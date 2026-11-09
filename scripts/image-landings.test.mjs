/**
 * The image format landing pages: png-to-jpg, jpg-to-png, webp-to-png, and the
 * existing webp-to-jpg, all served by the image format converter on a preset.
 *
 *   node --experimental-strip-types --test scripts/image-landings.test.mjs
 *
 * Covers the WebP signature in the magic-byte sniffer, the landing data, the
 * live-routes-only rule for every link these pages and the hub add, the parent
 * /image-format-converter retarget, and the converter's preset lock, input check
 * and encoding guards. Pages are rendered from the SSR bundle (dist-ssg), rebuilt
 * first when its sources are newer.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import { FORMAT_ACCEPT, sniffImageFile, sniffImageFormat } from "../src/lib/image/sniffImageFormat.ts";
import { HUB_GUIDES } from "../src/data/hubGuides.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SELF = fileURLToPath(import.meta.url);
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const TOOL = "src/components/tools/implementations/image/ImageFormatConverterTool.tsx";

const NEW_PAGES = ["png-to-jpg", "jpg-to-png", "webp-to-png"];
const PAGES = [...NEW_PAGES, "webp-to-jpg"];
const EMBEDS = {
  "png-to-jpg": { tool: "image-format-converter", input: "png", output: "image/jpeg" },
  "jpg-to-png": { tool: "image-format-converter", input: "jpeg", output: "image/png" },
  "webp-to-png": { tool: "image-format-converter", input: "webp", output: "image/png" },
  "webp-to-jpg": { tool: "image-format-converter", input: "webp", output: "image/jpeg" },
};
const PICKER = { png: "Choose PNG", jpeg: "Choose JPG", webp: "Choose WebP" };
/** Pages that are not live. They must not be linked or mentioned anywhere. */
const DENIED = ["jpg-to-webp", "png-to-webp"];

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50]);

/* ------------------------------------------------------------------ */
/* Sniffer                                                             */
/* ------------------------------------------------------------------ */

test("sniffImageFormat recognises JPEG, PNG and WebP, and RIFF alone is not WebP", () => {
  assert.equal(sniffImageFormat(JPEG), "jpeg");
  assert.equal(sniffImageFormat(PNG), "png");
  assert.equal(sniffImageFormat(WEBP), "webp");
  assert.equal(sniffImageFormat(WEBP.slice(0, 12)), "webp", "12 bytes are enough");
  assert.equal(sniffImageFormat(new TextEncoder().encode("RIFF\0\0\0\0AVI ")), "other", "RIFF video");
  assert.equal(sniffImageFormat(new TextEncoder().encode("RIFF\0\0\0\0WAVE")), "other", "RIFF audio");
  assert.equal(sniffImageFormat(WEBP.slice(0, 11)), "other", "truncated WebP header");
  assert.equal(sniffImageFormat(WEBP.slice(0, 4)), "other", "RIFF without the WEBP form type");
  assert.equal(sniffImageFormat(new Uint8Array()), "other");
  assert.equal(sniffImageFormat(new Uint8Array([0xff])), "other");
});

test("sniffImageFile reads WebP from the bytes, not the name or MIME type", async () => {
  assert.equal(await sniffImageFile(new File([WEBP], "photo.png", { type: "image/png" })), "webp");
  assert.equal(await sniffImageFile(new File([WEBP], "download", { type: "" })), "webp");
  assert.equal(await sniffImageFile(new File([PNG], "x.webp", { type: "image/webp" })), "png");
  assert.equal(await sniffImageFile(new File([], "empty.webp", { type: "image/webp" })), "other");
  assert.equal(FORMAT_ACCEPT.webp, ".webp,image/webp");
  assert.equal(FORMAT_ACCEPT.png, ".png,image/png");
  assert.equal(FORMAT_ACCEPT.jpeg, ".jpg,.jpeg,.jfif,.jpe,image/jpeg");
});

/* ------------------------------------------------------------------ */
/* SSR                                                                 */
/* ------------------------------------------------------------------ */

