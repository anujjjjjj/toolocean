/**
 * Build-time guard for the internal link graph.
 *
 * Search engines discover and weight pages by following <a href>. This site was
 * built with onClick={() => navigate(...)} on its category and homepage cards,
 * which is invisible to a crawler: a BFS over the prerendered HTML reached only
 * 105 of 114 tools from the homepage, 9 were reachable exclusively through
 * sitemap.xml, 84 sat at click depth 3 or worse, and the deepest was 11 hops.
 * None of that is visible in a browser, where every card works perfectly.
 *
 * So it gets asserted against the built HTML rather than trusted. Runs last in
 * the build, after prerender, because it can only be checked on real output.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");

/** Pages may sit this many clicks from the homepage, at most. */
const MAX_DEPTH = 3;

if (!existsSync(DIST)) {
  console.error("\n✗ dist/ not found — run the build before checking links.\n");
  process.exit(1);
}

function htmlFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "assets" || name === "og" || name === "fonts") continue;
      htmlFiles(full, acc);
    } else if (name.endsWith(".html")) {
      acc.push(full);
    }
  }
  return acc;
}

const routeOf = (file) => {
  const rel = relative(DIST, file);
  if (rel === "index.html") return "/";
  return "/" + rel.replace(/\/index\.html$/, "").replace(/\.html$/, "");
};

/** Legacy prefixes that 301 elsewhere. An internal link should never point at one. */
const LEGACY_PREFIXES = [
  "/tools/",
  "/pdf-tools/",
  "/csv-tools/",
  "/audio-tools/",
  "/image-tools/",
  "/video-tools/",
  "/spreadsheet-tools/",
  "/compression-tools/",
  "/archive-tools/",
  "/converter-tools/",
];

const pages = new Map();
for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, "utf-8");
  const links = [
    ...new Set(
      [...html.matchAll(/<a\b[^>]*\bhref="(\/[^"]*)"/g)]
        .map((m) => m[1].split("#")[0].split("?")[0])
        .map((href) => (href.length > 1 ? href.replace(/\/$/, "") : href))
        .filter((href) => href && !href.startsWith("/assets/")),
    ),
  ];
  pages.set(routeOf(file), { links, noindex: /content="noindex/.test(html) });
}

// --- BFS from the homepage over real anchors only -------------------------
const depth = new Map([["/", 0]]);
const queue = ["/"];
while (queue.length > 0) {
  const route = queue.shift();
  for (const link of pages.get(route)?.links ?? []) {
    if (!pages.has(link) || depth.has(link)) continue;
    depth.set(link, depth.get(route) + 1);
    queue.push(link);
  }
}

const failures = [];

// 1. Orphans — reachable only from sitemap.xml, which is discovery of last resort.
const orphans = [...pages.keys()].filter(
  (route) => !depth.has(route) && route !== "/404" && !pages.get(route).noindex,
);
if (orphans.length > 0) {
  failures.push(
    `${orphans.length} page(s) unreachable from / by following <a href>:\n` +
      orphans.map((r) => `    ${r}`).join("\n"),
  );
}

// 2. Anything buried deeper than MAX_DEPTH.
const tooDeep = [...depth.entries()].filter(([, d]) => d > MAX_DEPTH);
if (tooDeep.length > 0) {
  failures.push(
    `${tooDeep.length} page(s) deeper than ${MAX_DEPTH} clicks from /:\n` +
      tooDeep.map(([r, d]) => `    ${r}  (depth ${d})`).join("\n"),
  );
}

// 3. Internal links pointing at a URL that redirects.
const redirecting = [];
for (const [route, { links }] of pages) {
  for (const link of links) {
    if (LEGACY_PREFIXES.some((prefix) => link.startsWith(prefix))) {
      redirecting.push(`    ${route} → ${link}`);
    }
  }
}
if (redirecting.length > 0) {
  failures.push(
    `${redirecting.length} internal link(s) point at a legacy URL that redirects:\n` +
      redirecting.join("\n"),
  );
}

// 4. Every sitemap URL must be a page the build actually emitted.
const sitemapPath = resolve(DIST, "sitemap.xml");
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, "utf-8");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) =>
    new URL(loc).pathname.replace(/\/$/, ""),
  );
  const missing = locs.filter((p) => !pages.has(p === "" ? "/" : p));
  if (missing.length > 0) {
    failures.push(
      `${missing.length} sitemap URL(s) have no prerendered file and will 404:\n` +
        missing.map((p) => `    ${p}`).join("\n"),
    );
  }
  const noindexed = locs.filter((p) => pages.get(p === "" ? "/" : p)?.noindex);
  if (noindexed.length > 0) {
    failures.push(
      `${noindexed.length} sitemap URL(s) are marked noindex:\n` +
        noindexed.map((p) => `    ${p}`).join("\n"),
    );
  }
}

if (failures.length > 0) {
  console.error(`\n✗ link graph:\n\n  ${failures.join("\n\n  ")}\n`);
  process.exit(1);
}

const histogram = [...depth.values()].reduce((acc, d) => {
  acc[d] = (acc[d] ?? 0) + 1;
  return acc;
}, {});
const shape = Object.entries(histogram)
  .map(([d, n]) => `${n}@${d}`)
  .join(" ");
console.log(`✓ links: ${pages.size} pages, 0 orphans, max depth ${Math.max(...depth.values())} (${shape})`);
