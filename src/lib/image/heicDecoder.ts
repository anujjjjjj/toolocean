/**
 * Main-thread side of the HEIC converter. Imported by HeicToJpgTool only after a
 * file is chosen, and by offlinePrefetch on idle, which reads the worker and
 * .wasm URLs from here and stores both in the asset cache.
 *
 * Decoding happens in a worker (libheif is ~1 MB of wasm and a 12 MP photo takes
 * close to a second). Encoding happens here on a canvas, with the RGBA the worker
 * returns. That RGBA is already upright, and ImageData carries no EXIF, so the
 * canvas cannot rotate it a second time.
 */
import workerUrl from "./heicDecode.worker.ts?worker&url";
import wasmAssetUrl from "libheif-js/libheif-wasm/libheif.wasm?url";
import { fitWithin, flattenOnWhite, type HeicOutputFormat } from "./heic";
import type { HeicDecodeRequest, HeicDecodeResponse } from "./heicDecode.worker";

export function heicWorkerUrl(): string {
  return new URL(workerUrl, import.meta.url).href;
}

export function heicWasmUrl(): string {
  return new URL(wasmAssetUrl, import.meta.url).href;
}

export class HeicConvertError extends Error {
  constructor(
    message: string,
    readonly reason: "init" | "decode" | "encode",
  ) {
    super(message);
  }
}

export interface DecodedHeic {
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
  images: number;
}

/** One worker for a batch, so the wasm compiles once. */
export class HeicDecoder {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, { resolve: (value: DecodedHeic) => void; reject: (error: Error) => void }>();

  private ensure(): Worker {
    if (this.worker) return this.worker;
    const worker = new Worker(heicWorkerUrl(), { type: "module" });
    worker.onmessage = (event: MessageEvent<HeicDecodeResponse>) => {
      const data = event.data;
      const job = this.pending.get(data.id);
      if (!job) return;
      this.pending.delete(data.id);
      if (data.ok) {
        const decoded = data as Extract<HeicDecodeResponse, { ok: true }>;
        job.resolve({ width: decoded.width, height: decoded.height, rgba: new Uint8ClampedArray(decoded.rgba), images: decoded.images });
      } else {
        const failure = data as Extract<HeicDecodeResponse, { ok: false }>;
        job.reject(new HeicConvertError(failure.message, failure.reason));
      }
    };
    worker.onerror = () => this.fail(new HeicConvertError("The decoder stopped.", "init"));
    this.worker = worker;
    return worker;
  }

  /** A crashed worker (often out of memory on a huge photo) fails its jobs and is replaced next time. */
  private fail(error: Error) {
    for (const job of this.pending.values()) job.reject(error);
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
  }

  decode(bytes: ArrayBuffer): Promise<DecodedHeic> {
    const worker = this.ensure();
    const id = this.nextId++;
    return new Promise<DecodedHeic>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const message: HeicDecodeRequest = { id, bytes, wasmUrl: heicWasmUrl() };
      worker.postMessage(message, [bytes]);
    });
  }

  dispose() {
    this.fail(new HeicConvertError("Cancelled.", "init"));
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export interface EncodedHeic {
  blob: Blob;
  thumb: Blob | null;
}

/** Encode decoded pixels as JPEG or PNG, plus a small JPEG thumbnail for the result row. */
export async function encodeDecoded(
  decoded: DecodedHeic,
  format: HeicOutputFormat,
  quality: number,
  thumbBox = 112,
): Promise<EncodedHeic> {
  const { width, height, rgba } = decoded;
  if (format === "jpg") flattenOnWhite(rgba);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new HeicConvertError("This browser could not open a canvas that large.", "encode");
  ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
  const blob = await toBlob(canvas, format === "jpg" ? "image/jpeg" : "image/png", format === "jpg" ? quality : undefined);
  if (!blob) throw new HeicConvertError("This browser could not encode an image that large.", "encode");

  let thumb: Blob | null = null;
  const size = fitWithin(width, height, thumbBox);
  const small = document.createElement("canvas");
  small.width = size.width;
  small.height = size.height;
  const smallCtx = small.getContext("2d");
  if (smallCtx) {
    smallCtx.imageSmoothingQuality = "high";
    smallCtx.drawImage(canvas, 0, 0, size.width, size.height);
    thumb = await toBlob(small, "image/jpeg", 0.8);
  }
  // Release the full-size backing store now rather than at GC.
  canvas.width = 0;
  canvas.height = 0;
  return { blob, thumb };
}
