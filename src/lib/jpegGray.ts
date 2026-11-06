/**
 * Baseline JPEG encoder for one-channel (grayscale) images.
 *
 * Canvas can only write three-channel JPEGs, which spend bytes on two chroma
 * planes that are flat for a gray page. This writes a single-component JFIF
 * (SOF0, 8-bit samples, the standard luminance quantisation table scaled by
 * quality the way libjpeg does it, and the Annex K Huffman tables), which a PDF
 * embeds directly as DCTDecode with /ColorSpace /DeviceGray.
 *
 * The forward DCT is the separable Arai-Agui-Nakajima float transform: 5
 * multiplies per 8-point row, with its output scaling folded into the
 * quantisation divisors, so a block costs two passes of adds plus 64 multiplies.
 *
 * No DOM, no dependencies; the node tests load this file directly.
 */

/** Natural (row-major) index of each zigzag position. */
const ZIGZAG = new Uint8Array([
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21,
  28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61,
  54, 47, 55, 62, 63,
]);

/** ITU T.81 Annex K.1 luminance table, natural order. */
const BASE_LUMA_QUANT = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51,
  87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101,
  72, 92, 95, 98, 112, 100, 103, 99,
];

/* Annex K.3 typical Huffman tables for luminance: code counts per length 1..16, then symbols. */
const DC_BITS = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
const DC_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const AC_BITS = [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d];
const AC_VALUES = [
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14,
  0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09,
  0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a,
  0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65,
  0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88,
  0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9,
  0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca,
  0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea,
  0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
];

interface HuffmanTable {
  codes: Uint16Array;
  lengths: Uint8Array;
}

/** Canonical Huffman codes from a count-per-length list (T.81 Annex C). */
function buildHuffman(bits: number[], values: number[]): HuffmanTable {
  const codes = new Uint16Array(256);
  const lengths = new Uint8Array(256);
  let code = 0;
  let k = 0;
  for (let length = 1; length <= 16; length++) {
    for (let i = 0; i < bits[length - 1]; i++) {
      const symbol = values[k++];
      codes[symbol] = code;
      lengths[symbol] = length;
      code++;
    }
    code <<= 1;
  }
  return { codes, lengths };
}

const DC_TABLE = buildHuffman(DC_BITS, DC_VALUES);
const AC_TABLE = buildHuffman(AC_BITS, AC_VALUES);

/** AAN scale factors: cos(k*pi/16) * sqrt(2) for k > 0, 1 for k = 0. */
const AAN_SCALE = [1, 1.387039845, 1.306562965, 1.175875602, 1, 0.785694958, 0.5411961, 0.275899379];

/** Quality 1-100 to the libjpeg-scaled luminance table, natural order. */
export function scaledQuantTable(quality: number): Uint8Array {
  const q = Math.min(100, Math.max(1, Math.round(quality)));
  const scale = q < 50 ? Math.floor(5000 / q) : 200 - q * 2;
  const table = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    const value = Math.floor((BASE_LUMA_QUANT[i] * scale + 50) / 100);
    table[i] = Math.min(255, Math.max(1, value));
  }
  return table;
}

/** Growable byte sink with the bit writer and 0xFF byte stuffing for entropy data. */
class ByteWriter {
  buffer: Uint8Array;
  length = 0;
  private bitBuffer = 0;
  private bitCount = 0;

  constructor(initial: number) {
    this.buffer = new Uint8Array(Math.max(1024, initial));
  }

  private ensure(extra: number) {
    if (this.length + extra <= this.buffer.length) return;
    let size = this.buffer.length * 2;
    while (size < this.length + extra) size *= 2;
    const next = new Uint8Array(size);
    next.set(this.buffer.subarray(0, this.length));
    this.buffer = next;
  }

  byte(value: number) {
    this.ensure(1);
    this.buffer[this.length++] = value;
  }

  word(value: number) {
    this.ensure(2);
    this.buffer[this.length++] = (value >> 8) & 0xff;
    this.buffer[this.length++] = value & 0xff;
  }

  bytes(values: ArrayLike<number>) {
    this.ensure(values.length);
    for (let i = 0; i < values.length; i++) this.buffer[this.length++] = values[i];
  }

