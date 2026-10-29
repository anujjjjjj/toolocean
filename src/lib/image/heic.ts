/**
 * Pure helpers for the HEIC converter. No DOM, no decoder, so the node tests in
 * scripts/heic.test.mjs can import this file directly.
 *
 * The decoder itself lives in heicDecoder.ts and only loads after a file is chosen.
 */

/** Per-file ceiling. An iPhone HEIC is 1 to 5 MB; 50 MB is far past any camera file. */
export const MAX_HEIC_BYTES = 50 * 1024 * 1024;

/** Bytes needed to read the ftyp box: size, "ftyp", major brand, minor version, a few compatible brands. */
export const HEIC_SNIFF_BYTES = 64;

export type HeicOutputFormat = "jpg" | "png";

export const DEFAULT_JPG_QUALITY = 0.92;

/** HEVC-coded brands. These are what libheif can decode with libde265. */
const HEVC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs"]);
/** Generic HEIF brands. The codec has to be read from the compatible brands. */
const GENERIC_BRANDS = new Set(["mif1", "msf1"]);
const AVIF_BRANDS = new Set(["avif", "avis"]);

export type HeicSniff =
  | { kind: "heic"; brand: string }
  | { kind: "avif" }
  | { kind: "jpeg" }
  | { kind: "png" }
  | { kind: "unknown" };

function fourcc(bytes: Uint8Array, at: number): string {
  if (at + 4 > bytes.length) return "";
  return String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]);
}

/**
 * Identify a file from its first bytes rather than its name.
 *
 * A HEIF file opens with an ftyp box: 4-byte size, "ftyp" at offset 4, the
 * major brand at 8, a minor version at 12, then compatible brands to the end of
 * the box. Phones write "heic" or "mif1" as the major brand. "mif1" alone does
 * not say which codec, so AVIF (also mif1) is told apart by its own brand.
 */
export function sniffHeic(bytes: Uint8Array): HeicSniff {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { kind: "jpeg" };
  if (bytes.length >= 4 && bytes[0] === 0x89 && fourcc(bytes, 1).slice(0, 3) === "PNG") return { kind: "png" };
  if (fourcc(bytes, 4) !== "ftyp") return { kind: "unknown" };

  const major = fourcc(bytes, 8);
  const boxSize = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  const end = Math.min(bytes.length, boxSize > 16 ? boxSize : bytes.length);
  const compatible: string[] = [];
  for (let at = 16; at + 4 <= end; at += 4) compatible.push(fourcc(bytes, at));

  if (HEVC_BRANDS.has(major)) return { kind: "heic", brand: major };
  if (AVIF_BRANDS.has(major)) return { kind: "avif" };
  if (GENERIC_BRANDS.has(major)) {
    if (compatible.some((brand) => HEVC_BRANDS.has(brand))) return { kind: "heic", brand: major };
    if (compatible.some((brand) => AVIF_BRANDS.has(brand))) return { kind: "avif" };
    // A bare mif1 with no codec hint. Let the decoder try; it reports failure plainly.
    return { kind: "heic", brand: major };
  }
  return { kind: "unknown" };
}

/** Megabytes as people read them on a phone: 50 MB, not 52,428,800 bytes. */
function mb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/**
 * Plain-language reason a file will not be converted, or null when it should be.
 * Checked before the decoder is involved, so a wrong file never costs a decode.
 */
export function heicFileError(file: { name: string; size: number }, head: Uint8Array): string | null {
  const name = file.name || "That file";
  if (file.size === 0) return `${name} is empty.`;
  if (file.size > MAX_HEIC_BYTES) {
    return `${name} is ${mb(file.size)}. The limit is ${mb(MAX_HEIC_BYTES)} per file, so the tab does not run out of memory.`;
  }
  const sniff = sniffHeic(head);
  if (sniff.kind === "heic") return null;
  if (sniff.kind === "jpeg") return `${name} is already a JPEG inside, whatever its name says. It needs no conversion.`;
  if (sniff.kind === "png") return `${name} is already a PNG inside, whatever its name says. It needs no conversion.`;
  if (sniff.kind === "avif") return `${name} is an AVIF image, not HEIC. This page only decodes HEIC.`;
  return `${name} is not a HEIC or HEIF photo.`;
}

/** IMG_0412.HEIC becomes IMG_0412.jpg. A name with no stem becomes image.jpg. */
export function heicOutputName(name: string, format: HeicOutputFormat): string {
  const base = name.replace(/\.[^./\\]*$/, "").trim();
  return `${base || "image"}.${format}`;
}

/** Make ZIP entry names unique: a second IMG_0412.jpg becomes "IMG_0412 (2).jpg". */
export function uniqueNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    if (!used.has(name.toLowerCase())) {
      used.add(name.toLowerCase());
      return name;
    }
    const dot = name.lastIndexOf(".");
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : "";
    let n = 2;
    while (used.has(`${stem} (${n})${ext}`.toLowerCase())) n += 1;
    const next = `${stem} (${n})${ext}`;
    used.add(next.toLowerCase());
    return next;
  });
}

/**
 * Composite RGBA onto white in place. JPEG has no alpha channel, and canvas
 * would otherwise encode transparent pixels as black. Returns true if any pixel
 * was not fully opaque.
 */
export function flattenOnWhite(rgba: Uint8ClampedArray): boolean {
  let changed = false;
  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3];
    if (a === 255) continue;
    changed = true;
    const k = a / 255;
    rgba[i] = Math.round(rgba[i] * k + 255 * (1 - k));
    rgba[i + 1] = Math.round(rgba[i + 1] * k + 255 * (1 - k));
    rgba[i + 2] = Math.round(rgba[i + 2] * k + 255 * (1 - k));
    rgba[i + 3] = 255;
  }
  return changed;
}

/** Fit width x height inside a square box, never upscaling. Used for row thumbnails. */
export function fitWithin(width: number, height: number, box: number): { width: number; height: number } {
  const scale = Math.min(1, box / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
