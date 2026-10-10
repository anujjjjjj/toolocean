/** Rejects empty files and files the browser cannot decode. Batch callers skip
 *  the failures and keep the files that decoded. */

export function imageFileError(file: { name: string; size: number; type: string }): string | null {
  const name = file.name || "That file";
  if (file.size === 0) return `${name} is empty.`;
  if (!file.type.startsWith("image/")) return `${name} is not an image file.`;
  return null;
}

export async function readImageFiles(files: Iterable<File>): Promise<{ accepted: File[]; errors: string[] }> {
  const accepted: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const early = imageFileError(file);
    if (early) {
      errors.push(early);
      continue;
    }
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width < 1 || bitmap.height < 1) {
        bitmap.close();
        errors.push(`${file.name} could not be decoded.`);
        continue;
      }
      bitmap.close();
      accepted.push(file);
    } catch {
      errors.push(`${file.name} could not be decoded. The file may be corrupt.`);
    }
  }

  return { accepted, errors };
}
