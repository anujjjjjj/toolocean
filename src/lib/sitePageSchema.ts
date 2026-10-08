import { SITE_NAME, SITE_URL } from "@/lib/siteConfig";
import {
  CATEGORY_INDEX,
  CATEGORY_LABEL,
  TOOL_CATALOG,
  toolPath,
  toolsInCategory,
  type CategoryKey,
} from "@/data/toolCatalog";
import { CATEGORY_PAGE_SEO, HOME_SEO, INFO_PAGE_SEO } from "@/data/staticPageSeo";
import { WEBSITE_ID, buildBreadcrumbNode, buildSiteNodes } from "@/lib/schemaNodes";
import { PDF_HUB_FAQS } from "@/data/pdfHubContent";
import { HUB_GUIDES } from "@/data/hubGuides";

/**
 * Graphs for the pages that are not tools and not landing pages: the homepage,
 * the ten category listings, and the info pages.
 *
 * These shipped no structured data at all. headForRoute() builds their <head>
 * from StaticPageSeo, which carries only a title and a description, so the
 * prerendered HTML for the homepage and every category index contained zero
 * ld+json, while the client-side code in the old jsonLd.ts did emit some after
 * hydration. The site's highest-authority pages were therefore describing
 * themselves only to visitors who ran JavaScript.
 *
 * Schema objects stay out of staticPageSeo.ts, which is a copy file. The
 * builders are keyed by path here instead, matching how headForRoute already
 * dispatches to buildLandingPageGraph and buildToolPageGraph.
 */

const graph = (nodes: Record<string, unknown>[]) => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});

/** Category listing order used for the homepage ItemList. */
const CATEGORY_KEYS = Object.keys(CATEGORY_INDEX) as CategoryKey[];

/**
 * Homepage: a CollectionPage whose ItemList is the ten category listings.
 *
 * CollectionPage rather than WebPage because the page's job is to enumerate the
 * catalogue, and the ItemList states what it collects.
 */
export function buildHomeGraph() {
  const pageId = `${SITE_URL}/#webpage`;

  return graph([
    ...buildSiteNodes(),
    {
      "@type": "CollectionPage",
      "@id": pageId,
      url: `${SITE_URL}/`,
      name: HOME_SEO.title,
      description: HOME_SEO.description,
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: "en",
      mainEntity: {
        "@type": "ItemList",
        name: `${SITE_NAME} tool categories`,
        numberOfItems: CATEGORY_KEYS.length,
        itemListElement: CATEGORY_KEYS.map((key, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: CATEGORY_LABEL[key],
          url: `${SITE_URL}${CATEGORY_INDEX[key]}`,
        })),
      },
    },
  ]);
}

/**
 * Category listing: CollectionPage + BreadcrumbList + an ItemList naming every
 * tool on the page.
 *
 * The ItemList is the point. It is a machine-readable statement of exactly
 * which tools this hub collects, mirroring the anchors now in the HTML, and it
 * is the strongest signal available that the page is a genuine index rather
 * than a thin landing page.
 */
export function buildCategoryGraph(path: string) {
  const key = (Object.keys(CATEGORY_INDEX) as CategoryKey[]).find(
    (candidate) => CATEGORY_INDEX[candidate] === path,
  );
  if (!key) return null;

  const seo = CATEGORY_PAGE_SEO[path];
  const pageUrl = `${SITE_URL}${path}`;
  const pageId = `${pageUrl}#webpage`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;
  const tools = toolsInCategory(key);

  const nodes: Record<string, unknown>[] = [
    ...buildSiteNodes(),
    {
      "@type": "CollectionPage",
      "@id": pageId,
      url: pageUrl,
      name: seo.title,
      description: seo.description,
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": breadcrumbId },
      inLanguage: "en",
      mainEntity: {
        "@type": "ItemList",
        name: CATEGORY_LABEL[key],
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.name,
          description: tool.description,
          url: `${SITE_URL}${toolPath(tool)}`,
        })),
      },
    },
    buildBreadcrumbNode(
      [
        { name: "Home", path: "/" },
        { name: CATEGORY_LABEL[key], path },
      ],
      breadcrumbId,
    ),
  ];

  const hubFaqs = path === "/pdf-tools" ? PDF_HUB_FAQS : (HUB_GUIDES[path]?.faqs ?? []);
  if (hubFaqs.length > 0) {
    nodes.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      isPartOf: { "@id": pageId },
      mainEntity: hubFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer.replace(
            /\[([^\]]+)\]\((\/[^)\s]+)\)/g,
            (_match, label: string, faqPath: string) => `${label} (${SITE_URL}${faqPath})`,
          ),
        },
      })),
    });
  }

  return graph(nodes);
}

/** /all-tools, /about, /privacy, /terms: WebPage + BreadcrumbList. */
export function buildInfoPageGraph(path: string) {
  const seo = INFO_PAGE_SEO[path];
  if (!seo) return null;

  const pageUrl = `${SITE_URL}${path}`;
  const pageId = `${pageUrl}#webpage`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;

  // /all-tools is the HTML sitemap, so it is a collection like the category
  // pages are, just one that collects the entire catalogue.
  const isAllTools = path === "/all-tools";

  const page: Record<string, unknown> = {
    "@type": isAllTools ? "CollectionPage" : "WebPage",
    "@id": pageId,
    url: pageUrl,
    name: seo.title,
    description: seo.description,
    isPartOf: { "@id": WEBSITE_ID },
    breadcrumb: { "@id": breadcrumbId },
    inLanguage: "en",
  };

  if (isAllTools) {
    page.mainEntity = {
      "@type": "ItemList",
      name: `All ${SITE_NAME} tools`,
      numberOfItems: TOOL_CATALOG.length,
      itemListElement: TOOL_CATALOG.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.name,
        url: `${SITE_URL}${toolPath(tool)}`,
      })),
    };
  }

  const label = seo.title.split(/[-–, |]/)[0].trim();

  return graph([
    ...buildSiteNodes(),
    page,
    buildBreadcrumbNode([{ name: "Home", path: "/" }, { name: label, path }], breadcrumbId),
  ]);
}
