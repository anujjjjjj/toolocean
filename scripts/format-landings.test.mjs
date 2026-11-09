/**
 * The four format landing pages: jpg-to-pdf, png-to-pdf, pdf-to-jpg, pdf-to-png.
 *
 *   node --experimental-strip-types --test scripts/format-landings.test.mjs
 *
 * Covers the magic-byte sniffer behind the single-format image input, the
 * landing data, schema matching visible FAQs, the preset-aware dropzones, the
 * parent /images-to-pdf dropzone, and the locked PDF output format. Pages are
 * rendered from the SSR bundle (dist-ssg), rebuilt first when its sources are newer.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import {
  FORMAT_ACCEPT,
  rejectionReason,
  sniffImageFile,
  sniffImageFormat,
  summarizeBatch,
} from "../src/lib/image/sniffImageFormat.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

const PAGES = ["jpg-to-pdf", "png-to-pdf", "pdf-to-jpg", "pdf-to-png"];
const EMBEDS = {
  "jpg-to-pdf": { tool: "images-to-pdf", input: "jpeg" },
  "png-to-pdf": { tool: "images-to-pdf", input: "png" },
  "pdf-to-jpg": { tool: "pdf-to-images", output: "jpeg" },
  "pdf-to-png": { tool: "pdf-to-images", output: "png" },
};

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

/* ------------------------------------------------------------------ */
/* Sniffer                                                             */
/* ------------------------------------------------------------------ */

test("sniffImageFormat reads JPEG, PNG and WebP signatures and nothing else", () => {
  assert.equal(sniffImageFormat(JPEG), "jpeg");
  assert.equal(sniffImageFormat(PNG), "png");
  assert.equal(sniffImageFormat(new Uint8Array()), "other");
  assert.equal(sniffImageFormat(new Uint8Array([0xff, 0xd8])), "other", "truncated JPEG marker");
  assert.equal(sniffImageFormat(PNG.slice(0, 7)), "other", "truncated PNG signature");
  assert.equal(sniffImageFormat(new TextEncoder().encode("RIFF\0\0\0\0WEBP")), "webp");
  assert.equal(sniffImageFormat(new TextEncoder().encode("RIFF\0\0\0\0WAVE")), "other", "RIFF that is not WebP");
  assert.equal(sniffImageFormat(new TextEncoder().encode("%PDF-1.7")), "other");
});

test("sniffImageFile trusts bytes over name and MIME type", async () => {
  // A PNG renamed .jpg and labelled image/jpeg is still a PNG.
  assert.equal(await sniffImageFile(new File([PNG], "photo.jpg", { type: "image/jpeg" })), "png");
  // A real JPEG with a blank type and a .jfif name is a JPEG.
  assert.equal(await sniffImageFile(new File([JPEG], "scan.jfif", { type: "" })), "jpeg");
  assert.equal(await sniffImageFile(new File([], "empty.jpg", { type: "image/jpeg" })), "other");
});

test("rejection and batch messages name the file and the format", () => {
  assert.equal(rejectionReason("photo.png", "png", "jpeg"), "photo.png is a PNG, not a JPG.");
  assert.equal(rejectionReason("x.webp", "other", "png"), "x.webp is not a PNG.");
  assert.equal(summarizeBatch(2, []), "2 added.");
  assert.equal(
    summarizeBatch(2, [rejectionReason("photo.png", "png", "jpeg")]),
    "2 added, 1 rejected: photo.png is a PNG, not a JPG.",
  );
  assert.match(FORMAT_ACCEPT.jpeg, /\.jfif/);
  assert.match(FORMAT_ACCEPT.jpeg, /\.jpe(,|$)/);
  assert.doesNotMatch(FORMAT_ACCEPT.jpeg, /png/);
  assert.doesNotMatch(FORMAT_ACCEPT.png, /jpe?g/);
});

/* ------------------------------------------------------------------ */
/* SSR                                                                 */
/* ------------------------------------------------------------------ */

