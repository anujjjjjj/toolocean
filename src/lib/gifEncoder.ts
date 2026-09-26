/**
 * A self-contained animated GIF encoder for the browser.
 *
 * Replaces `gif-encoder-2`, which is a Node package: it extends Node streams and
 * expects the native `canvas` module, so it threw
 * `Class extends value #<Object> is not a constructor or null` at import time.
 * Because the throw happened during module evaluation of a lazy chunk, and the app
 * had no error boundary, it blanked the entire page rather than just the tool.
 *
 * Everything here works on ImageData from a regular <canvas>, so there is no
 * dependency and nothing to keep in sync.
 *
 * Format reference: GIF89a, with a Netscape 2.0 application extension for looping.
 */

/** Byte sink that grows as needed. */
class ByteWriter {
  private bytes: number[] = [];

  byte(value: number) {
    this.bytes.push(value & 0xff);
  }

  short(value: number) {
    this.byte(value);
    this.byte(value >> 8);
  }

  string(value: string) {
    for (let i = 0; i < value.length; i++) this.byte(value.charCodeAt(i));
  }

  raw(values: number[]) {
    for (const value of values) this.byte(value);
  }

  toUint8Array() {
    return new Uint8Array(this.bytes);
  }
}

interface Box {
  pixels: number[][];
  channel: number;
}

/**
 * Median-cut colour quantisation down to at most 256 colours.
 *
 * Chosen over NeuQuant because it is deterministic, roughly half the code, and the
 * difference is invisible on the short screen-captured clips this tool handles.
 */
function quantize(pixels: number[][], maxColors: number): number[][] {
  if (pixels.length === 0) return [[0, 0, 0]];

  let boxes: Box[] = [{ pixels, channel: 0 }];

  while (boxes.length < maxColors) {
    // Always split the box with the widest colour spread; splitting the largest by
    // count instead leaves gradients banded.
    let target = -1;
    let bestSpread = 0;
    let bestChannel = 0;

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box.pixels.length < 2) continue;
      for (let channel = 0; channel < 3; channel++) {
        let min = 255;
        let max = 0;
        for (const pixel of box.pixels) {
          if (pixel[channel] < min) min = pixel[channel];
          if (pixel[channel] > max) max = pixel[channel];
        }
        if (max - min > bestSpread) {
          bestSpread = max - min;
          target = i;
          bestChannel = channel;
        }
      }
    }

    if (target === -1 || bestSpread === 0) break;

    const box = boxes[target];
    const sorted = box.pixels.slice().sort((a, b) => a[bestChannel] - b[bestChannel]);
    const mid = sorted.length >> 1;

    boxes.splice(target, 1, { pixels: sorted.slice(0, mid), channel: bestChannel }, { pixels: sorted.slice(mid), channel: bestChannel });
  }

  return boxes
    .filter((box) => box.pixels.length > 0)
    .map((box) => {
      const total = [0, 0, 0];
      for (const pixel of box.pixels) {
        total[0] += pixel[0];
        total[1] += pixel[1];
        total[2] += pixel[2];
      }
      const n = box.pixels.length;
      return [Math.round(total[0] / n), Math.round(total[1] / n), Math.round(total[2] / n)];
    });
}

function nearestIndex(palette: number[][], r: number, g: number, b: number): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const dr = r - palette[i][0];
    const dg = g - palette[i][1];
    const db = b - palette[i][2];
    const distance = dr * dr + dg * dg + db * db;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

/** GIF's variable-code-width LZW, emitted as sub-blocks of at most 255 bytes. */
function lzwEncode(indices: Uint8Array, minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;

  let codeSize = minCodeSize + 1;
  let nextCode = endCode + 1;
  let dictionary = new Map<string, number>();

  const output: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;

  const emit = (code: number) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      output.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  };

  const resetDictionary = () => {
    dictionary = new Map();
    codeSize = minCodeSize + 1;
    nextCode = endCode + 1;
  };

  emit(clearCode);
  resetDictionary();

  let current = String(indices[0]);

  for (let i = 1; i < indices.length; i++) {
    const next = indices[i];
    const candidate = current + "," + next;

    if (dictionary.has(candidate)) {
      current = candidate;
      continue;
    }

    emit(dictionary.get(current) ?? Number(current));
    dictionary.set(candidate, nextCode++);

    if (nextCode > 1 << codeSize) {
      if (codeSize < 12) {
        codeSize++;
      } else {
        // Dictionary is full: flush and start over, which is what decoders expect.
        emit(clearCode);
        resetDictionary();
      }
    }

    current = String(next);
  }

  emit(dictionary.get(current) ?? Number(current));
  emit(endCode);

  if (bitCount > 0) output.push(bitBuffer & 0xff);

  // Chunk into sub-blocks, each prefixed with its length.
  const blocks: number[] = [];
  for (let i = 0; i < output.length; i += 255) {
    const chunk = output.slice(i, i + 255);
    blocks.push(chunk.length, ...chunk);
  }
  blocks.push(0);
  return blocks;
}

