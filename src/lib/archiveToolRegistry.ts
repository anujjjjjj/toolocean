import { ZipExtractorTool } from "@/components/tools/implementations/archive/ZipExtractorTool";
import { ZipCreatorTool } from "@/components/tools/implementations/archive/ZipCreatorTool";
import { ZipPreviewTool } from "@/components/tools/implementations/archive/ZipPreviewTool";

export const archiveComponentRegistry: Record<string, React.ComponentType<unknown>> = {
  "zip-extractor": ZipExtractorTool,
  "zip-creator": ZipCreatorTool,
  "zip-preview": ZipPreviewTool,
};
