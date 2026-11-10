/**
 * Size-target landing pages and the honest-result guards in both compressors.
 *
 *   node --experimental-strip-types --test scripts/size-landings.test.mjs
 *
 * Covers the pure outcome helpers in src/lib/targetOutcome.ts, source-level
 * checks that the tools only download and signal success behind a delivering
 * outcome, and the four new pages plus the five existing size pages. Pages are
 * rendered from the SSR bundle (dist-ssg), rebuilt first when its sources are
 * newer; when dist/ holds a build with the new pages, that HTML is checked too.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import {
  byteCount,
  decideImageOutcome,
  decidePdfOutcome,
  formatChangeLabel,
  imageDownloadName,
  pdfDownloadName,
  sniffImageInput,
} from "../src/lib/targetOutcome.ts";
import { createToolRunReporter } from "../src/lib/toolRunEvent.ts";
import { markToolSuccess, subscribeToolSuccess } from "../src/lib/toolResult.ts";
import { TOOL_RUN_EVENT, trackUmamiEvent } from "../src/lib/umami.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

const IMAGE_TOOL = "src/components/tools/implementations/image/ImageCompressorTool.tsx";
const PDF_TOOL = "src/components/tools/implementations/pdf/PdfCompressTool.tsx";

const NEW_PAGES = {
  "compress-pdf-to-500kb": { tool: "pdf-compress", targetBytes: 512000 },
  "compress-pdf-to-1mb": { tool: "pdf-compress", targetBytes: 1048576 },
  "compress-image-to-200kb": { tool: "image-compressor", targetBytes: 204800 },
  "compress-image-to-10kb": { tool: "image-compressor", targetBytes: 10240 },
};
const PDF_FAMILY = ["compress-pdf-to-100kb", "compress-pdf-to-200kb", "compress-pdf-to-500kb", "compress-pdf-to-1mb"];
const IMAGE_FAMILY = [
  "compress-image-to-10kb",
  "compress-image-to-20kb",
  "compress-image-to-50kb",
  "compress-image-to-100kb",
  "compress-image-to-200kb",
];
/** Decimal-portal alternative and the displayed ceiling, per new page. */
const UNITS = {
  "compress-pdf-to-500kb": ["488 KB", "499,712 bytes", "512,000 bytes"],
  "compress-pdf-to-1mb": ["976 KB", "999,424 bytes", "1,048,576 bytes"],
  "compress-image-to-200kb": ["195 KB", "199,680 bytes", "204,800 bytes"],
  "compress-image-to-10kb": ["9 KB", "9,216 bytes", "10,240 bytes"],
};

/* ------------------------------------------------------------------ */
/* Outcome helpers                                                     */
/* ------------------------------------------------------------------ */

const image = (over) => ({
  mode: "exact",
  originalBytes: 1_000_000,
  outputBytes: 9_000,
  targetBytes: 10_240,
  withinTarget: true,
  scale: 1,
  inputFormat: "jpeg",
  outputFormat: "jpeg",
  formatExplicit: false,
  ...over,
});

const pdf = (over) => ({
  originalBytes: 5_000_000,
  outputBytes: 400_000,
  targetBytes: 512_000,
  withinTarget: true,
  mode: "raster",
  scale: 2,
  ...over,
});

test("image: a miss is neither delivered nor a success", () => {
  const outcome = decideImageOutcome(image({ outputBytes: 12_000, withinTarget: false, scale: 0.13 }));
  assert.deepEqual(outcome, { kind: "miss", deliver: false, success: false });
  // Even an explicit conversion does not rescue a miss.
  assert.equal(decideImageOutcome(image({ withinTarget: false, formatExplicit: true, outputFormat: "webp" })).kind, "miss");
});

test("image: a larger output in the default format is suppressed", () => {
  const outcome = decideImageOutcome(image({ originalBytes: 24_000, outputBytes: 37_000, targetBytes: 204_800, inputFormat: "png" }));
  assert.deepEqual(outcome, { kind: "not-smaller", deliver: false, success: false });
});

