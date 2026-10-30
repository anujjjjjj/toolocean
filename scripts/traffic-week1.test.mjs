/**
 * Week-1 traffic work: the `tool-run` Umami event, the new landing pages, the
 * retitled tool pages, and the IndexNow wiring.
 *
 *   node --experimental-strip-types --test scripts/traffic-week1.test.mjs
 *
 * Page heads come from headForRoute in the SSR bundle (dist-ssg), which is
 * what scripts/prerender.mjs writes into every page. If dist-ssg is missing it
 * is built first. When dist/ exists, the prerendered HTML is checked as well.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import { DEDUPE_WINDOW_MS, createToolRunReporter } from "../src/lib/toolRunEvent.ts";
import { markToolSuccess, subscribeToolSuccess } from "../src/lib/toolResult.ts";
import { TOOL_RUN_EVENT, trackUmamiEvent, trackUmamiPageview } from "../src/lib/umami.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

const NEW_PAGES = ["/webp-to-jpg", "/heic-to-png", "/remove-password-from-bank-statement-pdf"];
const RETITLED = {
  "/images-to-pdf": "JPG to PDF",
  "/pdf-compress": "Compress PDF Online Free",
  "/image-format-converter": "PNG to JPG",
};
const CHECKED = [...NEW_PAGES, ...Object.keys(RETITLED), "/compress-image-to-20kb"];

/* ------------------------------------------------------------------ */
/* tool-run event                                                      */
/* ------------------------------------------------------------------ */