function loadSsr() {
  const entry = join(ROOT, "dist-ssg", "entry-ssg.js");
  const sources = [
    "src/data/landingPages.ts",
    "src/data/hubGuides.ts",
    "src/pages/LandingRoutePage.tsx",
    "src/lib/image/sniffImageFormat.ts",
    TOOL,
    "src/data/toolContent/imageFormatConverter.ts",
    "src/data/toolSeo.ts",
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
for (const slug of [...PAGES, "image-format-converter"]) rendered.set(slug, (await ssr.renderRoute(`/${slug}`)).html);
const parent = ssr.resolveToolContent("image-format-converter");

const text = (html) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");

const fileInputs = (html) => html.match(/<input[^>]*type="file"[^>]*>/g) ?? [];
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const privacyFaq = (entry) => entry.faqs.find((f) => /tool-run/.test(f.answer));

/** A path is live when it is a landing page, a catalog tool or a known static page, and is prerendered. */
function isLive(path) {
  const known =
    ssr.LANDING_ROUTES.includes(path) ||
    ssr.TOOL_CATALOG.some((tool) => `/${tool.id}` === path) ||
    Object.prototype.hasOwnProperty.call(ssr.STATIC_ROUTE_MODULES, path);
  return known && ssr.PRERENDER_ROUTES.includes(path);
}

/* ------------------------------------------------------------------ */
/* Landing data                                                        */
/* ------------------------------------------------------------------ */

test("the four preset pages exist with input and output, and unique titles, descriptions and H1s", () => {
  const others = ssr.LANDING_PAGES.filter((entry) => !PAGES.includes(entry.slug));
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
    assert.notEqual(entry.h1, parent.hero.h1, `${slug} reuses the parent H1`);
    assert.notEqual(title, parent.seo.title);
    assert.ok(entry.footerLabel && entry.lede);
    assert.ok(ssr.PRERENDER_ROUTES.includes(`/${slug}`), `${slug} is not prerendered`);
  }
  for (const key of ["title", "description"]) {
    assert.equal(new Set(PAGES.map((slug) => page(slug).seo[key])).size, PAGES.length, key);
  }
  assert.equal(new Set(PAGES.map((slug) => page(slug).h1)).size, PAGES.length);
});

test("new pages carry no palette entry and no benchmark", () => {
  // /webp-to-jpg predates this rule and keeps its palette entry; traffic-week1 requires it.
  for (const slug of NEW_PAGES) {
    assert.ok(!page(slug).palette, `${slug} should not add a palette entry`);
    assert.ok(!page(slug).benchmark, `${slug} should not have a benchmark`);
    assert.ok(!page(slug).measurementKey, `${slug} should not have a measurement key`);
  }
});

test("each page has a 3-step how-to, 4 to 6 FAQs and 150 to 300 words of prose", () => {
  for (const slug of PAGES) {
    const entry = page(slug);
    assert.equal(entry.howTo.steps.length, 3, slug);
    assert.ok(entry.faqs.length >= 4 && entry.faqs.length <= 6, `${slug} has ${entry.faqs.length} FAQs`);
    for (const tool of entry.tools) assert.ok(ssr.TOOL_CATALOG.some((t) => t.id === tool), `${slug} tool ${tool}`);
  }
  for (const slug of NEW_PAGES) {
    const entry = page(slug);
    const prose = words([entry.lede, ...entry.sections.flatMap((s) => s.body)].join(" "));
    assert.ok(prose >= 150 && prose <= 300, `${slug} has ${prose} words of prose`);
  }
});

test("output quality is stated plainly: 92% for JPG, lossless with no setting for PNG", () => {
  for (const slug of PAGES) {
    const json = JSON.stringify(page(slug));
    if (EMBEDS[slug].output === "image/jpeg") {
      assert.match(json, /92%/, `${slug} must say quality is fixed at 92%`);
    } else {
      assert.match(json, /lossless/i, slug);
      assert.match(json, /no quality (setting|level|control)/i, slug);
    }
  }
});

test("/webp-to-jpg no longer offers a format menu in its copy", () => {
  const json = JSON.stringify(page("webp-to-jpg"));
  assert.doesNotMatch(json, /still in the menu/i);
  assert.doesNotMatch(json, /opens with (JPEG|JPG) selected/i);
  assert.doesNotMatch(json, /switch the output/i);
  assert.match(page("webp-to-jpg").howTo.steps[1].title, /fixed to JPG/);
});

test("privacy answers keep files separate from analytics, name only tool and slug, and mention consent", () => {
  for (const slug of PAGES) {
    const faq = privacyFaq(page(slug));
    assert.ok(faq, `${slug} has no privacy FAQ naming tool-run`);
    assert.match(faq.answer, /never (leaves|uploaded)|not uploaded|stays on your device|never uploaded|leaves your device/i, slug);
    assert.match(faq.answer, /page view/, slug);
    assert.match(faq.answer, new RegExp(`image-format-converter and ${slug}`), slug);
    assert.match(faq.answer, /no file names?|file names and contents are never|no file name/i, slug);
    assert.match(faq.answer, /Google Analytics/, slug);
    assert.match(faq.answer, /consent/, slug);
    assert.match(faq.answer, /cookie notice/, slug);
    const json = JSON.stringify(page(slug));
    for (const banned of [/rich result/i, /nothing is sent/i, /one (network )?request/i, /only request/i, /guarantee/i]) {
      assert.doesNotMatch(json, banned, slug);
    }
  }
});

/* ------------------------------------------------------------------ */
/* Live routes only                                                    */
/* ------------------------------------------------------------------ */

test("related links on these pages go to the parent, live siblings and the image hub only", () => {
  for (const slug of NEW_PAGES) {
    const paths = page(slug).related.map((link) => link.path);
    assert.ok(paths.includes("/image-format-converter"), `${slug} lacks the parent`);
    assert.ok(paths.includes("/image-tools"), `${slug} lacks /image-tools`);
    const allowed = new Set(["/image-format-converter", "/image-tools", ...PAGES.filter((s) => s !== slug).map((s) => `/${s}`)]);
    for (const path of paths) assert.ok(allowed.has(path), `${slug} links ${path}`);
  }
  for (const slug of PAGES) {
    for (const { path } of page(slug).related) assert.ok(isLive(path), `${slug} links ${path}, not a live route`);
  }
});

test("hub rows on /image-tools list every format page next to WebP to JPG, and every row is live", () => {
  const rows = HUB_GUIDES["/image-tools"].rows;
  const paths = rows.map((row) => row.path);
  for (const route of Object.values(HUB_GUIDES).flatMap((hub) => hub.rows.map((row) => row.path))) {
    assert.ok(isLive(route), `hub row ${route} is not a live route`);
  }
  const at = paths.indexOf("/webp-to-jpg");
  assert.ok(at >= 0);
  assert.deepEqual(paths.slice(at, at + 4).sort(), ["/jpg-to-png", "/png-to-jpg", "/webp-to-jpg", "/webp-to-png"]);
});

test("the parent links exactly the live format pages, and every parent link is live", () => {
  const paths = parent.related.map((link) => link.path);
  const formatLinks = paths.filter((path) => /^\/(png|jpg|webp)-to-(png|jpg|webp)$/.test(path));
  assert.deepEqual(formatLinks.sort(), ["/jpg-to-png", "/png-to-jpg", "/webp-to-jpg", "/webp-to-png"]);
  for (const path of paths) assert.ok(isLive(path), `parent links ${path}, not a live route`);
  const visible = text(rendered.get("image-format-converter"));
  for (const label of ["PNG to JPG", "JPG to PNG", "WebP to PNG", "WebP to JPG"]) assert.ok(visible.includes(label), label);
});

test("/jpg-to-webp and /png-to-webp appear nowhere in src/ or scripts/", () => {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|mjs|js|json|css|md)$/.test(entry.name)) files.push(full);
    }
  };
  walk(join(ROOT, "src"));
  walk(join(ROOT, "scripts"));
  for (const file of files) {
    if (file === SELF) continue;
    const source = readFileSync(file, "utf8");
    for (const slug of DENIED) assert.ok(!source.includes(slug), `${relative(ROOT, file)} mentions ${slug}`);
  }
  for (const slug of DENIED) {
    assert.ok(!page(slug), `${slug} must not be a landing page`);
    assert.ok(!ssr.PRERENDER_ROUTES.includes(`/${slug}`), `${slug} must not be prerendered`);
  }
});

