/**
 * Thin glue for /heic-to-pdf: names, the deliver/withhold decision, and
 * assembling already-encoded JPEG or PNG bytes into a one-page-per-image PDF.
 *
 * HEIC decoding stays in heicDecoder.ts; this file never touches the wasm
 * engine. Relative-free of DOM so node --test can import it directly.
 */

export type HeicPdfImage = {
  name: string;
  bytes: Uint8Array;
  format: "jpeg" | "png";
};

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

/**
 * One page per image, in array order, sized to the photo's pixel width and
 * height. Callers must pass already-upright pixels (libheif applies irot
 * before encode). The original HEIC bytes are not copied in.
 */
export async function assembleImagesPdf(images: HeicPdfImage[]): Promise<Uint8Array> {
  if (images.length === 0) {
    const error = new Error("No decoded photos to put in the PDF.");
    (error as { reason?: string }).reason = "no-decoded";
    throw error;
  }
  const { PDFDocument } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  for (const image of images) {
    const embedded = image.format === "png" ? await pdfDoc.embedPng(image.bytes) : await pdfDoc.embedJpg(image.bytes);
    const page = pdfDoc.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width: embedded.width,
      height: embedded.height,
    });
  }
  return pdfDoc.save();
}
