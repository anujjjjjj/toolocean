/**
 * Visitor count from a mocked Umami share-stats response.
 *
 *   node --experimental-strip-types --test scripts/umami.test.mjs
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchVisitorLabel, isUmamiConfigured, umamiStatsUrl, visitorLabel } from "../src/lib/umami.ts";

const SHARE = "https://cloud.umami.is/share/tok123/toolocean";

test("an unset website id does not enable the script or the bar", () => {
  assert.equal(isUmamiConfigured(), false);
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