/* ------------------------------------------------------------------ */
/* Parent retarget                                                     */
/* ------------------------------------------------------------------ */

test("the parent is a generic converter: title, H1 and a description without quality control", () => {
  assert.equal(parent.hero.h1, "Image Format Converter");
  assert.ok(parent.seo.title.length <= 60, parent.seo.title);
  assert.match(parent.seo.title, /^Image Format Converter/);
  assert.ok(parent.seo.description.length >= 140 && parent.seo.description.length <= 165);
  assert.match(parent.seo.description, /92%/);
  assert.match(parent.seo.description, /lossless/);
  assert.doesNotMatch(parent.seo.description, /quality control/i);
  assert.doesNotMatch(read("src/data/toolSeo.ts"), /with quality control/);
});

/* ------------------------------------------------------------------ */
/* Rendered markup                                                     */
/* ------------------------------------------------------------------ */

test("preset pages narrow every file input to the input format, one file, with a preset picker label", () => {
  for (const slug of PAGES) {
    const html = rendered.get(slug);
    const { input } = EMBEDS[slug];
    const inputs = fileInputs(html);
    assert.ok(inputs.length >= 2, `${slug}: expected the landing dropzone and the tool's input, got ${inputs.length}`);
    for (const tag of inputs) {
      assert.equal(attr(tag, "accept"), FORMAT_ACCEPT[input], `${slug}: ${tag}`);
      assert.doesNotMatch(tag, /\smultiple/, `${slug}: ${tag}`);
    }
    assert.ok(text(html).includes(PICKER[input]), `${slug} picker label`);
    assert.match(html, /role="status"[^>]*aria-live="polite"[^>]*data-batch-status/, `${slug} has no live status line`);
    assert.doesNotMatch(text(html), /Output Format/);
  }
});

