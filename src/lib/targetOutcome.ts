/**
 * What a size-target run is allowed to claim, decided from the numbers alone.
 *
 * The engines in src/lib/targetSize return their best attempt whether or not it
 * helps. This module decides whether that attempt is handed to the person
 * (`deliver`) and whether it counts as a successful run for the tool-run event
 * (`success`). The tool components only turn the outcome into words.
 *
 * Relative imports with extensions, so node --test can load it directly.
 */
import { sniffImageFormat } from "./image/sniffImageFormat.ts";

export type ImageInputFormat = "jpeg" | "png" | "webp" | "other";
export type ImageOutputFormat = "jpeg" | "webp";

const FORMAT_NAME: Record<ImageInputFormat, string | null> = { jpeg: "JPEG", png: "PNG", webp: "WebP", other: null };

/** JPEG and PNG from the shared sniffer, plus the RIFF....WEBP container. */
export function sniffImageInput(bytes: Uint8Array): ImageInputFormat {
  const known = sniffImageFormat(bytes);
  if (known !== "other") return known;
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return "other";
}

/** "PNG → JPEG", "converted to JPEG" for an unnamed input, or null when nothing changed. */
export function formatChangeLabel({ input, output }: { input: ImageInputFormat; output: ImageOutputFormat }): string | null {
  if (input === output) return null;
  const to = FORMAT_NAME[output];
  const from = FORMAT_NAME[input];
  return from ? `${from} → ${to}` : `converted to ${to}`;
}

/** "10,240 bytes". Fixed locale, so prerender and the browser agree. */
export function byteCount(bytes: number): string {
  return `${bytes.toLocaleString("en-US")} bytes`;
}

interface Delivered {
  deliver: true;
  success: true;
}
interface Withheld {
  deliver: false;
  success: false;
}
const DELIVERED: Delivered = { deliver: true, success: true };
const WITHHELD: Withheld = { deliver: false, success: false };

/* ------------------------------------------------------------------ */
/* Images                                                              */
/* ------------------------------------------------------------------ */

export type ImageOutcome =
  /** Exact mode: under the target at full pixel size. */
  | ({ kind: "fit" } & Delivered)
  /** Exact mode: under the target after the engine reduced the pixel size. */
  | ({ kind: "fit-scaled" } & Delivered)
  /** Larger than the original, but the person picked this output format and it differs from the input. */
  | ({ kind: "converted-larger" } & Delivered)
  /** Quality mode: smaller than the original. */
  | ({ kind: "smaller" } & Delivered)
  /** Exact mode: even the smallest attempt is over the target. */
  | ({ kind: "miss" } & Withheld)
  /** Not smaller than the original and no explicit conversion: upload the original. */
  | ({ kind: "not-smaller" } & Withheld);

interface ImageOutcomeBase {
  originalBytes: number;
  outputBytes: number;
  inputFormat: ImageInputFormat;
  outputFormat: ImageOutputFormat;
  /** True only when the person pressed a format button. The default JPEG is not a choice. */
  formatExplicit: boolean;
}

export type ImageOutcomeArgs =
  | (ImageOutcomeBase & { mode: "exact"; targetBytes: number; withinTarget: boolean; scale: number })
  | (ImageOutcomeBase & { mode: "quality" });

export function decideImageOutcome(args: ImageOutcomeArgs): ImageOutcome {
  if (args.mode === "exact" && !args.withinTarget) return { kind: "miss", ...WITHHELD };
  if (args.outputBytes >= args.originalBytes) {
    const explicitConversion = args.formatExplicit && args.outputFormat !== args.inputFormat;
    return explicitConversion ? { kind: "converted-larger", ...DELIVERED } : { kind: "not-smaller", ...WITHHELD };
  }
  switch (args.mode) {
    case "quality":
      return { kind: "smaller", ...DELIVERED };
    case "exact":
      return args.scale < 1 ? { kind: "fit-scaled", ...DELIVERED } : { kind: "fit", ...DELIVERED };
    default: {
      const _exhaustive: never = args;
      return _exhaustive;
    }
  }
}

export function imageDownloadName({ name, format }: { name: string; format: ImageOutputFormat }): string {
  return `${name.replace(/\.[^.]+$/, "")}-sized.${format === "webp" ? "webp" : "jpg"}`;
}

/* ------------------------------------------------------------------ */
/* PDFs                                                                */
/* ------------------------------------------------------------------ */

export type PdfOutcome =
  /** The lossless rewrite is under the target and smaller than the original. Text stays selectable. */
  | ({ kind: "lossless-fit" } & Delivered)
  /** Pages redrawn as JPEG pictures at the full painted resolution. */
  | ({ kind: "raster-fit" } & Delivered)
  /** Pages redrawn below one pixel per PDF point (scale < 1) to fit. Small print may suffer. */
  | ({ kind: "raster-fit-low-res" } & Delivered)
  /** The smallest picture copy is still over the target. */
  | ({ kind: "miss" } & Withheld)
  /** The original is already at or under the target and nothing beat it losslessly. */
  | ({ kind: "already-under" } & Withheld)
  /** Over the target, and even the smallest picture copy is bigger than the original. */
  | ({ kind: "not-smaller-over-target" } & Withheld);

export interface PdfOutcomeArgs {
  originalBytes: number;
  outputBytes: number;
  targetBytes: number;
  withinTarget: boolean;
  mode: "lossless" | "raster";
  /** Pixels per PDF point that the engine settled on (2 is the painted scale). */
  scale: number;
}

export function decidePdfOutcome(args: PdfOutcomeArgs): PdfOutcome {
  const { originalBytes, outputBytes, targetBytes, withinTarget, mode, scale } = args;
  const notSmaller = outputBytes >= originalBytes;
  // A file that already fits is never swapped for pictures of itself.
  if (originalBytes <= targetBytes && (notSmaller || mode === "raster")) return { kind: "already-under", ...WITHHELD };
  if (notSmaller) return { kind: "not-smaller-over-target", ...WITHHELD };
  if (!withinTarget) return { kind: "miss", ...WITHHELD };
  switch (mode) {
    case "lossless":
      return { kind: "lossless-fit", ...DELIVERED };
    case "raster":
      return scale < 1 ? { kind: "raster-fit-low-res", ...DELIVERED } : { kind: "raster-fit", ...DELIVERED };
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

/** Picture copies are "-compressed"; a lossless rewrite stays "-optimised". */
export function pdfDownloadName({ name, raster }: { name: string; raster: boolean }): string {
  return `${name.replace(/\.pdf$/i, "")}${raster ? "-compressed.pdf" : "-optimised.pdf"}`;
}
