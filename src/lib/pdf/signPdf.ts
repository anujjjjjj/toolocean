import { PDFDocument } from "pdf-lib";

export interface SignaturePlacement {
  /** Zero-based page index. */
  pageIndex: number;
  /** Distance from the left edge, as a fraction of the page width. */
  xRatio: number;
  /** Distance from the top edge, as a fraction of the page height. */
  yRatio: number;
  /** Signature width as a fraction of the page width. Height follows the image. */
  widthRatio: number;
}

export async function readPdfPageCount(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  return doc.getPageCount();
}

/**
 * Draws a PNG onto one page. The rest of the page content is left in place,
 * so existing text stays selectable. This is a picture of a signature, not a
 * cryptographic signature.
 */
export async function applySignatureImage(
  pdfBytes: Uint8Array,
  pngBytes: Uint8Array,
  placement: SignaturePlacement,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { updateMetadata: false });
  const pages = doc.getPages();
  const page = pages[placement.pageIndex];
  if (!page) {
    throw new Error(`This PDF has no page ${placement.pageIndex + 1}.`);
  }

  const png = await doc.embedPng(pngBytes);
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const widthRatio = clamp(placement.widthRatio, 0.05, 0.9);
  const drawWidth = pageWidth * widthRatio;
  const drawHeight = drawWidth * (png.height / png.width);
  const x = clamp(placement.xRatio, 0, 1) * pageWidth;
  const top = clamp(placement.yRatio, 0, 1) * pageHeight;
  let y = pageHeight - top - drawHeight;

  const maxX = Math.max(0, pageWidth - drawWidth);
  const maxY = Math.max(0, pageHeight - drawHeight);
  const clampedX = clamp(x, 0, maxX);
  y = clamp(y, 0, maxY);

  page.drawImage(png, {
    x: clampedX,
    y,
    width: drawWidth,
    height: drawHeight,
  });

  return doc.save();
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
