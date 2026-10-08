import toolsData from "@/data/tools.json";
import { getToolIcon } from "@/lib/toolIcons";

export interface PaletteTool {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  path: string;
  icon: string;
  category: string;
}

export function getAllToolsForPalette(): { category: string; tools: PaletteTool[] }[] {
  const devTools: PaletteTool[] = toolsData.tools.map((tool) => ({
    id: tool.id,
    name: tool.name,
    description: tool.description,
    keywords: tool.keywords || [],
    path: `/tools/${tool.id}`,
    icon: tool.icon,
    category: (toolsData as { categories: { id: string; name: string }[] }).categories.find((c) => c.id === tool.category)?.name ?? "Developer Tools",
  }));

  const pdfTools: PaletteTool[] = [
    { id: "pdf-merge", name: "PDF Merge", description: "Combine multiple PDF files", keywords: ["pdf", "merge", "combine"], path: "/pdf-tools/pdf-merge", icon: "Merge", category: "PDF Tools" },
    { id: "pdf-split", name: "PDF Split", description: "Extract specific pages", keywords: ["pdf", "split", "extract"], path: "/pdf-tools/pdf-split", icon: "Split", category: "PDF Tools" },
    { id: "pdf-compress", name: "PDF Compress", description: "Reduce PDF file size", keywords: ["pdf", "compress", "shrink"], path: "/pdf-tools/pdf-compress", icon: "Shrink", category: "PDF Tools" },
    { id: "pdf-to-images", name: "PDF to Images", description: "Convert PDF to PNG/JPG", keywords: ["pdf", "image", "convert"], path: "/pdf-tools/pdf-to-images", icon: "Image", category: "PDF Tools" },
    { id: "images-to-pdf", name: "Images to PDF", description: "Combine images into PDF", keywords: ["images", "pdf", "combine"], path: "/pdf-tools/images-to-pdf", icon: "FileText", category: "PDF Tools" },
    { id: "pdf-rotate", name: "PDF Rotate", description: "Rotate PDF pages", keywords: ["pdf", "rotate"], path: "/pdf-tools/pdf-rotate", icon: "RotateCw", category: "PDF Tools" },
    { id: "pdf-watermark", name: "PDF Watermark", description: "Add watermark to PDF", keywords: ["pdf", "watermark"], path: "/pdf-tools/pdf-watermark", icon: "Droplets", category: "PDF Tools" },
    { id: "pdf-reorder", name: "PDF Page Reorder", description: "Rearrange PDF pages", keywords: ["pdf", "reorder", "pages"], path: "/pdf-tools/pdf-reorder", icon: "ArrowUpDown", category: "PDF Tools" },
    { id: "pdf-sign", name: "Sign PDF", description: "Place a visual signature on a page", keywords: ["pdf", "sign", "signature"], path: "/pdf-sign", icon: "PenLine", category: "PDF Tools" },
    { id: "pdf-encrypt", name: "Encrypt PDF", description: "Password-protect a PDF", keywords: ["pdf", "encrypt", "password"], path: "/pdf-encrypt", icon: "Lock", category: "PDF Tools" },
    { id: "pdf-unlock", name: "Unlock PDF", description: "Remove a known password or owner restrictions", keywords: ["pdf", "unlock", "password"], path: "/pdf-unlock", icon: "LockOpen", category: "PDF Tools" },
    { id: "pdf-metadata", name: "PDF Metadata", description: "View or strip Info and XMP metadata", keywords: ["pdf", "metadata", "xmp"], path: "/pdf-metadata", icon: "FileSearch", category: "PDF Tools" },
    { id: "pdf-form-fill", name: "Fill PDF Form", description: "Fill AcroForm fields and flatten", keywords: ["pdf", "form", "fill", "flatten"], path: "/pdf-form-fill", icon: "ListChecks", category: "PDF Tools" },
  ];

  const csvTools: PaletteTool[] = [
    { id: "csv-converter", name: "CSV ⇄ JSON Converter", description: "Convert between CSV and JSON", keywords: ["csv", "json", "convert"], path: "/csv-tools/csv-converter", icon: "ArrowUpDown", category: "CSV Tools" },
    { id: "csv-validator", name: "CSV Validator", description: "Validate CSV format and consistency", keywords: ["csv", "validate"], path: "/csv-tools/csv-validator", icon: "CheckCircle", category: "CSV Tools" },
    { id: "csv-merge", name: "CSV Merge", description: "Combine multiple CSV files", keywords: ["csv", "merge", "combine"], path: "/csv-tools/csv-merge", icon: "Merge", category: "CSV Tools" },
  ];

  const audioTools: PaletteTool[] = [
    { id: "audio-cutter", name: "Audio Cutter", description: "Trim audio by start and end time", keywords: ["audio", "cut", "trim"], path: "/audio-tools/audio-cutter", icon: "Scissors", category: "Audio Tools" },
    { id: "audio-merge", name: "Audio Merger", description: "Combine multiple audio files", keywords: ["audio", "merge", "combine"], path: "/audio-tools/audio-merge", icon: "Merge", category: "Audio Tools" },
  ];

  const imageTools: PaletteTool[] = [
    { id: "image-resizer", name: "Image Resizer", description: "Resize images with dimensions", keywords: ["image", "resize", "dimensions"], path: "/image-tools/image-resizer", icon: "Maximize2", category: "Image Tools" },
    { id: "image-compressor", name: "Image Compressor", description: "Reduce file size with quality", keywords: ["image", "compress", "quality"], path: "/image-tools/image-compressor", icon: "Shrink", category: "Image Tools" },
    { id: "image-format-converter", name: "Format Converter", description: "PNG, JPEG, WebP", keywords: ["image", "format", "convert"], path: "/image-tools/image-format-converter", icon: "Repeat", category: "Image Tools" },
    { id: "image-to-base64", name: "Image to Base64", description: "Convert to data URL", keywords: ["image", "base64", "data url"], path: "/image-tools/image-to-base64", icon: "FileImage", category: "Image Tools" },
    { id: "image-crop", name: "Image Crop", description: "Crop and export a selected region", keywords: ["image", "crop", "trim", "cut"], path: "/image-tools/image-crop", icon: "Crop", category: "Image Tools" },
    { id: "color-picker", name: "Color Picker from Image", description: "Click an image to get the pixel color", keywords: ["color", "picker", "eyedropper", "pixel", "hex"], path: "/image-tools/color-picker", icon: "Pipette", category: "Image Tools" },
    { id: "favicon-generator", name: "Favicon Generator", description: "Generate favicon sizes from an image", keywords: ["favicon", "icon", "generate", "ico"], path: "/image-tools/favicon-generator", icon: "Star", category: "Image Tools" },
    { id: "image-rotate-flip", name: "Rotate & Flip Image", description: "Rotate 90/180/270° or flip an image", keywords: ["image", "rotate", "flip", "mirror"], path: "/image-tools/image-rotate-flip", icon: "RotateCw", category: "Image Tools" },
    { id: "image-watermark", name: "Image Watermark", description: "Add a text watermark to an image", keywords: ["image", "watermark", "text", "overlay"], path: "/image-tools/image-watermark", icon: "Droplets", category: "Image Tools" },
    { id: "image-filters", name: "Image Filters", description: "Brightness, contrast, saturation, blur", keywords: ["image", "filter", "brightness", "contrast", "blur"], path: "/image-tools/image-filters", icon: "SlidersHorizontal", category: "Image Tools" },
  ];

  const videoTools: PaletteTool[] = [
    { id: "video-thumbnail", name: "Video Thumbnail", description: "Extract frame as image", keywords: ["video", "thumbnail", "frame"], path: "/video-tools/video-thumbnail", icon: "Film", category: "Video Tools" },
    { id: "video-trimmer", name: "Video Trimmer", description: "Trim video by time range", keywords: ["video", "trim", "cut"], path: "/video-tools/video-trimmer", icon: "Scissors", category: "Video Tools" },
    { id: "video-to-gif", name: "Video to GIF", description: "Convert to animated GIF", keywords: ["video", "gif", "animated"], path: "/video-tools/video-to-gif", icon: "Image", category: "Video Tools" },
    { id: "video-metadata", name: "Video Metadata Viewer", description: "Duration, dimensions, codec info", keywords: ["video", "metadata", "duration", "codec", "resolution"], path: "/video-tools/video-metadata", icon: "Info", category: "Video Tools" },
  ];

  const spreadsheetTools: PaletteTool[] = [
    { id: "excel-reader", name: "Excel Reader", description: "View Excel as table", keywords: ["excel", "xlsx", "read"], path: "/spreadsheet-tools/excel-reader", icon: "FileSpreadsheet", category: "Spreadsheet Tools" },
    { id: "csv-to-excel", name: "CSV to Excel", description: "Convert CSV to .xlsx", keywords: ["csv", "excel", "convert"], path: "/spreadsheet-tools/csv-to-excel", icon: "FileUp", category: "Spreadsheet Tools" },
    { id: "excel-to-csv", name: "Excel to CSV", description: "Export to CSV", keywords: ["excel", "csv", "export"], path: "/spreadsheet-tools/excel-to-csv", icon: "FileDown", category: "Spreadsheet Tools" },
    { id: "column-extractor", name: "Column Extractor", description: "Select and export specific columns", keywords: ["column", "extract", "select", "spreadsheet"], path: "/spreadsheet-tools/column-extractor", icon: "Columns", category: "Spreadsheet Tools" },
    { id: "json-to-excel", name: "JSON to Excel", description: "Convert a JSON array to .xlsx", keywords: ["json", "excel", "xlsx", "convert"], path: "/spreadsheet-tools/json-to-excel", icon: "Braces", category: "Spreadsheet Tools" },
  ];

  const compressionTools: PaletteTool[] = [
    { id: "gzip-compress", name: "Gzip Compress", description: "Compress text with gzip", keywords: ["gzip", "compress"], path: "/compression-tools/gzip-compress", icon: "FileDown", category: "Compression Tools" },
    { id: "gzip-decompress", name: "Gzip Decompress", description: "Decompress gzip data", keywords: ["gzip", "decompress"], path: "/compression-tools/gzip-decompress", icon: "FileUp", category: "Compression Tools" },
    { id: "lz-string-compress", name: "LZ-String Compress", description: "Compress for URLs and localStorage", keywords: ["lz-string", "compress", "url", "localstorage"], path: "/compression-tools/lz-string-compress", icon: "Zap", category: "Compression Tools" },
  ];

  const converterTools: PaletteTool[] = [
    { id: "md-to-docx", name: "Markdown to DOCX", description: "Convert Markdown to Word DOCX", keywords: ["markdown", "docx", "word", "convert"], path: "/converter-tools/md-to-docx", icon: "FileText", category: "Converter Tools" },
    { id: "markdown-html", name: "Markdown ↔ HTML", description: "Convert between Markdown and HTML", keywords: ["markdown", "html", "convert"], path: "/converter-tools/markdown-html", icon: "ArrowUpDown", category: "Converter Tools" },
    { id: "json-toml", name: "JSON ↔ TOML", description: "Convert between JSON and TOML", keywords: ["json", "toml", "convert", "config"], path: "/converter-tools/json-toml", icon: "Code", category: "Converter Tools" },
    { id: "json-yaml", name: "JSON ↔ YAML", description: "Convert between JSON and YAML", keywords: ["json", "yaml", "convert"], path: "/converter-tools/json-yaml", icon: "Code", category: "Converter Tools" },
    { id: "json-xml", name: "JSON ↔ XML", description: "Convert between JSON and XML", keywords: ["json", "xml", "convert"], path: "/converter-tools/json-xml", icon: "Code", category: "Converter Tools" },
    { id: "json-csv", name: "JSON ↔ CSV", description: "Convert between JSON arrays and CSV", keywords: ["json", "csv", "convert"], path: "/converter-tools/json-csv", icon: "Code", category: "Converter Tools" },
    { id: "color-converter", name: "Color Format Converter", description: "HEX, RGB, HSL, and CMYK", keywords: ["color", "hex", "rgb", "hsl", "cmyk", "convert"], path: "/converter-tools/color-converter", icon: "Palette", category: "Converter Tools" },
    { id: "timestamp-converter", name: "Timestamp Converter", description: "Unix, ISO, and locale dates", keywords: ["timestamp", "unix", "epoch", "iso", "date"], path: "/converter-tools/timestamp-converter", icon: "Clock", category: "Converter Tools" },
    { id: "html-markdown", name: "HTML to Markdown", description: "Convert HTML into clean Markdown", keywords: ["html", "markdown", "convert"], path: "/converter-tools/html-markdown", icon: "ArrowUpDown", category: "Converter Tools" },
    { id: "csv-markdown", name: "CSV to Markdown Table", description: "Turn CSV into a Markdown table", keywords: ["csv", "markdown", "table", "convert"], path: "/converter-tools/csv-markdown", icon: "ArrowUpDown", category: "Converter Tools" },
    { id: "svg-png", name: "SVG to PNG", description: "Render SVG to a PNG image", keywords: ["svg", "png", "render", "convert", "image"], path: "/converter-tools/svg-png", icon: "Image", category: "Converter Tools" },
    { id: "url-parser", name: "URL Parser / Builder", description: "Parse and build URLs with params", keywords: ["url", "parse", "query", "params", "builder"], path: "/converter-tools/url-parser", icon: "Link", category: "Converter Tools" },
  ];

  const archiveTools: PaletteTool[] = [
    { id: "zip-extractor", name: "ZIP Extractor", description: "Extract files from ZIP", keywords: ["zip", "extract"], path: "/archive-tools/zip-extractor", icon: "FolderOpen", category: "Archive Tools" },
    { id: "zip-creator", name: "ZIP Creator", description: "Create ZIP from files", keywords: ["zip", "create", "archive"], path: "/archive-tools/zip-creator", icon: "FolderPlus", category: "Archive Tools" },
    { id: "zip-preview", name: "ZIP Preview", description: "List ZIP contents", keywords: ["zip", "preview", "list"], path: "/archive-tools/zip-preview", icon: "List", category: "Archive Tools" },
  ];

  const categoryOrder = [
    ...(toolsData as { categories: { id: string; name: string }[] }).categories.map((c) => c.name),
    "PDF Tools",
    "CSV Tools",
    "Audio Tools",
    "Image Tools",
    "Video Tools",
    "Spreadsheet Tools",
    "Compression Tools",
    "Archive Tools",
    "Converter Tools",
  ];
  const seenCategories = new Set<string>();
  const orderedCategories = categoryOrder.filter((c) => {
    if (seenCategories.has(c)) return false;
    seenCategories.add(c);
    return true;
  });

  const allTools = [...devTools, ...pdfTools, ...csvTools, ...audioTools, ...imageTools, ...videoTools, ...spreadsheetTools, ...compressionTools, ...archiveTools, ...converterTools];

  return orderedCategories.map((category) => ({
    category,
    tools: allTools.filter((t) => t.category === category),
  })).filter((g) => g.tools.length > 0);
}

/** Kept as the palette's entry point; the icon set itself lives in toolIcons.ts. */
export function getIconComponent(iconName: string) {
  return getToolIcon(iconName);
}
