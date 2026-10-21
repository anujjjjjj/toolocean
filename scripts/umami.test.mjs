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
  UMAMI_SHARE_API,
  UMAMI_SHARE_URL,
  UMAMI_WEBSITE_ID,
  fetchVisitorLabel,
  isUmamiConfigured,
  trackUmamiPageview,
  umamiShareSlug,
  umamiShareUrl,
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

test("the committed share page is the home-page visitor source", () => {
  assert.equal(UMAMI_SHARE_URL, "https://cloud.umami.is/share/zgbDWbwKtfAOBwIa");
  assert.equal(umamiShareUrl(), UMAMI_SHARE_URL);
  assert.equal(umamiShareSlug(UMAMI_SHARE_URL), "zgbDWbwKtfAOBwIa");
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

test("a share page yields its slug, and a bare or insecure URL does not", () => {
  assert.equal(umamiShareSlug(SHARE), "tok123");
  assert.equal(umamiShareSlug("https://cloud.umami.is/share/abc/stats"), "abc");
  assert.equal(umamiShareSlug("http://cloud.umami.is/share/tok123/toolocean"), null);
  assert.equal(umamiShareSlug("https://cloud.umami.is/"), null);
  assert.equal(umamiShareSlug("not a url"), null);
});

test("stats are read with the share token, not the tracker script", async () => {
  const calls = [];
  const label = await fetchVisitorLabel(
    UMAMI_SHARE_URL,
    async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith("/share/zgbDWbwKtfAOBwIa")) {
        return new Response(JSON.stringify({ token: "jwt", websiteId: UMAMI_WEBSITE_ID }), { status: 200 });
      }
      return new Response(JSON.stringify({ visitors: 12408, comparison: { visitors: 10 } }), { status: 200 });
    },
    1_700_000_000_000,
  );
  assert.equal(label, "12,408 visitors");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, `${UMAMI_SHARE_API}/share/zgbDWbwKtfAOBwIa`);
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(
    calls[1].url,
    `${UMAMI_SHARE_API}/websites/${UMAMI_WEBSITE_ID}/stats?startAt=0&endAt=1700000000000`,
  );
  assert.equal(calls[1].init.headers["x-umami-share-token"], "jwt");
  assert.equal(calls[1].init.headers["x-umami-share-context"], "1");
  assert.equal(calls[1].init.credentials, "omit");
  assert.equal(calls.some((call) => call.url.includes("cloud.umami.is/script.js")), false);
});

test("the older nested visitor payload still formats", async () => {
  const label = await fetchVisitorLabel(SHARE, async (url) => {
    if (String(url).includes("/share/")) {
      return new Response(JSON.stringify({ token: "jwt", websiteId: "site" }), { status: 200 });
    }
    return new Response(JSON.stringify({ visitors: { value: 100, prev: 1 } }), { status: 200 });
  });
  assert.equal(label, "100 visitors");
});

test("zero and missing counts render nothing", () => {
  assert.equal(visitorLabel({ visitors: 0 }), null);
  assert.equal(visitorLabel({ visitors: 1 }), "1 visitor");
  assert.equal(visitorLabel({ visitors: { value: 0 } }), null);
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
  assert.equal(visitorLabel({ pageviews: 5000 }), null);
  assert.equal(visitorLabel({ visitors: "12408" }), null);
  assert.equal(visitorLabel(null), null);
});

test("a share payload without a token renders nothing", async () => {
  const label = await fetchVisitorLabel(SHARE, async () => new Response(JSON.stringify({ websiteId: "site" }), { status: 200 }));
  assert.equal(label, null);
});
