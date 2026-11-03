/**
 * PDF to Text: turning pdf.js text items into readable lines, and everything the
 * tool does with those lines afterwards.
 *
 * Nothing here touches the DOM or imports pdf.js. The item shape is declared
 * locally, so the node tests load this file directly and the tool stays the only
 * place that pulls in the engine, through the lazy loader.
 *
 * Pages are 1-based everywhere, as a person reads them.
 */

/** The fields of a pdf.js TextItem this file reads. */
export interface PdfTextItem {
  str: string;
  /** [a, b, c, d, e, f]: e and f are the baseline origin in PDF user space. */
  transform: number[];
  width: number;
  height: number;
  hasEOL: boolean;
}

/** One page, read once and cached, so changing an option never re-reads the PDF. */
export interface ExtractedPage {
  page: number;
  /** The page's lines as reconstructed, before any trimming. */
  text: string;
  /** No text item on the page holds anything but whitespace. */
  scanned: boolean;
}

/** Space between two runs on one line, as a share of the font size. */
const SPACE_GAP_EM = 0.2;
/** A baseline move bigger than this share of the font size starts a new line. */
const NEW_LINE_EM = 0.5;
/** A gap this many times the page's usual line spacing becomes a blank line. */
const PARAGRAPH_FACTOR = 1.5;
/** Line spacing assumed when a page has too few lines to measure its own. */
const DEFAULT_LEADING_EM = 1.2;

const WHITESPACE_END = /\s$/;
const WHITESPACE_START = /^\s/;

function fontSize(item: PdfTextItem): number {
  const [a = 0, , , d = 0] = item.transform;
  return Math.abs(d) || Math.abs(item.height) || Math.abs(a) || 1;
}

interface Line {
  text: string;
  /** Baseline of the line's first run. */
  y: number;
  size: number;
}

/**
 * Rebuilds the lines of one page from its text items, in the order pdf.js
 * returns them, which is the order they were drawn.
 *
 *   - hasEOL, or an empty item carrying hasEOL, ends the line.
 *   - So does a baseline move of more than half the font size. Smaller moves are
 *     superscripts and subscripts and stay on the line.
 *   - A space goes in when the horizontal gap between one run's end (e + width)
 *     and the next run's start is over 0.2 em and neither side already has
 *     whitespace. Glyph runs that touch, or nearly touch, are joined as they are,
 *     so a word split across runs stays one word.
 *   - A vertical step over 1.5 times the page's usual line spacing becomes a blank
 *     line, which is how paragraphs and headings get separated. The usual spacing
 *     is the median step on the page, held between 1 and 2 em so a page of short
 *     isolated lines cannot turn every break into a paragraph.
 */
export function reconstructLines(items: readonly PdfTextItem[]): string {
  const lines: Line[] = [];
  let current: Line | null = null;
  let lastEnd = 0;
  let lastY = 0;
  let lastSize = 0;
  let breakPending = false;

  for (const item of items) {
    const str = item.str ?? "";
    if (str === "") {
      if (item.hasEOL) breakPending = true;
      continue;
    }
    const size = fontSize(item);
    const x = item.transform[4] ?? 0;
    const y = item.transform[5] ?? 0;

    const moved = current !== null && Math.abs(y - lastY) > NEW_LINE_EM * Math.max(size, lastSize);
    if (current === null || breakPending || moved) {
      current = { text: str, y, size };
      lines.push(current);
    } else {
      const gap = x - lastEnd;
      const threshold = SPACE_GAP_EM * Math.max(size, lastSize);
      // A run that jumps back by more than an em is a new piece of text on the same baseline.
      const separate = gap > threshold || gap < -Math.max(size, lastSize);
      if (separate && !WHITESPACE_END.test(current.text) && !WHITESPACE_START.test(str)) current.text += " ";
      current.text += str;
      current.size = Math.max(current.size, size);
    }

    lastEnd = x + (item.width || 0);
    lastY = y;
    lastSize = size;
    breakPending = item.hasEOL;
  }

  if (lines.length === 0) return "";

  const steps: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    const step = lines[i - 1].y - lines[i].y;
    if (step > 0) steps.push(step);
  }
  const usual = steps.length >= 2 ? median(steps) : null;

  let out = lines[0].text;
  for (let i = 1; i < lines.length; i++) {
    const size = Math.max(lines[i - 1].size, lines[i].size);
    const leading = usual === null ? DEFAULT_LEADING_EM * size : clamp(usual, size, 2 * size);
    const step = Math.abs(lines[i - 1].y - lines[i].y);
    out += step > PARAGRAPH_FACTOR * leading ? "\n\n" : "\n";
    out += lines[i].text;
  }
  return out;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/** True when the page has no text layer: no item holds a visible character. */
export function isScannedPage(items: readonly PdfTextItem[]): boolean {
  return !items.some((item) => /\S/.test(item.str ?? ""));
}

export function extractPage(page: number, items: readonly PdfTextItem[]): ExtractedPage {
  return { page, text: reconstructLines(items), scanned: isScannedPage(items) };
}

export type ParsedPages = { pages: number[]; error?: undefined } | { pages?: undefined; error: string };

const RANGE_HINT = "Use page numbers and ranges, like 1-3, 5, 8-.";

