/**
 * Ping IndexNow after a deploy. Not part of `npm run build`.
 *
 * The key is public by design: it is the file at the site root. This script
 * reads INDEXNOW_KEY, or the committed public/<key>.txt whose body is the key.
 * It does not embed the key.
 *
 * Default: submit sitemap URLs whose <lastmod> changed since the last run.
 * State is written to .indexnow-state.json (gitignored).
 * --all submits every URL in the sitemap.
 * --dry-run prints the payload and does not POST.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "toolocean.co";
const STATE_PATH = resolve(ROOT, ".indexnow-state.json");
const KEY_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;

function discoverKey() {
  if (process.env.INDEXNOW_KEY && KEY_PATTERN.test(process.env.INDEXNOW_KEY)) {
    return process.env.INDEXNOW_KEY;
  }
  const publicDir = resolve(ROOT, "public");
  for (const name of readdirSync(publicDir)) {
    if (!name.endsWith(".txt")) continue;
    const key = name.slice(0, -".txt".length);
    if (!KEY_PATTERN.test(key)) continue;
    const body = readFileSync(resolve(publicDir, name), "utf8").trim();
    if (body === key) return key;
  }
  return null;
}

function loadSitemap() {
  const candidates = [
    resolve(ROOT, "public/sitemap.xml"),
    resolve(ROOT, "dist/sitemap.xml"),
  ];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) {
    console.error("No sitemap.xml in public/ or dist/. Run npm run sitemap first.");
    process.exit(1);
  }
  const xml = readFileSync(path, "utf8");
  const urls = [];
  for (const block of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
    const lastmod = block[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? "";
    if (loc) urls.push({ loc, lastmod });
  }
  return urls;
}

function loadState() {
  if (!existsSync(STATE_PATH)) return {};
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const all = args.has("--all");

const key = discoverKey();
if (!key) {
  console.error("No IndexNow key. Set INDEXNOW_KEY or commit public/<key>.txt containing the key.");
  process.exit(1);
}

const urls = loadSitemap();
const previous = loadState();
const changed = all ? urls : urls.filter((url) => previous[url.loc] !== url.lastmod);

if (changed.length === 0) {
  console.log("IndexNow: no lastmod changes. Nothing to submit.");
  process.exit(0);
}

const urlList = changed.map((url) => url.loc);
const body = {
  host: HOST,
  key,
  keyLocation: `https://${HOST}/${key}.txt`,
  urlList,
};

console.log(
  `IndexNow: ${urlList.length} URL(s)${all ? " (--all)" : ""}${dryRun ? " (dry run)" : ""}`,
);

if (dryRun) {
  console.log(JSON.stringify({ ...body, key: "(redacted in dry-run log)", urlList: urlList.slice(0, 5), total: urlList.length }, null, 2));
  process.exit(0);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});

console.log(`IndexNow response: ${response.status} ${response.statusText}`);
const text = await response.text();
if (text) console.log(text.slice(0, 500));

if (response.ok || response.status === 202) {
  const next = { ...previous };
  for (const url of changed) next[url.loc] = url.lastmod;
  writeFileSync(STATE_PATH, JSON.stringify(next, null, 2) + "\n");
  console.log(`Wrote ${STATE_PATH}`);
} else {
  process.exit(1);
}
