import { SITE_NAME, SITE_URL } from "@/lib/siteConfig";
import type { ToolPageContent } from "@/types/toolContent";

/**
 * Builds one connected schema.org @graph for a tool page.
 *
 * Why a single @graph instead of several standalone <script> blocks: nodes get
 * stable @ids and reference each other (WebPage isPartOf WebSite, WebPage
 * breadcrumb BreadcrumbList, WebPage mainEntity SoftwareApplication). That is
 * what lets a parser resolve the page into one entity rather than four
 * unrelated assertions about the same URL.
 *
 * Deliberately NOT emitted:
 *   - aggregateRating / reviewCount. We have no real reviews. Fabricating them
 *     is a structured-data spam violation and risks a manual action.
 *   - HowTo. Google retired HowTo rich results in 2023, so it buys no
 *     enhancement, and the steps are already expressed as an ordered list in
 *     the visible HTML.
 *
 * FAQPage is still emitted even though Google narrowed FAQ rich results to
 * recognised government and health sites in August 2023. It no longer wins a
 * SERP enhancement here, but it remains a clean machine-readable statement of
 * the Q&A content and is used by non-Google consumers and answer engines.
 */
export function buildToolPageGraph(content: ToolPageContent) {
  const pageUrl = `${SITE_URL}${content.path}`;
  const websiteId = `${SITE_URL}/#website`;
  const organizationId = `${SITE_URL}/#organization`;
  const pageId = `${pageUrl}#webpage`;
  const appId = `${pageUrl}#software`;

  const breadcrumbTrail = [
    { name: "Home", path: "/" },
    { name: content.category.name, path: content.category.path },
    { name: content.hero.h1, path: content.path },
  ];

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.svg` },
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { "@id": organizationId },
      inLanguage: "en",
    },
    {
      "@type": "WebPage",
      "@id": pageId,
      url: pageUrl,
      name: content.seo.title,
      description: content.seo.description,
      isPartOf: { "@id": websiteId },
      breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      mainEntity: { "@id": appId },
      inLanguage: "en",
      ...(content.seo.datePublished ? { datePublished: content.seo.datePublished } : {}),
      ...(content.seo.dateModified ? { dateModified: content.seo.dateModified } : {}),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: breadcrumbTrail.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${SITE_URL}${item.path}`,
      })),
    },
    {
      "@type": "SoftwareApplication",
      "@id": appId,
      name: content.hero.h1,
      url: pageUrl,
      description: content.seo.description,
      applicationCategory: "DeveloperApplication",
      // A browser tool genuinely has no OS requirement — this is not filler.
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript. Works in Chrome, Firefox, Safari and Edge.",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: content.features.map((feature) => feature.title),
      publisher: { "@id": organizationId },
    },
  ];

  if (content.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      isPartOf: { "@id": pageId },
      mainEntity: content.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
