/**
 * Writes encoded page images into a new PDF, one full-bleed image per page.
 *
 * pdf-lib is passed in rather than imported, so this file adds nothing to any
 * chunk that imports it statically, and the node tests drive it with the real
 * library. The image bytes are already compressed (Flate or DCT), so they go
 * in as raw streams with the matching /Filter; pdf-lib does not compress again.
 */
import type * as PdfLibModule from "pdf-lib";
import type { EncodedPageImage } from "./grayscalePdf.ts";

export type PdfLib = Pick<
  typeof PdfLibModule,
  "PDFDocument" | "pushGraphicsState" | "popGraphicsState" | "concatTransformationMatrix" | "drawObject"
>;

export interface GrayscaleWriter {
  /** Adds a page of `widthPt` x `heightPt` points covered by `image`. */
  addPage(widthPt: number, heightPt: number, image: EncodedPageImage): void;
  save(): Promise<Uint8Array>;
  readonly pageCount: number;
}

export async function createGrayscaleWriter(lib: PdfLib): Promise<GrayscaleWriter> {
  const doc = await lib.PDFDocument.create();
  doc.setProducer("ToolOcean Grayscale PDF");
  doc.setCreator("ToolOcean (toolocean.co/grayscale-pdf)");

  return {
    get pageCount() {
      return doc.getPageCount();
    },

    addPage(widthPt, heightPt, image) {
      const stream = doc.context.stream(image.bytes, {
        Type: "XObject",
        Subtype: "Image",
        Width: image.pixelWidth,
        Height: image.pixelHeight,
        ColorSpace: "DeviceGray",
        BitsPerComponent: image.bitsPerComponent,
        Filter: image.filter,
      });
      const ref = doc.context.register(stream);
      const page = doc.addPage([widthPt, heightPt]);
      const name = page.node.newXObject("Im", ref);
      page.pushOperators(
        lib.pushGraphicsState(),
        lib.concatTransformationMatrix(widthPt, 0, 0, heightPt, 0, 0),
        lib.drawObject(name),
        lib.popGraphicsState(),
      );
    },

    save() {
      return doc.save();
    },
  };
}
