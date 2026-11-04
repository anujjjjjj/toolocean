/**
 * Grayscale PDF: everything between "a page rendered to RGBA" and "bytes to
 * embed", plus the small sums and strings the tool shows.
 *
 * No DOM, no pdf.js, no pdf-lib. Deflate is passed in, so the worker can use the
 * browser's CompressionStream and the node tests can use zlib. The JPEG encoder
 * is the one-channel encoder in src/lib/jpegGray.ts.
 */
import { encodeGrayJpeg } from "../jpegGray.ts";

export type GrayMode = "gray" | "bw";
export type Dpi = 150 | 300;

export const DPI_OPTIONS: readonly Dpi[] = [150, 300];
export const DEFAULT_DPI: Dpi = 150;
export const DEFAULT_THRESHOLD = 160;
export const JPEG_QUALITY = 80;
/**
 * Pixel ceiling for one page. 16,777,216 is the canvas area limit in Safari on
 * iOS; a little under it leaves room. A letter page at 300 DPI is 8.4 MP, so
 * only posters and drawings ever reach it, and they render at a lower DPI.
 */
export const MAX_PAGE_PIXELS = 16_000_000;

/**
 * Rec. 601 luma of RGBA pixels, composited over white, one byte per pixel.
 * Fixed point (weights x 1024) keeps the inner loop in integer maths; the
 * result matches round(0.299R + 0.587G + 0.114B) to within one level, and is
 * exact for black, white and the primaries.
 */
export function luminanceFromRgba(rgba: ArrayLike<number>, pixelCount: number, out?: Uint8Array): Uint8Array {
  const gray = out ?? new Uint8Array(pixelCount);
  for (let i = 0, p = 0; i < pixelCount; i++, p += 4) {
    const r = rgba[p];
    const g = rgba[p + 1];
    const b = rgba[p + 2];
    const a = rgba[p + 3];
    let y = (306 * r + 601 * g + 117 * b + 512) >> 10;
    if (a !== 255) {
      // Over white: y*a/255 + 255*(1 - a/255), rounded.
      y = ((y * a + 255 * (255 - a)) * 257 + 32768) >> 16;
    }
    gray[i] = y;
  }
  return gray;
}

/** Bytes per row of a 1-bit image: rows are padded to a whole byte. */
export function packedRowBytes(width: number): number {
  return (width + 7) >> 3;
}

/**
 * Thresholds luma to 1 bit and packs it MSB-first, each row padded to a byte.
 * PDF DeviceGray at 1 bpc reads 0 as black and 1 as white, so a pixel at or
 * above the threshold sets its bit. Padding bits are left at 0 and ignored.
 */
