/**
 * Off-main-thread half of Grayscale PDF: RGBA in, an embeddable page image out.
 *
 * Luma, thresholding, deflate and the gray JPEG encoder all run here, so a 300
 * DPI page (8 MP of pixel maths) never blocks the tab. Deflate uses the
 * browser's CompressionStream ("deflate" is the zlib format FlateDecode reads)
 * and falls back to pako where that API is missing.
 */
import { encodePageImage, type EncodeOptions, type EncodeReport } from "./grayscalePdf";
import { deflateBytes } from "./deflate";

export interface GrayscaleRequest {
  id: number;
  rgba: ArrayBuffer;
  width: number;
  height: number;
  options: EncodeOptions;
}

export type GrayscaleResponse =
  | ({ id: number; ok: true } & EncodeReport)
  | { id: number; ok: false; message: string };

const scope = self as unknown as { postMessage(message: GrayscaleResponse, transfer?: Transferable[]): void };

self.onmessage = async (event: MessageEvent<GrayscaleRequest>) => {
  const { id, rgba, width, height, options } = event.data;
  try {
    const report = await encodePageImage(new Uint8ClampedArray(rgba), width, height, options, deflateBytes);
    const response: GrayscaleResponse = { id, ok: true, ...report };
    scope.postMessage(response, [report.image.bytes.buffer]);
  } catch (error) {
    const response: GrayscaleResponse = { id, ok: false, message: error instanceof Error ? error.message : String(error) };
    scope.postMessage(response);
  }
};
