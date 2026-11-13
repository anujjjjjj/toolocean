/**
 * Thin glue for /heic-to-pdf: names and the deliver/withhold decision.
 *
 * HEIC decoding stays in heicDecoder.ts. PDF page layout lives in
 * assembleImagesPdf.ts, shared with Images to PDF. This file never touches
 * the wasm engine and is DOM-free so node --test can import it directly.
 */

export {
  A4_PAGE_SIZE,
  LETTER_PAGE_SIZE,
  assembleImagesPdf,
  imagePlacement,
  pageDimensions,
} from "../pdf/assembleImagesPdf.ts";
export type { ImagesPdfImage as HeicPdfImage, ImagesPdfOptions, PdfOrientation, PdfPageSize } from "../pdf/assembleImagesPdf.ts";

export type HeicPdfOutcome =
  | { deliver: true; success: true }
  | { deliver: false; success: false; reason: "no-decoded" | "assemble-failed" };

/** A PDF is handed over only when at least one photo actually decoded. */
export function heicToPdfOutcome(decodedCount: number): HeicPdfOutcome {
  if (decodedCount <= 0) return { deliver: false, success: false, reason: "no-decoded" };
  return { deliver: true, success: true };
}

/** IMG_0412.HEIC becomes IMG_0412.pdf. Several photos become heic-photos.pdf. */
export function heicToPdfOutputName(names: string[]): string {
  if (names.length === 1) {
    const base = names[0]?.replace(/\.[^./\\]*$/, "").trim();
    return `${base || "image"}.pdf`;
  }
  return "heic-photos.pdf";
}