/**
 * Reads a page list such as "1-3, 5, 8-". Whitespace is ignored, en and em dashes
 * count as hyphens, "4-2" means 2 to 4, "8-" runs to the last page and "-3" starts
 * at page 1. Returns sorted pages without repeats, or an error naming the problem.
 */
export function parsePageRange(text: string, pageCount: number): ParsedPages {
  const pages = new Set<number>();
  const plural = `${pageCount} page${pageCount === 1 ? "" : "s"}`;

  for (const raw of text.replace(/[–—]/g, "-").split(",")) {
    const token = raw.replace(/\s+/g, "");
    if (token === "") continue;
    const match = /^(\d*)(-?)(\d*)$/.exec(token);
    if (!match || (match[1] === "" && match[3] === "") || (!match[2] && match[3])) {
      return { error: `"${raw.trim()}" is not a page or range. ${RANGE_HINT}` };
    }
    const [, a, dash, b] = match;
    const start = a ? Number(a) : 1;
    const end = dash ? (b ? Number(b) : pageCount) : start;
    const low = Math.min(start, end);
    const high = Math.max(start, end);
    if (low < 1) return { error: "Pages start at 1." };
    if (high > pageCount) return { error: `Page ${high} does not exist. This PDF has ${plural}.` };
    for (let page = low; page <= high; page++) pages.add(page);
  }

  if (pages.size === 0) return { error: `Type the pages to copy, like 1-3, 5, 8-.` };
  return { pages: [...pages].sort((x, y) => x - y) };
}

/**
 * Tidies extracted text: runs of spaces and tabs become one space, spaces at the
 * end of a line go, and two or more blank lines in a row become one. Leading and
 * trailing blank lines are dropped.
 */
export function trimWhitespace(text: string): string {
  return text
    .replace(/[ \t\f\v\u00a0]+/g, " ")
    .replace(/ +$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+|\n+$/g, "");
}

export interface AssembleOptions {
  /** Put "--- Page N ---" on its own line before each page. */
  pageBreaks: boolean;
  trim: boolean;
}

export const NO_TEXT_MARKER = "[no text layer]";

export function pageSeparator(page: number): string {
  return `--- Page ${page} ---`;
}

/**
 * Joins the chosen pages into the final text. With page breaks every page gets
 * its separator line, and a page without a text layer gets a short marker under
 * it, so the numbering never skips. Without them, pages with text are joined by a
 * blank line and scanned pages are left out.
 */
export function assembleText(pages: readonly ExtractedPage[], options: AssembleOptions): string {
  const body = (page: ExtractedPage) => (options.trim ? trimWhitespace(page.text) : page.text);
  if (options.pageBreaks) {
    return pages
      .map((page) => {
        const text = page.scanned ? "" : body(page);
        return `${pageSeparator(page.page)}\n${text === "" ? NO_TEXT_MARKER : text}`;
      })
      .join("\n\n");
  }
  return pages
    .filter((page) => !page.scanned)
    .map(body)
    .filter((text) => text !== "")
    .join("\n\n");
}

/** Pages without a text layer, in page order. */
export function scannedPages(pages: readonly ExtractedPage[]): number[] {
  return pages.filter((page) => page.scanned).map((page) => page.page);
}

/**
 * The plain notice for pages without a text layer.
 *
 *   [3]          Page 3 looks like a scan, no text layer, ...
 *   [3, 7]       Pages 3, 7 look like scans, no text layer, ...
 *   every page   says so outright, for the whole file or for the chosen pages
 */
export function scanMessage(scanned: readonly number[], considered: number, wholeDocument: boolean): string | null {
  if (scanned.length === 0) return null;
  if (scanned.length === considered) {
    if (considered === 1) {
      return wholeDocument
        ? "This PDF's only page looks like a scan, no text layer, so there is no text to copy from it."
        : `Page ${scanned[0]} looks like a scan, no text layer, so there is no text to copy from it.`;
    }
    return wholeDocument
      ? "Every page in this PDF looks like a scan, no text layer, so there is no text to copy from it."
      : "Every page you chose looks like a scan, no text layer, so there is no text to copy from them.";
  }
  if (scanned.length === 1) {
    return `Page ${scanned[0]} looks like a scan, no text layer, so there is no text to copy from it.`;
  }
  return `Pages ${scanned.join(", ")} look like scans, no text layer, so there is no text to copy from them.`;
}

/** Characters are code points, so an emoji or a CJK supplement character counts once. */
export function countCharacters(text: string): number {
  return text.length - (text.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g)?.length ?? 0);
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** "Bank Statement.pdf" becomes "Bank Statement.txt". The base name is kept as it is. */
export function textFileName(original: string): string {
  const name = original.replace(/^.*[\\/]/, "");
  const base = /\.pdf$/i.test(name) ? name.slice(0, -4) : name.replace(/\.[^.]*$/, "");
  return `${base || "document"}.txt`;
}

/** True when the bytes carry a PDF header near the start, as readers require. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  const head = bytes.subarray(0, 1024);
  for (let i = 0; i + 4 < head.length; i++) {
    if (head[i] === 0x25 && head[i + 1] === 0x50 && head[i + 2] === 0x44 && head[i + 3] === 0x46 && head[i + 4] === 0x2d) {
      return true;
    }
  }
  return false;
}
