/**
 * Video to MP3: file names, warnings, sniffing, the container probe, error wording,
 * downmixing, encode progress against the real encoder, and what the page promises.
 *   node --experimental-strip-types --test scripts/video-to-mp3.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { encodeMp3Channels, probeMp3 } from "audiobox/mp3";
import {
  BITRATE_OPTIONS,
  DEFAULT_BITRATE,
  DURATION_WARNING_SECONDS,
  SIZE_WARNING_BYTES,
  COPY_SLICE_SAMPLES,
  classifyError,
  conversionWarnings,
  copyChannelChunked,
  decodeWithContext,
  downmixToStereo,
  estimateOutputBytes,
  formatDuration,
  lacksAudio,
  outputFileName,
  pickSampleRate,
  probeContainer,
  sniffVideo,
  withEncodeProgress,
} from "../src/lib/videoToMp3.ts";
import { channelsToWavBlob } from "../src/lib/audioUtils.ts";
import { videoToMp3Content } from "../src/data/toolContent/videoToMp3.ts";
import { toolSeoData } from "../src/data/toolSeo.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const TOOL = "src/components/tools/implementations/video/VideoToMp3Tool.tsx";
const WORKER = "src/lib/videoToMp3.worker.ts";

const text = (value) => [...value].map((char) => char.charCodeAt(0));
const be32 = (value) => [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
const be16 = (value) => [(value >>> 8) & 255, value & 255];
const box = (type, ...parts) => {
  const body = parts.flat();
  return [...be32(body.length + 8), ...text(type), ...body];
};
const ftyp = (brand) => box("ftyp", text(brand), be32(0), text("isom"));
const bytes = (...parts) => new Uint8Array(parts.flat());
const reader = (data) => async (start, end) => data.subarray(start, end);

function trak({ handler, codec, duration = 1000, rate = 48000 }) {
  const mdhd = box("mdhd", be32(0), be32(0), be32(0), be32(1000), be32(duration), be32(0));
  const hdlr = box("hdlr", be32(0), be32(0), text(handler), be32(0), be32(0), be32(0), [0]);
  const entry = box(codec, new Array(6).fill(0), be16(1), new Array(8).fill(0), be16(2), be16(16), be32(0), be16(rate), be16(0));
  const stsd = box("stsd", be32(0), be32(1), entry);
  return box("trak", box("mdia", mdhd, hdlr, box("minf", box("stbl", stsd))));
}

const mvhd = (seconds) => box("mvhd", be32(0), be32(0), be32(0), be32(600), be32(seconds * 600), new Array(80).fill(0));

/** moov after mdat, the layout phones often write. */
const mp4 = (...traks) => bytes(ftyp("isom"), box("mdat", new Array(64).fill(0)), box("moov", mvhd(12), ...traks));

const ebml = (id, ...parts) => {
  const body = parts.flat();
  assert.ok(body.length < 0x3fff);
  return [...id, 0x40 | (body.length >> 8), body.length & 255, ...body];
};
const float64 = (value) => {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setFloat64(0, value);
  return [...out];
};
const mkvTrack = (type, codec, rate) =>
  ebml([0xae], ebml([0x83], [type]), ebml([0x86], text(codec)), rate ? ebml([0xe1], ebml([0xb5], float64(rate))) : []);
