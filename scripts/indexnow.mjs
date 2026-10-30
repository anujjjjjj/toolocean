/**
 * Ping IndexNow after a deploy. Not part of `npm run build`.
 *
 * The key is public by design: it is the file at the site root. This script
 * reads the committed public/<key>.txt whose body is the key (INDEXNOW_KEY
 * overrides it). It does not embed the key.
 *
 * `npm run indexnow` passes --all: every URL in the sitemap is submitted. That
 * is what .github/workflows/indexnow.yml runs after a production deploy of
 * main. See docs/INDEXNOW.md.
 *
 * Flags:
 *   --all      submit every sitemap URL (the npm script's default)
 *   --dry-run  print the payload summary and do not POST
 *   (neither)  submit only URLs whose <lastmod> changed since the last run,
 *              tracked in .indexnow-state.json (gitignored); `npm run indexnow:changed`
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "toolocean.co";
const STATE_PATH = resolve(ROOT, ".indexnow-state.json");
const KEY_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;
/** The committed key file. Its body is the key, served at https://toolocean.co/<key>.txt. */
const KEY_FILE = "654ba38f42abe57769c1a6ad9c1a742e.txt";
/** IndexNow accepts up to 10,000 URLs per POST. */
const BATCH = 10000;

function discoverKey() {
  if (process.env.INDEXNOW_KEY && KEY_PATTERN.test(process.env.INDEXNOW_KEY)) {
    return process.env.INDEXNOW_KEY;
  }
  const publicDir = resolve(ROOT, "public");
  const names = readdirSync(publicDir);
  // The committed file first, then any other <key>.txt whose body matches its name.
  names.sort((a, b) => (a === KEY_FILE ? -1 : b === KEY_FILE ? 1 : 0));
  for (const name of names) {
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
const foreign = urlList.filter((loc) => new URL(loc).host !== HOST);
if (foreign.length > 0) {
  console.error(`IndexNow: ${foreign.length} sitemap URL(s) are not on ${HOST}, e.g. ${foreign[0]}`);
  process.exit(1);
}
const payload = (list) => ({
  host: HOST,
  key,
  keyLocation: `https://${HOST}/${key}.txt`,
  urlList: list,
});

console.log(
  `IndexNow: ${urlList.length} URL(s)${all ? " (--all)" : ""}${dryRun ? " (dry run)" : ""}`,
);

if (dryRun) {
  console.log(
    JSON.stringify(
      { ...payload(urlList.slice(0, 5)), key: "(redacted in dry-run log)", total: urlList.length },
      null,
      2,
    ),
  );
  process.exit(0);
}

let ok = true;
for (let start = 0; start < urlList.length; start += BATCH) {
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload(urlList.slice(start, start + BATCH))),
  });
  console.log(`IndexNow response: ${response.status} ${response.statusText}`);
  const text = await response.text();
  if (text) console.log(text.slice(0, 500));
  // 200 and 202 are both acceptance. 202 means the key is still being verified.
  if (!(response.ok || response.status === 202)) ok = false;
}

if (ok) {
  const next = { ...previous };
  for (const url of changed) next[url.loc] = url.lastmod;
  writeFileSync(STATE_PATH, JSON.stringify(next, null, 2) + "\n");
  console.log(`Wrote ${STATE_PATH}`);
} else {
  process.exit(1);
}