  /** Writes the low `count` bits of `value`, most significant first. */
  bits(value: number, count: number) {
    this.bitBuffer = (this.bitBuffer << count) | (value & ((1 << count) - 1));
    this.bitCount += count;
    while (this.bitCount >= 8) {
      const out = (this.bitBuffer >> (this.bitCount - 8)) & 0xff;
      this.ensure(2);
      this.buffer[this.length++] = out;
      if (out === 0xff) this.buffer[this.length++] = 0;
      this.bitCount -= 8;
    }
    // Keep the pending bits small so the shift above never overflows 32 bits.
    this.bitBuffer &= (1 << this.bitCount) - 1;
  }

  /** Pads the last byte with 1 bits, as T.81 F.1.2.3 asks. */
  flushBits() {
    if (this.bitCount > 0) this.bits(0x7f, 8 - this.bitCount);
  }

  result(): Uint8Array {
    return this.buffer.slice(0, this.length);
  }
}

/** Number of bits needed for |value| (the JPEG "category"). */
function category(value: number): number {
  let abs = value < 0 ? -value : value;
  let bits = 0;
  while (abs > 0) {
    bits++;
    abs >>= 1;
  }
  return bits;
}

function writeHeaders(out: ByteWriter, width: number, height: number, quant: Uint8Array) {
  out.word(0xffd8); // SOI

  // APP0 JFIF 1.01, no thumbnail, aspect 1:1.
  out.word(0xffe0);
  out.word(16);
  out.bytes([0x4a, 0x46, 0x49, 0x46, 0x00, 1, 1, 0, 0, 1, 0, 1, 0, 0]);

  // DQT: one 8-bit table, id 0, zigzag order.
  out.word(0xffdb);
  out.word(67);
  out.byte(0);
  for (let i = 0; i < 64; i++) out.byte(quant[ZIGZAG[i]]);

  // SOF0: 8-bit precision, one component (id 1, 1x1 sampling, table 0).
  out.word(0xffc0);
  out.word(11);
  out.byte(8);
  out.word(height);
  out.word(width);
  out.byte(1);
  out.bytes([1, 0x11, 0]);

  // DHT: DC table 0 and AC table 0.
  out.word(0xffc4);
  out.word(2 + 17 + DC_VALUES.length + 17 + AC_VALUES.length);
  out.byte(0x00);
  out.bytes(DC_BITS);
  out.bytes(DC_VALUES);
  out.byte(0x10);
  out.bytes(AC_BITS);
  out.bytes(AC_VALUES);

  // SOS: one component using DC/AC tables 0, full spectral range.
  out.word(0xffda);
  out.word(8);
  out.byte(1);
  out.bytes([1, 0x00]);
  out.bytes([0, 63, 0]);
}

/**
 * Encodes `gray` (one byte per pixel, row-major, `width * height` long) as a
 * baseline grayscale JPEG. Quality uses the libjpeg 1-100 scale.
 */
