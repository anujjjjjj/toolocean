import toolsData from "@/data/tools.json";

/**
 * Single source of truth for every tool ToolOcean ships.
 *
 * Before this existed, each tool's name/description/icon was duplicated across
 * its category page, allToolsForPalette.ts, and scripts/generate-sitemap.mjs,
 * three places that had already drifted apart. Everything now derives from here:
 * routing, the command palette, the sitemap, and the per-page SEO content
 * resolver. Adding a tool means adding one entry.
 */

/** Route namespace a tool lives under. `dev` is the odd one out at /tools/. */
export type CategoryKey =
  | "dev"
  | "pdf"
  | "csv"
  | "audio"
  | "image"
  | "video"
  | "spreadsheet"
  | "compression"
  | "archive"
  | "converter";

export interface CatalogTool {
  id: string;
  category: CategoryKey;
  name: string;
  description: string;
  /** Lucide icon name. */
  icon: string;
  keywords: string[];
}

/** Route prefix per category. Dev tools sit at /tools/ for historical reasons. */
export const CATEGORY_ROUTE: Record<CategoryKey, string> = {
  dev: "/tools",
  pdf: "/pdf-tools",
  csv: "/csv-tools",
  audio: "/audio-tools",
  image: "/image-tools",
  video: "/video-tools",
  spreadsheet: "/spreadsheet-tools",
  compression: "/compression-tools",
  archive: "/archive-tools",
  converter: "/converter-tools",
};

/** Listing-page path for a category. */
export const CATEGORY_INDEX: Record<CategoryKey, string> = {
  dev: "/dev-tools",
  pdf: "/pdf-tools",
  csv: "/csv-tools",
  audio: "/audio-tools",
  image: "/image-tools",
  video: "/video-tools",
  spreadsheet: "/spreadsheet-tools",
  compression: "/compression-tools",
  archive: "/archive-tools",
  converter: "/converter-tools",
};

export const CATEGORY_LABEL: Record<CategoryKey, string> = {
  dev: "Developer Tools",
  pdf: "PDF Tools",
  csv: "CSV Tools",
  audio: "Audio Tools",
  image: "Image Tools",
  video: "Video Tools",
  spreadsheet: "Spreadsheet Tools",
  compression: "Compression Tools",
  archive: "Archive Tools",
  converter: "Converter Tools",
};

/**
 * Developer tools keep living in tools.json. It is already the file the dev
 * tool grid and workflow builder read, and duplicating 66 entries here would
 * recreate exactly the drift this module exists to remove.
 */
const DEV_TOOLS: CatalogTool[] = (
  toolsData as { tools: { id: string; name: string; description: string; icon: string; keywords?: string[] }[] }
).tools.map((tool) => ({
  id: tool.id,
  category: "dev" as const,
  name: tool.name,
  description: tool.description,
  icon: tool.icon,
  keywords: tool.keywords ?? [],
}));

