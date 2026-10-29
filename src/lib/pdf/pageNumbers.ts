/**
 * Page numbering for PDFs: label text, page ranges, and where the number goes.
 *
 * Everything here is plain math except addPageNumbers, which takes the pdf-lib
 * module as an argument. That keeps this file free of a runtime pdf-lib import,
 * so the tool's route chunk does not pull the library in before paint, and the
 * node tests can import it directly.
 *
 * Geometry is worked out in *visual* coordinates first: the page as a reader sees
 * it, after /Rotate, origin at the bottom-left of the visible box, y up. It is then
 * mapped back into the page's own user space, and the text is rotated by the same
 * angle as the page so it reads upright. The visible box is the CropBox clipped to
 * the MediaBox; a CropBox with an x/y offset moves the origin with it.
 */
import type { PDFDocument, PDFFont, PDFPage } from "pdf-lib";

type PdfLib = typeof import("pdf-lib");

export type NumberPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/** Top row first, left to right, matching the 3×2 picker. */
export const NUMBER_POSITIONS: NumberPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

export type NumberFormat = "n" | "page-n" | "n-of-total" | "page-n-of-total";

export const NUMBER_FORMATS: NumberFormat[] = ["n", "page-n", "n-of-total", "page-n-of-total"];

export interface PageNumberOptions {
  position: NumberPosition;
  format: NumberFormat;
  /** The number printed on the first numbered page. */
  startAt: number;
  /** Points. */
  fontSize: number;
  /** Points from the visible edge to the text. */
  margin: number;
  /** Which pages get a number, e.g. "", "2-", "2-10", "5". Empty means all. */
  range: string;
}

export const DEFAULT_OPTIONS: PageNumberOptions = {
  position: "bottom-center",
  format: "n",
  startAt: 1,
  fontSize: 11,
  margin: 28,
  range: "",
};

export const LIMITS = {
  startAt: { min: 0, max: 99999 },
  fontSize: { min: 6, max: 36 },
  margin: { min: 0, max: 144 },
};

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Label text. `total` is the last number that will be printed (see planNumbering). */
export function formatPageLabel(format: NumberFormat, n: number, total: number): string {
  switch (format) {
    case "page-n":
      return `Page ${n}`;
    case "n-of-total":
      return `${n} of ${total}`;
    case "page-n-of-total":
      return `Page ${n} of ${total}`;
    case "n":
    default:
      return String(n);
  }
}

/** 1-based, inclusive. */
export interface PageRange {
  first: number;
  last: number;
}

export type RangeResult = { ok: true; range: PageRange } | { ok: false; error: string };

/**
 * One contiguous run of pages. A single run keeps the numbers sequential and makes
 * "of N" unambiguous; anything with commas is rejected rather than half-honoured.
 *
 *   ""  / "all"  every page
 *   "2-"         page 2 to the end
 *   "-10"        page 1 to 10
 *   "2-10"       pages 2 to 10 (an end past the last page is clipped to it)
 *   "5"          page 5 only
 */
export function parsePageRange(spec: string, pageCount: number): RangeResult {
  const text = spec.trim().toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, "");
  if (pageCount < 1) return { ok: false, error: "This PDF has no pages." };
  if (text === "" || text === "all") return { ok: true, range: { first: 1, last: pageCount } };

  const match = /^(\d*)(-?)(\d*)$/.exec(text);
  if (!match || (match[1] === "" && match[3] === "")) {
    return { ok: false, error: "Use one range, like 2- or 2-10." };
  }
  const [, a, dash, b] = match;
  if (!dash && b) return { ok: false, error: "Use one range, like 2- or 2-10." };

  const first = a ? Number(a) : 1;
  const last = dash ? (b ? Number(b) : pageCount) : first;

  if (first < 1) return { ok: false, error: "Pages start at 1." };
  if (first > pageCount) {
    return { ok: false, error: `This PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}.` };
  }
  if (last < first) return { ok: false, error: "The range ends before it starts." };
  return { ok: true, range: { first, last: Math.min(last, pageCount) } };
}

export interface PlannedLabel {
  /** 0-based index into the document's pages. */
  pageIndex: number;
  number: number;
  label: string;
}

export interface NumberingPlan {
  labels: PlannedLabel[];
  /** N in "of N": the last number printed, not the file's page count. */
  total: number;
}

