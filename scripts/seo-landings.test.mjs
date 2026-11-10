/**
 * The four PDF landing pages: merge-pdf-without-uploading, compress-pdf-to-100kb,
 * smallpdf-alternative and ilovepdf-alternative.
 *
 *   node --experimental-strip-types --test scripts/seo-landings.test.mjs
 *
 * Covers the cited comparison rows, the stacked-card markup at narrow widths,
 * the measured benchmark data contract, schema matching visible content, and
 * the analytics wording. Pages are rendered from the SSR bundle (dist-ssg), which
 * is rebuilt first when its sources are newer.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

const PAGES = ["merge-pdf-without-uploading", "compress-pdf-to-100kb", "smallpdf-alternative", "ilovepdf-alternative"];
const ALTERNATIVES = { "smallpdf-alternative": "smallpdf.com", "ilovepdf-alternative": "www.ilovepdf.com" };
const CHECKED_ON = "2026-11-06";

function loadSsr() {
  const entry = join(ROOT, "dist-ssg", "entry-ssg.js");
  const sources = [
    "src/data/landingPages.ts",
    "src/data/landingBenchmarks.json",
    "src/pages/LandingRoutePage.tsx",
    "src/lib/landingPageSchema.ts",
    "src/data/toolContent/grayscalePdf.ts",
  ];
  const stale = !existsSync(entry) || sources.some((rel) => statSync(join(ROOT, rel)).mtimeMs > statSync(entry).mtimeMs);
  if (stale) {
    execFileSync(process.execPath, [join(ROOT, "node_modules/vite/bin/vite.js"), "build", "--ssr", "src/entry-ssg.tsx", "--outDir", "dist-ssg", "--logLevel", "error"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
  return import(pathToFileURL(entry).href);
}

const ssr = await loadSsr();
const page = (slug) => ssr.LANDING_PAGES.find((entry) => entry.slug === slug);
const rendered = new Map();
for (const slug of PAGES) rendered.set(slug, (await ssr.renderRoute(`/${slug}`)).html);

function graph(slug) {
  const html = ssr.headForRoute(`/${slug}`);
  return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(
    (m) => JSON.parse(m[1])["@graph"] ?? [],
  );
}

const text = (html) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");

/* ------------------------------------------------------------------ */
/* Comparison rows                                                     */
/* ------------------------------------------------------------------ */

test("every competitor row cites an official page and the 6 Nov 2026 check, and tables stay short", () => {
  for (const [slug, host] of Object.entries(ALTERNATIVES)) {
    const { rows } = page(slug).comparison;
    assert.ok(rows.length >= 3 && rows.length <= 5, `${slug} has ${rows.length} rows`);
    for (const row of rows) {
      const url = new URL(row.source.url);
      assert.equal(url.protocol, "https:", row.capability);
      assert.equal(url.host, host, `${slug} row "${row.capability}" cites ${url.host}`);
      assert.notEqual(url.pathname, "/file-security", "the Smallpdf file-security page returned 404");
      assert.equal(row.checkedOn, CHECKED_ON, row.capability);
      assert.ok(row.source.label.length > 0);
    }
  }
});

test("each comparison row shows its source link and checked date in the rendered page", () => {
  for (const slug of Object.keys(ALTERNATIVES)) {
    const html = rendered.get(slug);
    const { rows } = page(slug).comparison;
    const table = html.match(/<section id="comparison"[\s\S]*?<\/section>/)?.[0];
    assert.ok(table, `${slug} has no visible comparison section`);
    const bodyRows = table.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].split("</tr>").filter((r) => r.includes("<th"));
    assert.equal(bodyRows.length, rows.length);
    bodyRows.forEach((markup, index) => {
      assert.ok(markup.includes(`href="${rows[index].source.url}"`), `${slug} row ${index + 1} lacks its source link`);
      assert.match(markup, /checked <time datetime="2026-11-06">6 Nov 2026<\/time>/i);
    });
    // The comparison is the point of these pages, so it is not folded into the accordion.
    const details = html.match(/<details>[\s\S]*?<\/details>/)?.[0] ?? "";
    assert.ok(!details.includes("paper-table"), `${slug} comparison is hidden inside <details>`);
  }
});

test("no numeric Smallpdf prices, and dropped claim wording stays gone", () => {
  const smallpdf = JSON.stringify(page("smallpdf-alternative"));
  assert.doesNotMatch(smallpdf, /\$|€|£|US\$|per month|\/month/i);
  const all = PAGES.map((slug) => JSON.stringify(page(slug))).join("\n");
  for (const banned of [
    /they all upload/i,
    /most (online )?(services|pdf mergers)/i,
    /every task (still )?starts by uploading/i,
    /almost instantly/i,
    /certified e-sign/i,
    /no upload and no limits/i,
    /no limits/i,
    /guarantee/i,
    /one network request/i,
    /one small umami event/i,
    /works offline\W+\s*them: "No"/i,
  ]) {
    assert.doesNotMatch(all, banned);
  }
});

