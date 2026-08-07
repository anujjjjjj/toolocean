/**
 * Emits static HTML for every route after the client build.
 *
 * Why this exists: ToolOcean is a Vite SPA, so dist/index.html shipped as an
 * empty <div id="root">. Every title, meta description, canonical and JSON-LD
 * block was written by JavaScript after hydration. Google can render JS, but it
 * does so on a second pass with no guaranteed timeline, and competitors in this
 * niche serve static HTML — which made the whole SEO layer effectively invisible
 * at crawl time.
 *
 * Each route now gets a real file (dist/json-formatter/index.html) containing the
 * full head and the fully rendered page body. React hydrates that markup rather
 * than replacing it, so there is no flash and no layout shift.
 *
 * Run via `npm run build`, after `vite build` and the SSR bundle build.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

const { renderRoute, PRERENDER_ROUTES } = await import(
  pathToFileURL(join(ROOT, "dist-ssg", "entry-ssg.js")).href
);

const template = readFileSync(join(DIST, "index.html"), "utf-8");

if (!template.includes('<div id="root"></div>')) {
  throw new Error(
    'dist/index.html does not contain the expected `<div id="root"></div>` mount point.',
  );
}

/**
 * The base template carries the generic title/description from index.html. Those
 * would otherwise sit alongside the per-route tags and give crawlers two
 * conflicting answers, so they are stripped before the real head is spliced in.
 */
function stripPlaceholderHead(html) {
  return html
    .replace(/\n?\s*<title>[\s\S]*?<\/title>/i, "")
    .replace(/\n?\s*<meta\s+name="description"[^>]*>/gi, "")
    .replace(/\n?\s*<meta\s+property="og:[^"]*"[^>]*>/gi, "")
    .replace(/\n?\s*<meta\s+name="twitter:[^"]*"[^>]*>/gi, "");
}

const baseTemplate = stripPlaceholderHead(template);

let written = 0;
const failures = [];

for (const route of PRERENDER_ROUTES) {
  try {
    const { html, head } = await renderRoute(route);

    if (!html || html.length < 500) {
      throw new Error(`rendered body is suspiciously small (${html?.length ?? 0} bytes)`);
    }

    const page = baseTemplate
      .replace("</head>", `  ${head}\n  </head>`)
      .replace('<div id="root"></div>', `<div id="root">${html}</div>`);

    // "/" maps to dist/index.html; "/json-formatter" to dist/json-formatter/index.html
    // so that a static host serves it without any rewrite rule.
    const outDir = route === "/" ? DIST : join(DIST, route);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), page);
    written++;
  } catch (error) {
    failures.push(`  ${route}: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error(`\n✗ prerender failed for ${failures.length} route(s):\n${failures.join("\n")}\n`);
  process.exit(1);
}

/*
 * A standalone 404 document, served with a real 404 status by _redirects /
 * vercel.json. Without it a static host answers unknown URLs with 200 + the SPA
 * shell, which Google reports as a soft 404 and which lets junk URLs accumulate
 * in the index.
 */
const notFound = await renderRoute("/__not_found__");
writeFileSync(
  join(DIST, "404.html"),
  baseTemplate
    .replace("</head>", `  ${notFound.head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${notFound.html}</div>`),
);

console.log(`✓ prerender: ${written} static pages + 404.html`);
