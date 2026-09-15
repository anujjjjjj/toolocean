import type { ToolPageContent } from "@/types/toolContent";

/**
 * How a tool page gets its content without shipping every other tool's copy.
 *
 * ToolRoutePage used to import resolveToolContent directly. That pulled the
 * 2,380-line src/data/toolSeo.ts into the route chunk, so a visitor reading
 * /pdf-merge downloaded the marketing copy for all 114 tools — 53 KB gzip of
 * which roughly 52 KB was about pages they were not on. Authoring deep per-tool
 * content would have multiplied that by an order of magnitude, so this has to be
 * fixed before the content program starts, not after.
 *
 * Three sources, in order:
 *
 *   1. SSR — entry-ssg calls provideToolContent() before rendering. The Node
 *      bundle has no size budget, so it just resolves normally.
 *   2. First paint in the browser — the prerender inlines the resolved content
 *      as JSON in the document head. This read is synchronous, which matters:
 *      hydration must have the content in the same tick or React discards the
 *      prerendered markup and the page visibly flashes.
 *   3. Client-side navigation to another tool — nothing is inlined for that slug,
 *      so the resolver is imported dynamically. Async is fine here because there
 *      is no server markup to preserve.
 */

export const TOOL_CONTENT_ELEMENT_ID = "tool-content";

let provided: ToolPageContent | null = null;

/** SSR only. Set immediately before rendering a tool route. */
export function provideToolContent(content: ToolPageContent | null): void {
  provided = content;
}

/**
 * Content for `slug` if it is already available synchronously.
 *
 * The slug is checked rather than assumed: after a client-side navigation the
 * inlined payload still describes whichever tool was originally server-rendered,
 * and returning that for a different route would render the wrong page.
 */
export function readSyncToolContent(slug: string): ToolPageContent | null {
  if (provided?.slug === slug) return provided;

  if (typeof document === "undefined") return null;

  const element = document.getElementById(TOOL_CONTENT_ELEMENT_ID);
  if (!element?.textContent) return null;

  try {
    const parsed = JSON.parse(element.textContent) as ToolPageContent;
    return parsed.slug === slug ? parsed : null;
  } catch {
    // A malformed payload should degrade to the async path, not blank the page.
    return null;
  }
}

/** Dynamic import so the resolver and its copy stay out of the route chunk. */
export async function loadToolContent(slug: string): Promise<ToolPageContent | null> {
  const { resolveToolContent } = await import("@/lib/toolContentResolver");
  return resolveToolContent(slug) ?? null;
}
