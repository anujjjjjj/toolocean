/**
 * zlib-format deflate for PDF FlateDecode streams.
 *
 * CompressionStream is native and several times faster than a JavaScript
 * deflate on a multi-megabyte page. pako (already a dependency) covers the
 * browsers without it, Safari before 16.4 among them. It is a static import
 * because the worker build cannot split chunks; only the deflate half is kept.
 */
import { deflate } from "pako";

export async function deflateBytes(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream !== "undefined") {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  return deflate(bytes);
}