const mkvHeader = (docType) => ebml([0x1a, 0x45, 0xdf, 0xa3], ebml([0x42, 0x82], text(docType)));
const mkv = (docType, ...tracks) =>
  bytes(
    mkvHeader(docType),
    // Unknown-size Segment, which is how a live recorder writes it.
    [0x18, 0x53, 0x80, 0x67, 0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
    ebml([0x15, 0x49, 0xa9, 0x66], ebml([0x44, 0x89], float64(4000))),
    ebml([0x16, 0x54, 0xae, 0x6b], ...tracks),
    [0x1f, 0x43, 0xb6, 0x75, 0x81, 0],
  );

const noise = (length, seed = 1) => {
  const out = new Float32Array(length);
  let state = seed;
  for (let i = 0; i < length; i++) {
    state = (state * 1664525 + 1013904223) >>> 0;
    out[i] = (state / 2 ** 32 - 0.5) * 0.6 + 0.3 * Math.sin(i / 40);
  }
  return out;
};

describe("outputFileName", () => {
  it("keeps the base name exactly", () => {
    assert.equal(outputFileName("IMG_1234.MOV", "mp3"), "IMG_1234.mp3");
    assert.equal(outputFileName("IMG_1234.MOV", "wav"), "IMG_1234.wav");
    assert.equal(outputFileName("Team call (final).mp4", "mp3"), "Team call (final).mp3");
    assert.equal(outputFileName("Müller – Vortrag.webm", "mp3"), "Müller – Vortrag.mp3");
  });

  it("removes only the last extension", () => {
    assert.equal(outputFileName("week.3.final.mkv", "mp3"), "week.3.final.mp3");
  });

  it("copes with names that have no usable extension", () => {
    assert.equal(outputFileName("recording", "mp3"), "recording.mp3");
    assert.equal(outputFileName(".mov", "mp3"), ".mov.mp3");
    assert.equal(outputFileName("", "mp3"), "audio.mp3");
  });
});

describe("bitrate options", () => {
  it("offers 128, 192 and 320 with 192 as the default", () => {
    assert.deepEqual([...BITRATE_OPTIONS], [128, 192, 320]);
    assert.equal(DEFAULT_BITRATE, 192);
  });
});

describe("conversionWarnings", () => {
  it("uses 500 MB and 30 minutes", () => {
    assert.equal(SIZE_WARNING_BYTES, 500 * 1024 * 1024);
    assert.equal(DURATION_WARNING_SECONDS, 1800);
  });

  it("stays quiet at the thresholds and warns above them", () => {
    assert.deepEqual(conversionWarnings(SIZE_WARNING_BYTES, 1800), []);
    assert.deepEqual(conversionWarnings(SIZE_WARNING_BYTES + 1, 60).map((w) => w.kind), ["size"]);
    assert.deepEqual(conversionWarnings(1000, 1801).map((w) => w.kind), ["duration"]);
    assert.deepEqual(conversionWarnings(SIZE_WARNING_BYTES + 1, 1801).map((w) => w.kind), ["size", "duration"]);
  });

  it("treats an unknown length as no duration warning", () => {
    assert.deepEqual(conversionWarnings(1000, null), []);
  });
});

describe("estimateOutputBytes", () => {
  it("is bitrate times length for MP3", () => {
    assert.equal(estimateOutputBytes({ format: "mp3", bitrate: 192, seconds: 60 }), 1_440_000);
    assert.equal(estimateOutputBytes({ format: "mp3", bitrate: 320, seconds: 10 }), 400_000);
  });

  it("is 32-bit samples plus a header for WAV, whatever the bitrate", () => {
    const wav = { format: "wav", bitrate: 128, seconds: 1, sampleRate: 44100, channels: 2 };
    assert.equal(estimateOutputBytes(wav), 44100 * 2 * 4 + 44);
    assert.equal(estimateOutputBytes({ ...wav, bitrate: 320 }), estimateOutputBytes(wav));
  });
});

describe("formatDuration", () => {
  it("reads as a clock and names what it does not know", () => {
    assert.equal(formatDuration(65), "1:05");
    assert.equal(formatDuration(3723), "1:02:03");
    assert.equal(formatDuration(null), "Unknown length");
    assert.equal(formatDuration(Number.POSITIVE_INFINITY), "Unknown length");
  });
});

describe("sniffVideo", () => {
  const file = (name, type = "") => ({ name, type });

  it("reads ftyp as MP4 and QuickTime brands as MOV", () => {
    assert.equal(sniffVideo(file("a.mp4", "video/mp4"), bytes(ftyp("isom"))), "mp4");
    assert.equal(sniffVideo(file("a.m4v"), bytes(ftyp("M4V "))), "mp4");
    assert.equal(sniffVideo(file("IMG_1234.MOV", "video/quicktime"), bytes(ftyp("qt  "))), "mov");
    assert.equal(sniffVideo(file("a.mov"), bytes(ftyp("isom"))), "mov");
  });

  it("reads old QuickTime files that start with another atom", () => {
    assert.equal(sniffVideo(file("old.mov"), bytes(box("wide", []), new Array(8).fill(0))), "mov");
    assert.equal(sniffVideo(file("old.mov"), bytes(box("moov", new Array(8).fill(0)))), "mov");
  });

  it("tells WebM from MKV by the EBML doctype, then the name", () => {
    assert.equal(sniffVideo(file("a.webm"), bytes(mkvHeader("webm"))), "webm");
    assert.equal(sniffVideo(file("a.mkv"), bytes(mkvHeader("matroska"))), "mkv");
    assert.equal(sniffVideo(file("a.webm"), bytes([0x1a, 0x45, 0xdf, 0xa3])), "webm");
    assert.equal(sniffVideo(file("a.mkv"), bytes([0x1a, 0x45, 0xdf, 0xa3])), "mkv");
  });

  it("believes the bytes over a misleading name or type", () => {
    assert.equal(sniffVideo(file("clip.txt", "text/plain"), bytes(ftyp("isom"))), "mp4");
    assert.equal(sniffVideo(file("fake.mp4", "video/mp4"), bytes(text("%PDF-1.7 and more"))), null);
    assert.equal(sniffVideo(file("fake.mov", "video/quicktime"), bytes(text("hello, this is text"))), null);
    assert.equal(sniffVideo(file("fake.webm", "video/webm"), new Uint8Array(0)), null);
  });

  it("turns away photos and audio that share the MP4 box format", () => {
    assert.equal(sniffVideo(file("photo.heic"), bytes(ftyp("heic"))), null);
    assert.equal(sniffVideo(file("photo.avif"), bytes(ftyp("avif"))), null);
    assert.equal(sniffVideo(file("song.m4a", "audio/mp4"), bytes(ftyp("M4A "))), null);
  });
});

describe("probeContainer", () => {
  it("finds audio, codecs, rate and duration in MP4, with moov at the end", async () => {
    const data = mp4(trak({ handler: "vide", codec: "hvc1" }), trak({ handler: "soun", codec: "mp4a", rate: 48000 }));
    const probe = await probeContainer(reader(data), data.length, "mov");
    assert.deepEqual(probe, { hasAudio: true, audioCodec: "mp4a", videoCodec: "hvc1", sampleRate: 48000, duration: 12 });
  });

  it("reports no audio for a video-only MP4", async () => {
    const data = mp4(trak({ handler: "vide", codec: "avc1" }));
    assert.equal((await probeContainer(reader(data), data.length, "mp4")).hasAudio, false);
  });

  it("ignores a declared audio track with no samples, unless the file is fragmented", async () => {
    const empty = trak({ handler: "soun", codec: "mp4a", duration: 0 });
    const flat = mp4(trak({ handler: "vide", codec: "avc1" }), empty);
    assert.equal((await probeContainer(reader(flat), flat.length, "mp4")).hasAudio, false);
    const fragmented = bytes(ftyp("isom"), box("moov", mvhd(12), box("mvex", []), empty));
    assert.equal((await probeContainer(reader(fragmented), fragmented.length, "mp4")).hasAudio, true);
  });

  it("reads Matroska tracks, including an unknown-size segment", async () => {
    const data = mkv("matroska", mkvTrack(1, "V_MPEGH/ISO/HEVC"), mkvTrack(2, "A_AC3", 48000));
    assert.deepEqual(await probeContainer(reader(data), data.length, "mkv"), {
      hasAudio: true,
      audioCodec: "A_AC3",
      videoCodec: "V_MPEGH/ISO/HEVC",
      sampleRate: 48000,
      duration: 4,
    });
  });

  it("reports no audio for a Matroska file with a video track only", async () => {
    const data = mkv("webm", mkvTrack(1, "V_VP9"));
    assert.equal((await probeContainer(reader(data), data.length, "webm")).hasAudio, false);
  });

  it("stays unsure rather than guessing when the file cannot be read", async () => {
    const garbage = bytes(ftyp("isom"), new Array(64).fill(0xff));
    assert.equal((await probeContainer(reader(garbage), garbage.length, "mp4")).hasAudio, null);
    assert.equal((await probeContainer(reader(garbage), garbage.length, "mkv")).hasAudio, null);
    const failing = async () => {
      throw new Error("read failed");
    };
    assert.equal((await probeContainer(failing, 100, "mp4")).hasAudio, null);
  });
});

describe("pickSampleRate", () => {
  it("keeps rates the encoder takes and sends the rest to 44.1 kHz", () => {
    assert.equal(pickSampleRate(48000), 48000);
    assert.equal(pickSampleRate(32000), 32000);
    assert.equal(pickSampleRate(44100), 44100);
    assert.equal(pickSampleRate(22050), 44100);
    assert.equal(pickSampleRate(96000), 44100);
    assert.equal(pickSampleRate(null), 44100);
  });
});

describe("decodeWithContext", () => {
  const data = new ArrayBuffer(8);
  const decoded = { length: 10 };

  it("works with the promise form", async () => {
    const context = { decodeAudioData: () => Promise.resolve(decoded) };
    assert.equal(await decodeWithContext(context, data), decoded);
  });

  it("works with the callback form that old Safari has", async () => {
    const context = {
      decodeAudioData: (_data, success) => {
        setTimeout(() => success(decoded), 0);
      },
    };
    assert.equal(await decodeWithContext(context, data), decoded);
  });

  it("rejects from either form", async () => {
    const failure = new Error("bad");
    await assert.rejects(decodeWithContext({ decodeAudioData: () => Promise.reject(failure) }, data), failure);
    await assert.rejects(decodeWithContext({ decodeAudioData: (_d, _s, fail) => void fail(failure) }, data), failure);
  });
});

describe("classifyError", () => {
  const encoding = Object.assign(new Error("Unable to decode audio data"), { name: "EncodingError" });
  const hasAudio = { hasAudio: true, audioCodec: "mp4a", videoCodec: "avc1", sampleRate: 44100, duration: 5 };

  it("says there is no audio track when the container agrees", () => {
    const error = classifyError(encoding, { probe: { ...hasAudio, hasAudio: false } });
    assert.equal(error.kind, "no-audio");
    assert.equal(error.title, "This video has no audio track");
    assert.equal(classifyError(encoding, { audioTrackCount: 0 }).kind, "no-audio");
    assert.equal(classifyError({ name: "NoAudioError" }).kind, "no-audio");
  });

  it("names the codec in an unsupported MKV and suggests a fix", () => {
    const cases = [
      ["A_AC3", /AC-3/],
      ["A_DTS", /DTS/],
      ["A_FLAC", /FLAC/],
      ["A_OPUS", /Opus/],
    ];
    for (const [audioCodec, name] of cases) {
      const error = classifyError(encoding, { probe: { ...hasAudio, audioCodec, videoCodec: "V_MPEG4/ISO/AVC" }, container: "mkv" });
      assert.equal(error.kind, "unsupported-codec");
      assert.match(error.title, name);
      assert.match(error.fixes.join(" "), /MP4/);
      assert.match(error.fixes.join(" "), /Chrome/);
    }
  });

  it("has its own advice for HEVC and for WebM on Safari", () => {
    const hevc = classifyError(encoding, { probe: { ...hasAudio, videoCodec: "hvc1" }, container: "mov" });
    assert.equal(hevc.kind, "unsupported-codec");
    assert.match(hevc.title, /HEVC/);
    const safari = classifyError(encoding, { probe: hasAudio, container: "webm", isSafari: true });
    assert.equal(safari.kind, "unsupported-codec");
    assert.match(safari.title, /Safari/);
    assert.match(safari.fixes.join(" "), /Chrome/);
  });

  it("trusts the container over a media element that cannot open the track", () => {
    assert.equal(lacksAudio({ ...hasAudio, audioCodec: "A_AC3" }, 0), false);
    assert.equal(classifyError(encoding, { probe: { ...hasAudio, audioCodec: "A_AC3" }, audioTrackCount: 0 }).kind, "unsupported-codec");
    assert.equal(lacksAudio({ ...hasAudio, hasAudio: false }, 1), true);
    assert.equal(lacksAudio({ ...hasAudio, hasAudio: null }, 0), true);
    assert.equal(lacksAudio({ ...hasAudio, hasAudio: null }, null), false);
    assert.equal(lacksAudio(null, null), false);
  });

  it("calls an undetermined decode failure a codec problem, not a missing track", () => {
    assert.equal(classifyError(encoding, {}).kind, "unsupported-codec");
    assert.equal(classifyError(encoding, { probe: { ...hasAudio, hasAudio: null } }).kind, "unsupported-codec");
  });

  it("sends memory failures to the trimmer", () => {
    const failures = [
      new RangeError("Array buffer allocation failed"),
      new Error("Out of memory"),
      { name: "WorkerCrash" },
      { name: "QuotaExceededError" },
    ];
    for (const failure of failures) {
      const error = classifyError(failure);
      assert.equal(error.kind, "memory");
      assert.match(error.fixes.join(" "), /Video Trimmer/);
      assert.match(error.fixes.join(" "), /tabs/);
    }
    assert.equal(classifyError({ name: "NotReadableError" }, { fileSize: 3 * 1024 ** 3 }).kind, "memory");
  });

  it("reports a file that is not a video", () => {
    const error = classifyError({ name: "NotVideoError" });
    assert.equal(error.kind, "not-video");
    assert.match(error.title, /not look like a video/);
  });

  it("falls back to something safe, and every error offers a next step", () => {
    const kinds = [
      classifyError(new TypeError("x")),
      classifyError(null),
      classifyError({ name: "NotReadableError" }),
      classifyError(encoding),
      classifyError({ name: "NoAudioError" }),
    ];
    for (const error of kinds) {
      assert.ok(error.title && error.body);
      assert.ok(error.fixes.length > 0);
    }
  });
});

describe("downmixToStereo", () => {
  it("passes mono and stereo straight through", () => {
    const mono = [new Float32Array([0.5])];
    const stereo = [new Float32Array([0.1]), new Float32Array([0.2])];
    assert.equal(downmixToStereo(mono), mono);
    assert.equal(downmixToStereo(stereo), stereo);
  });

  it("folds 5.1 into two channels, centre to both sides, LFE to neither", () => {
    const silent = () => new Float32Array(4);
    const channels = [silent(), silent(), new Float32Array(4).fill(1), silent(), silent(), silent()];
    const [left, right] = downmixToStereo(channels);
    assert.ok(left[0] > 0);
    assert.equal(left[0], right[0]);

    const bass = [silent(), silent(), silent(), new Float32Array(4).fill(1), silent(), silent()];
    assert.ok(downmixToStereo(bass).every((channel) => channel.every((sample) => sample === 0)));
  });

  it("keeps sides on their own side", () => {
    const silent = () => new Float32Array(2);
    const [left, right] = downmixToStereo([new Float32Array(2).fill(0.5), silent(), silent(), silent()]);
    assert.ok(left[0] > 0);
    assert.equal(right[0], 0);
  });

  it("cannot clip, whatever the width", () => {
    for (const width of [3, 4, 5, 6, 7, 8]) {
      const full = Array.from({ length: width }, () => new Float32Array(16).fill(1));
      const out = downmixToStereo(full);
      assert.equal(out.length, 2, `${width} channels`);
      for (const channel of out) assert.ok(channel.every((sample) => Math.abs(sample) <= 1.0001), `${width} channels`);
    }
  });
});

describe("copyChannelChunked", () => {
  const sliceOf = (source) => (target, start) => target.set(source.subarray(start, start + target.length));
  const counter = () => {
    const counted = async () => {
      counted.yields += 1;
    };
    counted.yields = 0;
    return counted;
  };

  it("slices in about 2^20 samples", () => {
    assert.equal(COPY_SLICE_SAMPLES, 2 ** 20);
  });

  it("copies a large input exactly, into its own buffer, yielding between slices", async () => {
    const source = noise(COPY_SLICE_SAMPLES * 3 + 17);
    const yieldFn = counter();
    const copy = await copyChannelChunked(sliceOf(source), source.length, yieldFn, () => false);
    assert.deepEqual(Buffer.from(copy.buffer), Buffer.from(source.buffer));
    assert.notEqual(copy.buffer, source.buffer);
    assert.equal(copy.byteOffset, 0);
    assert.equal(copy.buffer.byteLength, source.byteLength);
    assert.equal(yieldFn.yields, 3);
  });

  it("does not yield for an input that fits in one slice", async () => {
    const source = noise(100);
    const yieldFn = counter();
    assert.deepEqual(await copyChannelChunked(sliceOf(source), source.length, yieldFn, () => false, 100), source);
    assert.equal(yieldFn.yields, 0);
  });

  it("hands over slices that tile the channel, with a short one at the end", async () => {
    const seen = [];
    await copyChannelChunked((target, start) => seen.push([start, target.length]), 25, counter(), () => false, 10);
    assert.deepEqual(seen, [[0, 10], [10, 10], [20, 5]]);
  });

  it("stops at the next slice once cancelled", async () => {
    const seen = [];
    let cancelled = false;
    const cancelDuringSecondYield = async () => {
      if (seen.length === 2) cancelled = true;
    };
    const copy = await copyChannelChunked((_target, start) => seen.push(start), 100, cancelDuringSecondYield, () => cancelled, 10);
    assert.equal(copy, null);
    assert.deepEqual(seen, [0, 10]);
  });

  it("copies nothing if already cancelled", async () => {
    let copied = false;
    const copy = await copyChannelChunked(() => (copied = true), 100, counter(), () => true, 10);
    assert.equal(copy, null);
    assert.equal(copied, false);
  });

  it("is what the client uses, with no whole-buffer copy left on the main thread", () => {
    const client = read("src/lib/videoToMp3Client.ts");
    assert.match(client, /copyChannelChunked\(/);
    assert.match(client, /copyFromChannel\(target, channel, start\)/);
    assert.doesNotMatch(client, /getChannelData\([^)]*\)\.slice\(/);
  });
});

describe("encode progress against the real audiobox encoder", () => {
  const left = noise(44100 * 3, 1);
  const right = noise(44100 * 3, 2);

  it("writes exactly the same bytes as an untracked encode", () => {
    const plain = encodeMp3Channels([left, right], 44100, { bitrate: 192 });
    const tracked = encodeMp3Channels(withEncodeProgress([left, right], () => {}), 44100, { bitrate: 192 });
    assert.deepEqual(Buffer.from(tracked), Buffer.from(plain));
  });

  it("climbs steadily through the frame loop and finishes at 100%", () => {
    const seen = [];
    encodeMp3Channels(withEncodeProgress([left, right], (fraction) => seen.push(fraction)), 44100, { bitrate: 192 });
    assert.ok(seen.every((value, index) => index === 0 || value >= seen[index - 1]), "never moves backwards");
    assert.ok(seen.at(-1) >= 0.99, `ended at ${seen.at(-1)}`);
    assert.ok(seen.filter((value) => value > 0.4 && value < 0.6).length > 50, "many updates mid-way, not one jump");
  });

  it("works for mono too", () => {
    const seen = [];
    const out = encodeMp3Channels(withEncodeProgress([left], (fraction) => seen.push(fraction)), 44100, { bitrate: 128 });
    assert.ok(seen.at(-1) >= 0.99);
    assert.equal(probeMp3(out).channels, 1);
  });

  it("produces a real MP3 of the right rate, length and bitrate", () => {
    const seconds = 3;
    for (const bitrate of BITRATE_OPTIONS) {
      const out = encodeMp3Channels([left, right], 44100, { bitrate });
      const info = probeMp3(out);
      assert.equal(info.sampleRate, 44100);
      assert.ok(Math.abs(info.duration - seconds) < 0.1, `${info.duration}`);
      const estimate = estimateOutputBytes({ format: "mp3", bitrate, seconds });
      assert.ok(Math.abs(out.length - estimate) / estimate < 0.05, `${bitrate}: ${out.length} vs ${estimate}`);
    }
  });
});

describe("channelsToWavBlob", () => {
  it("writes a header and interleaved float samples", async () => {
    const blob = channelsToWavBlob([new Float32Array([0.25, 0.5]), new Float32Array([-0.25, -0.5])], 48000);
    const data = new DataView(await blob.arrayBuffer());
    assert.equal(blob.type, "audio/wav");
    assert.equal(blob.size, 44 + 16);
    assert.equal(data.getUint32(24, true), 48000);
    assert.equal(data.getUint16(22, true), 2);
    assert.deepEqual(
      [0, 1, 2, 3].map((index) => data.getFloat32(44 + index * 4, true)),
      [0.25, -0.25, 0.5, -0.5],
    );
  });
});

function sourceFiles(dir, out = []) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(ROOT, rel)).isDirectory()) sourceFiles(rel, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(rel);
  }
  return out;
}

