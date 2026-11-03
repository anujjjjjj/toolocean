/**
 * Pure logic behind /video-to-mp3: file sniffing, a small container probe, warning
 * thresholds, error wording, downmixing and encode progress.
 *
 * No DOM and no audiobox, so the worker, the page and scripts/video-to-mp3.test.mjs
 * all load this same file. The encoder itself stays in videoToMp3.worker.ts.
 */

export const BITRATE_OPTIONS = [128, 192, 320] as const;
export type Mp3Bitrate = (typeof BITRATE_OPTIONS)[number];
export const DEFAULT_BITRATE: Mp3Bitrate = 192;

export type OutputFormat = "mp3" | "wav";

export const VIDEO_ACCEPT = "video/*,.mp4,.mov,.m4v,.webm,.mkv";

export const SIZE_WARNING_BYTES = 500 * 1024 * 1024;
export const DURATION_WARNING_SECONDS = 30 * 60;

/** Bytes of the file header that sniffVideo looks at. */
export const SNIFF_BYTES = 4096;

export const TRIMMER_PATH = "/video-trimmer";

/** `IMG_1234.MOV` -> `IMG_1234.mp3`. Only the last extension goes, so `a.b.mp4` -> `a.b.mp3`. */
export function outputFileName(name: string, format: OutputFormat): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base.replace(/^\.+$/, "") || "audio"}.${format}`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "Unknown length";
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

/** WAV here is 32-bit float, the format audioUtils writes. */
const WAV_BYTES_PER_SAMPLE = 4;

export function estimateOutputBytes(input: {
  format: OutputFormat;
  bitrate: number;
  seconds: number;
  sampleRate?: number;
  channels?: number;
}): number {
  const { format, bitrate, seconds, sampleRate = 44100, channels = 2 } = input;
  if (format === "wav") return Math.round(seconds * sampleRate) * channels * WAV_BYTES_PER_SAMPLE + 44;
  return Math.round((seconds * bitrate * 1000) / 8);
}

export interface ConversionWarning {
  kind: "size" | "duration";
  message: string;
}

export function conversionWarnings(bytes: number, seconds: number | null): ConversionWarning[] {
  const warnings: ConversionWarning[] = [];
  if (bytes > SIZE_WARNING_BYTES) {
    warnings.push({
      kind: "size",
      message: "This file is over 500 MB, and all of it is held in memory while the audio is read.",
    });
  }
  if (seconds !== null && seconds > DURATION_WARNING_SECONDS) {
    warnings.push({
      kind: "duration",
      message: "This audio runs past 30 minutes, which takes a lot of memory and several minutes to encode.",
    });
  }
  return warnings;
}

export type VideoContainer = "mp4" | "mov" | "webm" | "mkv";

/** ISO brands that are stills or audio, not video: HEIC photos and M4A share the ftyp box. */
const NON_VIDEO_BRANDS = new Set(["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1", "avif", "avis", "M4A ", "M4B ", "M4P "]);
const QUICKTIME_ATOMS = new Set(["moov", "mdat", "wide", "free", "skip", "pnot"]);
const AUDIO_MIME = /^audio\//;

const ascii = (bytes: Uint8Array, start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? "" : name.slice(dot + 1).toLowerCase();
}

function hasBytes(haystack: Uint8Array, needle: string): boolean {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle.charCodeAt(j)) continue outer;
    }
    return true;
  }
  return false;
}

/**
 * The container, or null when this is not a video we can read.
 *
 * Magic bytes decide. A renamed PDF has a video extension and sometimes a video
 * MIME type, and neither would survive decoding, so those two only settle what the
 * bytes leave open: MOV against MP4, and MKV against WebM.
 */
export function sniffVideo(file: { name: string; type: string }, head: Uint8Array): VideoContainer | null {
  const extension = extensionOf(file.name);
  if (head.length >= 12) {
    const box = ascii(head, 4, 8);
    if (box === "ftyp") {
      const brand = ascii(head, 8, 12);
      if (NON_VIDEO_BRANDS.has(brand) || AUDIO_MIME.test(file.type)) return null;
      return brand === "qt  " || extension === "mov" || file.type === "video/quicktime" ? "mov" : "mp4";
    }
    if (QUICKTIME_ATOMS.has(box)) return "mov";
  }
  if (head.length >= 4 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) {
    if (hasBytes(head, "webm")) return "webm";
    if (hasBytes(head, "matroska")) return "mkv";
    return extension === "webm" || file.type === "video/webm" ? "webm" : "mkv";
  }
  return null;
}

export interface ContainerProbe {
  /** False only when the container was read and lists no sound. Null means it could not be read. */
  hasAudio: boolean | null;
  audioCodec: string | null;
  videoCodec: string | null;
  sampleRate: number | null;
  duration: number | null;
}

const UNKNOWN_PROBE: ContainerProbe = { hasAudio: null, audioCodec: null, videoCodec: null, sampleRate: null, duration: null };

export type RangeReader = (start: number, end: number) => Promise<Uint8Array>;

const MAX_MOOV_BYTES = 256 * 1024 * 1024;
const MATROSKA_HEAD_BYTES = 8 * 1024 * 1024;
const MAX_TOP_LEVEL_BOXES = 512;

function viewOf(bytes: Uint8Array) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function u64(view: DataView, offset: number): number {
  return view.getUint32(offset) * 2 ** 32 + view.getUint32(offset + 4);
}

/** Children of a box body. Stops at the first malformed length, which is all a probe needs. */
function* boxes(bytes: Uint8Array): Generator<{ type: string; body: Uint8Array }> {
  const view = viewOf(bytes);
  let offset = 0;
  while (offset + 8 <= bytes.length) {
    let size = view.getUint32(offset);
    let header = 8;
    if (size === 1) {
      if (offset + 16 > bytes.length) return;
      size = u64(view, offset + 8);
      header = 16;
    } else if (size === 0) {
      size = bytes.length - offset;
    }
    if (size < header || offset + size > bytes.length) return;
    yield { type: ascii(bytes, offset + 4, offset + 8), body: bytes.subarray(offset + header, offset + size) };
    offset += size;
  }
}

const child = (bytes: Uint8Array, type: string) => {
  for (const box of boxes(bytes)) if (box.type === type) return box.body;
  return null;
};

/** Timescale and duration from an mvhd or mdhd body, which share this layout. */
function timing(body: Uint8Array): { timescale: number; duration: number } | null {
  if (body.length < 20) return null;
  const view = viewOf(body);
  if (body[0] === 1) return body.length < 32 ? null : { timescale: view.getUint32(20), duration: u64(view, 24) };
  return { timescale: view.getUint32(12), duration: view.getUint32(16) };
}

function parseMoov(moov: Uint8Array): ContainerProbe {
  const probe: ContainerProbe = { ...UNKNOWN_PROBE, hasAudio: false };
  let fragmented = false;
  const traks: Uint8Array[] = [];
  for (const box of boxes(moov)) {
    if (box.type === "mvex") fragmented = true;
    if (box.type === "trak") traks.push(box.body);
    if (box.type === "mvhd") {
      const time = timing(box.body);
      if (time?.timescale && time.duration) probe.duration = time.duration / time.timescale;
    }
  }

  for (const trak of traks) {
    const mdia = child(trak, "mdia");
    const hdlr = mdia && child(mdia, "hdlr");
    if (!mdia || !hdlr || hdlr.length < 12) continue;
    const handler = ascii(hdlr, 8, 12);
    const minf = child(mdia, "minf");
    const stbl = minf && child(minf, "stbl");
    const stsd = stbl && child(stbl, "stsd");
    // Header of the first sample description. In a fragmented file the lengths live outside moov.
    const entry = stsd && stsd.length >= 16 ? stsd.subarray(8) : null;
    const codec = entry ? ascii(entry, 4, 8) : null;

    if (handler === "vide" && !probe.videoCodec) probe.videoCodec = codec;
    if (handler !== "soun") continue;
    const mdhd = child(mdia, "mdhd");
    const time = mdhd && timing(mdhd);
    if (time && time.duration === 0 && !fragmented) continue; // A declared track holding no samples.
    probe.hasAudio = true;
    if (!probe.audioCodec) {
      probe.audioCodec = codec;
      if (entry && entry.length >= 34) probe.sampleRate = viewOf(entry).getUint16(32) || null;
    }
  }
  return probe;
}

async function probeIsoMedia(read: RangeReader, size: number): Promise<ContainerProbe> {
  let offset = 0;
  for (let count = 0; count < MAX_TOP_LEVEL_BOXES && offset + 8 <= size; count++) {
    const head = await read(offset, Math.min(offset + 16, size));
    if (head.length < 8) break;
    const view = viewOf(head);
    const size32 = view.getUint32(0);
    const large = size32 === 1 && head.length >= 16;
    const length = large ? u64(view, 8) : size32 === 0 ? size - offset : size32;
    if (length < 8) break;
    if (ascii(head, 4, 8) === "moov") {
      if (length > MAX_MOOV_BYTES || offset + length > size) break;
      return parseMoov((await read(offset, offset + length)).subarray(large ? 16 : 8));
    }
    offset += length;
  }
  return UNKNOWN_PROBE;
}

function vint(bytes: Uint8Array, offset: number, keepMarker: boolean): { value: number; length: number; unknown: boolean } | null {
  const first = bytes[offset];
  if (!first) return null;
  const length = Math.clz32(first) - 23;
  if (length > 8 || offset + length > bytes.length) return null;
  let value = keepMarker ? first : first & (0xff >> length);
  let allOnes = (first & (0xff >> length)) === 0xff >> length;
  for (let i = 1; i < length; i++) {
    value = value * 256 + bytes[offset + i];
    if (bytes[offset + i] !== 0xff) allOnes = false;
  }
  return { value, length, unknown: allOnes };
}

function* elements(bytes: Uint8Array): Generator<{ id: number; body: Uint8Array; complete: boolean }> {
  let offset = 0;
  while (offset < bytes.length) {
    const id = vint(bytes, offset, true);
    if (!id) return;
    const size = vint(bytes, offset + id.length, false);
    if (!size) return;
    const start = offset + id.length + size.length;
    const end = size.unknown ? bytes.length : start + size.value;
    yield { id: id.value, body: bytes.subarray(start, end), complete: end <= bytes.length };
    offset = end;
  }
}

function ebmlFloat(body: Uint8Array): number | null {
  if (body.length === 4) return viewOf(body).getFloat32(0);
  if (body.length === 8) return viewOf(body).getFloat64(0);
  return null;
}

const ebmlUint = (body: Uint8Array) => body.reduce((value, byte) => value * 256 + byte, 0);

const EBML_SEGMENT = 0x18538067;
const EBML_INFO = 0x1549a966;
const EBML_TRACKS = 0x1654ae6b;
const EBML_CLUSTER = 0x1f43b675;

function parseMatroskaTrack(entry: Uint8Array, probe: ContainerProbe) {
  let type = 0;
  let codec: string | null = null;
  let sampleRate: number | null = null;
  for (const element of elements(entry)) {
    if (element.id === 0x83) type = ebmlUint(element.body);
    if (element.id === 0x86) codec = ascii(element.body, 0, element.body.length).replace(/\0+$/, "");
    if (element.id === 0xe1) {
      for (const audio of elements(element.body)) {
        if (audio.id === 0xb5) sampleRate = ebmlFloat(audio.body);
      }
    }
  }
  if (type === 1 && !probe.videoCodec) probe.videoCodec = codec;
  if (type !== 2) return;
  probe.hasAudio = true;
  if (!probe.audioCodec) {
    probe.audioCodec = codec;
    probe.sampleRate = sampleRate;
  }
}

function parseMatroska(head: Uint8Array): ContainerProbe {
  const probe = { ...UNKNOWN_PROBE };
  let segment: Uint8Array | null = null;
  for (const element of elements(head)) {
    if (element.id === EBML_SEGMENT) {
      segment = element.body;
      break;
    }
  }
  if (!segment) return probe;

  for (const element of elements(segment)) {
    if (element.id === EBML_CLUSTER) break;
    if (!element.complete) break;
    if (element.id === EBML_INFO) {
      let scale = 1_000_000;
      let duration: number | null = null;
      for (const info of elements(element.body)) {
        if (info.id === 0x2ad7b1) scale = ebmlUint(info.body);
        if (info.id === 0x4489) duration = ebmlFloat(info.body);
      }
      if (duration) probe.duration = (duration * scale) / 1e9;
    }
    if (element.id === EBML_TRACKS) {
      probe.hasAudio = false;
      for (const track of elements(element.body)) {
        if (track.id === 0xae) parseMatroskaTrack(track.body, probe);
      }
    }
  }
  return probe;
}

/**
 * What the container says about its tracks.
 *
 * decodeAudioData throws the same error for a file with no sound and a file with
 * sound it cannot read, and those need opposite advice, so the answer has to come
 * from the file. Any parsing problem returns "unknown" and conversion still runs.
 */
export async function probeContainer(read: RangeReader, size: number, container: VideoContainer): Promise<ContainerProbe> {
  try {
    if (container === "mp4" || container === "mov") return await probeIsoMedia(read, size);
    return parseMatroska(await read(0, Math.min(size, MATROSKA_HEAD_BYTES)));
  } catch {
    return UNKNOWN_PROBE;
  }
}

/** The MP3 encoder takes 32, 44.1 or 48 kHz. Keep the source rate when it is one of those. */
export function pickSampleRate(sourceRate: number | null): 32000 | 44100 | 48000 {
  if (sourceRate === 48000 || sourceRate === 32000) return sourceRate;
  return 44100;
}

interface DecodingContext {
  decodeAudioData(
    data: ArrayBuffer,
    success?: (buffer: AudioBuffer) => void,
    failure?: (error: DOMException) => void,
  ): Promise<AudioBuffer> | void;
}

/** Old Safari only has the callback form and returns undefined. Everything else does both. */
export function decodeWithContext(context: DecodingContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const pending = context.decodeAudioData(data, resolve, reject);
    if (pending && typeof pending.then === "function") pending.then(resolve, reject);
  });
}

const SQRT1_2 = Math.SQRT1_2;

/** Per input channel, in Web Audio's channel order, the [left, right] gains. LFE is dropped. */
function stereoGains(count: number): [number, number][] {
  if (count === 3) return [[1, 0], [0, 1], [SQRT1_2, SQRT1_2]];
  if (count === 4) return [[1, 0], [0, 1], [SQRT1_2, 0], [0, SQRT1_2]];
  if (count === 5) return [[1, 0], [0, 1], [SQRT1_2, SQRT1_2], [SQRT1_2, 0], [0, SQRT1_2]];
  const gains: [number, number][] = [[1, 0], [0, 1], [SQRT1_2, SQRT1_2], [0, 0]];
  for (let channel = 4; channel < count; channel++) {
    gains.push(channel % 2 === 0 ? [SQRT1_2, 0] : [0, SQRT1_2]);
  }
  return gains;
}

/** Mono and stereo pass through. Wider layouts fold down, scaled so a full-scale mix cannot clip. */
export function downmixToStereo(channels: Float32Array[]): Float32Array[] {
  if (channels.length <= 2) return channels;
  const gains = stereoGains(channels.length);
  const scale = 1 / gains.reduce((sum, [left]) => sum + left, 0);
  const length = channels[0].length;
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  channels.forEach((channel, index) => {
    const leftGain = gains[index][0] * scale;
    const rightGain = gains[index][1] * scale;
    if (leftGain === 0 && rightGain === 0) return;
    for (let i = 0; i < length; i++) {
      left[i] += channel[i] * leftGain;
      right[i] += channel[i] * rightGain;
    }
  });
  return [left, right];
}

/* audiobox encodes a frame of 2 granules (1152 samples), plus enough extra to flush its delay line. */
const FRAME_SAMPLES = 1152;
const FLUSH_SAMPLES = 1104;
/** The frame loop reads `channels[0]` twice per granule: once to analyse, once for the masking model. */
const CHANNEL_READS_PER_FRAME = 4;

/**
 * Real encode progress without patching audiobox.
 *
 * encodeMp3Channels has no callback, but it looks up `channels[n]` afresh for every
 * granule, so a getter on index 0 counts completed work from inside the frame loop.
 * The audio is untouched and encoded once, as one stream, so the output is byte for
 * byte what an untracked call writes. audiobox is pinned exactly, and
 * scripts/video-to-mp3.test.mjs fails if a new version changes this read pattern.
 */
export function withEncodeProgress(channels: Float32Array[], onProgress: (fraction: number) => void): Float32Array[] {
  const first = channels[0];
  const totalReads = Math.max(1, Math.ceil((first.length + FLUSH_SAMPLES) / FRAME_SAMPLES)) * CHANNEL_READS_PER_FRAME;
  let reads = 0;
  const tracked = [...channels];
  Object.defineProperty(tracked, 0, {
    enumerable: true,
    get() {
      reads += 1;
      onProgress(Math.min(1, reads / totalReads));
      return first;
    },
  });
  return tracked;
}

/** About 4 MB, which copies in a millisecond or two. */
export const COPY_SLICE_SAMPLES = 2 ** 20;

/**
 * Copy a channel a slice at a time, yielding between slices, so that an hour of audio
 * does not freeze the page. `copySlice` fills `target` from sample `start` of the
 * source. Resolves to null if `isCancelled` turns true, which is checked before each slice.
 */
export async function copyChannelChunked(
  copySlice: (target: Float32Array, start: number) => void,
  length: number,
  yieldFn: () => Promise<void>,
  isCancelled: () => boolean,
  sliceSamples: number = COPY_SLICE_SAMPLES,
): Promise<Float32Array | null> {
  const copy = new Float32Array(length);
  for (let start = 0; start < length; start += sliceSamples) {
    if (start > 0) await yieldFn();
    if (isCancelled()) return null;
    copySlice(copy.subarray(start, Math.min(start + sliceSamples, length)), start);
  }
  return copy;
}

export type WorkerRequest = {
  channels: ArrayBuffer[];
  sampleRate: number;
  format: OutputFormat;
  bitrate: number;
};

export type WorkerResponse =
  | { type: "progress"; percent: number }
  | { type: "done"; blob: Blob }
  | { type: "error"; name: string; message: string };

export type ErrorKind = "not-video" | "no-audio" | "unsupported-codec" | "memory" | "unknown";

export interface ToolError {
  kind: ErrorKind;
  title: string;
  body: string;
  fixes: string[];
}

export const NOT_VIDEO_ERROR: ToolError = {
  kind: "not-video",
  title: "This does not look like a video file",
  body: "Its contents do not match any format this tool reads, whatever the file name says.",
  fixes: ["Choose an MP4, MOV, M4V, WebM or MKV file.", "If it came from a download, check that the download finished."],
};

export const NO_AUDIO_ERROR: ToolError = {
  kind: "no-audio",
  title: "This video has no audio track",
  body: "There is no sound stored in this file, so there is nothing to extract. Screen recordings made with the microphone off often end up this way.",
  fixes: ["Check that the original plays with sound.", "Record or export it again with audio turned on."],
};

export const MEMORY_ERROR: ToolError = {
  kind: "memory",
  title: "This file needs more memory than this tab has",
  body: "The video and its decoded audio both have to fit in memory at once, and the browser ran out of room.",
  fixes: ["Trim the video first with Video Trimmer, then convert the shorter clip.", "Close other tabs and try again."],
};

const CODEC_LABELS: [RegExp, string][] = [
  [/^(ac-3|A_AC3)/i, "Dolby Digital (AC-3)"],
  [/^(ec-3|A_EAC3)/i, "Dolby Digital Plus (E-AC-3)"],
  [/^(dts|A_DTS)/i, "DTS"],
  [/^A_TRUEHD/i, "Dolby TrueHD"],
  [/^(flac|A_FLAC)/i, "FLAC"],
  [/^(opus|A_OPUS)/i, "Opus"],
  [/^A_VORBIS/i, "Vorbis"],
  [/^alac/i, "Apple Lossless"],
];

function codecLabel(codec: string | null): string | null {
  if (!codec) return null;
  return CODEC_LABELS.find(([pattern]) => pattern.test(codec))?.[1] ?? null;
}

const isHevc = (codec: string | null) => Boolean(codec && /^(hvc1|hev1|V_MPEGH\/ISO\/HEVC)/i.test(codec));

function unsupportedCodecError(context: ErrorContext): ToolError {
  const label = codecLabel(context.probe?.audioCodec ?? null);
  const remux = "Re-save or export the video as MP4 with AAC audio, then convert that copy.";
  if (context.isSafari && context.container === "webm") {
    return {
      kind: "unsupported-codec",
      title: "Safari cannot read the audio in this WebM file",
      body: "Safari does not decode WebM audio here, though the file itself is probably fine.",
      fixes: ["Open this page in Chrome or Firefox and try again.", remux],
    };
  }
  if (isHevc(context.probe?.videoCodec ?? null)) {
    return {
      kind: "unsupported-codec",
      title: "This browser could not read the audio in this HEVC video",
      body: "HEVC is the high-efficiency format iPhones record in, and not every browser opens these files.",
      fixes: [
        "Try Chrome or Safari on a desktop.",
        "On an iPhone, share the video and turn off HEVC under Options, or re-save it as MP4.",
      ],
    };
  }
  return {
    kind: "unsupported-codec",
    title: label ? `This browser cannot decode ${label} audio` : "This browser cannot decode the audio in this file",
    body: label
      ? `The sound in this file is stored as ${label}, which browsers do not decode here.`
      : "The sound in this file uses a codec this browser does not decode, or the file is damaged.",
    fixes: [remux, "Try Chrome if you are using another browser."],
  };
}

/**
 * The container decides. The media element is only a fallback, because Firefox reports
 * no audio for any track it cannot decode, which would turn AC-3 into "no audio track".
 */
export function lacksAudio(probe: ContainerProbe | null | undefined, audioTrackCount: number | null | undefined): boolean {
  return probe?.hasAudio === false || ((probe?.hasAudio ?? null) === null && audioTrackCount === 0);
}

export interface ErrorContext {
  probe?: ContainerProbe | null;
  container?: VideoContainer | null;
  isSafari?: boolean;
  fileSize?: number;
  /** From the media element where the browser exposes it: 0 means it found no sound. */
  audioTrackCount?: number | null;
}

const MEMORY_MESSAGE = /out of memory|allocation failed|allocate|array buffer|memory/i;
/** Over this, Chrome reports a failed read as NotReadableError instead of a RangeError. */
const LARGE_READ_BYTES = 1024 * 1024 * 1024;

/** Turn whatever the decoder or worker threw into something a person can act on. */
export function classifyError(error: unknown, context: ErrorContext = {}): ToolError {
  const { name = "", message = "" } = (error ?? {}) as { name?: string; message?: string };
  if (name === "NoAudioError") return NO_AUDIO_ERROR;
  if (name === "NotVideoError") return NOT_VIDEO_ERROR;
  if (name === "RangeError" || name === "QuotaExceededError" || name === "WorkerCrash" || MEMORY_MESSAGE.test(message)) {
    return MEMORY_ERROR;
  }
  if (name === "NotReadableError") {
    if ((context.fileSize ?? 0) > LARGE_READ_BYTES) return MEMORY_ERROR;
    return {
      kind: "unknown",
      title: "This file could not be read",
      body: "The browser lost access to it, which usually means it was moved or changed after you chose it.",
      fixes: ["Choose the file again."],
    };
  }
  if (name === "EncodingError" || name === "DataError" || name === "NotSupportedError" || /decode/i.test(message)) {
    if (lacksAudio(context.probe, context.audioTrackCount)) return NO_AUDIO_ERROR;
    return unsupportedCodecError(context);
  }
  return {
    kind: "unknown",
    title: "This file could not be converted",
    body: "Something went wrong while the audio was being processed. Your file has not been changed.",
    fixes: ["Try again.", "Try Chrome if you are using another browser."],
  };
}
