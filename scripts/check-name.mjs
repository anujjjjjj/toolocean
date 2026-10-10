/**
 * Fails the build if a personal name or handle is present in prerendered HTML.
 *
 * The site is published as ToolOcean. Git history is not scanned.
 *
 *   node scripts/check-name.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");

const BANNED = [
  { label: "Anuj", pattern: /anuj/i },
  { label: "Kabra", pattern: /kabra/i },
  { label: "anujjjjjj", pattern: /anujjjjjj/i },
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const files = walk(DIST);
const hits = [];

for (const file of files) {
  const html = readFileSync(file, "utf8");
  for (const banned of BANNED) {
    if (banned.pattern.test(html)) {
      hits.push(`${relative(ROOT, file)} contains ${banned.label}`);
    }
  }
}

if (hits.length > 0) {
  console.error(`✗ personal name in dist HTML (${hits.length}):`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}

console.log(`✓ name check: ${files.length} HTML files, no personal name`);
