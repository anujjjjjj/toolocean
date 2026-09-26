import type { CategoryKey } from "@/data/toolCatalog";

/**
 * One color per category for the tool-card icon badge, copied from ilovepdf.com's
 * pattern of a colorful icon square per tool rather than a single uniform tint.
 * Plain hex rather than a CSS var: these are decorative category coding, not part
 * of the semantic theme, and there are more of them than the token set has room for.
 */
export const CATEGORY_BADGE_COLOR: Record<CategoryKey, string> = {
  pdf: "#F0653C",
  image: "#4C82F7",
  csv: "#22A06B",
  spreadsheet: "#22A06B",
  video: "#8B5CF6",
  audio: "#8B5CF6",
  archive: "#64748B",
  compression: "#64748B",
  converter: "#F5A524",
  dev: "#334155",
};