export function thresholdPack1Bit(gray: Uint8Array, width: number, height: number, threshold: number): Uint8Array {
  const rowBytes = packedRowBytes(width);
  const packed = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    const src = y * width;
    const dst = y * rowBytes;
    for (let x = 0; x < width; x++) {
      if (gray[src + x] >= threshold) packed[dst + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return packed;
}

/** Applies the same threshold to a gray buffer as 0/255 values, for previews. */
export function thresholdGray(gray: Uint8Array, threshold: number, out?: Uint8Array): Uint8Array {
  const result = out ?? new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) result[i] = gray[i] >= threshold ? 255 : 0;
  return result;
}

export interface PageGeometry {
  /** Output page size in PDF points, as the viewer shows it (rotation applied). */
  widthPt: number;
  heightPt: number;
  /** Raster size for the page. */
  pixelWidth: number;
  pixelHeight: number;
  /** pdf.js viewport scale that renders the page at that raster size. */
  scale: number;
  /** Effective resolution, lower than asked only when the pixel cap applied. */
  dpi: number;
}

/**
 * Raster size for a page shown at `widthPt` x `heightPt` points. DPI / 72 is
 * the pdf.js scale. Pages that would pass `maxPixels` are scaled down evenly.
 */
export function pageGeometry(widthPt: number, heightPt: number, dpi: number, maxPixels = MAX_PAGE_PIXELS): PageGeometry {
  let scale = dpi / 72;
  const area = widthPt * scale * heightPt * scale;
  if (area > maxPixels) scale *= Math.sqrt(maxPixels / area);
  const pixelWidth = Math.max(1, Math.round(widthPt * scale));
  const pixelHeight = Math.max(1, Math.round(heightPt * scale));
  return { widthPt, heightPt, pixelWidth, pixelHeight, scale, dpi: Math.round(scale * 72) };
}

export type ImageFilter = "FlateDecode" | "DCTDecode";

/** One page's image, ready to embed as an XObject. */
export interface EncodedPageImage {
  bytes: Uint8Array;
  filter: ImageFilter;
  bitsPerComponent: 1 | 8;
  pixelWidth: number;
  pixelHeight: number;
}

export interface EncodeCandidate {
  filter: ImageFilter;
  bytes: Uint8Array;
}

/** The smaller of the candidates; Flate wins a tie because it is lossless. */
export function chooseSmaller(candidates: EncodeCandidate[]): EncodeCandidate {
  if (candidates.length === 0) throw new Error("No encodings to choose from");
  let best = candidates[0];
  for (const candidate of candidates.slice(1)) {
    if (
      candidate.bytes.length < best.bytes.length ||
      (candidate.bytes.length === best.bytes.length && candidate.filter === "FlateDecode")
    ) {
      best = candidate;
    }
  }
  return best;
}

export type Deflate = (bytes: Uint8Array) => Promise<Uint8Array> | Uint8Array;

export interface EncodeOptions {
  mode: GrayMode;
  threshold?: number;
  quality?: number;
}

export type EncodePlan = "flate" | "jpeg" | "both";

/** Bands sampled to estimate both encodings before committing to one. */
export const SAMPLE_BANDS = 4;
/** Rows per band; a multiple of 8 so JPEG blocks do not straddle bands. */
export const SAMPLE_BAND_ROWS = 64;
/** An estimate this much smaller than the other settles it without trying both. */
export const DECISIVE_RATIO = 0.6;

/**
 * Copies SAMPLE_BANDS evenly spaced bands of rows into one strip, or returns
 * null when the page is short enough that sampling saves nothing.
 */
export function sampleBands(gray: Uint8Array, width: number, height: number): Uint8Array | null {
  const rows = SAMPLE_BANDS * SAMPLE_BAND_ROWS;
  if (height < rows * 3) return null;
  const strip = new Uint8Array(rows * width);
  const gap = (height - SAMPLE_BAND_ROWS) / (SAMPLE_BANDS - 1);
  for (let band = 0; band < SAMPLE_BANDS; band++) {
    const start = Math.round(band * gap) * width;
    strip.set(gray.subarray(start, start + SAMPLE_BAND_ROWS * width), band * SAMPLE_BAND_ROWS * width);
  }
  return strip;
}

/**
 * Which encodings are worth running in full, from sampled sizes. When one is
 * clearly smaller (under DECISIVE_RATIO of the other) only that one runs;
 * otherwise both run and the smaller is kept.
 */
export function planFromEstimate(flateBytes: number, jpegBytes: number): EncodePlan {
  if (flateBytes < jpegBytes * DECISIVE_RATIO) return "flate";
  if (jpegBytes < flateBytes * DECISIVE_RATIO) return "jpeg";
  return "both";
}

export interface EncodeReport {
  image: EncodedPageImage;
  plan: EncodePlan;
  /** Byte sizes of each encoding that was run in full. */
  sizes: { flate?: number; jpeg?: number; bw?: number };
  /** Milliseconds spent in each step. */
  timings: { luminance: number; sample?: number; flate?: number; jpeg?: number; bw?: number };
}

const clock = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/**
 * RGBA to an embeddable page image.
 *
 * Grayscale keeps the smaller of Flate (lossless, 8 bpc) and a gray JPEG. Text
 * and line art are far smaller as Flate and stay pixel-exact; photographs are
 * far smaller as JPEG. Running both costs 1.3 to 1.7 times the slower one, and
 * on a 300 DPI photo page the wasted Flate alone is about 300 ms, so four
 * sampled bands (about 8% of a 300 DPI page) are encoded both ways first and a
 * clear winner is encoded alone. Numbers: /workspace/grayscale-qa/size-report.md.
 *
 * Black and white is thresholded to 1 bit and deflated.
 */
export async function encodePageImage(
  rgba: ArrayLike<number>,
  width: number,
  height: number,
  options: EncodeOptions,
  deflate: Deflate,
): Promise<EncodeReport> {
  let started = clock();
  const gray = luminanceFromRgba(rgba, width * height);
  const timings: EncodeReport["timings"] = { luminance: clock() - started };

  if (options.mode === "bw") {
    started = clock();
    const packed = thresholdPack1Bit(gray, width, height, options.threshold ?? DEFAULT_THRESHOLD);
    const bytes = await deflate(packed);
    timings.bw = clock() - started;
    return {
      image: { bytes, filter: "FlateDecode", bitsPerComponent: 1, pixelWidth: width, pixelHeight: height },
      plan: "flate",
      sizes: { bw: bytes.length },
      timings,
    };
  }

  const quality = options.quality ?? JPEG_QUALITY;
  let plan: EncodePlan = "both";
  const strip = sampleBands(gray, width, height);
  if (strip) {
    started = clock();
    const rows = strip.length / width;
    const sampleFlate = (await deflate(strip)).length;
    const sampleJpeg = encodeGrayJpeg(strip, width, rows, quality).length;
    plan = planFromEstimate(sampleFlate, sampleJpeg);
    timings.sample = clock() - started;
  }

  const candidates: EncodeCandidate[] = [];
  const sizes: EncodeReport["sizes"] = {};
  if (plan !== "jpeg") {
    started = clock();
    const bytes = await deflate(gray);
    timings.flate = clock() - started;
    sizes.flate = bytes.length;
    candidates.push({ filter: "FlateDecode", bytes });
  }
  if (plan !== "flate") {
    started = clock();
    const bytes = encodeGrayJpeg(gray, width, height, quality);
    timings.jpeg = clock() - started;
    sizes.jpeg = bytes.length;
    candidates.push({ filter: "DCTDecode", bytes });
  }

  const best = chooseSmaller(candidates);
  return {
    image: { bytes: best.bytes, filter: best.filter, bitsPerComponent: 8, pixelWidth: width, pixelHeight: height },
    plan,
    sizes,
    timings,
  };
}

/** `Bank Statement.pdf` → `Bank Statement-grayscale.pdf`. Only a final .pdf is dropped. */
export function grayscaleFileName(name: string): string {
  const base = name.replace(/\.pdf$/i, "");
  return `${base.trim() === "" ? "document" : base}-grayscale.pdf`;
}

export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1000) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = size / 1024 / 1024;
  return `${mb < 10 ? mb.toFixed(2) : mb.toFixed(1)} MB`;
}

export type SizeChange = "smaller" | "larger" | "same";

export interface SizeComparison {
  change: SizeChange;
  /** e.g. "31% smaller", "2.4× larger", "about the same size". */
  delta: string;
  /** e.g. "1.2 MB → 840 KB, 31% smaller". */
  text: string;
}

/**
 * Output against input. Under 1% either way reads as the same size. Growth of
 * 2x or more reads as a multiple ("2.4× larger"), less than that as a percent.
 */
export function compareSizes(inputBytes: number, outputBytes: number): SizeComparison {
  const arrow = `${formatBytes(inputBytes)} → ${formatBytes(outputBytes)}`;
  const ratio = inputBytes > 0 ? outputBytes / inputBytes : 1;
  let change: SizeChange;
  let delta: string;
  if (Math.abs(ratio - 1) < 0.01) {
    change = "same";
    delta = "about the same size";
  } else if (ratio < 1) {
    change = "smaller";
    delta = `${Math.round((1 - ratio) * 100)}% smaller`;
  } else {
    change = "larger";
    delta = ratio >= 2 ? `${ratio.toFixed(1)}× larger` : `${Math.round((ratio - 1) * 100)}% larger`;
  }
  return { change, delta, text: `${arrow}, ${delta}` };
}
