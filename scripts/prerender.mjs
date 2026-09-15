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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

const TOOL_CONTENT_ELEMENT_ID = "tool-content";

const {
  renderRoute,
  PRERENDER_ROUTES,
  LANDING_ROUTES,
  STATIC_ROUTE_MODULES,
  TOOL_ROUTE_MODULE,
  LANDING_ROUTE_MODULE,
} = await import(pathToFileURL(join(ROOT, "dist-ssg", "entry-ssg.js")).href);

const template = readFileSync(join(DIST, "index.html"), "utf-8");

/*
 * Resource hints per route.
 *
 * Every page previously shipped the entry script and nothing else, so the
 * browser could not know it needed the route chunk until the entry had run:
 * HTML -> entry -> route chunk -> tool chunk -> shared deps, four requests deep
 * before anything could mount.
 *
 * The route shell is preloaded, because it is needed to hydrate what is already
 * on screen. The tool chunk is only prefetched: ToolWorkbench deliberately mounts
 * the tool after an effect, so it is not on the critical path, and preloading it
 * would have it compete with the fonts and the route chunk for bandwidth during
 * LCP — making Core Web Vitals worse, not better.
 */
const MANIFEST_PATH = join(DIST, ".vite", "manifest.json");
if (!existsSync(MANIFEST_PATH)) {
  throw new Error(
    `Vite manifest missing at ${MANIFEST_PATH}. Set build.manifest = true in vite.config.ts — ` +
      `without it no route can emit preload hints and every page falls back to a serial waterfall.`,
  );
}
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));

/** A chunk plus every chunk it statically imports, deduped. */
function chunkClosure(entry, seen = new Set()) {
  const chunk = manifest[entry];
  if (!chunk || seen.has(entry)) return seen;
  seen.add(entry);
  for (const imported of chunk.imports ?? []) chunkClosure(imported, seen);
  return seen;
}

function assetsFor(entry) {
  return [...chunkClosure(entry)]
    .map((key) => manifest[key]?.file)
    .filter(Boolean)
    .map((file) => `/${file}`);
}

/*
 * Resolve a source module to its manifest key.
 *
 * Rollup keys a chunk by its source path only when that path is an explicit
 * input. A module reached from more than one place becomes a shared chunk keyed
 * as `_<Name>-<hash>.js` instead, which is what happens to ToolRoutePage — so a
 * plain manifest[moduleId] lookup misses the single most important route on the
 * site.
 */
function resolveManifestKey(moduleId) {
  if (manifest[moduleId]) return moduleId;
  const base = moduleId.split("/").pop().replace(/\.[jt]sx?$/, "");
  return Object.keys(manifest).find((key) => manifest[key].name === base) ?? null;
}

/*
 * Modules that are statically imported by the app entry rather than lazily.
 * Their code is already inside the entry script the template loads, so there is
 * nothing extra to preload and an empty hint list is the correct answer.
 */
const ENTRY_BUNDLED = new Set(["src/pages/Index.tsx"]);

/** Entry chunk assets are already in the template's <script>; don't repeat them. */
const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry);
const entryAssets = new Set(entryKey ? assetsFor(entryKey) : []);

const toolSlugs = new Set(
  PRERENDER_ROUTES.filter((route) => route !== "/").map((route) => route.slice(1)),
);

function moduleForRoute(route) {
  if (STATIC_ROUTE_MODULES[route]) return STATIC_ROUTE_MODULES[route];
  if (LANDING_ROUTES.includes(route)) return LANDING_ROUTE_MODULE;
  return toolSlugs.has(route.slice(1)) ? TOOL_ROUTE_MODULE : null;
}

/*
 * Validate the whole route->module map up front.
 *
 * A silent miss here is the worst outcome available: the build still succeeds,
 * every page loses its preload hints, and the site quietly returns to the
 * waterfall it was supposed to have escaped. So drift fails the build loudly,
 * once, instead of degrading 136 pages invisibly.
 */
const unresolvable = [...new Set([
  ...Object.values(STATIC_ROUTE_MODULES),
  TOOL_ROUTE_MODULE,
  LANDING_ROUTE_MODULE,
])].filter((moduleId) => !ENTRY_BUNDLED.has(moduleId) && !resolveManifestKey(moduleId));

if (unresolvable.length > 0) {
  throw new Error(
    `src/lib/routeModules.ts points at ${unresolvable.length} module(s) with no chunk in the Vite ` +
      `manifest:\n  ${unresolvable.join("\n  ")}\n` +
      `Fix the path, or add it to ENTRY_BUNDLED if it is now statically imported.`,
  );
}

function preloadsForRoute(route) {
  const moduleId = moduleForRoute(route);
  if (!moduleId || ENTRY_BUNDLED.has(moduleId)) return "";

  const key = resolveManifestKey(moduleId);
  const assets = assetsFor(key).filter((href) => !entryAssets.has(href));

  return assets
    .map((href) => `<link rel="modulepreload" crossorigin href="${href}" />`)
    .join("\n  ");
}

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
    const { html, head, toolContent } = await renderRoute(route);

    if (!html || html.length < 500) {
      throw new Error(`rendered body is suspiciously small (${html?.length ?? 0} bytes)`);
    }

    const preloads = preloadsForRoute(route);
    /*
     * The resolved content, inlined so hydration can read it synchronously.
     *
     * Without it ToolRoutePage would have to import the resolver, which pulls
     * every tool's copy into the route chunk. The payload duplicates text that
     * is already in the body, so it compresses almost to nothing against it.
     *
     * `<` is escaped for the same reason the JSON-LD is: a closing tag inside a
     * string would otherwise end the script element early.
     */
    const contentScript = toolContent
      ? `<script type="application/json" id="${TOOL_CONTENT_ELEMENT_ID}">` +
        `${toolContent.replace(/</g, "\\u003c")}</script>`
      : "";

    const page = baseTemplate
      .replace("</head>", `  ${head}\n  ${preloads}\n  ${contentScript}\n  </head>`)
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
