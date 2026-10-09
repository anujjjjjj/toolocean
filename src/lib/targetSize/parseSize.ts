/** 1 KB is 1024 bytes. The compressor pages say this next to the size field. */
export const KILOBYTE = 1024;

const UNITS: Record<string, number> = {
  b: 1,
  kb: KILOBYTE,
  mb: KILOBYTE * KILOBYTE,
  gb: KILOBYTE * KILOBYTE * KILOBYTE,
};

/** Parse "100", "100kb", "1.5 MB" into bytes. A bare number is bytes. */
export function parseSize(input: string): number | null {
  const match = input.trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const bytes = Math.round(value * UNITS[match[2] ?? "b"]);
  return bytes > 0 ? bytes : null;
}

export function formatBytes(bytes: number): string {
  if (bytes < KILOBYTE) return `${bytes} B`;
  if (bytes < KILOBYTE * KILOBYTE) return `${(bytes / KILOBYTE).toFixed(1)} KB`;
  return `${(bytes / (KILOBYTE * KILOBYTE)).toFixed(2)} MB`;
}
