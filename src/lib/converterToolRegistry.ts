import { MdToDocxTool } from "@/components/tools/implementations/converters/MdToDocxTool";
import { MarkdownHtmlTool } from "@/components/tools/implementations/converters/MarkdownHtmlTool";
import { JsonTomlTool } from "@/components/tools/implementations/converters/JsonTomlTool";
import { JsonYamlTool } from "@/components/tools/implementations/converters/JsonYamlTool";
import { JsonXmlTool } from "@/components/tools/implementations/converters/JsonXmlTool";
import { JsonCsvTool } from "@/components/tools/implementations/converters/JsonCsvTool";
import { ColorConverterTool } from "@/components/tools/implementations/converters/ColorConverterTool";
import { TimestampConverterTool } from "@/components/tools/implementations/converters/TimestampConverterTool";
import { HtmlMarkdownTool } from "@/components/tools/implementations/converters/HtmlMarkdownTool";
import { CsvMarkdownTool } from "@/components/tools/implementations/converters/CsvMarkdownTool";
import { SvgPngTool } from "@/components/tools/implementations/converters/SvgPngTool";
import { UrlParserTool } from "@/components/tools/implementations/converters/UrlParserTool";

export const converterComponentRegistry: Record<string, React.ComponentType<unknown>> = {
  "md-to-docx": MdToDocxTool,
  "markdown-html": MarkdownHtmlTool,
  "json-toml": JsonTomlTool,
  "json-yaml": JsonYamlTool,
  "json-xml": JsonXmlTool,
  "json-csv": JsonCsvTool,
  "color-converter": ColorConverterTool,
  "timestamp-converter": TimestampConverterTool,
  "html-markdown": HtmlMarkdownTool,
  "csv-markdown": CsvMarkdownTool,
  "svg-png": SvgPngTool,
  "url-parser": UrlParserTool,
};