/** A browser-ish global: an EventTarget window with an optional Umami spy. */
function withBrowser({ umami = true } = {}, run) {
  const calls = [];
  const win = new EventTarget();
  if (umami) {
    win.umami = {
      track(...args) {
        calls.push(args);
      },
    };
  }
  globalThis.window = win;
  globalThis.document = {};
  try {
    return run(calls);
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
}

function subscribe(tool, slug, now) {
  return subscribeToolSuccess(
    createToolRunReporter({ tool, slug, send: trackUmamiEvent, eventName: TOOL_RUN_EVENT, now }),
  );
}

test("tool-run fires on a successful result with the tool id and route slug", () => {
  withBrowser({}, (calls) => {
    const stop = subscribe("image-format-converter", "image-format-converter");
    markToolSuccess({});
    stop();
    assert.deepEqual(calls, [["tool-run", { tool: "image-format-converter", slug: "image-format-converter" }]]);
  });
});

test("a landing-page embed reports its own slug and the embedded tool id", () => {
  withBrowser({}, (calls) => {
    const stop = subscribe("image-compressor", "compress-image-to-20kb");
    markToolSuccess();
    stop();
    assert.deepEqual(calls, [["tool-run", { tool: "image-compressor", slug: "compress-image-to-20kb" }]]);
  });
});

test("tool-run does not fire on a page view or on subscribing", () => {
  withBrowser({}, (calls) => {
    const stop = subscribe("pdf-unlock", "remove-password-from-bank-statement-pdf");
    trackUmamiPageview("/remove-password-from-bank-statement-pdf", "Unlock");
    trackUmamiPageview("/pdf-unlock", "Unlock PDF");
    stop();
    assert.equal(calls.filter(([name]) => name === "tool-run").length, 0);
  });
});

test("tool-run does not fire when the tool fails (no success signal)", () => {
  withBrowser({}, (calls) => {
    const stop = subscribe("pdf-unlock", "pdf-unlock");
    // A wrong password or undecodable file never calls markToolSuccess.
    window.dispatchEvent(new Event("error"));
    stop();
    assert.deepEqual(calls, []);
  });
});

test("one run fires at most once: repeated keys and rapid unkeyed repeats are dropped", () => {
  withBrowser({}, (calls) => {
    let clock = 10_000;
    const stop = subscribe("csv-to-json", "csv-to-json", () => clock);
    const output = '[{"a":1}]';
    markToolSuccess(output); // convert
    markToolSuccess(output); // download of the same output
    assert.equal(calls.length, 1);

    markToolSuccess("different output");
    assert.equal(calls.length, 2);

    markToolSuccess();
    markToolSuccess(); // a re-render signalling again in the same tick
    assert.equal(calls.length, 2, "unkeyed repeat inside the window after a keyed run is dropped");

    clock += DEDUPE_WINDOW_MS + 1;
    markToolSuccess();
    markToolSuccess();
    assert.equal(calls.length, 3);

    clock += DEDUPE_WINDOW_MS + 1;
    markToolSuccess();
    assert.equal(calls.length, 4, "a later run is a new event");
    stop();
  });
});

test("after unsubscribing, success signals send nothing", () => {
  withBrowser({}, (calls) => {
    const stop = subscribe("heic-to-jpg", "heic-to-png");
    stop();
    markToolSuccess();
    assert.deepEqual(calls, []);
  });
});

test("tool-run is a no-op without window.umami, and a throwing tracker is ignored", () => {
  withBrowser({ umami: false }, (calls) => {
    const stop = subscribe("pdf-compress", "pdf-compress");
    assert.doesNotThrow(() => markToolSuccess());
    stop();
    assert.deepEqual(calls, []);
  });
  // No browser at all (prerender / Node).
  assert.doesNotThrow(() => trackUmamiEvent("tool-run", { tool: "x", slug: "x" }));
  assert.doesNotThrow(() => markToolSuccess());

  withBrowser({}, () => {
    window.umami.track = () => {
      throw new Error("blocked");
    };
    assert.doesNotThrow(() => trackUmamiEvent("tool-run", { tool: "x", slug: "x" }));
  });
});

/**
 * Each required file tool signals success after it writes the result, inside
 * the try that produced it, never from the catch that reports a failure.
 */
const SUCCESS_PATHS = [
  ["src/components/tools/implementations/image/ImageFormatConverterTool.tsx", "a.click();", null],
  ["src/components/tools/implementations/image/ImageCompressorTool.tsx", "setNote(notes.join", null],
  ["src/components/tools/implementations/image/HeicToJpgTool.tsx", "converted += 1;", null],
  ["src/components/tools/implementations/pdf/ImagesToPdfTool.tsx", "a.click();", "} catch (error)"],
  ["src/components/tools/implementations/pdf/PdfCompressTool.tsx", "a.click();", null],
  ["src/components/tools/implementations/pdf/PdfUnlockTool.tsx", "downloadPdf(unlocked", "} catch (error)"],
];

test("the file tools call markToolSuccess on their success path", () => {
  for (const [file, after, beforeCatch] of SUCCESS_PATHS) {
    const source = read(file);
    assert.match(source, /import \{ markToolSuccess \} from "@\/lib\/toolResult";/, file);
    const start = source.indexOf(after);
    assert.ok(start >= 0, `${file}: success marker ${after} not found`);
    const call = source.indexOf("markToolSuccess(", start);
    assert.ok(call > start, `${file}: markToolSuccess must follow ${after}`);
    if (beforeCatch) {
      const catchAt = source.indexOf(beforeCatch, start);
      assert.ok(call < catchAt, `${file}: markToolSuccess must sit before the catch block`);
    }
  }
});

test("the workbench and the landing embed both subscribe to tool-run", () => {
  const hook = read("src/hooks/useWorkbenchAnalytics.ts");
  assert.match(hook, /useToolRunEvent\(tool, tool\)/);
  const landing = read("src/pages/LandingRoutePage.tsx");
  assert.match(landing, /useToolRunEvent\(tool, slug\)/);
  assert.match(landing, /<EmbeddedTool embed=\{page\.embed\} slug=\{page\.slug\} \/>/);
});

/* ------------------------------------------------------------------ */
/* Pages: sitemap, prerender routes, heads                             */
/* ------------------------------------------------------------------ */

function loadSsr() {
  const entry = join(ROOT, "dist-ssg", "entry-ssg.js");
  const stale =
    !existsSync(entry) || !readFileSync(entry, "utf8").includes("remove-password-from-bank-statement-pdf");
  if (stale) {
    execFileSync(process.execPath, [join(ROOT, "node_modules/vite/bin/vite.js"), "build", "--ssr", "src/entry-ssg.tsx", "--outDir", "dist-ssg", "--logLevel", "error"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
  return import(pathToFileURL(entry).href);
}

const ssr = await loadSsr();

function head(route) {
  const html = ssr.headForRoute(route);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.replace(/&amp;/g, "&");
  const description = html
    .match(/<meta name="description" content="([^"]*)"/)?.[1]
    ?.replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1]),
  );
  return { html, title, description, canonical, jsonLd };
}

