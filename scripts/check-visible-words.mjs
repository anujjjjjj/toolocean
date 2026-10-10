/**
 * Visible-copy budget for the Paper tool shell.
 *
 * Counts words in <main> that a reader sees with every <details> closed:
 * summaries stay, detail bodies do not, and the workbench, related-tools
 * block, nav, and screen-reader-only text are excluded. Pages without
 * data-lean-shell are skipped. An allowlist records slugs that need more
 * than the budget without dropping any indexable sentence.
 *
 *   node scripts/check-visible-words.mjs
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");
const ALLOW = resolve(ROOT, "scripts/visible-words-allowlist.json");
const BUDGET = 180;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === "index.html") out.push(full);
  }
  return out;
}

function routeFromFile(file) {
  const rel = relative(DIST, dirname(file));
  return rel === "" ? "/" : `/${rel}`;
}

function removeTagAt(html, tagStart) {
  const tagMatch = /^<([a-zA-Z0-9]+)/.exec(html.slice(tagStart));
  if (!tagMatch) return html;
  const tag = tagMatch[1];
  let depth = 0;
  let j = tagStart;
  while (j < html.length) {
    const nextOpen = html.indexOf(`<${tag}`, j);
    const nextClose = html.indexOf(`</${tag}`, j);
    if (nextClose === -1) return html.slice(0, tagStart);
    const isOpen =
      nextOpen !== -1 &&
      nextOpen < nextClose &&
      /[\s>/]/.test(html[nextOpen + tag.length + 1] ?? ">");
    if (isOpen) {
      const end = html.indexOf(">", nextOpen);
      if (html[end - 1] !== "/") depth += 1;
      j = end + 1;
      continue;
    }
    depth -= 1;
    const end = html.indexOf(">", nextClose);
    j = end + 1;
    if (depth === 0) break;
  }
  return html.slice(0, tagStart) + " " + html.slice(j);
}

function removeMatching(html, pattern) {
  let current = html;
  let guard = 0;
  while (guard < 80) {
    const match = pattern.exec(current);
    pattern.lastIndex = 0;
    if (!match || match.index === undefined) break;
    const tagStart = current.lastIndexOf("<", match.index);
    if (tagStart < 0) break;
    const next = removeTagAt(current, tagStart);
    if (next === current) break;
    current = next;
    guard += 1;
  }
  return current;
}

/** Keep <summary>, drop the rest of each details element. */
function stripClosedDetails(html) {
  let out = "";
  let i = 0;
  while (i < html.length) {
    const start = html.indexOf("<details", i);
    if (start === -1) {
      out += html.slice(i);
      break;
    }
    out += html.slice(i, start);
    const openEnd = html.indexOf(">", start);
    const after = html.slice(openEnd + 1);
    const summary = after.match(/^\s*<summary\b[^>]*>[\s\S]*?<\/summary>/i);
    if (summary) out += summary[0];
    const removed = removeTagAt(html, start);
    const consumed = html.length - removed.length;
    i = start + Math.max(consumed, 1);
    if (consumed <= 0) break;
  }
  return out;
}

function visibleWords(html) {
  const main = html.match(/<main\b[^>]*>[\s\S]*<\/main>/i)?.[0] ?? "";
  let body = main
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  body = removeMatching(body, /<section\b[^>]*\bid="related-tools"/i);
  body = removeMatching(body, /<section\b[^>]*\bid="tool-workbench"/i);
  body = removeMatching(body, /<nav\b/i);
  body = body.replace(/<[^>]*class="[^"]*\bsr-only\b[^"]*"[^>]*>[\s\S]*?<\/[a-z0-9]+>/gi, " ");
  body = stripClosedDetails(body);
  const text = body
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

if (!existsSync(DIST)) {
  console.error("dist/ is missing.");
  process.exit(1);
}

const allow = existsSync(ALLOW) ? JSON.parse(readFileSync(ALLOW, "utf8")) : { pages: {} };
const rows = [];
for (const file of walk(DIST)) {
  const html = readFileSync(file, "utf8");
  if (!html.includes("data-lean-shell")) continue;
  const words = visibleWords(html);
  rows.push({ route: routeFromFile(file), words });
}

rows.sort((a, b) => b.words - a.words || a.route.localeCompare(b.route));
const failures = rows.filter((row) => row.words > BUDGET && !allow.pages?.[row.route]);

console.log("\nroute".padEnd(42) + "words");
for (const row of rows) {
  const mark = row.words > BUDGET ? (allow.pages?.[row.route] ? " ~" : " !") : "  ";
  console.log(`${mark}${row.route.padEnd(40)} ${row.words}`);
}

if (process.argv.includes("--write-allowlist")) {
  const pages = {};
  for (const row of rows.filter((row) => row.words > BUDGET)) pages[row.route] = { words: row.words };
  writeFileSync(ALLOW, JSON.stringify({ note: "Lean tool pages allowed over 180 visible words.", budget: BUDGET, pages }, null, 2) + "\n");
  console.log(`Wrote ${Object.keys(pages).length} page(s) over ${BUDGET}.`);
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} lean page(s) exceed ${BUDGET} visible words and are not allowlisted.\n`);
  process.exit(1);
}

console.log(`\n✓ visible words: ${rows.length} lean page(s), budget ${BUDGET}`);