function loadSsr() {
  const entry = join(ROOT, "dist-ssg", "entry-ssg.js");
  const sources = [
    "src/data/landingPages.ts",
    "src/pages/LandingRoutePage.tsx",
    "src/lib/landingPageSchema.ts",
    "src/lib/leanShell.ts",
    "src/lib/image/sniffImageFormat.ts",
    "src/components/tools/implementations/pdf/ImagesToPdfTool.tsx",
    "src/components/tools/implementations/pdf/PdfToImagesTool.tsx",
    "src/data/toolContent/imagesToPdf.ts",
    "src/data/toolContent/pdfToImages.ts",
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
for (const slug of [...PAGES, "images-to-pdf", "pdf-to-images"]) rendered.set(slug, (await ssr.renderRoute(`/${slug}`)).html);

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

const fileInputs = (html) => html.match(/<input[^>]*type="file"[^>]*>/g) ?? [];
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

/* ------------------------------------------------------------------ */
/* Landing data                                                        */
/* ------------------------------------------------------------------ */

test("the four pages exist with presets, and their titles, descriptions and H1s are unique site-wide", () => {
  const others = ssr.LANDING_PAGES.filter((entry) => !PAGES.includes(entry.slug));
  const parentH1s = [ssr.resolveToolContent("images-to-pdf").hero.h1, ssr.resolveToolContent("pdf-to-images").hero.h1];
  for (const slug of PAGES) {
    const entry = page(slug);
    assert.ok(entry, `${slug} is missing`);
    assert.deepEqual(entry.embed, EMBEDS[slug]);
    const { title, description } = entry.seo;
    assert.ok(title.length <= 60, `${slug} title ${title.length}`);
    assert.ok(description.length >= 140 && description.length <= 165, `${slug} description ${description.length}`);
    for (const other of others) {
      assert.notEqual(title, other.seo.title);
      assert.notEqual(description, other.seo.description);
      assert.notEqual(entry.h1, other.h1);
    }
    assert.ok(!parentH1s.includes(entry.h1), `${slug} reuses a parent H1`);
    assert.ok(entry.footerLabel && entry.lede);
    assert.ok(!entry.palette, `${slug} should not add a palette entry`);
  }
  for (const key of ["title", "description"]) {
    assert.equal(new Set(PAGES.map((slug) => page(slug).seo[key])).size, PAGES.length, key);
  }
  assert.equal(new Set(PAGES.map((slug) => page(slug).h1)).size, PAGES.length);
});

test("each page has a 3-step how-to, 4 to 6 FAQs and related links that resolve", () => {
  for (const slug of PAGES) {
    const entry = page(slug);
    assert.equal(entry.howTo.steps.length, 3, slug);
    assert.ok(entry.faqs.length >= 4 && entry.faqs.length <= 6, `${slug} has ${entry.faqs.length} FAQs`);
    const paths = entry.related.map((link) => link.path);
    const parent = `/${EMBEDS[slug].tool}`;
    const sibling = { "jpg-to-pdf": "/png-to-pdf", "png-to-pdf": "/jpg-to-pdf", "pdf-to-jpg": "/pdf-to-png", "pdf-to-png": "/pdf-to-jpg" }[slug];
    for (const required of [parent, sibling, "/pdf-tools"]) assert.ok(paths.includes(required), `${slug} lacks ${required}`);
    for (const path of paths) assert.ok(ssr.PRERENDER_ROUTES.includes(path), `${slug} links ${path}, not prerendered`);
    for (const tool of entry.tools) assert.ok(ssr.TOOL_CATALOG.some((t) => t.id === tool), `${slug} tool ${tool}`);
    assert.ok(ssr.PRERENDER_ROUTES.includes(`/${slug}`), `${slug} is not prerendered`);
  }
});

test("parent tool pages link both format pages", () => {
  const imagesToPdf = ssr.resolveToolContent("images-to-pdf").related.map((link) => link.path);
  const pdfToImages = ssr.resolveToolContent("pdf-to-images").related.map((link) => link.path);
  assert.ok(imagesToPdf.includes("/jpg-to-pdf") && imagesToPdf.includes("/png-to-pdf"));
  assert.ok(pdfToImages.includes("/pdf-to-jpg") && pdfToImages.includes("/pdf-to-png"));
});

test("privacy answers separate files from analytics and name only tool and slug", () => {
  for (const slug of PAGES) {
    const json = JSON.stringify(page(slug));
    assert.match(json, /tool-run/, slug);
    assert.match(json, new RegExp(`${EMBEDS[slug].tool} and ${slug}`), slug);
    assert.match(json, /page view/, slug);
    for (const banned of [/rich result/i, /nothing is sent/i, /one (network )?request/i, /only request/i, /guarantee/i]) {
      assert.doesNotMatch(json, banned, slug);
    }
  }
});

/* ------------------------------------------------------------------ */
/* Schema and rendered markup                                          */
/* ------------------------------------------------------------------ */

test("FAQPage questions and answers equal the visible FAQs, with a self canonical", () => {
  for (const slug of PAGES) {
    const nodes = graph(slug);
    const visible = text(rendered.get(slug));
    const faq = nodes.find((node) => node["@type"] === "FAQPage");
    assert.ok(faq, `${slug} has no FAQPage`);
    assert.deepEqual(
      faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]),
      page(slug).faqs.map((f) => [f.question, f.answer]),
    );
    for (const f of page(slug).faqs) assert.ok(visible.includes(f.question), `${slug}: ${f.question}`);
    for (const step of page(slug).howTo.steps) assert.ok(visible.includes(step.title), `${slug}: ${step.title}`);
    assert.ok(visible.includes(page(slug).h1));
    assert.equal(ssr.headForRoute(`/${slug}`).match(/<link rel="canonical" href="([^"]+)"/)[1], `https://toolocean.co/${slug}`);
  }
});

