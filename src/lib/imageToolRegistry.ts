import { ImageResizerTool } from "@/components/tools/implementations/image/ImageResizerTool";
import { ImageCompressorTool } from "@/components/tools/implementations/image/ImageCompressorTool";
import { ImageFormatConverterTool } from "@/components/tools/implementations/image/ImageFormatConverterTool";
import { ImageToBase64Tool } from "@/components/tools/implementations/image/ImageToBase64Tool";
import { PlaceholderTool } from "@/components/tools/PlaceholderTool";

export const imageComponentRegistry: Record<string, React.ComponentType<unknown>> = {
  "image-resizer": ImageResizerTool,
  "image-compressor": ImageCompressorTool,
  "image-format-converter": ImageFormatConverterTool,
  "image-crop": PlaceholderTool,
  "color-picker": PlaceholderTool,
  "favicon-generator": PlaceholderTool,
  "image-to-base64": ImageToBase64Tool,
};
