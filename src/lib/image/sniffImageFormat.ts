/**
 * Identify JPEG and PNG by their first bytes. MIME types and extensions are
 * unreliable: some browsers report an empty type for .jfif, and a renamed file
 * keeps its real format. No imports, so node --test can load it directly.
 */

export type SniffedFormat = "jpeg" | "png" | "other";
export type KnownFormat = Exclude<SniffedFormat, "other">;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function sniffImageFormat(bytes: Uint8Array): SniffedFormat {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= PNG_SIGNATURE.length && PNG_SIGNATURE.every((b, i) => bytes[i] === b)) return "png";
  return "other";
}

/** Reads only the first 8 bytes of the file. */
export async function sniffImageFile(file: Blob): Promise<SniffedFormat> {
  const head = await file.slice(0, 8).arrayBuffer();
  return sniffImageFormat(new Uint8Array(head));
}

export const FORMAT_LABEL: Record<KnownFormat, string> = { jpeg: "JPG", png: "PNG" };

/** File-picker filters for a single-format input. The bytes are still checked afterwards. */
export const FORMAT_ACCEPT: Record<KnownFormat, string> = {
  jpeg: ".jpg,.jpeg,.jfif,.jpe,image/jpeg",
  png: ".png,image/png",
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