test("image: a same-format larger output is suppressed even when the format was pressed", () => {
  const outcome = decideImageOutcome(
    image({ originalBytes: 150_000, outputBytes: 178_000, targetBytes: 204_800, inputFormat: "jpeg", formatExplicit: true }),
  );
  assert.equal(outcome.kind, "not-smaller");
  assert.equal(outcome.deliver, false);
  // An equal size is not smaller either.
  assert.equal(decideImageOutcome(image({ originalBytes: 9_000, outputBytes: 9_000 })).kind, "not-smaller");
});

test("image: an explicit conversion that grows is delivered and labelled", () => {
  const args = image({ originalBytes: 24_000, outputBytes: 37_000, targetBytes: 204_800, inputFormat: "png", formatExplicit: true });
  assert.deepEqual(decideImageOutcome(args), { kind: "converted-larger", deliver: true, success: true });
  assert.equal(formatChangeLabel({ input: "png", output: "jpeg" }), "PNG → JPEG");
  assert.equal(formatChangeLabel({ input: "jpeg", output: "webp" }), "JPEG → WebP");
  assert.equal(formatChangeLabel({ input: "other", output: "jpeg" }), "converted to JPEG");
  assert.equal(formatChangeLabel({ input: "webp", output: "webp" }), null);
});

test("image: fit, fit-scaled, and quality mode", () => {
  assert.deepEqual(decideImageOutcome(image({})), { kind: "fit", deliver: true, success: true });
  assert.deepEqual(decideImageOutcome(image({ scale: 0.178 })), { kind: "fit-scaled", deliver: true, success: true });
  const quality = { mode: "quality", originalBytes: 20_000, inputFormat: "jpeg", outputFormat: "jpeg", formatExplicit: false };
  assert.equal(decideImageOutcome({ ...quality, outputBytes: 15_000 }).kind, "smaller");
  // Quality mode writes the default JPEG, so a larger copy is suppressed there too.
  assert.deepEqual(decideImageOutcome({ ...quality, inputFormat: "png", outputBytes: 25_000 }), {
    kind: "not-smaller",
    deliver: false,
    success: false,
  });
});

