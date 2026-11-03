import type { ToolPageContent } from "@/types/toolContent";

/**
 * Related links for three tools with no authored page. Left to deriveRelated(),
 * Video to MP3 is only one tie-break away from dropping off these lists as the
 * catalog grows, so each page names it first and keeps the rest of its links.
 * check-content counts these as authored, so each description is written for its page.
 */
export const videoTrimmerContent: Partial<ToolPageContent> = {
  related: [
    { name: "Video to MP3", path: "/video-to-mp3", description: "Save the trimmed clip's sound as MP3" },
    { name: "Audio Cutter", path: "/audio-cutter", description: "The same cut for audio files" },
    { name: "Image Crop", path: "/image-crop", description: "Crop a saved frame" },
    { name: "Video to GIF", path: "/video-to-gif", description: "Turn a short clip into a GIF" },
    { name: "Metadata Viewer", path: "/video-metadata", description: "Check length and dimensions first" },
    { name: "Thumbnail Extractor", path: "/video-thumbnail", description: "Keep one frame as an image" },
  ],
};

export const videoToGifContent: Partial<ToolPageContent> = {
  related: [
    { name: "Video to MP3", path: "/video-to-mp3", description: "Keep the sound a GIF leaves out" },
    { name: "Video Trimmer", path: "/video-trimmer", description: "Shorten the clip before converting" },
    { name: "Metadata Viewer", path: "/video-metadata", description: "See frame size and length" },
    { name: "Thumbnail Extractor", path: "/video-thumbnail", description: "Need one still instead?" },
  ],
};

export const audioCutterContent: Partial<ToolPageContent> = {
  related: [
    { name: "Video to MP3", path: "/video-to-mp3", description: "Get audio out of a video first" },
    { name: "Audio Merger", path: "/audio-merge", description: "Join your cuts into one file" },
    { name: "Image Crop", path: "/image-crop", description: "Crop pictures the same way" },
    { name: "Video Trimmer", path: "/video-trimmer", description: "Cut a video by time" },
  ],
};
