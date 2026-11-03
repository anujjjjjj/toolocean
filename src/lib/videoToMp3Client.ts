/**
 * Main-thread side of Video to MP3: read a file's facts, decode its audio, and hand
 * the samples to a worker. The worker is created only when the user converts, and
 * offlinePrefetch reads its URL from here so it can be stored for offline use.
 */
import workerUrl from "./videoToMp3.worker.ts?worker&url";
import {
  copyChannelChunked,
  decodeWithContext,
  probeContainer,
  sniffVideo,
  SNIFF_BYTES,
  type ContainerProbe,
  type OutputFormat,
  type VideoContainer,
  type WorkerRequest,
  type WorkerResponse,
} from "./videoToMp3";

export function videoToMp3WorkerUrl(): string {
  return new URL(workerUrl, import.meta.url).href;
}

export class NamedError extends Error {
  constructor(name: "NoAudioError" | "NotVideoError" | "WorkerCrash", message = "") {
    super(message);
    this.name = name;
  }
}

/** Long enough for a slow disk. HEVC in Chrome usually fails straight away instead. */
const METADATA_TIMEOUT_MS = 6000;

interface MediaFacts {
  duration: number | null;
  audioTrackCount: number | null;
}

type BrowserVideo = HTMLVideoElement & { audioTracks?: { length: number }; mozHasAudio?: boolean };

/** Never rejects. A video the browser cannot play may still have audio it can decode. */
function readMediaFacts(file: File): Promise<MediaFacts> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video: BrowserVideo = document.createElement("video");
    const finish = (facts: MediaFacts) => {
      window.clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(facts);
    };
    const timer = window.setTimeout(() => finish({ duration: null, audioTrackCount: null }), METADATA_TIMEOUT_MS);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const audioTrackCount = video.audioTracks ? video.audioTracks.length : video.mozHasAudio === false ? 0 : null;
      finish({ duration: Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null, audioTrackCount });
    };
    video.onerror = () => finish({ duration: null, audioTrackCount: null });
    video.src = url;
  });
}

export interface VideoFacts {
  container: VideoContainer;
  probe: ContainerProbe;
  duration: number | null;
  audioTrackCount: number | null;
}

/** Throws NotVideoError for anything sniffVideo rejects. Everything else is best effort. */
export async function inspectVideo(file: File): Promise<VideoFacts> {
  const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
  const container = sniffVideo(file, head);
  if (!container) throw new NamedError("NotVideoError");
  const read = async (start: number, end: number) => new Uint8Array(await file.slice(start, end).arrayBuffer());
  const [probe, facts] = await Promise.all([probeContainer(read, file.size, container), readMediaFacts(file)]);
  return { container, probe, duration: facts.duration ?? probe.duration, audioTrackCount: facts.audioTrackCount };
}

type LegacyWindow = typeof window & { webkitOfflineAudioContext?: typeof OfflineAudioContext };

/** Consumes `bytes`. An offline context does no rendering here, so its length of 1 is never used. */
export function decodeAudio(bytes: ArrayBuffer, sampleRate: number): Promise<AudioBuffer> {
  const Context = window.OfflineAudioContext ?? (window as LegacyWindow).webkitOfflineAudioContext;
  return decodeWithContext(new Context(2, 1, sampleRate), bytes);
}

/**
 * A full turn of the event loop. Not scheduler.yield, whose continuations run ahead of
 * other tasks, so a chain of them held off timers until the copy ended. Not setTimeout,
 * which a hidden tab limits to about one call a second, or 150 s for an hour of audio.
 */
function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    const { port1, port2 } = new MessageChannel();
    port1.onmessage = () => {
      port1.close();
      resolve();
    };
    port2.postMessage(null);
  });
}

function sliceCopier(decoded: AudioBuffer, channel: number) {
  if (typeof decoded.copyFromChannel === "function") {
    return (target: Float32Array, start: number) => decoded.copyFromChannel(target, channel, start);
  }
  const source = decoded.getChannelData(channel);
  return (target: Float32Array, start: number) => target.set(source.subarray(start, start + target.length));
}

/**
 * An AudioBuffer's own storage cannot be transferred, so the worker gets a copy of each
 * channel. An hour of audio is over 600 MB per channel, so the copy is chunked. Resolves
 * to null if cancelled.
 */
async function copyChannels(decoded: AudioBuffer, isCancelled: () => boolean): Promise<ArrayBuffer[] | null> {
  const channels: ArrayBuffer[] = [];
  for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
    const copy = await copyChannelChunked(sliceCopier(decoded, channel), decoded.length, yieldToEventLoop, isCancelled);
    if (!copy) return null;
    channels.push(copy.buffer as ArrayBuffer);
  }
  return channels;
}

export interface EncodeJob {
  result: Promise<Blob>;
  cancel: () => void;
}

export function startEncode(
  decoded: AudioBuffer,
  settings: { format: OutputFormat; bitrate: number },
  onProgress: (percent: number) => void,
): EncodeJob {
  const worker = new Worker(videoToMp3WorkerUrl(), { type: "module" });
  let stopped = false;
  const stop = () => {
    stopped = true;
    worker.terminate();
  };
  // Like a cancel during encoding, a cancel during the copy leaves `result` unsettled.
  const result = new Promise<Blob>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.type === "progress") {
        onProgress(message.percent);
        return;
      }
      stop();
      if (message.type === "done") resolve(message.blob);
      else reject(Object.assign(new Error(message.message), { name: message.name }));
    };
    // A worker that runs out of memory dies without posting anything.
    worker.onerror = () => {
      stop();
      reject(new NamedError("WorkerCrash"));
    };
    copyChannels(decoded, () => stopped).then(
      (channels) => {
        if (!channels) return;
        const request: WorkerRequest = { channels, sampleRate: decoded.sampleRate, ...settings };
        worker.postMessage(request, channels);
      },
      (error) => {
        stop();
        reject(error);
      },
    );
  });
  return { result, cancel: stop };
}
