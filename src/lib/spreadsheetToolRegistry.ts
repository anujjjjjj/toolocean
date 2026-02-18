import { ExcelReaderTool } from "@/components/tools/implementations/spreadsheet/ExcelReaderTool";
import { CsvToExcelTool } from "@/components/tools/implementations/spreadsheet/CsvToExcelTool";
import { PlaceholderTool } from "@/components/tools/PlaceholderTool";

export const spreadsheetComponentRegistry: Record<string, React.ComponentType<unknown>> = {
  "excel-reader": ExcelReaderTool,
  "csv-to-excel": CsvToExcelTool,
  "excel-to-csv": PlaceholderTool,
  "column-extractor": PlaceholderTool,
};
