import type { ToolPageContent } from "@/types/toolContent";
import { jsonFormatterContent } from "./jsonFormatter";
import { pdfMergeContent } from "./pdfMerge";
import { pdfSplitContent } from "./pdfSplit";
import { zipExtractorContent } from "./zipExtractor";
import { zipCreatorContent } from "./zipCreator";
import { imageCompressorContent } from "./imageCompressor";
import { imageResizerContent } from "./imageResizer";
import { imageFormatConverterContent } from "./imageFormatConverter";
import { pdfToImagesContent } from "./pdfToImages";
import { imagesToPdfContent } from "./imagesToPdf";

/**
 * Hand-authored page content, keyed by tool slug.
 *
 * Every tool renders a complete page without an entry here, resolveToolContent()
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
  "pdf-merge": pdfMergeContent,
  "pdf-split": pdfSplitContent,
  "zip-extractor": zipExtractorContent,
  "zip-creator": zipCreatorContent,
  "image-compressor": imageCompressorContent,
  "image-resizer": imageResizerContent,
  "image-format-converter": imageFormatConverterContent,
  "pdf-to-images": pdfToImagesContent,
  "images-to-pdf": imagesToPdfContent,
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
  // Currently empty. pdf-compress was listed here after measurement showed it
  // reduced files by 0.0% while presenting a quality slider its code never read;
  // it now has a real re-encoding mode (84.1% on a 12-page scan, measured) and a
  // guard that refuses to return a file bigger than the original.
];