const CATEGORY_TOOLS: CatalogTool[] = [
  // ---- PDF ----
  { id: "pdf-merge", category: "pdf", name: "PDF Merge", description: "Combine multiple PDF files into one document", icon: "Merge", keywords: ["pdf","merge","combine"] },
  { id: "pdf-split", category: "pdf", name: "PDF Split", description: "Extract specific pages from a PDF document", icon: "Split", keywords: ["pdf","split","extract"] },
  { id: "pdf-compress", category: "pdf", name: "PDF Compress", description: "Reduce PDF file size while maintaining quality", icon: "Shrink", keywords: ["pdf","compress","shrink"] },
  { id: "pdf-to-images", category: "pdf", name: "PDF to Images", description: "Convert PDF pages to PNG or JPG images", icon: "Image", keywords: ["pdf","image","convert"] },
  { id: "images-to-pdf", category: "pdf", name: "Images to PDF", description: "Combine multiple images into a single PDF", icon: "FileText", keywords: ["images","pdf","combine"] },
  { id: "pdf-rotate", category: "pdf", name: "PDF Rotate", description: "Rotate PDF pages by 90°, 180°, or 270°", icon: "RotateCw", keywords: ["pdf","rotate"] },
  { id: "pdf-watermark", category: "pdf", name: "PDF Watermark", description: "Add text or image watermark to PDF pages", icon: "Droplets", keywords: ["pdf","watermark"] },
  { id: "pdf-reorder", category: "pdf", name: "PDF Page Reorder", description: "Rearrange PDF pages with drag and drop", icon: "ArrowUpDown", keywords: ["pdf","reorder","pages"] },

  // ---- Image ----
  { id: "image-resizer", category: "image", name: "Image Resizer", description: "Resize images with width, height, or aspect ratio", icon: "Maximize2", keywords: ["image","resize","dimensions"] },
  { id: "image-compressor", category: "image", name: "Image Compressor", description: "Reduce file size with quality slider", icon: "Shrink", keywords: ["image","compress","quality"] },
  { id: "image-format-converter", category: "image", name: "Format Converter", description: "Convert between PNG, JPEG, and WebP", icon: "Repeat", keywords: ["image","format","convert"] },
  { id: "image-to-base64", category: "image", name: "Image to Base64", description: "Convert image to data URL or raw Base64", icon: "FileImage", keywords: ["image","base64","data url"] },
  { id: "image-crop", category: "image", name: "Image Crop", description: "Crop and export a selected region", icon: "Crop", keywords: ["image","crop","trim","cut"] },
  { id: "color-picker", category: "image", name: "Color Picker from Image", description: "Click an image to get the pixel color", icon: "Pipette", keywords: ["color","picker","eyedropper","pixel","hex"] },
  { id: "favicon-generator", category: "image", name: "Favicon Generator", description: "Generate favicon sizes from an image", icon: "Star", keywords: ["favicon","icon","generate","ico"] },
  { id: "image-rotate-flip", category: "image", name: "Rotate & Flip", description: "Rotate 90/180/270° or flip horizontally/vertically", icon: "RotateCw", keywords: ["image","rotate","flip","mirror"] },
  { id: "image-watermark", category: "image", name: "Watermark", description: "Add text watermark with custom position and opacity", icon: "Droplets", keywords: ["image","watermark","text","overlay"] },
  { id: "image-filters", category: "image", name: "Image Filters", description: "Adjust brightness, contrast, saturation, blur, and more", icon: "SlidersHorizontal", keywords: ["image","filter","brightness","contrast","blur"] },

  // ---- Converter ----
  { id: "md-to-docx", category: "converter", name: "Markdown → DOCX", description: "Convert Markdown files to Microsoft Word DOCX format", icon: "FileText", keywords: ["markdown","docx","word","convert"] },
  { id: "markdown-html", category: "converter", name: "Markdown ↔ HTML", description: "Convert between Markdown and HTML formats bidirectionally", icon: "ArrowUpDown", keywords: ["markdown","html","convert"] },
  { id: "json-toml", category: "converter", name: "JSON ↔ TOML", description: "Convert between JSON and TOML configuration formats", icon: "Code", keywords: ["json","toml","convert","config"] },
  { id: "json-yaml", category: "converter", name: "JSON ↔ YAML", description: "Convert between JSON and YAML data formats", icon: "Code", keywords: ["json","yaml","convert"] },
  { id: "json-xml", category: "converter", name: "JSON ↔ XML", description: "Convert between JSON and XML data formats", icon: "Code", keywords: ["json","xml","convert"] },
  { id: "json-csv", category: "converter", name: "JSON ↔ CSV", description: "Convert between JSON arrays and CSV format", icon: "Code", keywords: ["json","csv","convert"] },
  { id: "html-markdown", category: "converter", name: "HTML → Markdown", description: "Convert HTML to clean Markdown format", icon: "ArrowUpDown", keywords: ["html","markdown","convert"] },
  { id: "csv-markdown", category: "converter", name: "CSV → Markdown Table", description: "Convert CSV data into a formatted Markdown table", icon: "ArrowUpDown", keywords: ["csv","markdown","table","convert"] },
  { id: "svg-png", category: "converter", name: "SVG → PNG", description: "Render SVG to a high-resolution PNG image", icon: "Image", keywords: ["svg","png","render","convert","image"] },
  { id: "url-parser", category: "converter", name: "URL Parser / Builder", description: "Parse, inspect, and build URLs with query parameters", icon: "Link", keywords: ["url","parse","query","params","builder"] },

  // ---- CSV ----
  { id: "csv-converter", category: "csv", name: "CSV ⇄ JSON Converter", description: "Convert between CSV and JSON with customizable delimiters", icon: "ArrowUpDown", keywords: ["csv","json","convert"] },
  { id: "csv-validator", category: "csv", name: "CSV Validator", description: "Validate CSV format, headers, and row consistency", icon: "CheckCircle", keywords: ["csv","validate"] },
  { id: "csv-merge", category: "csv", name: "CSV Merge", description: "Combine multiple CSV files into one", icon: "Merge", keywords: ["csv","merge","combine"] },

  // ---- Spreadsheet ----
  { id: "excel-reader", category: "spreadsheet", name: "Excel Reader", description: "Upload and view Excel files as table", icon: "FileSpreadsheet", keywords: ["excel","xlsx","read"] },
  { id: "csv-to-excel", category: "spreadsheet", name: "CSV to Excel", description: "Convert CSV to .xlsx and download", icon: "FileUp", keywords: ["csv","excel","convert"] },
  { id: "excel-to-csv", category: "spreadsheet", name: "Excel to CSV", description: "Export Excel sheets to CSV", icon: "FileDown", keywords: ["excel","csv","export"] },
  { id: "column-extractor", category: "spreadsheet", name: "Column Extractor", description: "Select and export specific columns", icon: "Columns", keywords: ["column","extract","select","spreadsheet"] },
  { id: "json-to-excel", category: "spreadsheet", name: "JSON → Excel", description: "Convert a JSON array of objects to an Excel file", icon: "Braces", keywords: ["json","excel","xlsx","convert"] },

  // ---- Video ----
  { id: "video-thumbnail", category: "video", name: "Thumbnail Extractor", description: "Capture a frame as image at any timestamp", icon: "Film", keywords: ["video","thumbnail","frame"] },
  { id: "video-trimmer", category: "video", name: "Video Trimmer", description: "Trim video by selecting start and end time", icon: "Scissors", keywords: ["video","trim","cut"] },
  { id: "video-to-gif", category: "video", name: "Video to GIF", description: "Convert video to animated GIF", icon: "Image", keywords: ["video","gif","animated"] },
  { id: "video-metadata", category: "video", name: "Metadata Viewer", description: "View duration, dimensions, codec info", icon: "Info", keywords: ["video","metadata","duration","codec","resolution"] },

  // ---- Audio ----
  { id: "audio-cutter", category: "audio", name: "Audio Cutter", description: "Trim audio by selecting start and end time", icon: "Scissors", keywords: ["audio","cut","trim"] },
  { id: "audio-merge", category: "audio", name: "Audio Merger", description: "Combine multiple audio files into one", icon: "Merge", keywords: ["audio","merge","combine"] },

  // ---- Compression ----
  { id: "gzip-compress", category: "compression", name: "Gzip Compress", description: "Compress text with gzip", icon: "FileDown", keywords: ["gzip","compress"] },
  { id: "gzip-decompress", category: "compression", name: "Gzip Decompress", description: "Decompress gzip data", icon: "FileUp", keywords: ["gzip","decompress"] },
  { id: "lz-string-compress", category: "compression", name: "LZ-String Compress", description: "Compress for URLs and localStorage", icon: "Zap", keywords: ["lz-string","compress","url","localstorage"] },

  // ---- Archive ----
  { id: "zip-extractor", category: "archive", name: "ZIP Extractor", description: "Extract and download files from ZIP", icon: "FolderOpen", keywords: ["zip","extract"] },
  { id: "zip-creator", category: "archive", name: "ZIP Creator", description: "Create ZIP from multiple files", icon: "FolderPlus", keywords: ["zip","create","archive"] },
  { id: "zip-preview", category: "archive", name: "ZIP Preview", description: "List contents without extracting", icon: "List", keywords: ["zip","preview","list"] },
];

