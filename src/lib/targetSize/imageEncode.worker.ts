import { createWorkerSurface, encodeOnSurface } from "./encodeCore";
import type { EncodeImageOptions, EncodeImageResult } from "./types";

interface RequestMessage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  options: EncodeImageOptions;
}

self.onmessage = async (event: MessageEvent<RequestMessage>) => {
  const { bitmap, width, height, options } = event.data;
  try {
    const surface = createWorkerSurface();
    if (!surface) throw new Error("OffscreenCanvas is unavailable");
    const result = await encodeOnSurface(surface, bitmap, width, height, options);
    const copy = result.bytes.slice().buffer;
    const payload: EncodeImageResult = result;
    (self as unknown as Worker).postMessage({ ok: true, result: payload }, [copy]);
  } catch (error) {
    (self as unknown as Worker).postMessage({
      ok: false,
      message: error instanceof Error ? error.message : "Encode failed",
    });
  } finally {
    bitmap.close();
  }
};
