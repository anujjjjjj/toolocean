import { VideoThumbnailTool } from "@/components/tools/implementations/video/VideoThumbnailTool";
import { PlaceholderTool } from "@/components/tools/PlaceholderTool";

export const videoComponentRegistry: Record<string, React.ComponentType<unknown>> = {
  "video-trimmer": PlaceholderTool,
  "video-to-gif": PlaceholderTool,
  "video-thumbnail": VideoThumbnailTool,
  "video-metadata": PlaceholderTool,
};