test("image: input format comes from bytes", () => {
  assert.equal(sniffImageInput(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "jpeg");
  assert.equal(sniffImageInput(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "png");
  assert.equal(sniffImageInput(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ")), "webp");
  assert.equal(sniffImageInput(new TextEncoder().encode("GIF89a")), "other");
  assert.equal(sniffImageInput(new TextEncoder().encode("RIFF")), "other");
});

test("pdf: an already-small file is a no-op that is not a success", () => {
  const lossless = decidePdfOutcome(pdf({ originalBytes: 80_000, outputBytes: 80_100, mode: "lossless", scale: 1 }));
  assert.deepEqual(lossless, { kind: "already-under", deliver: false, success: false });
  // A file that already fits is never swapped for a picture copy, even a smaller one.
  assert.equal(decidePdfOutcome(pdf({ originalBytes: 500_000, outputBytes: 300_000 })).kind, "already-under");
  // A lossless rewrite that is smaller and fits is fine.
  assert.equal(decidePdfOutcome(pdf({ originalBytes: 90_000, outputBytes: 80_000, mode: "lossless", scale: 1 })).kind, "lossless-fit");
});

test("pdf: a raster copy bigger than an over-target original gives that reason", () => {
  const outcome = decidePdfOutcome(pdf({ originalBytes: 85_700, outputBytes: 309_900, targetBytes: 51_200, withinTarget: false, scale: 0.336 }));
  assert.deepEqual(outcome, { kind: "not-smaller-over-target", deliver: false, success: false });
});

test("pdf: a miss smaller than the original is withheld", () => {
  const outcome = decidePdfOutcome(pdf({ originalBytes: 55_000_000, outputBytes: 1_090_000, withinTarget: false, scale: 0.336 }));
  assert.deepEqual(outcome, { kind: "miss", deliver: false, success: false });
});

test("pdf: raster fits, with raster-fit-low-res when scale < 1", () => {
  assert.deepEqual(decidePdfOutcome(pdf({ scale: 2 })), { kind: "raster-fit", deliver: true, success: true });
  assert.deepEqual(decidePdfOutcome(pdf({ scale: 1 })), { kind: "raster-fit", deliver: true, success: true });
  assert.deepEqual(decidePdfOutcome(pdf({ scale: 0.98 })), { kind: "raster-fit-low-res", deliver: true, success: true });
});

test("output names: -compressed for pictures, -optimised for lossless, -sized for images", () => {
  assert.equal(pdfDownloadName({ name: "scan.PDF", raster: true }), "scan-compressed.pdf");
  assert.equal(pdfDownloadName({ name: "letter.pdf", raster: false }), "letter-optimised.pdf");
  assert.equal(imageDownloadName({ name: "sign.png", format: "jpeg" }), "sign-sized.jpg");
  assert.equal(imageDownloadName({ name: "photo.jpeg", format: "webp" }), "photo-sized.webp");
  assert.equal(byteCount(1048576), "1,048,576 bytes");
});

/* ------------------------------------------------------------------ */
/* Tool sources                                                        */
/* ------------------------------------------------------------------ */

const presetBytes = (source, listName) => {
  const block = source.match(new RegExp(`const ${listName} = \\[([\\s\\S]*?)\\];`))?.[1] ?? "";
  return [...block.matchAll(/label: "([^"]+)", bytes: ([^}]+?) \}/g)].map(([, label, expr]) => [
    label,
    // KILOBYTE is 1024; the expressions are products of literals and KILOBYTE.
    expr.split("*").reduce((acc, part) => acc * (part.trim() === "KILOBYTE" ? 1024 : Number(part.trim())), 1),
  ]);
};

test("preset chips: a 10 KB image chip, and every new page's ceiling has a chip", () => {
  const imageChips = new Map(presetBytes(read(IMAGE_TOOL), "TARGETS"));
  const pdfChips = new Map(presetBytes(read(PDF_TOOL), "EXACT_PRESETS"));
  assert.equal(imageChips.get("10 KB"), 10240);
  assert.equal(imageChips.get("200 KB"), 204800);
  assert.equal(pdfChips.get("500 KB"), 512000);
  assert.equal(pdfChips.get("1 MB"), 1048576);
  for (const [slug, { tool, targetBytes }] of Object.entries(NEW_PAGES)) {
    const chips = tool === "pdf-compress" ? pdfChips : imageChips;
    assert.ok([...chips.values()].includes(targetBytes), `${slug}: no chip for ${targetBytes}`);
  }
});

test("image tool: markToolSuccess and downloads sit behind a delivering outcome", () => {
  const source = read(IMAGE_TOOL);
  assert.equal((source.match(/markToolSuccess\(/g) ?? []).length, 2, "one call per mode");
  const quality = source.slice(source.indexOf("const compressQuality"), source.indexOf("const compressExact"));
  assert.ok(quality.indexOf("if (!outcome.success) {") > 0);
  assert.ok(quality.indexOf("if (!outcome.success) {") < quality.indexOf("saveBlob("), "quality mode saves only after the guard");
  assert.ok(quality.indexOf("saveBlob(") < quality.indexOf("markToolSuccess("));
  const exact = source.slice(source.indexOf("const compressExact"), source.indexOf("const working"));
  assert.match(exact, /if \(outcome\.deliver\) delivered\.push\(/);
  assert.match(exact, /for \(const item of delivered\) zip\.file\(item\.name, item\.bytes\);/, "the ZIP holds delivered files only");
  assert.match(exact, /new Blob\(\[delivered\[0\]\.bytes\]/, "a single download is a delivered file");
  const guard = exact.indexOf("if (!delivered.length) {");
  assert.ok(guard > 0 && guard < exact.indexOf("saveBlob(") && guard < exact.indexOf("markToolSuccess("), "nothing saved or signalled without a delivery");
  assert.doesNotMatch(exact, /result\.bytes\][^;]*saveBlob|zip\.file\(name, result\.bytes\)/);
});

test("pdf tool: exact mode downloads and signals only behind a success outcome", () => {
  const source = read(PDF_TOOL);
  const exact = source.slice(source.indexOf("const compressExact"), source.indexOf("const compressPdf = async"));
  const guard = exact.indexOf("if (!outcome.success) {");
  assert.ok(guard > 0, "exact mode checks the outcome");
  assert.ok(guard < exact.indexOf("downloadPdf("), "no download before the guard");
  assert.ok(guard < exact.indexOf("markToolSuccess("), "no tool-run before the guard");
  assert.match(exact, /downloadPdf\(blob, exact\.mode === "raster"\)/, "raster exact output is named -compressed");
  assert.doesNotMatch(exact, /nothing to strip/, "the lossless-only reason is not used for an exact run");
  assert.match(source, /a\.download = pdfDownloadName\(\{ name: pdfFile\.name, raster \}\);/);
});

test("both tools guard against repeated submits and report errors", () => {
  for (const file of [IMAGE_TOOL, PDF_TOOL]) {
    const source = read(file);
    assert.match(source, /const busyRef = useRef\(false\);/, file);
    assert.match(source, /if \([^)]*busyRef\.current\) return;/, file);
    assert.match(source, /busyRef\.current = true;/, file);
    assert.match(source, /finally \{\s*busyRef\.current = false;/, file);
    assert.match(source, /catch \(error\) \{\s*toast\(\{[\s\S]*?variant: "destructive"/, file);
    assert.match(source, /Working…/, file);
  }
  assert.match(read(IMAGE_TOOL), /disabled=\{busy\} data-analytics-label="image-exact-size"/);
  assert.match(read(PDF_TOOL), /onClick=\{compressPdf\}\s*disabled=\{isProcessing\}/);
});

test("the PDF result note shows no pixels-per-inch number and always asks for a zoom check on raster fits", () => {
  const source = read(PDF_TOOL);
  const note = source.slice(source.indexOf("function ExactOutcomeNote"), source.indexOf("export function PdfCompressTool"));
  assert.doesNotMatch(note, /ppi|pixels per inch|dpi/i);
  assert.equal((note.match(/\$\{CHECK_PAGES\}/g) ?? []).length, 2, "both raster fits carry the zoom check");
  assert.match(note, /small print may be hard to read/);
});

test("tool-run reports each new page's slug under the embedded tool", () => {
  for (const [slug, { tool }] of Object.entries(NEW_PAGES)) {
    const calls = [];
    globalThis.window = Object.assign(new EventTarget(), { umami: { track: (...args) => calls.push(args) } });
    globalThis.document = {};
    try {
      const stop = subscribeToolSuccess(createToolRunReporter({ tool, slug, send: trackUmamiEvent, eventName: TOOL_RUN_EVENT }));
      markToolSuccess();
      stop();
    } finally {
      delete globalThis.window;
      delete globalThis.document;
    }
    assert.deepEqual(calls, [["tool-run", { tool, slug }]]);
  }
});

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

function loadSsr() {
  const entry = join(ROOT, "dist-ssg", "entry-ssg.js");
  const sources = [
    "src/data/landingPages.ts",
    "src/pages/LandingRoutePage.tsx",
    "src/pages/PdfToolsPage.tsx",
    "src/data/hubGuides.ts",
    "src/data/toolContent/pdfCompress.ts",
    "src/data/toolContent/imageCompressor.ts",
    "src/lib/targetOutcome.ts",
    IMAGE_TOOL,
    PDF_TOOL,
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
for (const slug of [...PDF_FAMILY, ...IMAGE_FAMILY, "pdf-tools", "image-tools", "pdf-compress", "image-compressor"]) {
  rendered.set(slug, (await ssr.renderRoute(`/${slug}`)).html);
}

const graph = (slug) =>
  [...ssr.headForRoute(`/${slug}`).matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(
    (m) => JSON.parse(m[1])["@graph"] ?? [],
  );

const text = (html) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");

const titleOf = (route) => ssr.headForRoute(route).match(/<title>([^<]*)<\/title>/)?.[1]?.replace(/&amp;/g, "&");

test("the four pages exist with exact targets, fit the length limits and have unique titles", () => {
  const others = new Map();
  for (const route of ssr.PRERENDER_ROUTES) others.set(titleOf(route), route);
  for (const [slug, embed] of Object.entries(NEW_PAGES)) {
    const entry = page(slug);
    assert.ok(entry, `${slug} is missing`);
    assert.deepEqual(entry.embed, embed);
    const { title, description } = entry.seo;
    assert.ok(title.length <= 60, `${slug} title ${title.length}`);
    assert.ok(description.length >= 140 && description.length <= 165, `${slug} description ${description.length}`);
    // seoHead appends " | ToolOcean" only when the result still fits in 60.
    const head = titleOf(`/${slug}`);
    assert.ok(head === title || head === `${title} | ToolOcean`, `${slug} head title ${head}`);
    assert.ok(head.length <= 60, `${slug} head title ${head.length}`);
    assert.equal(others.get(head), `/${slug}`, `${slug} shares its title`);
    assert.equal(ssr.LANDING_PAGES.filter((other) => other.h1 === entry.h1).length, 1, `${slug} H1 is reused`);
    assert.ok(entry.footerLabel && entry.lede);
    assert.equal(entry.measurementKey, undefined, `${slug} must not quote an unverified measurement`);
    assert.ok(entry.sections.length >= 1 && entry.sections.length <= 3, slug);
    assert.ok(ssr.PRERENDER_ROUTES.includes(`/${slug}`), `${slug} is not prerendered`);
  }
});

test("one H1, a self canonical, HowTo with 3 steps, and FAQPage equal to the visible 4 to 6 FAQs", () => {
  for (const slug of Object.keys(NEW_PAGES)) {
    const html = rendered.get(slug);
    const h1s = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g) ?? [];
    assert.equal(h1s.length, 1, `${slug} has ${h1s.length} H1s`);
    assert.equal(text(h1s[0]).trim(), page(slug).h1);
    assert.equal(ssr.headForRoute(`/${slug}`).match(/<link rel="canonical" href="([^"]+)"/)[1], `https://toolocean.co/${slug}`);
    const nodes = graph(slug);
    const howTo = nodes.find((node) => node["@type"] === "HowTo");
    assert.ok(howTo, `${slug} has no HowTo`);
    assert.equal(howTo.step.length, 3);
    const faq = nodes.find((node) => node["@type"] === "FAQPage");
    assert.ok(faq, `${slug} has no FAQPage`);
    const faqs = page(slug).faqs;
    assert.ok(faqs.length >= 4 && faqs.length <= 6, `${slug} has ${faqs.length} FAQs`);
    assert.deepEqual(
      faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]),
      faqs.map((f) => [f.question, f.answer]),
    );
    const visible = text(html);
    for (const f of faqs) assert.ok(visible.includes(f.question), `${slug}: ${f.question}`);
    for (const step of page(slug).howTo.steps) assert.ok(visible.includes(step.title), `${slug}: ${step.title}`);
  }
});

test("every size page links its siblings, its parent tool and its hub", () => {
  for (const [family, parent, hub] of [
    [PDF_FAMILY, "/pdf-compress", "/pdf-tools"],
    [IMAGE_FAMILY, "/image-compressor", "/image-tools"],
  ]) {
    for (const slug of family) {
      const paths = page(slug).related.map((link) => link.path);
      const required = [...family.filter((other) => other !== slug).map((other) => `/${other}`), parent, hub];
      for (const path of required) {
        assert.ok(paths.includes(path), `${slug} lacks ${path}`);
        assert.ok(rendered.get(slug).includes(`href="${path}"`), `${slug} does not render a link to ${path}`);
      }
      for (const path of paths) assert.ok(ssr.PRERENDER_ROUTES.includes(path), `${slug} links ${path}, not prerendered`);
    }
  }
});

test("hubs and parent tools link every size page", () => {
  for (const slug of PDF_FAMILY) {
    for (const host of ["pdf-tools", "pdf-compress"]) assert.ok(rendered.get(host).includes(`href="/${slug}"`), `/${host} lacks /${slug}`);
  }
  for (const slug of IMAGE_FAMILY) {
    for (const host of ["image-tools", "image-compressor"]) assert.ok(rendered.get(host).includes(`href="/${slug}"`), `/${host} lacks /${slug}`);
  }
  assert.doesNotMatch(read("src/pages/PdfToolsPage.tsx"), /Two ceilings are preselected/);
});

test("the sitemap lists the four pages", () => {
  execFileSync(process.execPath, [join(ROOT, "scripts/generate-sitemap.mjs")], { cwd: ROOT, stdio: "ignore" });
  const sitemap = read("public/sitemap.xml");
  for (const slug of Object.keys(NEW_PAGES)) assert.ok(sitemap.includes(`<loc>https://toolocean.co/${slug}</loc>`), slug);
});

test("units: binary ceilings in bytes, decimal alternatives in KB, never a bare byte count to type", () => {
  for (const [slug, [alternative, alternativeBytes, ceiling]] of Object.entries(UNITS)) {
    const visible = text(rendered.get(slug));
    for (const needle of [alternative, alternativeBytes, ceiling]) assert.ok(visible.includes(needle), `${slug} lacks ${needle}`);
    assert.doesNotMatch(visible, /\b(?:500000|1000000|200000|10000)\b/, `${slug} shows a bare byte count`);
    assert.doesNotMatch(visible, /\b(?:type|enter)\s+(?:500,000|1,000,000|200,000|10,000)\b/i, slug);
  }
});

test("copy makes no guarantee, no readability promise and no unmeasured figure", () => {
  for (const slug of Object.keys(NEW_PAGES)) {
    const json = JSON.stringify(page(slug));
    for (const banned of [/guarantee/i, /typical uploads fit/i, /30[–-]40 pages/i, /\bppi\b|pixels per inch/i, /\bdpi\b/i, /always fits/i, /sharper/i]) {
      assert.doesNotMatch(json, banned, `${slug}: ${banned}`);
    }
  }
});

test("privacy answers: files aren't uploaded, and the analytics are named accurately", () => {
  for (const [slug, { tool }] of Object.entries(NEW_PAGES)) {
    const json = JSON.stringify(page(slug).faqs);
    assert.match(json, /your files aren't uploaded/i, slug);
    assert.match(json, /tool-run/, slug);
    assert.match(json, new RegExp(`${tool} and ${slug}`), slug);
    assert.match(json, /page view/, slug);
    assert.match(json, /Google Analytics/, slug);
    assert.match(json, /banner/, slug);
    assert.doesNotMatch(json, /nothing is sent|one (network )?request|only request/i, slug);
  }
});

test("the 20 KB page keeps its metadata and H1", () => {
  const entry = page("compress-image-to-20kb");
  assert.deepEqual(entry.seo, {
    title: "Compress Image to 20 KB for Exam & Form Photos",
    description:
      "Compress a photo or signature to 20 KB for exam and government application forms. Runs in your browser, 1 KB is 1024 bytes, and nothing is uploaded.",
    keywords: [
      "compress image to 20kb",
      "photo 20kb for exam form",
      "signature 20kb",
      "reduce photo size for application form",
      "jpeg under 20 kb",
    ],
  });
  assert.equal(entry.h1, "Compress an image to 20 KB");
});

test("no links to /jpg-to-webp or /png-to-webp", () => {
  for (const rel of ["src/data/landingPages.ts", IMAGE_TOOL, PDF_TOOL, "src/data/hubGuides.ts", "src/pages/PdfToolsPage.tsx"]) {
    assert.doesNotMatch(read(rel), /\/(?:jpg|png)-to-webp\b/, rel);
  }
  for (const [slug, html] of rendered) assert.doesNotMatch(html, /href="\/(?:jpg|png)-to-webp"/, slug);
});

test("prerendered HTML in dist matches, when a build is present", (t) => {
  if (!existsSync(join(ROOT, "dist", "compress-pdf-to-500kb", "index.html"))) {
    t.skip("dist/ has no build with the new pages; run npm run build");
    return;
  }
  for (const slug of Object.keys(NEW_PAGES)) {
    const html = read(`dist/${slug}/index.html`);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, slug);
    assert.ok(html.includes('"@type":"FAQPage"') && html.includes('"@type":"HowTo"'), slug);
    assert.ok(html.includes(`<link rel="canonical" href="https://toolocean.co/${slug}" />`), slug);
    assert.ok(html.includes("paper-drop"), `${slug} prerender lacks the tool dropzone`);
  }
});