/* ------------------------------------------------------------------ */
/* Responsive markup                                                   */
/* ------------------------------------------------------------------ */

test("landing tables are stacked cards below 768px, not a horizontal scroller", () => {
  const source = read("src/pages/LandingRoutePage.tsx");
  assert.doesNotMatch(source, /overflow-x-auto/);
  assert.doesNotMatch(source, /min-w-\[/);
  const css = read("src/index.css");
  const block = css.match(/@media \(max-width: 767px\) \{\s*\.paper-table[\s\S]*?\n  \}\n/)?.[0];
  assert.ok(block, "paper-table has no narrow-screen block");
  assert.match(block, /\.paper-table tr,[\s\S]*display: block/);
  assert.match(block, /td\[data-label\]::before \{[\s\S]*content: attr\(data-label\)/);
  assert.match(block, /\.paper-table thead \{[^}]*clip: rect\(0 0 0 0\)/);
  const tableCss = css.slice(css.indexOf(".paper-table {"), css.indexOf(".paper-hashes code"));
  assert.doesNotMatch(tableCss, /teal|#14b8a6|#0d9488|#0f766e|hsl\(17\d/i, "paper colours only");
  for (const slug of [...Object.keys(ALTERNATIVES), "compress-pdf-to-100kb", "merge-pdf-without-uploading"]) {
    const html = rendered.get(slug);
    const tds = html.match(/<td\b[^>]*>/g) ?? [];
    assert.ok(tds.length > 0, `${slug} renders no table cells`);
    for (const td of tds) assert.match(td, /data-label="[^"]+"/, `${slug}: ${td}`);
  }
});

/* ------------------------------------------------------------------ */
/* Benchmarks                                                          */
/* ------------------------------------------------------------------ */

const bench = JSON.parse(read("src/data/landingBenchmarks.json"));

test("benchmark data: provenance, hashes, KB = 1024 and medians inside their ranges", () => {
  assert.equal(bench.kb, 1024);
  assert.match(bench.measuredOn, /^\d{4}-\d{2}-\d{2}$/);
  for (const key of ["browser", "os", "cpu", "commit", "viewport"]) assert.ok(bench.environment[key], key);
  assert.ok(bench.environment.ramGiB > 0);
  assert.match(bench.environment.browser, /\d+\.\d+/, "browser version is recorded");
  assert.ok(Number.isInteger(bench.fixtureRecipe.seed));
  const files = new Set();
  for (const fixture of bench.fixtures) {
    assert.match(fixture.sha256, /^[0-9a-f]{64}$/);
    assert.ok(fixture.bytes > 0 && fixture.pages > 0);
    files.add(fixture.file);
  }
  for (const row of [...bench.compress, bench.merge]) {
    assert.ok(row.runs >= 3, "repeated runs");
    assert.ok(row.msMin <= row.msMedian && row.msMedian <= row.msMax);
  }
  for (const row of bench.compress) assert.ok(files.has(row.fixture), row.fixture);
  for (const file of bench.merge.files) assert.ok(files.has(file), file);
});

test("benchmark outcomes agree with their bytes, and 100,000 differs from 102,400", () => {
  for (const row of bench.compress) {
    if (row.outcome.startsWith("fit-")) {
      for (const size of row.outputBytes) assert.ok(size <= row.targetBytes, `${row.fixture}@${row.targetBytes}: ${size}`);
    } else if (row.outcome === "cannot-fit-over-target") {
      for (const size of row.outputBytes) assert.ok(size > row.targetBytes);
    } else {
      assert.equal(row.outcome, "cannot-fit-refused");
      assert.deepEqual(row.outputBytes, []);
    }
    if (row.outcome === "fit-lossless") assert.equal(row.textSelectable, true);
    if (row.outcome === "fit-raster" || row.outcome === "cannot-fit-over-target") assert.equal(row.textSelectable, false);
  }
  assert.ok(bench.compress.some((row) => row.outcome.startsWith("cannot-fit")), "an honest cannot-fit row");
  // The same file fits 102,400 losslessly and does not fit 100,000.
  const wide = bench.compress.find((row) => row.targetBytes === 102400 && row.outcome === "fit-lossless" && row.outputBytes.every((b) => b > 100000));
  assert.ok(wide, "a fixture whose lossless size sits between 100,000 and 102,400 bytes");
  const narrow = bench.compress.find((row) => row.fixture === wide.fixture && row.targetBytes === 100000);
  assert.ok(narrow && narrow.outcome !== "fit-lossless", "the same fixture at 100,000 bytes");
});

test("the 100 KB page renders every measured row with exact bytes and the cannot-fit cases", () => {
  const visible = text(rendered.get("compress-pdf-to-100kb"));
  for (const row of bench.compress) {
    for (const size of row.outputBytes) assert.ok(visible.includes(`${size.toLocaleString("en-US")} bytes`), String(size));
  }
  assert.ok(visible.includes("100,000 bytes") && visible.includes("102,400 bytes"));
  assert.match(visible, /Cannot fit\. Nothing downloaded/);
  assert.match(visible, /Cannot fit\. Smallest copy still over the target/);
  assert.match(visible, /1 KB = 1024 bytes/);
  for (const fixture of bench.fixtures) assert.ok(visible.includes(fixture.sha256));
  assert.equal(page("compress-pdf-to-100kb").embed.targetBytes, 102400);
});

test("page images are painted at a fixed scale, not the screen's pixel ratio", () => {
  const engine = read("src/lib/targetSize/compressPdfToTarget.ts");
  assert.doesNotMatch(engine, /devicePixelRatio/);
  assert.match(engine, /paintPages\(data, 2\)/);
  for (const check of bench.pixelRatioCheck) assert.equal(check.deviceScaleFactor, 2);
});

/* ------------------------------------------------------------------ */
/* Schema and analytics wording                                        */
/* ------------------------------------------------------------------ */

test("schema matches visible content: FAQ, HowTo scope, section names, no ratings", () => {
  for (const slug of PAGES) {
    const nodes = graph(slug);
    const visible = text(rendered.get(slug));
    const faq = nodes.find((node) => node["@type"] === "FAQPage");
    assert.deepEqual(
      faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]),
      page(slug).faqs.map((f) => [f.question, f.answer]),
    );
    for (const f of page(slug).faqs) assert.ok(visible.includes(f.question), f.question);
    const web = nodes.find((node) => node["@type"] === "WebPage");
    for (const part of web.hasPart) assert.ok(visible.includes(part.name), `${slug}: hasPart "${part.name}" is not visible`);
    const json = JSON.stringify(nodes);
    assert.doesNotMatch(json, /aggregateRating|"Review"|ratingValue/);
    assert.equal(ssr.headForRoute(`/${slug}`).match(/<link rel="canonical" href="([^"]+)"/)[1], `https://toolocean.co/${slug}`);
  }
  // HowTo stays where it was: only the 100 KB page, still three steps.
  assert.equal(graph("compress-pdf-to-100kb").find((n) => n["@type"] === "HowTo").step.length, 3);
  for (const slug of ["merge-pdf-without-uploading", "smallpdf-alternative", "ilovepdf-alternative"]) {
    assert.ok(!graph(slug).some((n) => n["@type"] === "HowTo"), `${slug} gained HowTo`);
  }
});

test("titles and descriptions fit, and are unique among the four", () => {
  const titles = new Set();
  for (const slug of PAGES) {
    const { title, description } = page(slug).seo;
    assert.ok(title.length <= 60, `${slug} title ${title.length}`);
    assert.ok(description.length >= 140 && description.length <= 165, `${slug} description ${description.length}`);
    titles.add(title);
  }
  assert.equal(titles.size, PAGES.length);
});

test("the merge FAQ separates analytics from files and names only tool and slug", () => {
  const answer = page("merge-pdf-without-uploading").faqs[0].answer;
  assert.match(answer, /tool-run/);
  assert.match(answer, /only fields are tool and slug/);
  assert.match(answer, /tool_engage and tool_action/);
  assert.match(answer, /page view/);
  assert.match(answer, /None of these include file names, sizes, page counts or contents/);
  assert.doesNotMatch(answer, /one (network )?request|only request|one small/i);
});

test("grayscale FAQ no longer implies a single request", () => {
  const grayscale = read("src/data/toolContent/grayscalePdf.ts");
  assert.doesNotMatch(grayscale, /The one thing sent/);
  assert.match(grayscale, /tool-run event whose only fields are the tool and the page slug/);
});

test("alternative pages link the merge and 100 KB pages instead of repeating them", () => {
  for (const slug of Object.keys(ALTERNATIVES)) {
    const paths = page(slug).related.map((link) => link.path);
    assert.ok(paths.includes("/merge-pdf-without-uploading") && paths.includes("/compress-pdf-to-100kb"), slug);
    for (const path of paths) assert.ok(ssr.PRERENDER_ROUTES.includes(path), `${slug} links ${path}, not prerendered`);
  }
  for (const slug of ["merge-pdf-without-uploading", "compress-pdf-to-100kb"]) {
    for (const link of page(slug).related) assert.ok(ssr.PRERENDER_ROUTES.includes(link.path), link.path);
  }
});


test("alternatives do not claim that this site's existing form-fill or visual-sign tools are absent", () => {
  const content = read("src/data/landingPages.ts");
  assert.doesNotMatch(content, /PDF forms, signatures or PDF\/A: those are on/);
});
