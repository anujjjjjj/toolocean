import { PdfMergeTool } from "@/components/tools/implementations/pdf/PdfMergeTool";
import { PdfSplitTool } from "@/components/tools/implementations/pdf/PdfSplitTool";
import { PdfCompressTool } from "@/components/tools/implementations/pdf/PdfCompressTool";
import { PdfToImagesTool } from "@/components/tools/implementations/pdf/PdfToImagesTool";
import { ImagesToPdfTool } from "@/components/tools/implementations/pdf/ImagesToPdfTool";
import { PdfRotateTool } from "@/components/tools/implementations/pdf/PdfRotateTool";
import { PdfWatermarkTool } from "@/components/tools/implementations/pdf/PdfWatermarkTool";
import { PdfReorderTool } from "@/components/tools/implementations/pdf/PdfReorderTool";

// Component registry for PDF tool page rendering
export const pdfComponentRegistry: Record<string, React.ComponentType<any>> = {
    "pdf-merge": PdfMergeTool,
    "pdf-split": PdfSplitTool,
    "pdf-compress": PdfCompressTool,
    "pdf-to-images": PdfToImagesTool,
    "images-to-pdf": ImagesToPdfTool,
    "pdf-rotate": PdfRotateTool,
    "pdf-watermark": PdfWatermarkTool,
    "pdf-reorder": PdfReorderTool,
};