test("new pages are in the generated sitemap and the prerender routes", () => {
  execFileSync(process.execPath, [join(ROOT, "scripts/generate-sitemap.mjs")], { cwd: ROOT, stdio: "ignore" });
  const sitemap = read("public/sitemap.xml");
  for (const route of NEW_PAGES) {
    assert.ok(sitemap.includes(`<loc>https://toolocean.co${route}</loc>`), `${route} missing from sitemap`);
    assert.ok(ssr.PRERENDER_ROUTES.includes(route), `${route} missing from PRERENDER_ROUTES`);
    assert.ok(ssr.LANDING_ROUTES.includes(route), `${route} is not a landing route`);
  }
});

test("every prerendered page has a unique title", () => {
  const seen = new Map();
  for (const route of ssr.PRERENDER_ROUTES) {
    const { title } = head(route);
    assert.ok(title, `${route} has no title`);
    assert.ok(!seen.has(title), `${route} repeats the title of ${seen.get(title)}: ${title}`);
    seen.set(title, route);
  }
});

test("new and retitled pages: title <= 60 chars, description 140-165, required title starts", () => {
  for (const route of CHECKED) {
    const { title, description } = head(route);
    assert.ok(title.length <= 60, `${route} title is ${title.length} chars: ${title}`);
    assert.ok(
      description.length >= 140 && description.length <= 165,
      `${route} description is ${description.length} chars`,
    );
  }
  for (const [route, start] of Object.entries(RETITLED)) {
    const { title, html } = head(route);
    assert.ok(title.startsWith(start), `${route} title should start with "${start}": ${title}`);
    assert.ok(html.includes(start), route);
  }
  assert.match(head("/compress-image-to-20kb").title, /exam/i);
  assert.match(head("/compress-image-to-20kb").description, /exam/i);
});

test("new pages carry FAQPage JSON-LD that matches their FAQs, and a self canonical", () => {
  for (const route of NEW_PAGES) {
    const { canonical, jsonLd } = head(route);
    assert.equal(canonical, `https://toolocean.co${route}`);
    const page = ssr.LANDING_PAGES.find((entry) => `/${entry.slug}` === route);
    const faq = jsonLd.flatMap((doc) => doc["@graph"] ?? []).find((node) => node["@type"] === "FAQPage");
    assert.ok(faq, `${route} has no FAQPage`);
    assert.ok(page.faqs.length >= 4, `${route} needs at least 4 FAQs`);
    assert.deepEqual(
      faq.mainEntity.map((q) => q.name),
      page.faqs.map((f) => f.question),
    );
  }
});

test("new pages embed a tool, link siblings and a hub, and have a palette entry", () => {
  const hubs = new Set(["/image-tools", "/pdf-tools"]);
  for (const route of NEW_PAGES) {
    const page = ssr.LANDING_PAGES.find((entry) => `/${entry.slug}` === route);
    assert.ok(page.embed, `${route} has no embedded tool`);
    assert.ok(page.palette, `${route} has no command palette entry`);
    assert.ok(page.related.some((link) => hubs.has(link.path)), `${route} does not link its hub`);
    for (const link of page.related) {
      assert.ok(ssr.PRERENDER_ROUTES.includes(link.path), `${route} links ${link.path}, which is not prerendered`);
    }
  }
  assert.deepEqual(ssr.LANDING_PAGES.find((p) => p.slug === "webp-to-jpg").embed, {
    tool: "image-format-converter",
    output: "image/jpeg",
  });
  assert.deepEqual(ssr.LANDING_PAGES.find((p) => p.slug === "heic-to-png").embed, { tool: "heic-to-jpg", format: "png" });
  assert.deepEqual(ssr.LANDING_PAGES.find((p) => p.slug === "remove-password-from-bank-statement-pdf").embed, {
    tool: "pdf-unlock",
  });
});