describe("the encoder stays in the worker", () => {
  it("is imported by the worker alone, and only from audiobox/mp3", () => {
    const importing = sourceFiles("src").filter((file) => /from\s+["']audiobox|import\(\s*["']audiobox|import\s+["']audiobox/.test(read(file)));
    assert.deepEqual(importing, [WORKER]);
    assert.match(read(WORKER), /from "audiobox\/mp3"/);
  });

  it("is pinned to one exact version", () => {
    assert.equal(JSON.parse(read("package.json")).dependencies.audiobox, "1.1.0");
  });

  it("creates the worker only when converting", () => {
    const client = read("src/lib/videoToMp3Client.ts");
    assert.equal(client.match(/new Worker\(/g).length, 1);
    assert.ok(client.indexOf("new Worker(") > client.indexOf("export function startEncode"));
    assert.doesNotMatch(read("src/lib/leanShell.ts"), /videoToMp3/);
  });

  it("never splits the audio into separately encoded pieces", () => {
    const worker = read(WORKER);
    assert.equal(worker.match(/encodeMp3Channels\(/g).length, 1);
    assert.doesNotMatch(worker, /subarray|slice\(/);
  });

  it("has no ffmpeg.wasm", () => {
    const { dependencies, devDependencies } = JSON.parse(read("package.json"));
    assert.equal(Object.keys({ ...dependencies, ...devDependencies }).filter((name) => /ffmpeg/.test(name)).length, 0);
  });
});

describe("the page keeps its promises", () => {
  it("has the exact title, and no other tool shares it", () => {
    const { title } = toolSeoData["video-to-mp3"];
    assert.equal(`${title} | ToolOcean`, "Video to MP3 – Extract Audio, No Upload, Free | ToolOcean");
    assert.equal(videoToMp3Content.seo.title, title);
    const same = Object.entries(toolSeoData).filter(([, entry]) => entry.title === title);
    assert.deepEqual(same.map(([key]) => key), ["video-to-mp3"]);
  });

  it("description fits and covers the search terms", () => {
    const { description } = videoToMp3Content.seo;
    assert.ok(description.length >= 140 && description.length <= 165, `${description.length}`);
    assert.match(description, /video to mp3/i);
    assert.match(description, /no upload/i);
    assert.match(description, /MOV/);
    assert.equal(toolSeoData["video-to-mp3"].description, description);
  });

  it("intro and FAQ reach the people searching", () => {
    const intro = videoToMp3Content.intro.paragraphs.join(" ");
    assert.match(intro, /MOV/);
    assert.match(intro, /iPhone/);
    assert.match(intro, /MP4 to MP3 without uploading/i);
    assert.match(intro, /extract audio from video online free/i);

    const questions = videoToMp3Content.faqs.map((faq) => faq.question).join(" | ");
    assert.ok(videoToMp3Content.faqs.length >= 8);
    assert.match(questions, /iPhone MOV/);
    assert.match(questions, /MKV/);
    assert.match(questions, /no audio track/);
    assert.match(questions, /limit on file size or length/);
    assert.match(questions, /uploaded/);
  });

  it("links out to the trimmer, the cutter and GIF, and they link back", () => {
    const paths = videoToMp3Content.related.map((link) => link.path);
    for (const path of ["/video-trimmer", "/audio-cutter", "/video-to-gif"]) assert.ok(paths.includes(path), path);
    const cross = read("src/data/toolContent/videoCrossLinks.ts");
    for (const name of ["videoTrimmerContent", "videoToGifContent", "audioCutterContent"]) {
      assert.match(cross, new RegExp(`${name}[^=]*= \\{\\s*related: \\[\\s*\\{ name: "Video to MP3", path: "/video-to-mp3"`), name);
      assert.match(read("src/data/toolContent/index.ts"), new RegExp(`: ${name},`), name);
    }
  });

  it("states the privacy line exactly and carries every QA hook", () => {
    const source = read(TOOL);
    assert.match(source, /Your video never leaves your browser/);
    for (const hook of ["data-v2m-state", "data-v2m-warning", "data-v2m-error", "data-v2m-download", "data-v2m-convert", "data-v2m-bitrate", "data-v2m-format"]) {
      assert.ok(source.includes(hook), hook);
    }
  });

  it("signals success only from the download", () => {
    const source = read(TOOL);
    assert.equal(source.match(/markToolSuccess\(/g).length, 1);
    const download = source.slice(source.indexOf("const download = "), source.indexOf("const choose = "));
    assert.ok(download.indexOf("save(") < download.indexOf("markToolSuccess("));
    assert.ok(download.indexOf("markToolSuccess(") > 0);
  });

  it("is listed in the analytics doc and the shared registries", () => {
    assert.match(read("docs/ANALYTICS_EVENTS.md"), /\| video-to-mp3 \| `src\/components\/tools\/implementations\/video\/VideoToMp3Tool\.tsx` \| 1 \|/);
    assert.match(read("public/llms.txt"), /^> 124 file and developer/m);
    for (const file of ["src/data/toolCatalog.ts", "src/lib/allToolsForPalette.ts", "src/lib/lazyToolRegistry.ts", "src/lib/toolRegistry.ts", "src/lib/leanShell.ts", "src/lib/offlinePrefetch.ts"]) {
      assert.match(read(file), /"video-to-mp3"/, file);
    }
  });
});
