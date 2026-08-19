import { TOOL_CATALOG, toolPath } from "@/data/toolCatalog";
import { CATEGORY_PAGE_SEO, HOME_SEO, INFO_PAGE_SEO } from "@/data/staticPageSeo";
import { buildToolPageGraph } from "@/lib/toolPageSchema";
import { resolveToolContent } from "@/lib/toolContentResolver";
import { renderHeadTags } from "@/lib/seoHead";

/**
 * The route list the prerender walks, plus the <head> for each one.
 *
 * Head tags are computed here rather than scraped out of the React render because
 * useSEO applies them in an effect, and effects do not run under renderToString.
 * Deriving them from the same pure resolver the page uses is both simpler and
 * impossible to get out of sync with the body content.
 */

export const CATEGORY_INDEXES = Object.keys(CATEGORY_PAGE_SEO);

/** About/Privacy/Terms. Separate from the category indexes so breadcrumbs and the
 *  sitemap do not treat them as tool categories. */
export const INFO_ROUTES = Object.keys(INFO_PAGE_SEO);

/** Every path the build emits static HTML for. */
export const PRERENDER_ROUTES: string[] = [
  "/",
  ...CATEGORY_INDEXES,
  ...INFO_ROUTES,
  ...TOOL_CATALOG.map((tool) => toolPath(tool)),
];

/** Builds the <head> markup for a prerendered route. */
export function headForRoute(path: string): string {
  if (path === "/") {
    return renderHeadTags({ ...HOME_SEO, path: "/" });
  }

  const categoryPage = CATEGORY_PAGE_SEO[path];
  if (categoryPage) {
    return renderHeadTags({ ...categoryPage, path });
  }

  const infoPage = INFO_PAGE_SEO[path];
  if (infoPage) {
    return renderHeadTags({ ...infoPage, path });
  }

  const slug = path.replace(/^\//, "");
  const content = resolveToolContent(slug);
  if (content) {
    return renderHeadTags({
      title: content.seo.title,
      description: content.seo.description,
      path: content.path,
      keywords: content.seo.keywords,
      image: content.seo.ogImage,
      jsonLd: [buildToolPageGraph(content)],
    });
  }

  // Unknown route: emit a noindex head rather than nothing, so a stray prerendered
  // file can never be indexed as a thin page.
  return renderHeadTags({
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist.",
    path,
    noindex: true,
  });
}