test("the parent keeps its wide image input", () => {
  // The tool page prerenders the lean-shell dropzone only; the tool mounts on first use.
  const inputs = fileInputs(rendered.get("image-format-converter"));
  assert.ok(inputs.length > 0);
  for (const tag of inputs) assert.equal(attr(tag, "accept"), "image/*", tag);
});

/* ------------------------------------------------------------------ */
/* Converter source                                                    */
/* ------------------------------------------------------------------ */

const source = read(TOOL);

test("a preset hides the format menu and locks the output", () => {
  assert.match(source, /const format = preset\?\.output \?\? chosenFormat;/);
  assert.match(source, /\{!preset && \(\s*<div>\s*<Label>Output Format<\/Label>/);
  assert.equal((source.match(/setFormat\(/g) ?? []).length, 1, "only the format menu may set the format");
  assert.match(source, /accept=\{preset \? FORMAT_ACCEPT\[preset\.input\] : "image\/\*"\}/);
});

test("input is sniffed before readImageFiles, presets compare to preset.input, blank MIME types are re-typed", () => {
  const sniff = source.indexOf("await sniffImageFile(file)");
  const decode = source.indexOf("await readImageFiles(");
  assert.ok(sniff > 0 && decode > sniff, "sniff must come before decoding");
  assert.match(source, /if \(preset && file\.size > 0 && found !== preset\.input\) \{\s*rejected\.push\(rejectionReason\(file\.name, found, preset\.input\)\);/);
  assert.match(source, /found !== "other" && file\.type !== FORMAT_MIME\[found\]/);
  assert.match(source, /setStatus\(\{ text: summarizeBatch\(accepted\.length, problems\)/);
  assert.match(source, /if \(!accepted\[0\]\) \{\s*setImageUrl\(null\);/, "a rejection clears the loaded image");
});

test("the WebP probe runs on mount and gates the notice and the WebP menu item", () => {
  assert.match(source, /canvas\.width = 1;\s*canvas\.height = 1;\s*canvas\.toBlob\(\(blob\) => done\(blob\?\.type === "image\/webp"\), "image\/webp"\);/);
  assert.match(source, /useEffect\(\(\) => \{[\s\S]*?probeWebpEncoding\([\s\S]*?\}, \[\]\);/);
  assert.match(source, /webpOffered && webpSupported === false && \(\s*<p role="note" className="text-sm text-muted-foreground">/);
  assert.match(source, /<Link to="\/png-to-jpg"/);
  assert.match(source, /disabled=\{f\.value === "image\/webp" && webpSupported === false\}/);
});

test("markToolSuccess runs only after the null-blob and WebP type guards", () => {
  const nullGuard = source.indexOf("if (!blob) {");
  const webpGuard = source.indexOf('if (format === "image/webp" && blob.type !== "image/webp") {');
  const success = source.indexOf("markToolSuccess(blob)");
  assert.ok(nullGuard > 0, "null-blob guard missing");
  assert.ok(webpGuard > 0, "WebP blob.type guard missing");
  assert.equal(source.split("markToolSuccess(").length - 1, 1, "exactly one markToolSuccess call");
  assert.ok(nullGuard < webpGuard && webpGuard < success, "both guards must precede markToolSuccess");
  for (const [start, end] of [[nullGuard, webpGuard], [webpGuard, source.indexOf("document.createElement(\"a\")", webpGuard)]]) {
    const block = source.slice(start, end);
    assert.match(block, /variant: "destructive"/);
    assert.match(block, /return;/);
    assert.doesNotMatch(block, /a\.click\(\)|markToolSuccess/);
  }
  assert.match(source.slice(nullGuard, webpGuard), /Could not create the file in this browser/);
  assert.match(source.slice(webpGuard, success), /can't create WebP files/);
  assert.ok(source.indexOf("a.click();", webpGuard) < success, "download happens before the success signal");
  assert.match(source, /ctx\.fillStyle = "#ffffff";/, "JPEG keeps the white fill");
  assert.match(source, /\? 0\.92 : undefined/, "quality stays 0.92");
});
