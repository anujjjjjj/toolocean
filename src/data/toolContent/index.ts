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

/**
 * Tools whose behaviour does not match what a page about them would claim.
 *
 * Deep content for one of these would mean publishing something untrue. The
 * precedent is encryption-tool, whose "AES" and "DES" modes once emitted base64
 * of a JSON blob containing the plaintext alongside the key and IV: a page
 * describing that as encryption would have been a false security claim, not a
 * marketing exaggeration. It now uses real ciphers, so it is not listed.
 *
 * scripts/check-content.mjs refuses an override for anything listed here, so the
 * dependency is enforced rather than remembered. Fix the tool, or change what
 * the page claims, then remove the slug.
 */
export const KNOWN_BROKEN: string[] = [
  // Currently empty. The five tools the audit flagged — encryption-tool,
  // video-to-gif, xml-json-converter, color-picker and lorem-ipsum-generator —
  // were all repaired before this gate existed, and each was re-checked against
  // the source rather than taken from the audit document. Add a slug here the
  // moment a tool stops doing what its page says it does.
];
