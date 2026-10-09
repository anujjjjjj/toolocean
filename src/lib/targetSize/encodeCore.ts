import { padJpegWithCom } from "./jpeg";
import type { EncodeImageOptions, EncodeImageResult, TargetMime } from "./types";

type Drawable = CanvasImageSource;

interface Surface {
  setSize(width: number, height: number): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  toBlob(mime: TargetMime, quality: number): Promise<Blob | null>;
}

function mainSurface(): Surface {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get a 2D canvas context");
  return {
    setSize(width, height) {
      canvas.width = width;
      canvas.height = height;
      return context;
    },
    toBlob(mime, quality) {
      return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
    },
  };
}

function workerSurface(): Surface | null {
  if (typeof OffscreenCanvas === "undefined") return null;
  const canvas = new OffscreenCanvas(1, 1);
  const context = canvas.getContext("2d");
  if (!context) return null;
  return {
    setSize(width, height) {
      canvas.width = width;
      canvas.height = height;
      return context;
    },
    toBlob(mime, quality) {
      return canvas.convertToBlob({ type: mime, quality });
    },
  };
}

function paint(
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  source: Drawable,
  width: number,
  height: number,
) {
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
}

async function encodeAt(
  surface: Surface,
  source: Drawable,
  width: number,
  height: number,
  mime: TargetMime,
  quality: number,
): Promise<Uint8Array | null> {
  const context = surface.setSize(width, height);
  paint(context, source, width, height);
  const blob = await surface.toBlob(mime, quality);
  if (!blob) return null;
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Highest JPEG/WebP quality whose file is at or under targetBytes.
 * If full resolution cannot fit, the bitmap is scaled down and searched again.
 */
export async function encodeOnSurface(
  surface: Surface,
  source: Drawable,
  sourceWidth: number,
  sourceHeight: number,
  options: EncodeImageOptions,
): Promise<EncodeImageResult> {
  const { targetBytes, mime } = options;
  const minBytes = options.minBytes && options.minBytes > 0 ? options.minBytes : undefined;
  if (minBytes && minBytes > targetBytes) {
    throw new Error("Minimum size is larger than the target");
  }

  let scale = 1;
  let best: { bytes: Uint8Array; quality: number; scale: number; width: number; height: number } | null = null;
  let smallest: { bytes: Uint8Array; quality: number; scale: number; width: number; height: number } | null = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    let low = 0.05;
    let high = 0.95;
    let fit: { bytes: Uint8Array; quality: number } | null = null;

    for (let step = 0; step < 8; step++) {
      const quality = (low + high) / 2;
      const bytes = await encodeAt(surface, source, width, height, mime, quality);
      if (!bytes) break;
      const candidate = { bytes, quality, scale, width, height };
      if (!smallest || bytes.byteLength < smallest.bytes.byteLength) smallest = candidate;
      if (bytes.byteLength <= targetBytes) {
        fit = { bytes, quality };
        low = quality;
      } else {
        high = quality;
      }
    }

    if (fit) {
      best = { ...fit, scale, width, height };
      break;
    }
    scale *= 0.75;
  }

  const chosen = best ?? smallest;
  if (!chosen) throw new Error("Could not encode the image");

  let bytes = chosen.bytes;
  let paddingBytes = 0;
  if (mime === "image/jpeg" && minBytes && bytes.byteLength < minBytes && bytes.byteLength <= targetBytes) {
    const padded = padJpegWithCom(bytes, minBytes);
    if (padded.bytes.byteLength <= targetBytes) {
      bytes = padded.bytes;
      paddingBytes = padded.paddingBytes;
    }
  }

  return {
    bytes,
    mime,
    quality: chosen.quality,
    scale: chosen.scale,
    width: chosen.width,
    height: chosen.height,
    padded: paddingBytes > 0,
    paddingBytes,
    withinTarget: bytes.byteLength <= targetBytes,
    metMinimum: minBytes ? bytes.byteLength >= minBytes : true,
  };
}

export function createMainSurface(): Surface {
  return mainSurface();
}

export function createWorkerSurface(): Surface | null {
  return workerSurface();
}
