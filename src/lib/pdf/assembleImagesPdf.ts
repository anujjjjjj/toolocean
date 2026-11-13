/**
 * Shared images-to-PDF assembly used by Images to PDF and HEIC to PDF.
 *
 * Callers pass already-encoded JPEG or PNG bytes. This module never touches
 * the HEIC decoder and is DOM-free so node --test can import it directly.
 */

export const A4_PAGE_SIZE = [595.28, 841.89] as const;
export const LETTER_PAGE_SIZE = [612, 792] as const;

export type PdfPageSize = "a4" | "letter" | "fit";
export type PdfOrientation = "portrait" | "landscape" | "auto";

export type ImagesPdfOptions = {
  pageSize?: PdfPageSize;
  orientation?: PdfOrientation;
  /** Margin on every side, in PDF points. Negative values are treated as 0. */
  margin?: number;
};

export type ImagesPdfImage = {
  name: string;
  bytes: Uint8Array;
  format: "jpeg" | "png";
};

/** Page width and height in points for one image under the chosen options. */
export function pageDimensions(
  imageWidth: number,
  imageHeight: number,
  options?: ImagesPdfOptions,
): { width: number; height: number } {
  const pageSize = options?.pageSize ?? "fit";
  const orientation = options?.orientation ?? "auto";

  // Default: one page exactly as many points as the picture has pixels.
  if (pageSize === "fit" && orientation === "auto") {
    return { width: imageWidth, height: imageHeight };
  }

  const base =
    pageSize === "a4"
      ? { width: A4_PAGE_SIZE[0], height: A4_PAGE_SIZE[1] }
      : pageSize === "letter"
        ? { width: LETTER_PAGE_SIZE[0], height: LETTER_PAGE_SIZE[1] }
        : { width: imageWidth, height: imageHeight };

  const portrait = { width: Math.min(base.width, base.height), height: Math.max(base.width, base.height) };
  const landscape = { width: Math.max(base.width, base.height), height: Math.min(base.width, base.height) };

  if (orientation === "portrait") return portrait;
  if (orientation === "landscape") return landscape;
  return imageWidth >= imageHeight ? landscape : portrait;
}

/**
 * Uniform, centred placement of an image inside a page inset by `margin`.
 * The pixels are not rotated. When margin is 0 and the page matches the
 * image, the result is {x:0,y:0,width:imageWidth,height:imageHeight}.
 */
export function imagePlacement(
  pageWidth: number,
  pageHeight: number,
  imageWidth: number,
  imageHeight: number,
  margin = 0,
): { x: number; y: number; width: number; height: number } {
  const inset = Math.max(0, margin);
  const boxWidth = pageWidth - inset * 2;
  const boxHeight = pageHeight - inset * 2;
  if (boxWidth <= 0 || boxHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return { x: pageWidth / 2, y: pageHeight / 2, width: 0, height: 0 };
  }
  const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: inset + (boxWidth - width) / 2,
    y: inset + (boxHeight - height) / 2,
    width,
    height,
  };
}

/**
 * One page per image, in array order. Default options keep each page sized
 * to the picture and draw it edge to edge.
 */
export async function assembleImagesPdf(images: ImagesPdfImage[], options?: ImagesPdfOptions): Promise<Uint8Array> {
  if (images.length === 0) {
    const error = new Error("No decoded photos to put in the PDF.");
    (error as { reason?: string }).reason = "no-decoded";
    throw error;
  }
  const { PDFDocument } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const margin = Math.max(0, options?.margin ?? 0);
  for (const image of images) {
    const embedded = image.format === "png" ? await pdfDoc.embedPng(image.bytes) : await pdfDoc.embedJpg(image.bytes);
    const pageSize = pageDimensions(embedded.width, embedded.height, options);
    const page = pdfDoc.addPage([pageSize.width, pageSize.height]);
    const placement = imagePlacement(pageSize.width, pageSize.height, embedded.width, embedded.height, margin);
    page.drawImage(embedded, placement);
  }
  return pdfDoc.save();
}
