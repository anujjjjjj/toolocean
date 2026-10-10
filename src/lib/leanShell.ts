import { findToolBySlug, type CategoryKey } from "@/data/toolCatalog";

/**
 * Every tool page uses the Paper shell. File tools get a dropzone in the
 * prerender. Text tools get the same title, steps, and folded copy, and their
 * editor arrives with the route chunk.
 */
export function usesLeanShell(_slug: string): boolean {
  return true;
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
  "csv-merge": {
    accept: ".csv,.txt,.tsv,text/csv",
    multiple: true,
    title: "Drop CSV files",
    hint: "or click to browse · CSV or TSV · multiple files",
  },
  "csv-to-excel": {
    accept: ".csv,.txt,text/csv",
    multiple: false,
    title: "Drop a CSV",
    hint: "or click to browse · CSV or TXT",
  },
  "excel-to-csv": {
    accept: ".xlsx,.xls,.ods",
    multiple: false,
    title: "Drop a spreadsheet",
    hint: "or click to browse · Excel or ODS",
  },
  "excel-reader": {
    accept: ".xlsx,.xls",
    multiple: false,
    title: "Drop a spreadsheet",
    hint: "or click to browse · .xlsx or .xls",
  },
  "column-extractor": {
    accept: ".csv,.xlsx,.xls",
    multiple: false,
    title: "Drop a spreadsheet",
    hint: "or click to browse · CSV or Excel",
  },
  "json-to-excel": {
    accept: ".json,application/json",
    multiple: false,
    title: "Drop a JSON file",
    hint: "or click to browse · JSON",
  },
  "gzip-decompress": {
    accept: ".gz,application/gzip",
    multiple: false,
    title: "Drop a gzip file",
    hint: "or click to browse · .gz",
  },
  "svg-png": {
    accept: ".svg,image/svg+xml",
    multiple: false,
    title: "Drop an SVG",
    hint: "or click to browse · SVG",
  },
};

const CATEGORY_DROP: Partial<Record<CategoryKey, ShellDropzoneCopy>> = {
  pdf: {
    accept: PDF,
    multiple: false,
    title: "Drop a PDF here",
    hint: "or click to browse · PDF only",
  },
  image: {
    accept: "image/*",
    multiple: false,
    title: "Drop an image here",
    hint: "or click to browse · JPG, PNG, WebP",
  },
  video: {
    accept: "video/*",
    multiple: false,
    title: "Drop a video here",
    hint: "or click to browse · video file",
  },
  audio: {
    accept: "audio/*",
    multiple: false,
    title: "Drop an audio file",
    hint: "or click to browse · audio file",
  },
  archive: {
    accept: ".zip,application/zip",
    multiple: false,
    title: "Drop a ZIP here",
    hint: "or click to browse · .zip",
  },
};

const MULTI = new Set(["images-to-pdf", "audio-merge", "zip-creator"]);

export function shellDropzoneCopy(slug: string): ShellDropzoneCopy | null {
  if (COPY[slug]) return COPY[slug];
  const tool = findToolBySlug(slug);
  const base = tool ? CATEGORY_DROP[tool.category] : undefined;
  if (!base) return null;
  if (!MULTI.has(slug)) return base;
  return { ...base, multiple: true, hint: `${base.hint} · multiple files` };
}
