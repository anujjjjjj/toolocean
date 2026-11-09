/**
 * Identify JPEG, PNG and WebP by their first bytes. MIME types and extensions are
 * unreliable: some browsers report an empty type for .jfif, and a renamed file
 * keeps its real format. No imports, so node --test can load it directly.
 */

export type SniffedFormat = "jpeg" | "png" | "webp" | "other";
export type KnownFormat = Exclude<SniffedFormat, "other">;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
/** "RIFF" at bytes 0-3 and "WEBP" at bytes 8-11; bytes 4-7 are the chunk size. */
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];
const SNIFF_BYTES = 12;

export function sniffImageFormat(bytes: Uint8Array): SniffedFormat {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= PNG_SIGNATURE.length && PNG_SIGNATURE.every((b, i) => bytes[i] === b)) return "png";
  if (bytes.length >= SNIFF_BYTES && RIFF.every((b, i) => bytes[i] === b) && WEBP.every((b, i) => bytes[8 + i] === b)) {
    return "webp";
  }
  return "other";
}

/** Reads only the first 12 bytes of the file. */
export async function sniffImageFile(file: Blob): Promise<SniffedFormat> {
  const head = await file.slice(0, SNIFF_BYTES).arrayBuffer();
  return sniffImageFormat(new Uint8Array(head));
}

export const FORMAT_LABEL: Record<KnownFormat, string> = { jpeg: "JPG", png: "PNG", webp: "WebP" };

/** The MIME type a sniffed format is decoded as. */
export const FORMAT_MIME: Record<KnownFormat, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** File-picker filters for a single-format input. The bytes are still checked afterwards. */
export const FORMAT_ACCEPT: Record<KnownFormat, string> = {
  jpeg: ".jpg,.jpeg,.jfif,.jpe,image/jpeg",
  png: ".png,image/png",
  webp: ".webp,image/webp",
};

/** One rejection sentence, e.g. "photo.png is a PNG, not a JPG." */
export function rejectionReason(name: string, found: SniffedFormat, wanted: KnownFormat): string {
  const label = name || "That file";
  if (found === "other") return `${label} is not a ${FORMAT_LABEL[wanted]}.`;
  return `${label} is a ${FORMAT_LABEL[found]}, not a ${FORMAT_LABEL[wanted]}.`;
}

/** "2 added, 1 rejected: photo.png is a PNG, not a JPG." */
export function summarizeBatch(added: number, rejected: string[]): string {
  const head = `${added} added`;
  if (rejected.length === 0) return `${head}.`;
  return `${head}, ${rejected.length} rejected: ${rejected.join(" ")}`;
}
