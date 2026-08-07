/**
 * Generates public/sitemap.xml from the tool catalog.
 *
 * Reads src/data/toolCatalog.ts — the same file the app routes on — so the
 * sitemap cannot drift from reality. The previous version kept its own hand-typed
 * copy of every category's tool ids, which had already fallen out of sync.
 *
 * Only canonical URLs are listed. The pre-flattening /tools/… and
 * /<category>-tools/… paths are 301s and must never appear in a sitemap.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const siteConfigSource = readFileSync(resolve(ROOT, "src/lib/siteConfig.ts"), "utf-8");
const siteUrlMatch = siteConfigSource.match(/export const SITE_URL = "([^"]+)"/);
if (!siteUrlMatch) {
  throw new Error("Could not parse SITE_URL from src/lib/siteConfig.ts");
}
const SITE_URL = siteUrlMatch[1];

// Dev tool slugs come from tools.json; the rest from the catalog's literal entries.
const catalogSource = readFileSync(resolve(ROOT, "src/data/toolCatalog.ts"), "utf-8");
const categorySlugs = [...catalogSource.matchAll(/\{ id: "([^"]+)", category: "([^"]+)"/g)].map(
  ([, id]) => id,
);
const devSlugs = JSON.parse(readFileSync(resolve(ROOT, "src/data/tools.json"), "utf-8")).tools.map(
  (tool) => tool.id,
);
const toolSlugs = [...devSlugs, ...categorySlugs];

const CATEGORY_INDEXES = [
  "/dev-tools",
  "/pdf-tools",
  "/csv-tools",
  "/audio-tools",
  "/image-tools",
  "/video-tools",
  "/spreadsheet-tools",
  "/compression-tools",
  "/archive-tools",
  "/converter-tools",
];

const today = new Date().toISOString().slice(0, 10);

const routes = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  ...CATEGORY_INDEXES.map((path) => ({ path, priority: "0.9", changefreq: "weekly" })),
  { path: "/workflow-builder", priority: "0.5", changefreq: "monthly" },
  // Tool pages are the money pages — they matter more than the listings.
  ...toolSlugs.map((slug) => ({ path: `/${slug}`, priority: "0.8", changefreq: "monthly" })),
];

const urlEntries = routes
  .map(
    (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

writeFileSync(resolve(ROOT, "public/sitemap.xml"), sitemap);
console.log(`✓ sitemap: ${routes.length} canonical URLs (${toolSlugs.length} tools)`);
