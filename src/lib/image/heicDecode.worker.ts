/**
 * Decodes one HEIC per message with libheif (wasm) and posts back RGBA pixels.
 *
 * libheif applies the file's irot/imir/clap transforms while decoding, so the
 * pixels that come out are already upright. The main thread draws them as-is;
 * rotating again there would turn a portrait photo on its side.
 *
 * The .wasm URL arrives with each message rather than being imported here, so
 * the page can prefetch exactly the same URL for offline use.
 */
import createLibheif from "libheif-js/libheif-wasm/libheif.js";

interface HeifImage {
  handle: unknown;
  get_width(): number;
  get_height(): number;
  display(target: { data: Uint8ClampedArray; width: number; height: number }, done: (result: unknown) => void): void;
  free(): void;
}

interface Libheif {
  HeifDecoder: new () => { decoder: unknown; decode(bytes: Uint8Array): HeifImage[] };
  heif_image_handle_is_primary_image(handle: unknown): number;
  heif_context_free(context: unknown): void;
}

export interface HeicDecodeRequest {
  id: number;
  bytes: ArrayBuffer;
  wasmUrl: string;
}

export type HeicDecodeResponse =
  | { id: number; ok: true; width: number; height: number; rgba: ArrayBuffer; images: number }
  | { id: number; ok: false; reason: "init" | "decode"; message: string };

let ready: Promise<Libheif> | null = null;

function load(wasmUrl: string): Promise<Libheif> {
  ready ??= fetch(wasmUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`wasm ${response.status}`);
      return response.arrayBuffer();
    })
    .then(
      (wasmBinary) =>
        new Promise<Libheif>((resolve, reject) => {
          // Emscripten returns the options object as the module once it is ready.
          const module: Record<string, unknown> = { wasmBinary };
          module.onRuntimeInitialized = () => resolve(module as unknown as Libheif);
          module.onAbort = (reason: unknown) => reject(new Error(String(reason)));
          (createLibheif as unknown as (options: Record<string, unknown>) => unknown)(module);
        }),
    );
  ready.catch(() => {
    ready = null;
  });
  return ready;
}

function post(message: HeicDecodeResponse, transfer: Transferable[] = []) {
  (self as unknown as Worker).postMessage(message, transfer);
}

self.onmessage = async (event: MessageEvent<HeicDecodeRequest>) => {
  const { id, bytes, wasmUrl } = event.data;
  let lib: Libheif;
  try {
    lib = await load(wasmUrl);
  } catch (error) {
    post({ id, ok: false, reason: "init", message: error instanceof Error ? error.message : "init failed" });
    return;
  }

  const decoder = new lib.HeifDecoder();
  let images: HeifImage[] = [];
  try {
    images = decoder.decode(new Uint8Array(bytes));
    if (!images.length) throw new Error("no images");
    // Burst and Live Photo files can hold more than one top-level image. The primary one is the photo.
    const primary = images.find((image) => lib.heif_image_handle_is_primary_image(image.handle)) ?? images[0];
    const width = primary.get_width();
    const height = primary.get_height();
    if (!(width > 0 && height > 0)) throw new Error("no dimensions");
    const target = { data: new Uint8ClampedArray(width * height * 4), width, height };
    const result = await new Promise<unknown>((resolve) => primary.display(target, resolve));
    if (!result) throw new Error("decode failed");
    post({ id, ok: true, width, height, rgba: target.data.buffer, images: images.length }, [target.data.buffer]);
  } catch (error) {
    post({ id, ok: false, reason: "decode", message: error instanceof Error ? error.message : "decode failed" });
  } finally {
    for (const image of images) image.free();
    if (decoder.decoder) lib.heif_context_free(decoder.decoder);
    decoder.decoder = null;
  }
};