export function encodeGrayJpeg(gray: Uint8Array, width: number, height: number, quality = 80): Uint8Array {
  if (width < 1 || height < 1 || width > 65535 || height > 65535) {
    throw new RangeError(`JPEG dimensions out of range: ${width}x${height}`);
  }
  if (gray.length < width * height) throw new RangeError("Pixel buffer is shorter than width * height");

  const quant = scaledQuantTable(quality);
  // Divisors with the AAN output scale folded in, natural order.
  const divisors = new Float32Array(64);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const i = row * 8 + col;
      divisors[i] = 1 / (quant[i] * AAN_SCALE[row] * AAN_SCALE[col] * 8);
    }
  }

  const out = new ByteWriter((width * height) >> 3);
  writeHeaders(out, width, height, quant);

  const block = new Float32Array(64);
  const coeffs = new Int32Array(64);
  const dcCodes = DC_TABLE.codes;
  const dcLengths = DC_TABLE.lengths;
  const acCodes = AC_TABLE.codes;
  const acLengths = AC_TABLE.lengths;
  const eob = 0x00;
  const zrl = 0xf0;
  let previousDc = 0;
  const lastX = width - 1;
  const lastY = height - 1;

  for (let by = 0; by < height; by += 8) {
    for (let bx = 0; bx < width; bx += 8) {
      // Load the block, level shifted, repeating edge pixels past the border.
      const fullBlock = bx + 7 <= lastX && by + 7 <= lastY;
      for (let y = 0; y < 8; y++) {
        const sy = fullBlock ? by + y : Math.min(by + y, lastY);
        const rowStart = sy * width;
        for (let x = 0; x < 8; x++) {
          const sx = fullBlock ? bx + x : Math.min(bx + x, lastX);
          block[y * 8 + x] = gray[rowStart + sx] - 128;
        }
      }

      fdct(block);

      for (let i = 0; i < 64; i++) {
        const value = block[i] * divisors[i];
        // Round half away from zero.
        coeffs[i] = value < 0 ? -Math.floor(0.5 - value) : Math.floor(value + 0.5);
      }

      // DC: difference from the previous block.
      const dc = coeffs[0];
      const diff = dc - previousDc;
      previousDc = dc;
      const dcSize = category(diff);
      out.bits(dcCodes[dcSize], dcLengths[dcSize]);
      if (dcSize) out.bits(diff < 0 ? diff + (1 << dcSize) - 1 : diff, dcSize);

      // AC: zigzag run-length.
      let lastNonZero = 63;
      while (lastNonZero > 0 && coeffs[ZIGZAG[lastNonZero]] === 0) lastNonZero--;
      let run = 0;
      for (let k = 1; k <= lastNonZero; k++) {
        const value = coeffs[ZIGZAG[k]];
        if (value === 0) {
          run++;
          continue;
        }
        while (run > 15) {
          out.bits(acCodes[zrl], acLengths[zrl]);
          run -= 16;
        }
        const size = category(value);
        const symbol = (run << 4) | size;
        out.bits(acCodes[symbol], acLengths[symbol]);
        out.bits(value < 0 ? value + (1 << size) - 1 : value, size);
        run = 0;
      }
      if (lastNonZero < 63) out.bits(acCodes[eob], acLengths[eob]);
    }
  }

  out.flushBits();
  out.word(0xffd9); // EOI
  return out.result();
}

/* AAN rotation constants. */
const C_0_707 = 0.707106781; // cos(4π/16)
const C_0_382 = 0.382683433; // cos(6π/16)
const C_0_541 = 0.5411961; // cos(6π/16) * √2
const C_1_306 = 1.306562965; // cos(2π/16) * √2

/** In-place 2D forward DCT of an 8x8 block, output scaled by the AAN factors. */
function fdct(data: Float32Array) {
  for (let pass = 0; pass < 2; pass++) {
    // Pass 0 walks rows (stride 1 inside, 8 between); pass 1 walks columns.
    const step = pass === 0 ? 1 : 8;
    const next = pass === 0 ? 8 : 1;
    for (let line = 0, base = 0; line < 8; line++, base += next) {
      const i0 = base;
      const i1 = base + step;
      const i2 = base + 2 * step;
      const i3 = base + 3 * step;
      const i4 = base + 4 * step;
      const i5 = base + 5 * step;
      const i6 = base + 6 * step;
      const i7 = base + 7 * step;

      const t0 = data[i0] + data[i7];
      const t7 = data[i0] - data[i7];
      const t1 = data[i1] + data[i6];
      const t6 = data[i1] - data[i6];
      const t2 = data[i2] + data[i5];
      const t5 = data[i2] - data[i5];
      const t3 = data[i3] + data[i4];
      const t4 = data[i3] - data[i4];

      // Even part.
      const t10 = t0 + t3;
      const t13 = t0 - t3;
      const t11 = t1 + t2;
      const t12 = t1 - t2;
      data[i0] = t10 + t11;
      data[i4] = t10 - t11;
      const z1 = (t12 + t13) * C_0_707;
      data[i2] = t13 + z1;
      data[i6] = t13 - z1;

      // Odd part.
      const u10 = t4 + t5;
      const u11 = t5 + t6;
      const u12 = t6 + t7;
      const z5 = (u10 - u12) * C_0_382;
      const z2 = C_0_541 * u10 + z5;
      const z4 = C_1_306 * u12 + z5;
      const z3 = u11 * C_0_707;
      const z11 = t7 + z3;
      const z13 = t7 - z3;
      data[i5] = z13 + z2;
      data[i3] = z13 - z2;
      data[i1] = z11 + z4;
      data[i7] = z11 - z4;
    }
  }
}
