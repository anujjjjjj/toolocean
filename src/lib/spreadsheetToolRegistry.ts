import { ExcelReaderTool } from "@/components/tools/implementations/spreadsheet/ExcelReaderTool";
import { CsvToExcelTool } from "@/components/tools/implementations/spreadsheet/CsvToExcelTool";
import { ExcelToCsvTool } from "@/components/tools/implementations/spreadsheet/ExcelToCsvTool";
import { JsonToExcelTool } from "@/components/tools/implementations/spreadsheet/JsonToExcelTool";
import { ColumnExtractorTool } from "@/components/tools/implementations/spreadsheet/ColumnExtractorTool";

export const spreadsheetComponentRegistry: Record<string, React.ComponentType<unknown>> = {
  "excel-reader": ExcelReaderTool,
  "csv-to-excel": CsvToExcelTool,
  "excel-to-csv": ExcelToCsvTool,
  "json-to-excel": JsonToExcelTool,
  "column-extractor": ColumnExtractorTool,
};