test("the bank statement page is linked from /pdf-unlock content and the PDF hub", () => {
  const unlock = ssr.resolveToolContent("pdf-unlock");
  assert.ok(JSON.stringify(unlock.faqs).includes("(/remove-password-from-bank-statement-pdf)"));
  assert.match(read("src/pages/PdfToolsPage.tsx"), /to="\/remove-password-from-bank-statement-pdf"/);
});

test("prerendered HTML in dist matches, when a build is present", (t) => {
  if (!existsSync(join(ROOT, "dist", "webp-to-jpg", "index.html"))) {
    t.skip("dist/ has no build with the new pages; run npm run build");
    return;
  }
  for (const route of NEW_PAGES) {
    const html = read(`dist${route}/index.html`);
    assert.ok(html.includes('"@type":"FAQPage"'), `${route} prerender lacks FAQPage`);
    assert.ok(html.includes(`<link rel="canonical" href="https://toolocean.co${route}" />`), route);
    assert.ok(html.includes("paper-drop"), `${route} prerender lacks the tool dropzone`);
  }
});

/* ------------------------------------------------------------------ */
/* IndexNow                                                            */
/* ------------------------------------------------------------------ */

test("npm run indexnow submits every sitemap URL; --dry-run posts nothing", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts.indexnow, "node scripts/indexnow.mjs --all");
  const sitemapUrls = (read("public/sitemap.xml").match(/<loc>/g) ?? []).length;
  const out = execFileSync(process.execPath, ["scripts/indexnow.mjs", "--all", "--dry-run"], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, INDEXNOW_KEY: "" },
  });
  assert.match(out, new RegExp(`IndexNow: ${sitemapUrls} URL\\(s\\) \\(--all\\) \\(dry run\\)`));
  assert.match(out, /"keyLocation": "https:\/\/toolocean\.co\/654ba38f42abe57769c1a6ad9c1a742e\.txt"/);
});

test("the IndexNow workflow only runs after a successful Production deploy of main", () => {
  const yml = read(".github/workflows/indexnow.yml");
  assert.match(yml, /on:\s*\n\s*deployment_status:/);
  assert.match(yml, /github\.event\.deployment_status\.state == 'success'/);
  assert.match(yml, /github\.event\.deployment\.environment == 'Production'/);
  assert.match(yml, /refs\/heads\/main/);
  assert.match(yml, /node-version: 22/);
  assert.match(yml, /npm ci/);
  assert.match(yml, /npm run sitemap/);
  assert.match(yml, /run: npm run indexnow\s*$/m);
  assert.doesNotMatch(yml, /pull_request|push:/);
});

/* ------------------------------------------------------------------ */
/* tool-run coverage                                                   */
/* ------------------------------------------------------------------ */

test("every PDF and image tool, and the JSON formatter, signals success; the doc lists them", async () => {
  const { readdirSync } = await import("node:fs");
  const base = "src/components/tools/implementations";
  const files = [
    ...readdirSync(join(ROOT, base, "pdf")).map((name) => `${base}/pdf/${name}`),
    ...readdirSync(join(ROOT, base, "image")).map((name) => `${base}/image/${name}`),
    `${base}/JsonFormatterTool.tsx`,
  ].filter((file) => file.endsWith(".tsx"));
  const doc = read("docs/ANALYTICS_EVENTS.md");
  for (const file of files) {
    const source = read(file);
    assert.match(source, /import \{ markToolSuccess \} from "@\/lib\/toolResult";/, file);
    assert.match(source, /markToolSuccess\(/, file);
    assert.ok(doc.includes(`\`${file}\``), `${file} is covered but missing from docs/ANALYTICS_EVENTS.md`);
  }
});
