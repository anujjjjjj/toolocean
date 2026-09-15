import { TOOL_CATALOG, toolPath } from "@/data/toolCatalog";
import { CATEGORY_PAGE_SEO, HOME_SEO, INFO_PAGE_SEO } from "@/data/staticPageSeo";
import { buildToolPageGraph } from "@/lib/toolPageSchema";
import { resolveToolContent } from "@/lib/toolContentResolver";
import { renderHeadTags } from "@/lib/seoHead";
import { LANDING_PAGES, findLandingPage } from "@/data/landingPages";
import { buildLandingPageGraph } from "@/lib/landingPageSchema";
import { buildCategoryGraph, buildHomeGraph, buildInfoPageGraph } from "@/lib/sitePageSchema";

/**
 * The route list the prerender walks, plus the <head> for each one.
 *
 * Head tags are computed here rather than scraped out of the React render because
 * useSEO applies them in an effect, and effects do not run under renderToString.
 * Deriving them from the same pure resolver the page uses is both simpler and
 * impossible to get out of sync with the body content.
 */

export const CATEGORY_INDEXES = Object.keys(CATEGORY_PAGE_SEO);

/**
 * Routes that are prerendered but must not be indexed.
 *
 * /workflow-builder is an app whose content is produced at runtime, so its
 * prerendered body is roughly forty words of empty state. It still needs a
 * static file — a hard refresh would otherwise hit the `/* /404.html 404`
 * fallback — but an indexed forty-word page linked from every footer on the
 * site is a liability, not an asset. It stays crawlable and usable, just not
 * indexable, and it is excluded from sitemap.xml to match.
 */
const NOINDEX_ROUTES = new Set(["/workflow-builder"]);

/** About/Privacy/Terms. Separate from the category indexes so breadcrumbs and the
 *  sitemap do not treat them as tool categories. */
export const INFO_ROUTES = Object.keys(INFO_PAGE_SEO);

/** Every path the build emits static HTML for. */
export const LANDING_ROUTES = LANDING_PAGES.map((page) => `/${page.slug}`);

export const PRERENDER_ROUTES: string[] = [
  "/",
  ...CATEGORY_INDEXES,
  ...INFO_ROUTES,
  ...LANDING_ROUTES,
  ...TOOL_CATALOG.map((tool) => toolPath(tool)),
];

/** Builds the <head> markup for a prerendered route. */
export function headForRoute(path: string): string {
  if (path === "/") {
    return renderHeadTags({ ...HOME_SEO, path: "/", jsonLd: [buildHomeGraph()] });
  }

  const categoryPage = CATEGORY_PAGE_SEO[path];
  if (categoryPage) {
    const categoryGraph = buildCategoryGraph(path);
    return renderHeadTags({ ...categoryPage, path, jsonLd: categoryGraph ? [categoryGraph] : [] });
  }

  const infoPage = INFO_PAGE_SEO[path];
  if (infoPage) {
    // A noindex page gets no graph — describing a page in detail while telling
    // the crawler to ignore it is a contradiction, not a signal.
    const noindex = NOINDEX_ROUTES.has(path);
    const infoGraph = noindex ? null : buildInfoPageGraph(path);
    return renderHeadTags({
      ...infoPage,
      path,
      noindex,
      jsonLd: infoGraph ? [infoGraph] : [],
    });
  }

  const slug = path.replace(/^\//, "");

  const landing = findLandingPage(slug);
  if (landing) {
    return renderHeadTags({
      title: landing.seo.title,
      description: landing.seo.description,
      path: `/${landing.slug}`,
      keywords: landing.seo.keywords,
      jsonLd: [buildLandingPageGraph(landing)],
    });
  }

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
