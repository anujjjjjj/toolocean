import type { ToolPageContent } from "@/types/toolContent";
import { jsonFormatterContent } from "./jsonFormatter";

/**
 * Hand-authored page content, keyed by tool slug.
 *
 * Every tool renders a complete page without an entry here — resolveToolContent()
 * falls back to the tool's existing SEO record plus its category profile. An
 * entry is how a tool graduates from "correct" to "genuinely the best page on
 * the web for this query": worked examples, real use cases, and FAQs that answer
 * something specific to that tool.
 *
 * Add tools here in order of search demand rather than all at once. Six deeply
 * written pages outrank sixty templated ones, and bulk-generating the long tail
 * is the scaled-content pattern Google demoted in March 2024.
 */
export const TOOL_CONTENT_OVERRIDES: Record<string, Partial<ToolPageContent>> = {
  "json-formatter": jsonFormatterContent,
};
