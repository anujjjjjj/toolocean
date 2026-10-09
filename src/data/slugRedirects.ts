/**
 * Flat slugs that used to be their own tools and now 301 to one canonical page.
 *
 * The real redirects live in vercel.json and public/_redirects. This map is the
 * in-app fallback so a client-side visit, or a host that ignores those files,
 * does not 404.
 */
export const SLUG_REDIRECTS: Record<string, string> = {
  "csv-converter": "/csv-to-json",
  "csv-json-converter": "/csv-to-json",
  "json-csv": "/json-to-csv",
  "yaml-json-converter": "/yaml-to-json",
  "json-yaml": "/json-to-yaml",
  "xml-json-converter": "/xml-to-json",
  "json-xml": "/json-to-xml",
  "json-toml": "/json-to-toml",
};
