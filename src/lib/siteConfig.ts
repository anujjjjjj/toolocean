// Single source of truth for site-wide SEO constants.
// SITE_URL drives every canonical URL, og:url, and JSON-LD id. scripts/generate-sitemap.mjs
// parses this same line, so changing it here updates the sitemap on the next build too.
export const SITE_URL = "https://toolocean.co";
export const SITE_NAME = "ToolOcean";
/*
 * Must be a raster format. This previously pointed at /favicon.svg, which
 * Facebook, X, LinkedIn and Slack all refuse to render — every shared link
 * appeared with no preview image. Regenerate with scripts/generate-og-image.mjs.
 */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
export const DEFAULT_DESCRIPTION =
  "ToolOcean is a free collection of browser-based developer, PDF, image, audio, video, and file tools. 100% client-side — your files never leave your device.";
export const TWITTER_HANDLE = "@toolocean";
