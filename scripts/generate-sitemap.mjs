/**
 * Generates public/sitemap.xml from the tool catalog.
 *
 * The output is build-generated and therefore gitignored, not committed. Writing
 * into public/ (rather than straight to dist/) is deliberate: vite copies public/
 * verbatim, so both `build:client` and the prerender pass pick it up with no extra
 * wiring, and `vite dev` serves the same file the deploy will.
 *
 * Reads src/data/toolCatalog.ts — the same file the app routes on — so the
 * sitemap cannot drift from reality. The previous version kept its own hand-typed
 * copy of every category's tool ids, which had already fallen out of sync.
 *
 * Only canonical URLs are listed. The pre-flattening /tools/… and
 * /<category>-tools/… paths are 301s and must never appear in a sitemap.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
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

/*
 * Modifier and comparison landing pages. Parsed from the same data module the app
 * routes and prerenders from, so a page cannot end up in the sitemap without a
 * matching static file — which is exactly how /workflow-builder came to be the one
 * advertised URL that answered 404.
 */
const landingSource = readFileSync(resolve(ROOT, "src/data/landingPages.ts"), "utf-8");
const landingSlugs = [...landingSource.matchAll(/^\s{4}slug: "([a-z0-9-]+)",$/gm)].map(([, slug]) => slug);
if (landingSlugs.length === 0) {
  throw new Error("Could not parse any landing page slugs from src/data/landingPages.ts");
}

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

/**
 * lastmod comes from git, per URL.
 *
 * This used to be `new Date()` for every entry, which meant all 126 URLs claimed
 * to have changed on every single deploy. Google's documented behaviour is to stop
 * trusting lastmod when it is demonstrably inaccurate, so the field was costing
 * credibility and returning nothing. Bing does use it, which is why the fix is to
 * make it true rather than to drop it.
 *
 * A missing date is better than a wrong one: if git history is unavailable — no
 * repo, or a clone too shallow to reach the commit that last touched a file, which
 * is how most CI checkouts behave — the element is omitted for that URL instead of
 * being filled in with a guess.
 */
const gitDateCache = new Map();

function lastCommitDate(relativePath) {
  if (gitDateCache.has(relativePath)) return gitDateCache.get(relativePath);

  let date = null;
  try {
    const output = execFileSync("git", ["log", "-1", "--format=%cs", "--", relativePath], {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    // %cs is already YYYY-MM-DD, which is a valid W3C date for sitemaps.
    if (/^\d{4}-\d{2}-\d{2}$/.test(output)) date = output;
  } catch {
    // Not a repo, git missing, or the path is untracked. Omit rather than invent.
  }

  gitDateCache.set(relativePath, date);
  return date;
}

/** toolContent files are camelCase: json-formatter -> jsonFormatter.ts */
function authoredContentPath(slug) {
  const camel = slug.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
  const path = `src/data/toolContent/${camel}.ts`;
  return existsSync(resolve(ROOT, path)) ? path : null;
}

/**
 * The file that most specifically defines a URL's content.
 *
 * Deliberately not the shared template or the tool's own component: a layout
 * tweak or a bug fix in the formatter's logic does not change what the page says,
 * and including them would put us straight back to a date that moves on every
 * commit. A tool with no authored content file falls back to toolSeo.ts, so it
 * carries the date its title, description and FAQs actually last changed.
 */
const LISTING_SOURCE = {
  "/dev-tools": "src/pages/DevToolsPage.tsx",
  "/pdf-tools": "src/pages/PdfToolsPage.tsx",
  "/csv-tools": "src/pages/CsvToolsPage.tsx",
  "/audio-tools": "src/pages/AudioToolsPage.tsx",
  "/image-tools": "src/pages/ImageToolsPage.tsx",
  "/video-tools": "src/pages/VideoToolsPage.tsx",
  "/spreadsheet-tools": "src/pages/SpreadsheetToolsPage.tsx",
  "/compression-tools": "src/pages/CompressionToolsPage.tsx",
  "/archive-tools": "src/pages/ArchiveToolsPage.tsx",
  "/converter-tools": "src/pages/ConverterToolsPage.tsx",
};

const routes = [
  { path: "/", priority: "1.0", changefreq: "weekly", source: "src/pages/Index.tsx" },
  ...CATEGORY_INDEXES.map((path) => ({
    path,
    priority: "0.9",
    changefreq: "weekly",
    source: LISTING_SOURCE[path],
  })),
  {
    path: "/workflow-builder",
    priority: "0.5",
    changefreq: "monthly",
    source: "src/pages/WorkflowBuilderPage.tsx",
  },
  /*
   * Landing pages rank higher than the tool pages here because they target the
   * qualified queries this site can actually win, and each one is an entry point
   * into several tools rather than just one.
   */
  ...landingSlugs.map((slug) => ({
    path: `/${slug}`,
    priority: "0.9",
    changefreq: "monthly",
    source: "src/data/landingPages.ts",
  })),
  // Trust pages. Low priority — they exist for readers and for E-E-A-T, not to rank.
  { path: "/about", priority: "0.4", changefreq: "yearly", source: "src/pages/AboutPage.tsx" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly", source: "src/pages/PrivacyPage.tsx" },
  { path: "/terms", priority: "0.3", changefreq: "yearly", source: "src/pages/TermsPage.tsx" },
  // Tool pages are the money pages — they matter more than the listings.
  ...toolSlugs.map((slug) => ({
    path: `/${slug}`,
    priority: "0.8",
    changefreq: "monthly",
    source: authoredContentPath(slug) ?? "src/data/toolSeo.ts",
  })),
];

const urlEntries = routes
  .map((route) => {
    const lastmod = route.source ? lastCommitDate(route.source) : null;
    return `  <url>
    <loc>${SITE_URL}${route.path}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  })
  .join("\n");

const datedCount = routes.filter((route) => route.source && lastCommitDate(route.source)).length;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

writeFileSync(resolve(ROOT, "public/sitemap.xml"), sitemap);
console.log(
  `✓ sitemap: ${routes.length} canonical URLs (${toolSlugs.length} tools), ` +
    `${datedCount} with a git-derived lastmod`,
);
