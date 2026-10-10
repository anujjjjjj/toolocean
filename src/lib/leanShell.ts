/**
 * Proof slugs for the Paper tool shell.
 *
 * PR B widens this to every tool. Keeping the gate here means the other pages
 * keep their current section order and only pick up the new tokens.
 */
export const LEAN_SHELL_SLUGS = new Set([
  "pdf-merge",
  "pdf-compress",
  "pdf-sign",
  "image-compressor",
  "csv-to-json",
]);

export function usesLeanShell(slug: string): boolean {
  return LEAN_SHELL_SLUGS.has(slug);
}

export interface ShellDropzoneCopy {
  accept: string;
  multiple: boolean;
  title: string;
  hint: string;
}

const PDF = "application/pdf,.pdf";

const COPY: Record<string, ShellDropzoneCopy> = {
  "pdf-merge": {
    accept: PDF,
    multiple: true,
    title: "Drop PDFs here",
    hint: "or click to browse · PDF only · multiple files",
  },
  "pdf-compress": {
    accept: PDF,
    multiple: false,
    title: "Drop a PDF here",
    hint: "or click to browse · PDF only",
  },
  "pdf-sign": {
    accept: PDF,
    multiple: false,
    title: "Drop a PDF here",
    hint: "or click to browse · PDF only",
  },
  "image-compressor": {
    accept: "image/*",
    multiple: true,
    title: "Drop images here",
    hint: "or click to browse · JPG, PNG, WebP",
  },
  "csv-to-json": {
    accept: ".csv,.json,.txt,text/csv,application/json",
    multiple: false,
    title: "Drop a CSV or JSON file",
    hint: "or click to browse · CSV, JSON, or TXT",
  },
};

export function shellDropzoneCopy(slug: string): ShellDropzoneCopy {
  return (
    COPY[slug] ?? {
      accept: "",
      multiple: true,
      title: "Drop a file here",
      hint: "or click to browse",
    }
  );
}
