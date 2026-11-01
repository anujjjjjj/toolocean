/**
 * Deleting pages from a PDF: the range field, selections, and the rebuilt file.
 *
 * Pages are 1-based everywhere a person sees them, which is every function here
 * except deletePages, whose list is 0-based like pdf-lib's own page indices.
 *
 * pdf-lib is passed in, as in pageNumbers.ts, so this file carries no runtime import
 * of it and the node tests can load it directly.
 */
import type { PDFDocument, PDFObject } from "pdf-lib";
import { pdfDownloadName } from "./downloadPdf.ts";
import { openPdf } from "./pageNumbers.ts";

type PdfLib = typeof import("pdf-lib");

export interface ParsedRange {
  /** Sorted, 1-based, no repeats. Empty when `error` is set. */
  pages: number[];
  error?: string;
}

const SYNTAX_HINT = "Use page numbers and ranges, like 2-4, 9.";

/**
 * Reads text such as "2-4, 9". An end past the last page is an error rather than
 * clipped, because the list says what gets deleted and a typo should not go unseen.
 *
 *   ""      nothing
 *   "4-2"   pages 2 to 4
 *   "8-"    page 8 to the end
 *   "-3"    page 1 to 3
 */
export function parseRange(text: string, pageCount: number): ParsedRange {
  const pages = new Set<number>();
  const fail = (error: string): ParsedRange => ({ pages: [], error });
  const outside = `This PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}.`;

  for (const raw of text.replace(/[–—]/g, "-").split(",")) {
    const token = raw.replace(/\s+/g, "");
    if (token === "") continue;
    const match = /^(\d*)(-?)(\d*)$/.exec(token);
    if (!match || (match[1] === "" && match[3] === "") || (!match[2] && match[3])) return fail(SYNTAX_HINT);

    const [, a, dash, b] = match;
    const start = a ? Number(a) : 1;
    const end = dash ? (b ? Number(b) : pageCount) : start;
    const low = Math.min(start, end);
    const high = Math.max(start, end);
    if (low < 1) return fail("Pages start at 1.");
    if (high > pageCount) return fail(outside);
    for (let page = low; page <= high; page++) pages.add(page);
  }
  return { pages: [...pages].sort((x, y) => x - y) };
}

/** The canonical text for a selection: [2, 3, 4, 9] becomes "2-4, 9". */
export function formatRange(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((x, y) => x - y);
  const runs: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const first = sorted[i];
    while (sorted[i + 1] === sorted[i] + 1) i += 1;
    runs.push(sorted[i] === first ? String(first) : `${first}-${sorted[i]}`);
  }
  return runs.join(", ");
}

export function oddPages(total: number): number[] {
  return Array.from({ length: Math.ceil(total / 2) }, (_, i) => i * 2 + 1);
}

export function evenPages(total: number): number[] {
  return Array.from({ length: Math.floor(total / 2) }, (_, i) => (i + 1) * 2);
}

export function keptPages(total: number, deleted: Iterable<number>): number[] {
  const gone = new Set(deleted);
  return Array.from({ length: total }, (_, i) => i + 1).filter((page) => !gone.has(page));
}

export function editedFileName(original: string): string {
  return pdfDownloadName(original, "edited");
}

export class DeleteAllPagesError extends Error {
  constructor() {
    super("A PDF needs at least one page.");
    this.name = "DeleteAllPagesError";
  }
}

/**
 * copyPages follows every reference on a page, so a link to a deleted page pulls a
 * full copy of that page into the output, unseen in a viewer but still in the file.
 * A link to a kept page lands on a duplicate that is not in the page tree either.
 * Walk the output from its root, cut every reference to a page that is not in the
 * tree, then drop whatever can no longer be reached.
 */
function removeStrayPages(lib: PdfLib, doc: PDFDocument) {
  const { PDFArray, PDFDict, PDFName, PDFNull, PDFRef, PDFStream } = lib;
  const { context } = doc;
  const inTree = new Set(doc.getPages().map((page) => page.ref));
  const typeKey = PDFName.of("Type");
  const pageType = PDFName.of("Page");

  const isStray = (value: PDFObject) => {
    if (!(value instanceof PDFRef) || inTree.has(value)) return false;
    const target = context.lookup(value);
    return target instanceof PDFDict && target.get(typeKey) === pageType;
  };

  const reached = new Set<PDFObject>();
  const stack: PDFObject[] = [context.trailerInfo.Root];
  if (context.trailerInfo.Info) stack.push(context.trailerInfo.Info);

  while (stack.length > 0) {
    let current = stack.pop() as PDFObject | undefined;
    if (current instanceof PDFRef) {
      if (reached.has(current)) continue;
      reached.add(current);
      current = context.lookup(current);
    }
    if (current instanceof PDFStream) current = current.dict;
    if (current instanceof PDFDict) {
      for (const [key, value] of current.entries()) {
        if (isStray(value)) current.delete(key);
        else stack.push(value);
      }
    } else if (current instanceof PDFArray) {
      for (let i = 0; i < current.size(); i++) {
        const value = current.get(i);
        if (isStray(value)) current.set(i, PDFNull);
        else stack.push(value);
      }
    }
  }

  for (const [ref] of context.enumerateIndirectObjects()) {
    if (!reached.has(ref)) context.delete(ref);
  }
}

/**
 * The kept pages, in their original order, copied into a new document. Throws
 * DeleteAllPagesError if nothing would be left, and PdfOpenError for a file that
 * is encrypted or unreadable. `deletedIndices` is 0-based.
 */
export async function deletePages(lib: PdfLib, bytes: Uint8Array, deletedIndices: number[]): Promise<Uint8Array> {
  const source = await openPdf(lib, bytes);
  const kept = keptPages(
    source.getPageCount(),
    deletedIndices.map((index) => index + 1),
  ).map((page) => page - 1);
  if (kept.length === 0) throw new DeleteAllPagesError();

  const out = await lib.PDFDocument.create();
  const copies = await out.copyPages(source, kept);
  for (const page of copies) out.addPage(page);
  removeStrayPages(lib, out);
  return out.save();
}
