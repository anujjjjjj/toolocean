import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * Slug → lazily-loaded tool component.
 *
 * Replaces the eleven registries that each statically imported every tool they
 * knew about. That arrangement produced a single 4.0 MB JavaScript bundle: opening
 * the homepage downloaded all 114 tools plus pdf-lib, pdfjs, xlsx, docx and
 * recharts before anything could render.
 *
 * Each entry here becomes its own Vite chunk, so a visitor downloads the page
 * shell plus exactly one tool. Import specifiers must stay literal strings,
 * Vite needs them statically analysable to split the chunks.
 *
 * Components exported as named bindings are unwrapped into the { default } shape
 * React.lazy requires; the handful exported as defaults are imported directly.
 */
const toolLoaders: Record<string, () => Promise<{ default: ComponentType }>> = {};

function lazyTool(slug: string, loader: () => Promise<{ default: ComponentType }>) {
  toolLoaders[slug] = loader;
  return lazy(loader);
}

/** Warm the route chunk. Safe to call on hover, focus, or a quiet viewport queue. */
export function prefetchToolChunk(slug: string): Promise<unknown> | undefined {
  return toolLoaders[slug]?.();
}

export const lazyToolComponents: Record<string, LazyExoticComponent<ComponentType>> = {
  "audio-cutter": lazyTool("audio-cutter", () => import("@/components/tools/implementations/audio/AudioCutterTool").then((m) => ({ default: m.AudioCutterTool }))),
  "audio-merge": lazyTool("audio-merge", () => import("@/components/tools/implementations/audio/AudioMergeTool").then((m) => ({ default: m.AudioMergeTool }))),
  "base64-tool": lazyTool("base64-tool", () => import("@/components/tools/implementations/Base64Tool").then((m) => ({ default: m.Base64Tool }))),
  "box-shadow-generator": lazyTool("box-shadow-generator", () => import("@/components/tools/implementations/BoxShadowGeneratorTool").then((m) => ({ default: m.BoxShadowGeneratorTool }))),
  "case-converter": lazyTool("case-converter", () => import("@/components/tools/implementations/CaseConverterTool").then((m) => ({ default: m.CaseConverterTool }))),
  "chmod-calculator": lazyTool("chmod-calculator", () => import("@/components/tools/implementations/ChmodCalculatorTool").then((m) => ({ default: m.ChmodCalculatorTool }))),
  "code-explainer": lazyTool("code-explainer", () => import("@/components/tools/implementations/CodeExplainerTool").then((m) => ({ default: m.CodeExplainerTool }))),
  "color-converter": lazyTool("color-converter", () => import("@/components/tools/implementations/converters/ColorConverterTool").then((m) => ({ default: m.ColorConverterTool }))),
  "color-palette-generator": lazyTool("color-palette-generator", () => import("@/components/tools/implementations/ColorPaletteGeneratorTool").then((m) => ({ default: m.ColorPaletteGeneratorTool }))),
  "color-picker": lazyTool("color-picker", () => import("@/components/tools/implementations/image/ImageColorPickerTool").then((m) => ({ default: m.ImageColorPickerTool }))),
  "column-extractor": lazyTool("column-extractor", () => import("@/components/tools/implementations/spreadsheet/ColumnExtractorTool").then((m) => ({ default: m.ColumnExtractorTool }))),
  "cron-expression-builder": lazyTool("cron-expression-builder", () => import("@/components/tools/implementations/CronExpressionBuilderTool").then((m) => ({ default: m.CronExpressionBuilderTool }))),
  "css-minifier": lazyTool("css-minifier", () => import("@/components/tools/implementations/CssFormatterTool").then((m) => ({ default: m.CssFormatterTool }))),
  "css-unit-converter": lazyTool("css-unit-converter", () => import("@/components/tools/implementations/CssUnitConverterTool").then((m) => ({ default: m.CssUnitConverterTool }))),
  "csv-formatter": lazyTool("csv-formatter", () => import("@/components/tools/implementations/CsvFormatterTool").then((m) => ({ default: m.CsvFormatterTool }))),
  "csv-to-json": lazyTool("csv-to-json", () => import("@/components/tools/implementations/CsvJsonConverterTool").then((m) => ({ default: m.CsvJsonConverterTool }))),
  "csv-markdown": lazyTool("csv-markdown", () => import("@/components/tools/implementations/converters/CsvMarkdownTool").then((m) => ({ default: m.CsvMarkdownTool }))),
  "csv-merge": lazyTool("csv-merge", () => import("@/components/tools/implementations/csv/CsvMergeTool").then((m) => ({ default: m.CsvMergeTool }))),
  "csv-to-excel": lazyTool("csv-to-excel", () => import("@/components/tools/implementations/spreadsheet/CsvToExcelTool").then((m) => ({ default: m.CsvToExcelTool }))),
  "csv-validator": lazyTool("csv-validator", () => import("@/components/tools/implementations/csv/CsvValidatorTool").then((m) => ({ default: m.CsvValidatorTool }))),
  "dns-lookup": lazyTool("dns-lookup", () => import("@/components/tools/implementations/DnsLookupTool").then((m) => ({ default: m.DnsLookupTool }))),
  "dockerfile-formatter": lazyTool("dockerfile-formatter", () => import("@/components/tools/implementations/DockerfileFormatterTool")),
  "duplicate-remover": lazyTool("duplicate-remover", () => import("@/components/tools/implementations/DuplicateRemoverTool").then((m) => ({ default: m.DuplicateRemoverTool }))),
  "encryption-tool": lazyTool("encryption-tool", () => import("@/components/tools/implementations/EncryptionTool").then((m) => ({ default: m.EncryptionTool }))),
  "env-formatter": lazyTool("env-formatter", () => import("@/components/tools/implementations/EnvFormatterTool").then((m) => ({ default: m.EnvFormatterTool }))),
  "excel-reader": lazyTool("excel-reader", () => import("@/components/tools/implementations/spreadsheet/ExcelReaderTool").then((m) => ({ default: m.ExcelReaderTool }))),
  "excel-to-csv": lazyTool("excel-to-csv", () => import("@/components/tools/implementations/spreadsheet/ExcelToCsvTool").then((m) => ({ default: m.ExcelToCsvTool }))),
  "fake-data-generator": lazyTool("fake-data-generator", () => import("@/components/tools/implementations/FakeDataGeneratorTool")),
  "favicon-generator": lazyTool("favicon-generator", () => import("@/components/tools/implementations/image/FaviconGeneratorTool").then((m) => ({ default: m.FaviconGeneratorTool }))),
  "gitignore-generator": lazyTool("gitignore-generator", () => import("@/components/tools/implementations/GitignoreGeneratorTool")),
  "gradient-generator": lazyTool("gradient-generator", () => import("@/components/tools/implementations/GradientGeneratorTool").then((m) => ({ default: m.GradientGeneratorTool }))),
  "gzip-compress": lazyTool("gzip-compress", () => import("@/components/tools/implementations/compression/GzipCompressTool").then((m) => ({ default: m.GzipCompressTool }))),
  "gzip-decompress": lazyTool("gzip-decompress", () => import("@/components/tools/implementations/compression/GzipDecompressTool").then((m) => ({ default: m.GzipDecompressTool }))),
  "hash-generator": lazyTool("hash-generator", () => import("@/components/tools/implementations/HashGeneratorTool").then((m) => ({ default: m.HashGeneratorTool }))),
  "html-entity-encoder": lazyTool("html-entity-encoder", () => import("@/components/tools/implementations/HtmlEntityEncoderTool").then((m) => ({ default: m.HtmlEntityEncoderTool }))),
  "html-formatter": lazyTool("html-formatter", () => import("@/components/tools/implementations/HtmlFormatterTool").then((m) => ({ default: m.HtmlFormatterTool }))),
  "html-jsx-converter": lazyTool("html-jsx-converter", () => import("@/components/tools/implementations/HtmlJsxConverterTool").then((m) => ({ default: m.HtmlJsxConverterTool }))),
  "html-markdown": lazyTool("html-markdown", () => import("@/components/tools/implementations/converters/HtmlMarkdownTool").then((m) => ({ default: m.HtmlMarkdownTool }))),
  "http-request-composer": lazyTool("http-request-composer", () => import("@/components/tools/implementations/HttpRequestComposerTool")),
  "image-compressor": lazyTool("image-compressor", () => import("@/components/tools/implementations/image/ImageCompressorTool").then((m) => ({ default: m.ImageCompressorTool }))),
  "image-crop": lazyTool("image-crop", () => import("@/components/tools/implementations/image/ImageCropTool").then((m) => ({ default: m.ImageCropTool }))),
  "image-filters": lazyTool("image-filters", () => import("@/components/tools/implementations/image/ImageFiltersTool").then((m) => ({ default: m.ImageFiltersTool }))),
  "image-format-converter": lazyTool("image-format-converter", () => import("@/components/tools/implementations/image/ImageFormatConverterTool").then((m) => ({ default: m.ImageFormatConverterTool }))),
  "image-resizer": lazyTool("image-resizer", () => import("@/components/tools/implementations/image/ImageResizerTool").then((m) => ({ default: m.ImageResizerTool }))),
  "image-rotate-flip": lazyTool("image-rotate-flip", () => import("@/components/tools/implementations/image/ImageRotateFlipTool").then((m) => ({ default: m.ImageRotateFlipTool }))),
  "image-to-base64": lazyTool("image-to-base64", () => import("@/components/tools/implementations/image/ImageToBase64Tool").then((m) => ({ default: m.ImageToBase64Tool }))),
  "image-watermark": lazyTool("image-watermark", () => import("@/components/tools/implementations/image/ImageWatermarkTool").then((m) => ({ default: m.ImageWatermarkTool }))),
  "images-to-pdf": lazyTool("images-to-pdf", () => import("@/components/tools/implementations/pdf/ImagesToPdfTool").then((m) => ({ default: m.ImagesToPdfTool }))),
  "ip-address": lazyTool("ip-address", () => import("@/components/tools/implementations/IpAddressTool")),
  "ip-cidr-calculator": lazyTool("ip-cidr-calculator", () => import("@/components/tools/implementations/IpCidrCalculatorTool").then((m) => ({ default: m.IpCidrCalculatorTool }))),
  "json-fixer": lazyTool("json-fixer", () => import("@/components/tools/implementations/JsonFixerTool").then((m) => ({ default: m.JsonFixerTool }))),
  "json-flattener": lazyTool("json-flattener", () => import("@/components/tools/implementations/JsonFlattenerTool").then((m) => ({ default: m.JsonFlattenerTool }))),
  "json-formatter": lazyTool("json-formatter", () => import("@/components/tools/implementations/JsonFormatterTool").then((m) => ({ default: m.JsonFormatterTool }))),
  "json-merger": lazyTool("json-merger", () => import("@/components/tools/implementations/JsonMergerTool").then((m) => ({ default: m.JsonMergerTool }))),
  "json-minifier": lazyTool("json-minifier", () => import("@/components/tools/implementations/JsonMinifierTool").then((m) => ({ default: m.JsonMinifierTool }))),
  "json-parse": lazyTool("json-parse", () => import("@/components/tools/implementations/JsonParseTool").then((m) => ({ default: m.JsonParseTool }))),
  "json-schema-validator": lazyTool("json-schema-validator", () => import("@/components/tools/implementations/JsonSchemaValidatorTool").then((m) => ({ default: m.JsonSchemaValidatorTool }))),
  "json-stringify": lazyTool("json-stringify", () => import("@/components/tools/implementations/JsonStringifyTool").then((m) => ({ default: m.JsonStringifyTool }))),
  "json-to-csv": lazyTool("json-to-csv", () => import("@/components/tools/implementations/CsvJsonConverterTool").then((m) => ({ default: m.CsvJsonConverterTool }))),
  "json-to-excel": lazyTool("json-to-excel", () => import("@/components/tools/implementations/spreadsheet/JsonToExcelTool").then((m) => ({ default: m.JsonToExcelTool }))),
  "json-to-toml": lazyTool("json-to-toml", () => import("@/components/tools/implementations/converters/JsonTomlTool").then((m) => ({ default: m.JsonTomlTool }))),
  "json-to-xml": lazyTool("json-to-xml", () => import("@/components/tools/implementations/XmlJsonConverterTool").then((m) => ({ default: m.XmlJsonConverterTool }))),
  "json-to-yaml": lazyTool("json-to-yaml", () => import("@/components/tools/implementations/YamlJsonConverterTool").then((m) => ({ default: m.YamlJsonConverterTool }))),
  "jwt-decoder": lazyTool("jwt-decoder", () => import("@/components/tools/implementations/JwtDecoderTool").then((m) => ({ default: m.JwtDecoderTool }))),
  "jwt-generator": lazyTool("jwt-generator", () => import("@/components/tools/implementations/JwtGeneratorTool").then((m) => ({ default: m.JwtGeneratorTool }))),
  "line-break-remover": lazyTool("line-break-remover", () => import("@/components/tools/implementations/LineBreakRemoverTool").then((m) => ({ default: m.LineBreakRemoverTool }))),
  "lorem-ipsum-generator": lazyTool("lorem-ipsum-generator", () => import("@/components/tools/implementations/LoremIpsumGeneratorTool").then((m) => ({ default: m.LoremIpsumGeneratorTool }))),
  "lz-string-compress": lazyTool("lz-string-compress", () => import("@/components/tools/implementations/compression/LzStringCompressTool").then((m) => ({ default: m.LzStringCompressTool }))),
  "markdown-html": lazyTool("markdown-html", () => import("@/components/tools/implementations/converters/MarkdownHtmlTool").then((m) => ({ default: m.MarkdownHtmlTool }))),
  "markdown-preview": lazyTool("markdown-preview", () => import("@/components/tools/implementations/MarkdownPreviewTool").then((m) => ({ default: m.MarkdownPreviewTool }))),
  "md-to-docx": lazyTool("md-to-docx", () => import("@/components/tools/implementations/converters/MdToDocxTool").then((m) => ({ default: m.MdToDocxTool }))),
  "mime-type-lookup": lazyTool("mime-type-lookup", () => import("@/components/tools/implementations/MimeTypeLookupTool").then((m) => ({ default: m.MimeTypeLookupTool }))),
  "nginx-config-generator": lazyTool("nginx-config-generator", () => import("@/components/tools/implementations/NginxConfigGeneratorTool").then((m) => ({ default: m.NginxConfigGeneratorTool }))),
  "number-base-converter": lazyTool("number-base-converter", () => import("@/components/tools/implementations/NumberBaseConverterTool").then((m) => ({ default: m.NumberBaseConverterTool }))),
  "number-formatter": lazyTool("number-formatter", () => import("@/components/tools/implementations/NumberFormatterTool").then((m) => ({ default: m.NumberFormatterTool }))),
  "password-generator": lazyTool("password-generator", () => import("@/components/tools/implementations/PasswordGeneratorTool").then((m) => ({ default: m.PasswordGeneratorTool }))),
  "pdf-compress": lazyTool("pdf-compress", () => import("@/components/tools/implementations/pdf/PdfCompressTool").then((m) => ({ default: m.PdfCompressTool }))),
  "pdf-encrypt": lazyTool("pdf-encrypt", () => import("@/components/tools/implementations/pdf/PdfEncryptTool").then((m) => ({ default: m.PdfEncryptTool }))),
  "pdf-form-fill": lazyTool("pdf-form-fill", () => import("@/components/tools/implementations/pdf/PdfFormFillTool").then((m) => ({ default: m.PdfFormFillTool }))),
  "pdf-merge": lazyTool("pdf-merge", () => import("@/components/tools/implementations/pdf/PdfMergeTool").then((m) => ({ default: m.PdfMergeTool }))),
  "pdf-metadata": lazyTool("pdf-metadata", () => import("@/components/tools/implementations/pdf/PdfMetadataTool").then((m) => ({ default: m.PdfMetadataTool }))),
  "pdf-reorder": lazyTool("pdf-reorder", () => import("@/components/tools/implementations/pdf/PdfReorderTool").then((m) => ({ default: m.PdfReorderTool }))),
  "pdf-rotate": lazyTool("pdf-rotate", () => import("@/components/tools/implementations/pdf/PdfRotateTool").then((m) => ({ default: m.PdfRotateTool }))),
  "pdf-sign": lazyTool("pdf-sign", () => import("@/components/tools/implementations/pdf/PdfSignTool").then((m) => ({ default: m.PdfSignTool }))),
  "pdf-split": lazyTool("pdf-split", () => import("@/components/tools/implementations/pdf/PdfSplitTool").then((m) => ({ default: m.PdfSplitTool }))),
  "pdf-to-images": lazyTool("pdf-to-images", () => import("@/components/tools/implementations/pdf/PdfToImagesTool").then((m) => ({ default: m.PdfToImagesTool }))),
  "pdf-unlock": lazyTool("pdf-unlock", () => import("@/components/tools/implementations/pdf/PdfUnlockTool").then((m) => ({ default: m.PdfUnlockTool }))),
  "pdf-watermark": lazyTool("pdf-watermark", () => import("@/components/tools/implementations/pdf/PdfWatermarkTool").then((m) => ({ default: m.PdfWatermarkTool }))),
  "qr-code-generator": lazyTool("qr-code-generator", () => import("@/components/tools/implementations/QrCodeGeneratorTool").then((m) => ({ default: m.QrCodeGeneratorTool }))),
  "regex-generator": lazyTool("regex-generator", () => import("@/components/tools/implementations/RegexGeneratorTool").then((m) => ({ default: m.RegexGeneratorTool }))),
  "regex-tester": lazyTool("regex-tester", () => import("@/components/tools/implementations/RegexTesterTool").then((m) => ({ default: m.RegexTesterTool }))),
  "slug-converter": lazyTool("slug-converter", () => import("@/components/tools/implementations/SlugConverterTool").then((m) => ({ default: m.SlugConverterTool }))),
  "sql-formatter": lazyTool("sql-formatter", () => import("@/components/tools/implementations/SqlFormatterTool").then((m) => ({ default: m.SqlFormatterTool }))),
  "string-escape": lazyTool("string-escape", () => import("@/components/tools/implementations/StringEscapeTool").then((m) => ({ default: m.StringEscapeTool }))),
  "svg-png": lazyTool("svg-png", () => import("@/components/tools/implementations/converters/SvgPngTool").then((m) => ({ default: m.SvgPngTool }))),
  "text-diff": lazyTool("text-diff", () => import("@/components/tools/implementations/TextDiffTool").then((m) => ({ default: m.TextDiffTool }))),
  "text-replacer": lazyTool("text-replacer", () => import("@/components/tools/implementations/TextReplacerTool").then((m) => ({ default: m.TextReplacerTool }))),
  "text-sorter": lazyTool("text-sorter", () => import("@/components/tools/implementations/TextSorterTool").then((m) => ({ default: m.TextSorterTool }))),
  "text-to-binary": lazyTool("text-to-binary", () => import("@/components/tools/implementations/TextToBinaryTool").then((m) => ({ default: m.TextToBinaryTool }))),
  "timestamp-converter": lazyTool("timestamp-converter", () => import("@/components/tools/implementations/converters/TimestampConverterTool").then((m) => ({ default: m.TimestampConverterTool }))),
  "toml-formatter": lazyTool("toml-formatter", () => import("@/components/tools/implementations/TomlFormatterTool").then((m) => ({ default: m.TomlFormatterTool }))),
  "unicode-inspector": lazyTool("unicode-inspector", () => import("@/components/tools/implementations/UnicodeInspectorTool").then((m) => ({ default: m.UnicodeInspectorTool }))),
  "url-encoder": lazyTool("url-encoder", () => import("@/components/tools/implementations/UrlEncoderTool").then((m) => ({ default: m.UrlEncoderTool }))),
  "url-parser": lazyTool("url-parser", () => import("@/components/tools/implementations/converters/UrlParserTool").then((m) => ({ default: m.UrlParserTool }))),
  "user-agent-generator": lazyTool("user-agent-generator", () => import("@/components/tools/implementations/UserAgentGeneratorTool")),
  "uuid-generator": lazyTool("uuid-generator", () => import("@/components/tools/implementations/UuidGeneratorTool").then((m) => ({ default: m.UuidGeneratorTool }))),
  "video-metadata": lazyTool("video-metadata", () => import("@/components/tools/implementations/video/VideoMetadataTool").then((m) => ({ default: m.VideoMetadataTool }))),
  "video-thumbnail": lazyTool("video-thumbnail", () => import("@/components/tools/implementations/video/VideoThumbnailTool").then((m) => ({ default: m.VideoThumbnailTool }))),
  "video-to-gif": lazyTool("video-to-gif", () => import("@/components/tools/implementations/video/VideoToGifTool").then((m) => ({ default: m.VideoToGifTool }))),
  "video-trimmer": lazyTool("video-trimmer", () => import("@/components/tools/implementations/video/VideoTrimmerTool").then((m) => ({ default: m.VideoTrimmerTool }))),
  "word-counter": lazyTool("word-counter", () => import("@/components/tools/implementations/WordCounterTool").then((m) => ({ default: m.WordCounterTool }))),
  "xml-formatter": lazyTool("xml-formatter", () => import("@/components/tools/implementations/XmlFormatterTool").then((m) => ({ default: m.XmlFormatterTool }))),
  "xml-to-json": lazyTool("xml-to-json", () => import("@/components/tools/implementations/XmlJsonConverterTool").then((m) => ({ default: m.XmlJsonConverterTool }))),
  "yaml-formatter": lazyTool("yaml-formatter", () => import("@/components/tools/implementations/YamlFormatterTool").then((m) => ({ default: m.YamlFormatterTool }))),
  "yaml-to-json": lazyTool("yaml-to-json", () => import("@/components/tools/implementations/YamlJsonConverterTool").then((m) => ({ default: m.YamlJsonConverterTool }))),
  "zip-creator": lazyTool("zip-creator", () => import("@/components/tools/implementations/archive/ZipCreatorTool").then((m) => ({ default: m.ZipCreatorTool }))),
  "zip-extractor": lazyTool("zip-extractor", () => import("@/components/tools/implementations/archive/ZipExtractorTool").then((m) => ({ default: m.ZipExtractorTool }))),
  "zip-preview": lazyTool("zip-preview", () => import("@/components/tools/implementations/archive/ZipPreviewTool").then((m) => ({ default: m.ZipPreviewTool }))),
};

export function getLazyTool(slug: string): LazyExoticComponent<ComponentType> | undefined {
  return lazyToolComponents[slug];
}
