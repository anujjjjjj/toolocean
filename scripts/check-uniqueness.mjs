/**
 * Page-uniqueness gate.
 *
 * Measures 6-word shingles in each prerendered page's <main>, after dropping
 * header, footer, nav, related tools, and the repeated footer call-to-action.
 * The workbench and the article stay in the measurement. A shingle shared with
 * another page does not count as unique.
 *
 * A shingle is unique when it appears on only one page. Score = unique / total.
 * Pages under 40% fail unless scripts/uniqueness-allowlist.json records the
 * same content hash. That keeps the current thin templates green and forces a
 * new or rewritten page to clear the bar.
 *
 *   node scripts/check-uniqueness.mjs
 *   node scripts/check-uniqueness.mjs --write-allowlist
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "dist");
const ALLOWLIST_PATH = resolve(ROOT, "scripts/uniqueness-allowlist.json");
const THRESHOLD = 0.4;
const SHINGLE = 6;

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

/** Drop one element, including nested copies of the same tag name. */
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
      const selfClosing = html[end - 1] === "/";
      if (!selfClosing) depth += 1;
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
  while (guard < 50) {
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

function measuredText(html) {
  const main = html.match(/<main\b[^>]*>[\s\S]*<\/main>/i)?.[0] ?? "";
  let body = main
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  body = removeMatching(body, /<section\b[^>]*\bid="related-tools"/i);
  body = removeMatching(body, /<section\b[^>]*aria-labelledby="footer-cta-heading"/i);
  body = removeMatching(body, /<nav\b/i);
  body = removeMatching(body, /<footer\b/i);
  body = removeMatching(body, /<header\b/i);
  return body
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

function shingles(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const out = [];
  for (let i = 0; i + SHINGLE <= words.length; i++) out.push(words.slice(i, i + SHINGLE).join(" "));
  return out;
}

function hashText(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

if (!existsSync(DIST)) {
  console.error("dist/ is missing. Run the prerender before check:uniqueness.");
  process.exit(1);
}

const pages = walk(DIST)
  .map((file) => {
    const route = routeFromFile(file);
    const text = measuredText(readFileSync(file, "utf8"));
    return { route, text, hash: hashText(text), shingles: shingles(text) };
  })
  .filter((page) => page.route !== "/404");

const owners = new Map();
for (const page of pages) {
  for (const shingle of new Set(page.shingles)) {
    owners.set(shingle, (owners.get(shingle) ?? 0) + 1);
  }
}

const rows = pages.map((page) => {
  const total = page.shingles.length;
  const unique = page.shingles.filter((shingle) => owners.get(shingle) === 1).length;
  const score = total === 0 ? 0 : unique / total;
  return { route: page.route, hash: page.hash, score, total, unique };
});

rows.sort((a, b) => a.score - b.score || a.route.localeCompare(b.route));

const allowlist = existsSync(ALLOWLIST_PATH)
  ? JSON.parse(readFileSync(ALLOWLIST_PATH, "utf8"))
  : { pages: {} };

const below = rows.filter((row) => row.score < THRESHOLD);

if (process.argv.includes("--write-allowlist")) {
  const pagesOut = {};
  for (const row of below) {
    pagesOut[row.route] = { hash: row.hash, score: Number(row.score.toFixed(4)) };
  }
  writeFileSync(
    ALLOWLIST_PATH,
    JSON.stringify(
      {
        note: "Pages under 40% unique 6-word shingles when this file was written. A changed hash must clear 40%.",
        threshold: THRESHOLD,
        pages: pagesOut,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Wrote ${below.length} page(s) under ${THRESHOLD} to ${ALLOWLIST_PATH}`);
}

console.log("\nroute".padEnd(42) + "score".padEnd(8) + "unique/total");
for (const row of rows) {
  const mark = row.score < THRESHOLD ? " !" : "  ";
  console.log(
    `${mark}${row.route.padEnd(40)} ${(row.score * 100).toFixed(1).padStart(5)}%  ${row.unique}/${row.total}`,
  );
}

const failures = [];
for (const row of below) {
  const allowed = allowlist.pages?.[row.route];
  if (allowed && allowed.hash === row.hash) continue;
  failures.push(row);
}

console.log(
  `\n${below.length} of ${rows.length} pages are under ${Math.round(THRESHOLD * 100)}% unique. ` +
    `${below.length - failures.length} match the allowlist. ${failures.length} fail.`,
);

if (failures.length > 0 && !process.argv.includes("--write-allowlist")) {
  console.error(
    "\n✗ These pages are under 40% unique and are not allowlisted at this content hash:\n" +
      failures
        .map((row) => `  ${row.route}  ${(row.score * 100).toFixed(1)}%  hash ${row.hash}`)
        .join("\n") +
      "\n",
  );
  process.exit(1);
}

console.log("✓ uniqueness");
