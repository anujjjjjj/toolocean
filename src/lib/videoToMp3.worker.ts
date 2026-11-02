/**
 * Encodes decoded audio off the main thread.
 *
 * This is the only file that may import audiobox, which keeps the encoder in the
 * worker chunk. The whole recording is encoded in a single call. Splitting it into
 * segments would give steadier progress and an audible click at every join, so
 * progress comes from withEncodeProgress instead. Cancel terminates this worker.
 */
import { encodeMp3Channels } from "audiobox/mp3";
import { channelsToWavBlob } from "./audioUtils";
import { downmixToStereo, withEncodeProgress, type WorkerRequest, type WorkerResponse } from "./videoToMp3";

function post(message: WorkerResponse) {
  (self as unknown as Worker).postMessage(message);
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { channels, sampleRate, format, bitrate } = event.data;
  try {
    const planar = downmixToStereo(channels.map((buffer) => new Float32Array(buffer)));
    if (format === "wav") {
      post({ type: "done", blob: channelsToWavBlob(planar, sampleRate) });
      return;
    }

    let shown = -1;
    const tracked = withEncodeProgress(planar, (fraction) => {
      const percent = Math.floor(fraction * 100);
      if (percent === shown) return;
      shown = percent;
      post({ type: "progress", percent });
    });
    const bytes = encodeMp3Channels(tracked, sampleRate, { bitrate });
    post({ type: "done", blob: new Blob([bytes as BlobPart], { type: "audio/mpeg" }) });
  } catch (error) {
    const { name = "Error", message = "" } = error as Error;
    post({ type: "error", name, message });
  }
};
