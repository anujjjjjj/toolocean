import { ImageResizerTool } from "@/components/tools/implementations/image/ImageResizerTool";
import { ImageCompressorTool } from "@/components/tools/implementations/image/ImageCompressorTool";
import { ImageFormatConverterTool } from "@/components/tools/implementations/image/ImageFormatConverterTool";
import { ImageToBase64Tool } from "@/components/tools/implementations/image/ImageToBase64Tool";
import { ImageCropTool } from "@/components/tools/implementations/image/ImageCropTool";
import { ImageRotateFlipTool } from "@/components/tools/implementations/image/ImageRotateFlipTool";
import { ImageWatermarkTool } from "@/components/tools/implementations/image/ImageWatermarkTool";
import { ImageFiltersTool } from "@/components/tools/implementations/image/ImageFiltersTool";
import { ImageColorPickerTool } from "@/components/tools/implementations/image/ImageColorPickerTool";
import { FaviconGeneratorTool } from "@/components/tools/implementations/image/FaviconGeneratorTool";

export const imageComponentRegistry: Record<string, React.ComponentType<unknown>> = {
  "image-resizer": ImageResizerTool,
  "image-compressor": ImageCompressorTool,
  "image-format-converter": ImageFormatConverterTool,
  "image-crop": ImageCropTool,
  "color-picker": ImageColorPickerTool,
  "favicon-generator": FaviconGeneratorTool,
  "image-to-base64": ImageToBase64Tool,
  "image-rotate-flip": ImageRotateFlipTool,
  "image-watermark": ImageWatermarkTool,
  "image-filters": ImageFiltersTool,
};
