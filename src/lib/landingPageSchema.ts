import { SITE_NAME, SITE_URL } from "@/lib/siteConfig";
import type { LandingPage } from "@/data/landingPages";

/**
 * schema.org @graph for a modifier or comparison landing page.
 *
 * Deliberately typed as WebPage rather than SoftwareApplication: these pages are
 * about the tools, they are not the tools. Claiming SoftwareApplication for an
 * article-shaped page is the kind of mismatch between markup and visible content
 * that gets structured data ignored, or worse, manually actioned.
 *
 * Same omissions as the tool graph. No aggregateRating, no invented review counts.
 * FAQPage is included because it is a true machine-readable statement of the Q&A on
 * the page, and answer engines read it even though Google narrowed FAQ rich results
 * to government and health sites in 2023.
 */
export function buildLandingPageGraph(page: LandingPage) {
  const pageUrl = `${SITE_URL}/${page.slug}`;
  const websiteId = `${SITE_URL}/#website`;
  const organizationId = `${SITE_URL}/#organization`;
  const pageId = `${pageUrl}#webpage`;

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
      name: page.seo.title,
      description: page.seo.description,
      isPartOf: { "@id": websiteId },
      inLanguage: "en",
      breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      // The sections are the substance of the page; naming them helps a parser
      // pick the relevant passage rather than the whole document.
      hasPart: page.sections.map((section) => ({
        "@type": "WebPageElement",
        name: section.heading,
      })),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: page.h1, item: pageUrl },
      ],
    },
  ];

  if (page.howTo && page.howTo.steps.length > 0) {
    graph.push({
      "@type": "HowTo",
      "@id": `${pageUrl}#howto`,
      name: page.howTo.name,
      step: page.howTo.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.title,
        text: step.body,
        url: `${pageUrl}#how-it-works`,
      })),
    });
  }

  if (page.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      isPartOf: { "@id": pageId },
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