export const TOOL_CATALOG: CatalogTool[] = [...DEV_TOOLS, ...CATEGORY_TOOLS];

/**
 * Tools that also belong on a second category's listing page.
 *
 * color-converter and timestamp-converter used to be registered under both
 * /tools/ and /converter-tools/ with the *same* component, two URLs serving one
 * tool. Each now has a single canonical slug and simply appears in both listings.
 */
const CROSS_LISTED: Record<string, CategoryKey[]> = {
  "color-converter": ["converter"],
  "timestamp-converter": ["converter"],
};

/**
 * Canonical page path. Every tool lives at the site root, e.g. "/json-formatter".
 * Slugs are globally unique, see scripts/check-catalog.mjs, which fails the
 * build if a collision is ever introduced.
 */
export function toolPath(tool: CatalogTool): string {
  return `/${tool.id}`;
}

/**
 * Pre-flattening URLs for a tool. These must keep resolving and 301 to
 * toolPath(); see public/_redirects and vercel.json.
 */
export function legacyPathsFor(tool: CatalogTool): string[] {
  const prefixes = [tool.category, ...(CROSS_LISTED[tool.id] ?? [])];
  return prefixes.map((category) => `${CATEGORY_ROUTE[category]}/${tool.id}`);
}

const BY_ID = new Map<string, CatalogTool>(TOOL_CATALOG.map((tool) => [tool.id, tool]));

/** Look up a tool by its (now globally unique) slug. */
export function findToolBySlug(slug: string): CatalogTool | undefined {
  return BY_ID.get(slug);
}

/** Tools shown on a category listing page, including cross-listed ones. */
export function toolsInCategory(category: CategoryKey): CatalogTool[] {
  return TOOL_CATALOG.filter(
    (tool) => tool.category === category || (CROSS_LISTED[tool.id] ?? []).includes(category),
  );
}
