/**
 * Build-time guard for the tool catalog.
 *
 * Every tool is served from a flat, root-level slug (/json-formatter), so slugs
 * must be globally unique. A collision would silently make one of the two tools
 * unreachable, which is exactly the class of bug that is invisible in review and
 * obvious in production. Runs before every build.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const catalogSource = readFileSync(resolve(ROOT, "src/data/toolCatalog.ts"), "utf-8");
const categoryTools = [...catalogSource.matchAll(/\{ id: "([^"]+)", category: "([^"]+)"/g)].map(
  ([, id, category]) => ({ id, category }),
);

const devTools = JSON.parse(readFileSync(resolve(ROOT, "src/data/tools.json"), "utf-8")).tools.map(
  (tool) => ({ id: tool.id, category: "dev" }),
);

const all = [...devTools, ...categoryTools];

const seen = new Map();
const collisions = [];
for (const tool of all) {
  if (seen.has(tool.id)) {
    collisions.push(`  ${tool.id}  (${seen.get(tool.id)} + ${tool.category})`);
  } else {
    seen.set(tool.id, tool.category);
  }
}

if (collisions.length > 0) {
  console.error(
    `\n✗ Tool slug collision — these ids resolve to the same root URL:\n${collisions.join("\n")}\n\n` +
      `Give one of each pair a distinct id, or cross-list it via CROSS_LISTED in src/data/toolCatalog.ts.\n`,
  );
  process.exit(1);
}

// Guard against a tool existing in the catalog but having no page content source.
const seoSource = readFileSync(resolve(ROOT, "src/data/toolSeo.ts"), "utf-8");
const seoBody = seoSource.slice(seoSource.indexOf("export const toolSeoData"));
const seoKeys = new Set([...seoBody.matchAll(/^ {2}"([^"]+)":\s*\{/gm)].map(([, key]) => key));

const missingSeo = all.filter(
  (tool) => !seoKeys.has(tool.id) && ![...seoKeys].some((key) => key.endsWith(`/${tool.id}`)),
);

if (missingSeo.length > 0) {
  console.error(
    `\n✗ ${missingSeo.length} tool(s) have no entry in src/data/toolSeo.ts, so their page would fall back to a bare name:\n` +
      missingSeo.map((tool) => `  ${tool.id}`).join("\n") +
      "\n",
  );
  process.exit(1);
}

console.log(`✓ catalog: ${all.length} tools, unique slugs, all have SEO content`);
