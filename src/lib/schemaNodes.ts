import { SITE_NAME, SITE_URL } from "@/lib/siteConfig";

/**
 * The two schema.org nodes every page on the site shares.
 *
 * Organization and WebSite were previously rebuilt inline in each graph builder,
 * which meant three verbatim copies drifting independently. They are pure
 * constants of the site, so they live here and every graph references them by
 * @id. Which is also what lets a parser resolve the whole site into one entity
 * rather than a set of unrelated assertions that happen to share a name.
 */

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Deliberately no `potentialAction`/SearchAction. The previous WebSite node
 * declared a sitelinks searchbox pointing at /?q={search_term_string}, which
 * nothing on the site handles. The homepage field just opens the command
 * palette. Google also retired the sitelinks searchbox result in November 2024,
 * so the claim bought nothing and was not true.
 */
export function buildSiteNodes(): Record<string, unknown>[] {
  return [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.svg` },
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { "@id": ORGANIZATION_ID },
      inLanguage: "en",
    },
  ];
}

/** BreadcrumbList node from a trail of {name, path} pairs. */
export function buildBreadcrumbNode(
  trail: { name: string; path: string }[],
  id: string,
): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    "@id": id,
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}
