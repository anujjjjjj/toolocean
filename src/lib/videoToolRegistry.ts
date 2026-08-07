import { VideoThumbnailTool } from "@/components/tools/implementations/video/VideoThumbnailTool";
import { VideoTrimmerTool } from "@/components/tools/implementations/video/VideoTrimmerTool";
import { VideoToGifTool } from "@/components/tools/implementations/video/VideoToGifTool";
import { VideoMetadataTool } from "@/components/tools/implementations/video/VideoMetadataTool";

export const videoComponentRegistry: Record<string, React.ComponentType<unknown>> = {
  "video-trimmer": VideoTrimmerTool,
  "video-to-gif": VideoToGifTool,
  "video-thumbnail": VideoThumbnailTool,
  "video-metadata": VideoMetadataTool,
};
