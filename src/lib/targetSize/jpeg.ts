/** Insert JPEG COM segments so a file that undershot a minimum reaches it. */
export function padJpegWithCom(jpeg: Uint8Array, minBytes: number): { bytes: Uint8Array; paddingBytes: number } {
  if (jpeg.byteLength >= minBytes) return { bytes: jpeg, paddingBytes: 0 };
  if (jpeg.length < 2 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) {
    return { bytes: jpeg, paddingBytes: 0 };
  }

  const segments: Uint8Array[] = [];
  let remaining = minBytes - jpeg.byteLength;
  while (remaining > 0) {
    const payload = Math.min(Math.max(remaining - 4, 1), 65533);
    const segment = new Uint8Array(4 + payload);
    segment[0] = 0xff;
    segment[1] = 0xfe;
    const length = payload + 2;
    segment[2] = (length >> 8) & 0xff;
    segment[3] = length & 0xff;
    segments.push(segment);
    remaining -= segment.length;
  }

  const extra = segments.reduce((sum, segment) => sum + segment.length, 0);
  const out = new Uint8Array(jpeg.length + extra);
  out.set(jpeg.subarray(0, 2), 0);
  let offset = 2;
  for (const segment of segments) {
    out.set(segment, offset);
    offset += segment.length;
  }
  out.set(jpeg.subarray(2), offset);
  return { bytes: out, paddingBytes: extra };
}

/**
 * Write pixels-per-inch into the JFIF APP0 segment.
 * Browsers usually emit one; if they do not, a short APP0 is inserted after SOI.
 */
export function setJfifDensity(jpeg: Uint8Array, dpi: number): Uint8Array {
  if (jpeg.length < 4 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return jpeg;
  const density = Math.max(1, Math.min(65535, Math.round(dpi)));
  let index = 2;
  while (index + 4 < jpeg.length && jpeg[index] === 0xff) {
    const marker = jpeg[index + 1];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0xd8 || marker === 0x00 || marker === 0x01) {
      index += 2;
      continue;
    }
    const length = (jpeg[index + 2] << 8) | jpeg[index + 3];
    if (length < 2) break;
    const isJfif =
      marker === 0xe0 &&
      jpeg[index + 4] === 0x4a &&
      jpeg[index + 5] === 0x46 &&
      jpeg[index + 6] === 0x49 &&
      jpeg[index + 7] === 0x46;
    if (isJfif && index + 16 < jpeg.length) {
      const out = jpeg.slice();
      out[index + 11] = 1;
      out[index + 12] = (density >> 8) & 0xff;
      out[index + 13] = density & 0xff;
      out[index + 14] = (density >> 8) & 0xff;
      out[index + 15] = density & 0xff;
      return out;
    }
    index += 2 + length;
  }

  const app0 = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10,
    0x4a, 0x46, 0x49, 0x46, 0x00,
    0x01, 0x01,
    0x01,
    (density >> 8) & 0xff, density & 0xff,
    (density >> 8) & 0xff, density & 0xff,
    0x00, 0x00,
  ]);
  const out = new Uint8Array(jpeg.length + app0.length);
  out.set(jpeg.subarray(0, 2), 0);
  out.set(app0, 2);
  out.set(jpeg.subarray(2), 2 + app0.length);
  return out;
}
