import { CsvConverterTool } from "@/components/tools/implementations/csv/CsvConverterTool";
import { CsvValidatorTool } from "@/components/tools/implementations/csv/CsvValidatorTool";
import { CsvMergeTool } from "@/components/tools/implementations/csv/CsvMergeTool";

export const csvComponentRegistry: Record<string, React.ComponentType<unknown>> = {
  "csv-converter": CsvConverterTool,
  "csv-validator": CsvValidatorTool,
  "csv-merge": CsvMergeTool,
};
