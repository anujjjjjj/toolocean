import { AudioCutterTool } from "@/components/tools/implementations/audio/AudioCutterTool";
import { AudioMergeTool } from "@/components/tools/implementations/audio/AudioMergeTool";

export const audioComponentRegistry: Record<string, React.ComponentType<unknown>> = {
  "audio-cutter": AudioCutterTool,
  "audio-merge": AudioMergeTool,
};
