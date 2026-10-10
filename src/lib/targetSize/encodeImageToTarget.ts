import { createMainSurface, encodeOnSurface } from "./encodeCore";
import workerUrl from "./imageEncode.worker.ts?worker&url";
import type { EncodeImageOptions, EncodeImageResult } from "./types";

export type { EncodeImageOptions, EncodeImageResult, TargetMime } from "./types";

function supportsWorker(): boolean {
  return typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap === "function";
}

async function encodeInWorker(
  bitmap: ImageBitmap,
  options: EncodeImageOptions,
): Promise<EncodeImageResult> {
  const copy = await createImageBitmap(bitmap);
  const worker = new Worker(new URL(workerUrl, import.meta.url), { type: "module" });
  try {
    return await new Promise((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<{ ok: boolean; result?: EncodeImageResult; message?: string }>) => {
        if (event.data.ok && event.data.result) resolve(event.data.result);
        else reject(new Error(event.data.message || "Worker encode failed"));
      };
      worker.onerror = () => reject(new Error("Worker encode failed"));
      worker.postMessage(
        { bitmap: copy, width: copy.width, height: copy.height, options },
        [copy],
      );
    });
  } finally {
    worker.terminate();
  }
}

/**
 * Hashed worker script. A plain `new URL("./imageEncode.worker.ts")` is emitted as a
 * data URL because `.ts` is an MPEG transport type, so the prefetch must use the
 * worker build URL instead.
 */
export function imageEncodeWorkerUrl(): string {
  return new URL(workerUrl, import.meta.url).href;
}

/** The encode worker and its imports are fetched on demand. Pull the script so it can be cached. */
export function prefetchImageEncodeAssets(): void {
  void fetch(imageEncodeWorkerUrl()).catch(() => {});
}

/** Encode toward a byte ceiling. Uses an OffscreenCanvas worker when the browser has one. */
export async function encodeImageToTarget(
  source: CanvasImageSource & { width: number; height: number },
  options: EncodeImageOptions,
): Promise<EncodeImageResult> {
  if (supportsWorker() && typeof ImageBitmap !== "undefined") {
    try {
      const bitmap = source instanceof ImageBitmap ? source : await createImageBitmap(source);
      return await encodeInWorker(bitmap, options);
    } catch {
      // Main-thread canvas is the fallback when the worker cannot start.
    }
  }
  return encodeOnSurface(createMainSurface(), source, source.width, source.height, options);
}

export async function fileToBitmap(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file);
}
