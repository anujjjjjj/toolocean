/**
 * Umami script tag in the document shell, and the visitor-count helper.
 *
 *   node --experimental-strip-types --test scripts/umami.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  UMAMI_DOMAINS,
  UMAMI_SCRIPT_SRC,
  UMAMI_WEBSITE_ID,
  fetchVisitorLabel,
  isUmamiConfigured,
  trackUmamiPageview,
  umamiShareUrl,
  umamiStatsUrl,
  umamiWebsiteId,
  visitorLabel,
} from "../src/lib/umami.ts";

const SHARE = "https://cloud.umami.is/share/tok123/toolocean";
const EXPECTED_ID = "485af8d4-6328-4f5c-adb8-7c5eeabd81cb";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function umamiTag(html) {
  return html.match(/<script\b[^>]*\bsrc="https:\/\/cloud\.umami\.is\/script\.js"[^>]*>/i)?.[0] ?? null;
}

test("root document renders the deferred Umami script with the website id", () => {
  assert.equal(UMAMI_WEBSITE_ID, EXPECTED_ID);
  assert.equal(umamiWebsiteId(), EXPECTED_ID);
  assert.equal(isUmamiConfigured(), true);
  assert.equal(UMAMI_SCRIPT_SRC, "https://cloud.umami.is/script.js");
  assert.equal(UMAMI_DOMAINS, "toolocean.co");

  const html = readFileSync(join(ROOT, "index.html"), "utf8");
  const tag = umamiTag(html);
  assert.ok(tag, "index.html is missing the Umami script");
  assert.match(tag, /\bdefer\b/);
  assert.doesNotMatch(tag, /\basync\b/);
  assert.match(tag, new RegExp(`data-website-id="${UMAMI_WEBSITE_ID}"`));
  assert.match(tag, new RegExp(`data-domains="${UMAMI_DOMAINS}"`));
  assert.match(tag, /data-do-not-track="true"/);

  const moduleAt = html.indexOf('<script type="module"');
  const umamiAt = html.indexOf(UMAMI_SCRIPT_SRC);
  assert.ok(moduleAt !== -1 && umamiAt > moduleAt, "Umami script must follow the app module");
});

test("visitor count stays off without a share URL", () => {
  assert.equal(umamiShareUrl(), undefined);
});

test("the landing view is left to the script and later routes are tracked", () => {
  const calls = [];
  globalThis.window = {
    umami: {
      track(update) {
        calls.push(update({ url: "/previous", title: "Previous" }));
      },
    },
  };
  globalThis.document = {};
  try {
    trackUmamiPageview("/json-formatter", "JSON Formatter");
    trackUmamiPageview("/pdf-merge", "PDF Merge");
    assert.deepEqual(calls, [{ url: "/pdf-merge", title: "PDF Merge" }]);
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});

test("share page URL becomes that token's stats API", () => {
  const url = new URL(umamiStatsUrl(SHARE, 1_700_000_000_000));
  assert.equal(url.origin, "https://cloud.umami.is");
  assert.equal(url.pathname, "/api/share/tok123/stats");
  assert.equal(url.searchParams.get("startAt"), "0");
  assert.equal(url.searchParams.get("endAt"), "1700000000000");
});

test("an existing stats URL still uses the share token", () => {
  const url = umamiStatsUrl("https://cloud.umami.is/api/share/abc/stats");
  assert.equal(new URL(url).pathname, "/api/share/abc/stats");
});

test("non-https and token-less URLs are ignored", () => {
  assert.equal(umamiStatsUrl("http://cloud.umami.is/share/tok123/toolocean"), null);
  assert.equal(umamiStatsUrl("https://cloud.umami.is/"), null);
  assert.equal(umamiStatsUrl("not a url"), null);
});

test("mocked stats response formats the visitor line", async () => {
  let requested = "";
  const label = await fetchVisitorLabel(SHARE, async (url) => {
    requested = String(url);
    return new Response(JSON.stringify({ visitors: { value: 12408, prev: 100 } }), { status: 200 });
  });
  assert.match(requested, /\/api\/share\/tok123\/stats\?/);
  assert.equal(label, "12,408 visitors");
});

test("a count under 100 renders nothing", () => {
  assert.equal(visitorLabel({ visitors: { value: 99 } }), null);
  assert.equal(visitorLabel({ visitors: { value: 100 } }), "100 visitors");
});

test("a failed response renders nothing", async () => {
  const label = await fetchVisitorLabel(SHARE, async () => new Response("no", { status: 500 }));
  assert.equal(label, null);
});

test("a thrown request renders nothing", async () => {
  const label = await fetchVisitorLabel(SHARE, async () => {
    throw new Error("offline");
  });
  assert.equal(label, null);
});

test("a payload without a numeric visitor count renders nothing", () => {
  assert.equal(visitorLabel({ pageviews: { value: 5000 } }), null);
  assert.equal(visitorLabel({ visitors: { value: "12408" } }), null);
  assert.equal(visitorLabel(null), null);
});
