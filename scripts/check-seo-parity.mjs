/**
 * Compare SEO-bearing head tags between a baseline dist and the current dist.
 *
 * Asset hashes, font preloads, and the theme boot script are allowed to differ.
 * Title, description, canonical, robots, Open Graph, Twitter, and JSON-LD must match.
 *
 *   node scripts/check-seo-parity.mjs /path/to/baseline-dist
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");
const BASE = resolve(process.argv[2] ?? "");

if (!BASE || !existsSync(BASE)) {
  console.error("Pass the baseline dist directory.");
  process.exit(1);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets" || entry.name === "fonts") continue;
      walk(full, out);
    } else if (entry.name === "index.html") out.push(full);
  }
  return out;
}

function route(root, file) {
  const rel = relative(root, dirname(file));
  return rel === "" ? "/" : `/${rel}`;
}

function seoBlock(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  const take = (re) => [...head.matchAll(re)].map((match) => match[0].replace(/\s+/g, " ").trim()).sort();
  return {
    title: take(/<title\b[^>]*>[\s\S]*?<\/title>/gi),
    description: take(/<meta\b[^>]*name="description"[^>]*>/gi),
    canonical: take(/<link\b[^>]*rel="canonical"[^>]*>/gi),
    robots: take(/<meta\b[^>]*name="robots"[^>]*>/gi),
    og: take(/<meta\b[^>]*(?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/gi),
    jsonld: take(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi),
  };
}

const baseFiles = new Map(walk(BASE).map((file) => [route(BASE, file), file]));
const nextFiles = walk(DIST);
let mismatches = 0;
let compared = 0;

for (const file of nextFiles) {
  const key = route(DIST, file);
  const before = baseFiles.get(key);
  if (!before) {
    console.error("missing from baseline:", key);
    mismatches += 1;
    continue;
  }
  compared += 1;
  const a = seoBlock(readFileSync(before, "utf8"));
  const b = seoBlock(readFileSync(file, "utf8"));
  const fields = ["title", "description", "canonical", "robots", "og", "jsonld"];
  const bad = fields.filter((field) => JSON.stringify(a[field]) !== JSON.stringify(b[field]));
  if (bad.length) {
    mismatches += 1;
    console.error(key, bad.join(", "));
    for (const field of bad) {
      console.error("  baseline", field, a[field]);
      console.error("  current ", field, b[field]);
    }
  }
}

if (mismatches) {
  console.error(`\n✗ SEO parity: ${mismatches} page(s) differ (${compared} compared)`);
  process.exit(1);
}
console.log(`✓ SEO parity: ${compared} pages, title/description/canonical/robots/og/json-ld match`);
