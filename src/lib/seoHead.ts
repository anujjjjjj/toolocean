import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, TWITTER_HANDLE } from "@/lib/siteConfig";

/**
 * Head-tag construction, expressed as data so the build-time prerender and the
 * runtime useSEO hook produce identical output.
 *
 * The prerender writes these into the static HTML (which is what crawlers read),
 * while useSEO applies the same set on client-side navigation. Sharing one
 * definition is what stops the two from disagreeing about the canonical URL.
 */

export interface SeoInput {
  title: string;
  description: string;
  /** Route path, e.g. "/json-formatter". Combined with SITE_URL for the canonical. */
  path: string;
  keywords?: string[];
  image?: string;
  noindex?: boolean;
  jsonLd?: object[];
}

export interface ResolvedSeo {
  fullTitle: string;
  canonical: string;
  ogImage: string;
  metaByName: Record<string, string>;
  metaByProperty: Record<string, string>;
  jsonLd: object[];
}

export function resolveSeo(input: SeoInput): ResolvedSeo {
  const fullTitle = input.title.includes(SITE_NAME) ? input.title : `${input.title} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}${input.path}`;
  const rawImage = input.image ?? DEFAULT_OG_IMAGE;
  // OG consumers reject relative URLs, so always emit an absolute one.
  const ogImage = rawImage.startsWith("http") ? rawImage : `${SITE_URL}${rawImage}`;

  const metaByName: Record<string, string> = {
    description: input.description,
    /*
     * max-image-preview:large is what allows a large thumbnail in Discover and
     * image-rich SERP treatments; without it Google defaults to a small preview.
     * The snippet/video values keep the defaults explicit rather than implied.
     */
    robots: input.noindex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    "twitter:card": "summary_large_image",
    "twitter:title": fullTitle,
    "twitter:description": input.description,
    "twitter:image": ogImage,
    "twitter:site": TWITTER_HANDLE,
  };

  if (input.keywords && input.keywords.length > 0) {
    metaByName.keywords = input.keywords.join(", ");
  }

  const metaByProperty: Record<string, string> = {
    "og:title": fullTitle,
    "og:description": input.description,
    "og:url": canonical,
    "og:image": ogImage,
    "og:image:alt": input.title,
    "og:type": "website",
    "og:site_name": SITE_NAME,
    "og:locale": "en_US",
  };

  return { fullTitle, canonical, ogImage, metaByName, metaByProperty, jsonLd: input.jsonLd ?? [] };
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Escapes a JSON-LD payload for safe embedding in a <script> element.
 *
 * A literal "</script>" inside string data would otherwise terminate the block
 * early, and the tool content here legitimately contains HTML-ish examples.
 */
function escapeJsonLd(value: object): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** Renders the resolved SEO data as static HTML for the prerendered <head>. */
export function renderHeadTags(input: SeoInput): string {
  const seo = resolveSeo(input);
  const lines: string[] = [
    `<title>${escapeAttribute(seo.fullTitle)}</title>`,
    `<link rel="canonical" href="${escapeAttribute(seo.canonical)}" />`,
  ];

  for (const [name, content] of Object.entries(seo.metaByName)) {
    lines.push(`<meta name="${name}" content="${escapeAttribute(content)}" />`);
  }
  for (const [property, content] of Object.entries(seo.metaByProperty)) {
    lines.push(`<meta property="${property}" content="${escapeAttribute(content)}" />`);
  }
  for (const schema of seo.jsonLd) {
    // The data attribute lets useSEO recognise and replace this block on the
    // first client render instead of appending a second copy beside it.
    lines.push(
      `<script type="application/ld+json" data-seo-jsonld="true">${escapeJsonLd(schema)}</script>`,
    );
  }

  return lines.join("\n    ");
}