export interface GifOptions {
  width: number;
  height: number;
  /** Frame delay in milliseconds. */
  delay: number;
  /** 0 loops forever. */
  repeat?: number;
  /** Palette size, 2-256. Fewer colours means a smaller file. */
  maxColors?: number;
}

/**
 * Encodes frames into an animated GIF.
 *
 * A single global palette is sampled across all frames rather than one palette per
 * frame: it keeps colours stable between frames (per-frame palettes make flat areas
 * shimmer) and saves up to 768 bytes on every frame.
 */
export function encodeGif(frames: ImageData[], options: GifOptions): Blob {
  const { width, height, delay, repeat = 0, maxColors = 256 } = options;
  if (!frames.length) throw new Error("No frames to encode");

  // Sample rather than reading every pixel of every frame; quantising 3 million
  // pixels takes seconds and lands on the same palette as quantising 30 thousand.
  const samples: number[][] = [];
  const stride = Math.max(1, Math.floor((frames.length * width * height) / 30000));
  let counter = 0;
  for (const frame of frames) {
    for (let i = 0; i < frame.data.length; i += 4) {
      if (counter++ % stride === 0) samples.push([frame.data[i], frame.data[i + 1], frame.data[i + 2]]);
    }
  }

  const palette = quantize(samples, Math.min(256, Math.max(2, maxColors)));

  // Palette size must be a power of two; pad with black.
  let paletteBits = 1;
  while (1 << paletteBits < palette.length) paletteBits++;
  const paletteSize = 1 << paletteBits;
  const paddedPalette = palette.slice();
  while (paddedPalette.length < paletteSize) paddedPalette.push([0, 0, 0]);

  const writer = new ByteWriter();

  writer.string("GIF89a");
  writer.short(width);
  writer.short(height);
  // Global colour table present, 8-bit colour resolution, table size exponent.
  writer.byte(0x80 | 0x70 | (paletteBits - 1));
  writer.byte(0); // background colour index
  writer.byte(0); // pixel aspect ratio

  for (const [r, g, b] of paddedPalette) writer.raw([r, g, b]);

  // Netscape looping extension.
  writer.raw([0x21, 0xff, 0x0b]);
  writer.string("NETSCAPE2.0");
  writer.raw([0x03, 0x01]);
  writer.short(repeat);
  writer.byte(0);

  const delayCentiseconds = Math.max(1, Math.round(delay / 10));
  const cache = new Map<number, number>();

  for (const frame of frames) {
    writer.raw([0x21, 0xf9, 0x04, 0x00]); // graphic control extension, no transparency
    writer.short(delayCentiseconds);
    writer.raw([0x00, 0x00]);

    writer.byte(0x2c); // image descriptor
    writer.short(0);
    writer.short(0);
    writer.short(width);
    writer.short(height);
    writer.byte(0); // no local colour table, not interlaced

    const indices = new Uint8Array(width * height);
    for (let i = 0, p = 0; i < frame.data.length; i += 4, p++) {
      const r = frame.data[i];
      const g = frame.data[i + 1];
      const b = frame.data[i + 2];
      // Exact-colour cache. Screen recordings and UI captures repeat the same few
      // colours across millions of pixels, so this avoids most palette searches.
      const key = (r << 16) | (g << 8) | b;
      let index = cache.get(key);
      if (index === undefined) {
        index = nearestIndex(palette, r, g, b);
        cache.set(key, index);
      }
      indices[p] = index;
    }

    const minCodeSize = Math.max(2, paletteBits);
    writer.byte(minCodeSize);
    writer.raw(lzwEncode(indices, minCodeSize));
  }

  writer.byte(0x3b); // trailer

  return new Blob([writer.toUint8Array()], { type: "image/gif" });
}
