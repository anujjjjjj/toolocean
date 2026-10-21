/**
 * Fails the build if a prerendered page is missing the Umami tracker.
 *
 * index.html is the shell for every page. The website id is UMAMI_WEBSITE_ID
 * in src/lib/umami.ts. This checks that the built HTML still carries the same
 * deferred tag after Vite and prerender.
 *
 *   node scripts/check-umami.mjs
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const EXPECTED_ID = "485af8d4-6328-4f5c-adb8-7c5eeabd81cb";

function umamiTag(html) {
  return html.match(/<script\b[^>]*\bsrc="https:\/\/cloud\.umami\.is\/script\.js"[^>]*>/i)?.[0] ?? null;
}

function fail(message) {
  console.error(`\n✗ umami: ${message}\n`);
  process.exit(1);
}

if (!existsSync(DIST)) {
  fail("dist/ not found. Run the client build and prerender first.");
}

const sourceTs = readFileSync(join(ROOT, "src/lib/umami.ts"), "utf8");
const constantId = sourceTs.match(/export const UMAMI_WEBSITE_ID = "([^"]+)"/)?.[1];
if (constantId !== EXPECTED_ID) {
  fail(`UMAMI_WEBSITE_ID is ${constantId ?? "missing"}, expected ${EXPECTED_ID}`);
}

const sourceHtml = readFileSync(join(ROOT, "index.html"), "utf8");
const sourceTag = umamiTag(sourceHtml);
if (!sourceTag) fail("index.html is missing the Umami script tag");
if (!sourceTag.includes(`data-website-id="${EXPECTED_ID}"`)) {
  fail("index.html data-website-id does not match UMAMI_WEBSITE_ID");
}
if (!/\bdefer\b/.test(sourceTag) || /\basync\b/.test(sourceTag)) {
  fail("index.html Umami script must be deferred and not async");
}
if (!sourceTag.includes('data-domains="toolocean.co"')) {
  fail('index.html Umami script must set data-domains="toolocean.co"');
}

const moduleAt = sourceHtml.indexOf('<script type="module"');
const umamiAt = sourceHtml.indexOf("https://cloud.umami.is/script.js");
if (moduleAt === -1 || umamiAt < moduleAt) {
  fail("Umami script must follow the app module in index.html");
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets" || entry.name === "fonts" || entry.name === "og") continue;
      walk(full, out);
    } else if (entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(DIST);
if (files.length === 0) fail("dist/ has no HTML files");

const bad = [];
for (const file of files) {
  const html = readFileSync(file, "utf8");
  const tag = umamiTag(html);
  const ok =
    tag &&
    tag.includes(`data-website-id="${EXPECTED_ID}"`) &&
    /\bdefer\b/.test(tag) &&
    tag.includes('data-domains="toolocean.co"') &&
    html.indexOf("https://cloud.umami.is/script.js") > html.indexOf('type="module"');
  if (!ok) bad.push(relative(ROOT, file));
}

if (bad.length > 0) {
  console.error(`\n✗ umami script missing or wrong in ${bad.length} HTML file(s):`);
  for (const file of bad.slice(0, 20)) console.error(`  ${file}`);
  process.exit(1);
}

console.log(`✓ umami: ${files.length} HTML files include the deferred script (${EXPECTED_ID})`);