export function planNumbering(
  range: PageRange,
  startAt: number,
  format: NumberFormat,
): NumberingPlan {
  const count = range.last - range.first + 1;
  const total = startAt + count - 1;
  const labels: PlannedLabel[] = [];
  for (let i = 0; i < count; i++) {
    const number = startAt + i;
    labels.push({ pageIndex: range.first - 1 + i, number, label: formatPageLabel(format, number, total) });
  }
  return { labels, total };
}

export type Rotation = 0 | 90 | 180 | 270;

/** /Rotate is a multiple of 90, possibly negative or over 360. */
export function normalizeRotation(angle: number): Rotation {
  const quarter = Math.round(angle / 90);
  return ((((quarter % 4) + 4) % 4) * 90) as Rotation;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function normalizeBox(box: Box): Box {
  const x = box.width < 0 ? box.x + box.width : box.x;
  const y = box.height < 0 ? box.y + box.height : box.y;
  return { x, y, width: Math.abs(box.width), height: Math.abs(box.height) };
}

/** CropBox clipped to MediaBox, as viewers display it. Falls back to MediaBox. */
export function visibleBox(media: Box, crop?: Box | null): Box {
  const m = normalizeBox(media);
  if (!crop) return m;
  const c = normalizeBox(crop);
  const x = Math.max(m.x, c.x);
  const y = Math.max(m.y, c.y);
  const right = Math.min(m.x + m.width, c.x + c.width);
  const top = Math.min(m.y + m.height, c.y + c.height);
  if (right <= x || top <= y) return m;
  return { x, y, width: right - x, height: top - y };
}

/** Width and height as displayed. A quarter turn swaps them. */
export function visualSize(box: Box, rotation: Rotation): { width: number; height: number } {
  return rotation === 90 || rotation === 270
    ? { width: box.height, height: box.width }
    : { width: box.width, height: box.height };
}

/**
 * Visual point to user space. /Rotate turns the page clockwise for display, so:
 *   90:  the user-space left edge is displayed at the top
 *   180: upside down
 *   270: the user-space left edge is displayed at the bottom
 */
export function visualToUser(box: Box, rotation: Rotation, vx: number, vy: number): { x: number; y: number } {
  switch (rotation) {
    case 90:
      return { x: box.x + box.width - vy, y: box.y + vx };
    case 180:
      return { x: box.x + box.width - vx, y: box.y + box.height - vy };
    case 270:
      return { x: box.x + vy, y: box.y + box.height - vx };
    case 0:
    default:
      return { x: box.x + vx, y: box.y + vy };
  }
}

export interface LabelPlacement {
  /** Baseline origin of the text in user space. */
  x: number;
  y: number;
  /** Counter-clockwise text rotation in degrees, equal to the page's /Rotate. */
  rotate: Rotation;
  /** Baseline origin in visual coordinates, for tests and the preview caption. */
  visual: { x: number; y: number };
}

/**
 * Bottom positions put the baseline `margin` above the visible bottom edge. Top
 * positions put the top of the capitals `margin` below the visible top edge. Left
 * and right measure to the ends of the text. The result is clamped so a large
 * margin or font cannot push the label off the page.
 */
export function placeLabel(input: {
  box: Box;
  rotation: Rotation;
  position: NumberPosition;
  margin: number;
  textWidth: number;
  capHeight: number;
}): LabelPlacement {
  const { box, rotation, position, margin, textWidth, capHeight } = input;
  const size = visualSize(box, rotation);
  const [vertical, horizontal] = position.split("-") as ["top" | "bottom", "left" | "center" | "right"];

  let vx =
    horizontal === "left"
      ? margin
      : horizontal === "right"
        ? size.width - margin - textWidth
        : (size.width - textWidth) / 2;
  let vy = vertical === "top" ? size.height - margin - capHeight : margin;

  vx = Math.min(Math.max(vx, 0), Math.max(0, size.width - textWidth));
  vy = Math.min(Math.max(vy, 0), Math.max(0, size.height - capHeight));

  const user = visualToUser(box, rotation, vx, vy);
  return { x: user.x, y: user.y, rotate: rotation, visual: { x: vx, y: vy } };
}

export function pageGeometry(page: PDFPage): { box: Box; rotation: Rotation } {
  return {
    box: visibleBox(page.getMediaBox(), page.getCropBox()),
    rotation: normalizeRotation(page.getRotation().angle),
  };
}

export function drawLabel(lib: PdfLib, page: PDFPage, font: PDFFont, label: string, options: PageNumberOptions) {
  const { box, rotation } = pageGeometry(page);
  const fontSize = clampInt(options.fontSize, LIMITS.fontSize.min, LIMITS.fontSize.max);
  const margin = clampInt(options.margin, LIMITS.margin.min, LIMITS.margin.max);
  const placement = placeLabel({
    box,
    rotation,
    position: options.position,
    margin,
    textWidth: font.widthOfTextAtSize(label, fontSize),
    capHeight: font.heightAtSize(fontSize, { descender: false }),
  });
  // A loaded page's existing content is wrapped in q … Q by pdf-lib before the first
  // draw (autoNormalizeCTM), so a transform the producer left active cannot move this.
  page.drawText(label, {
    x: placement.x,
    y: placement.y,
    size: fontSize,
    font,
    color: lib.rgb(0, 0, 0),
    rotate: lib.degrees(placement.rotate),
  });
  return placement;
}

/** The plan for a document, or the range error as an exception. */
export function planFor(options: PageNumberOptions, pageCount: number): NumberingPlan {
  const parsed = parsePageRange(options.range, pageCount);
  if (parsed.ok === false) throw new Error((parsed as { error: string }).error);
  const startAt = clampInt(options.startAt, LIMITS.startAt.min, LIMITS.startAt.max);
  return planNumbering(parsed.range, startAt, options.format);
}

/** Numbers `doc` in place. Pass `only` to draw a subset of the plan (the preview). */
export async function addPageNumbers(
  lib: PdfLib,
  doc: PDFDocument,
  options: PageNumberOptions,
  only?: (label: PlannedLabel) => boolean,
): Promise<NumberingPlan> {
  const plan = planFor(options, doc.getPageCount());
  const font = await doc.embedFont(lib.StandardFonts.Helvetica);
  const pages = doc.getPages();
  for (const entry of plan.labels) {
    if (only && !only(entry)) continue;
    drawLabel(lib, pages[entry.pageIndex], font, entry.label, options);
  }
  return plan;
}

export type OpenFailure = "encrypted" | "invalid" | "empty";

export class PdfOpenError extends Error {
  readonly kind: OpenFailure;
  constructor(kind: OpenFailure) {
    super(
      kind === "encrypted"
        ? "This PDF is password-protected or restricted."
        : kind === "empty"
          ? "This PDF has no pages."
          : "This file could not be read as a PDF.",
    );
    this.name = "PdfOpenError";
    this.kind = kind;
  }
}

function hasPdfHeader(bytes: Uint8Array): boolean {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  return head.includes("%PDF-");
}

/**
 * Opens a PDF for numbering. An encrypted file is refused rather than loaded with
 * ignoreEncryption, which would write numbers into a file whose other streams
 * stay encrypted and produce a broken download.
 */
export async function openPdf(lib: PdfLib, bytes: Uint8Array): Promise<PDFDocument> {
  if (!hasPdfHeader(bytes)) throw new PdfOpenError("invalid");
  let doc: PDFDocument;
  try {
    doc = await lib.PDFDocument.load(bytes, { updateMetadata: false });
  } catch (error) {
    const encrypted =
      error instanceof lib.EncryptedPDFError || (error instanceof Error && /encrypted/i.test(error.message));
    throw new PdfOpenError(encrypted ? "encrypted" : "invalid");
  }
  if (doc.isEncrypted) throw new PdfOpenError("encrypted");
  if (doc.getPageCount() === 0) throw new PdfOpenError("empty");
  return doc;
}

/** The whole job: bytes in, numbered bytes out. */
export async function numberPdf(
  lib: PdfLib,
  bytes: Uint8Array,
  options: PageNumberOptions,
): Promise<{ bytes: Uint8Array; plan: NumberingPlan }> {
  const doc = await openPdf(lib, bytes);
  const plan = await addPageNumbers(lib, doc, options);
  return { bytes: await doc.save(), plan };
}

/**
 * A one-page PDF holding a copy of `pageIndex` with its number drawn by the same
 * code as the download. The preview renders this, so what is shown is what is written.
 */
export async function previewPdf(
  lib: PdfLib,
  source: PDFDocument,
  options: PageNumberOptions,
  pageIndex: number,
): Promise<Uint8Array> {
  const plan = planFor(options, source.getPageCount());
  const entry = plan.labels.find((label) => label.pageIndex === pageIndex);

  const doc = await lib.PDFDocument.create();
  const [copy] = await doc.copyPages(source, [pageIndex]);
  doc.addPage(copy);
  if (entry) {
    const font = await doc.embedFont(lib.StandardFonts.Helvetica);
    drawLabel(lib, copy, font, entry.label, options);
  }
  return doc.save();
}
