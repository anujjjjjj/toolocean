import toolsData from "@/data/tools.json";
import * as Icons from "lucide-react";

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
  ];

  const videoTools: PaletteTool[] = [
    { id: "video-thumbnail", name: "Video Thumbnail", description: "Extract frame as image", keywords: ["video", "thumbnail", "frame"], path: "/video-tools/video-thumbnail", icon: "Film", category: "Video Tools" },
    { id: "video-trimmer", name: "Video Trimmer", description: "Trim video by time range", keywords: ["video", "trim", "cut"], path: "/video-tools/video-trimmer", icon: "Scissors", category: "Video Tools" },
    { id: "video-to-gif", name: "Video to GIF", description: "Convert to animated GIF", keywords: ["video", "gif", "animated"], path: "/video-tools/video-to-gif", icon: "Image", category: "Video Tools" },
  ];

  const spreadsheetTools: PaletteTool[] = [
    { id: "excel-reader", name: "Excel Reader", description: "View Excel as table", keywords: ["excel", "xlsx", "read"], path: "/spreadsheet-tools/excel-reader", icon: "FileSpreadsheet", category: "Spreadsheet Tools" },
    { id: "csv-to-excel", name: "CSV to Excel", description: "Convert CSV to .xlsx", keywords: ["csv", "excel", "convert"], path: "/spreadsheet-tools/csv-to-excel", icon: "FileUp", category: "Spreadsheet Tools" },
    { id: "excel-to-csv", name: "Excel to CSV", description: "Export to CSV", keywords: ["excel", "csv", "export"], path: "/spreadsheet-tools/excel-to-csv", icon: "FileDown", category: "Spreadsheet Tools" },
  ];

  const compressionTools: PaletteTool[] = [
    { id: "gzip-compress", name: "Gzip Compress", description: "Compress text with gzip", keywords: ["gzip", "compress"], path: "/compression-tools/gzip-compress", icon: "FileDown", category: "Compression Tools" },
    { id: "gzip-decompress", name: "Gzip Decompress", description: "Decompress gzip data", keywords: ["gzip", "decompress"], path: "/compression-tools/gzip-decompress", icon: "FileUp", category: "Compression Tools" },
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
  ];
  const seenCategories = new Set<string>();
  const orderedCategories = categoryOrder.filter((c) => {
    if (seenCategories.has(c)) return false;
    seenCategories.add(c);
    return true;
  });

  const allTools = [...devTools, ...pdfTools, ...csvTools, ...audioTools, ...imageTools, ...videoTools, ...spreadsheetTools, ...compressionTools, ...archiveTools];

  return orderedCategories.map((category) => ({
    category,
    tools: allTools.filter((t) => t.category === category),
  })).filter((g) => g.tools.length > 0);
}

export function getIconComponent(iconName: string) {
  return (Icons as Record<string, React.ComponentType<{ className?: string }>>)[iconName] ?? Icons.Wrench;
}
