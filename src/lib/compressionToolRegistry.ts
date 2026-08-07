import { GzipCompressTool } from "@/components/tools/implementations/compression/GzipCompressTool";
import { GzipDecompressTool } from "@/components/tools/implementations/compression/GzipDecompressTool";
import { LzStringCompressTool } from "@/components/tools/implementations/compression/LzStringCompressTool";

export const compressionComponentRegistry: Record<string, React.ComponentType<unknown>> = {
  "gzip-compress": GzipCompressTool,
  "gzip-decompress": GzipDecompressTool,
  "lz-string-compress": LzStringCompressTool,
};