test("the parent /images-to-pdf dropzone accepts images, not PDFs", () => {
  assert.equal(ssr.resolveToolContent("images-to-pdf") != null, true);
  const inputs = fileInputs(rendered.get("images-to-pdf"));
  assert.ok(inputs.length > 0, "no file input on /images-to-pdf");
  for (const input of inputs) {
    assert.equal(attr(input, "accept"), "image/*", input);
    assert.match(input, /\smultiple=""/, input);
  }
  assert.doesNotMatch(rendered.get("images-to-pdf"), /Drop a PDF here/);
});

test("image-input pages narrow every file input to the preset format, multiple files", () => {
  for (const [slug, format] of [["jpg-to-pdf", "jpeg"], ["png-to-pdf", "png"]]) {
    const html = rendered.get(slug);
    const inputs = fileInputs(html);
    assert.ok(inputs.length >= 2, `${slug}: expected the landing dropzone and the tool's input, got ${inputs.length}`);
    for (const input of inputs) {
      assert.equal(attr(input, "accept"), FORMAT_ACCEPT[format], `${slug}: ${input}`);
      assert.match(input, /\smultiple=""/, `${slug}: ${input}`);
    }
    const label = format === "jpeg" ? "JPG" : "PNG";
    assert.ok(text(html).includes(`Choose ${label} images`), `${slug} picker label`);
    assert.match(html, /role="status"[^>]*aria-live="polite"|aria-live="polite"[^>]*role="status"/, `${slug} has no live status line`);
  }
});

test("PDF output pages accept one PDF and render no format menu", () => {
  for (const slug of ["pdf-to-jpg", "pdf-to-png"]) {
    const html = rendered.get(slug);
    for (const input of fileInputs(html)) assert.match(attr(input, "accept"), /pdf/, `${slug}: ${input}`);
    assert.doesNotMatch(html, /id="format"/);
    assert.doesNotMatch(text(html), /Image Format/);
  }
  // The menu only appears after a PDF is loaded, which SSR cannot reach, so the
  // gating and the derived format are checked in the source as well.
  const source = read("src/components/tools/implementations/pdf/PdfToImagesTool.tsx");
  assert.match(source, /const format = preset\?\.output \?\? chosenFormat;/);
  assert.match(source, /\{!preset && \(\s*<div className="space-y-2">\s*<Label htmlFor="format">/);
  assert.equal((source.match(/setFormat\(/g) ?? []).length, 1, "only the format menu may set the format");
  assert.match(source, /format === "png" \? "png" : "jpg"/, "extension follows the effective format");
  assert.match(source, /_images\.zip/, "ZIP name unchanged");
});

test("the image tool embeds by sniffed bytes, not by file.type", () => {
  const source = read("src/components/tools/implementations/pdf/ImagesToPdfTool.tsx");
  assert.doesNotMatch(source, /file\.type === "image\/(png|jpeg|jpg)"\)\s*\{\s*image = await pdfDoc\.embed/);
  assert.match(source, /sniffImageFormat\(uint8Array\) === "png"\) \{\s*image = await pdfDoc\.embedPng/);
  assert.match(source, /sniffImageFormat\(uint8Array\) === "jpeg"\) \{\s*image = await pdfDoc\.embedJpg/);
  assert.match(source, /markToolSuccess\(blob\)/);
});

test("the image tool's action row stacks below sm so both buttons fit at 375px", () => {
  const source = read("src/components/tools/implementations/pdf/ImagesToPdfTool.tsx");
  assert.match(
    source,
    /<div className="flex flex-col gap-3 sm:flex-row">\s*<Button\s+onClick=\{\(\) => fileInputRef\.current\?\.click\(\)\}/,
  );
});

test("the landing embed switch is exhaustive and warms pdf-lib for images-to-pdf", () => {
  const source = read("src/pages/LandingRoutePage.tsx");
  assert.match(source, /default:\s*return assertNever\(embed\);/);
  assert.match(source, /if \(tool === "images-to-pdf"\) prefetchPdfLib\(\);/);
});
