/**
 * /heic-to-pdf landing: the deliver/withhold guard, PDF assembly order,
 * landing data, schema, hubs, and the parent-tool links.
 *
 *   node --experimental-strip-types --test scripts/heic-to-pdf.test.mjs
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import { heicFileError } from "../src/lib/image/heic.ts";
import {
  A4_PAGE_SIZE,
  LETTER_PAGE_SIZE,
  assembleImagesPdf,
  heicToPdfOutcome,
  heicToPdfOutputName,
  imagePlacement,
  pageDimensions,
} from "../src/lib/image/heicToPdf.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const SLUG = "heic-to-pdf";

const PORTRAIT = Uint8Array.from(
  Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAQAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDwKiiivzI/uM//2Q==",
    "base64",
  ),
);
const LANDSCAPE = Uint8Array.from(
  Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAIABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD4sooor+4z5o//2Q==",
    "base64",
  ),
);
const SQUARE = Uint8Array.from(
  Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAMAAwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCWiiiv5qP5CP/Z",
    "base64",
  ),
);

test("heicToPdfOutcome withholds a download when nothing decoded", () => {
  assert.deepEqual(heicToPdfOutcome(0), { deliver: false, success: false, reason: "no-decoded" });
  assert.deepEqual(heicToPdfOutcome(-1), { deliver: false, success: false, reason: "no-decoded" });
  assert.deepEqual(heicToPdfOutcome(1), { deliver: true, success: true });
  assert.deepEqual(heicToPdfOutcome(3), { deliver: true, success: true });
});

test("heicToPdfOutputName uses the stem for one file and a batch name for several", () => {
  assert.equal(heicToPdfOutputName(["IMG_0412.HEIC"]), "IMG_0412.pdf");
  assert.equal(heicToPdfOutputName(["photo.heif"]), "photo.pdf");
  assert.equal(heicToPdfOutputName([".heic"]), "image.pdf");
  assert.equal(heicToPdfOutputName(["a.HEIC", "b.HEIC"]), "heic-photos.pdf");
});

test("a JPEG renamed .heic is refused before the decoder runs", () => {
  const head = PORTRAIT.subarray(0, 64);
  const message = heicFileError({ name: "photo.heic", size: PORTRAIT.length }, head);
  assert.match(message, /already a JPEG/i);
  assert.equal(heicFileError({ name: "empty.heic", size: 0 }, new Uint8Array()), "empty.heic is empty.");
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.match(heicFileError({ name: "shot.heic", size: 100 }, png), /already a PNG/i);
  assert.match(heicFileError({ name: "notes.heic", size: 12 }, new TextEncoder().encode("not a photo!!")), /not a HEIC or HEIF/i);
});

test("assembleImagesPdf writes a %PDF header, keeps pick order and portrait aspect", async () => {
  const bytes = await assembleImagesPdf([
    { name: "portrait.jpg", bytes: PORTRAIT, format: "jpeg" },
    { name: "landscape.jpg", bytes: LANDSCAPE, format: "jpeg" },
    { name: "square.jpg", bytes: SQUARE, format: "jpeg" },
  ]);
  assert.ok(bytes.byteLength > 0);
  assert.equal(Buffer.from(bytes.subarray(0, 5)).toString("ascii"), "%PDF-");
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  assert.equal(pages.length, 3);
  const sizes = pages.map((page) => page.getSize());
  assert.equal(sizes[0].width, 8);
  assert.equal(sizes[0].height, 16);
  assert.ok(sizes[0].height > sizes[0].width, "first page must stay portrait");
  assert.equal(sizes[1].width, 16);
  assert.equal(sizes[1].height, 8);
  assert.ok(sizes[1].width > sizes[1].height, "second page must stay landscape");
  assert.equal(sizes[2].width, 12);
  assert.equal(sizes[2].height, 12);
});

test("assembleImagesPdf refuses an empty list", async () => {
  await assert.rejects(() => assembleImagesPdf([]), /No decoded photos/);
});

test("pageDimensions covers A4, Letter, Fit and orientation swaps", () => {
  assert.deepEqual(pageDimensions(8, 16), { width: 8, height: 16 });
  assert.deepEqual(pageDimensions(8, 16, { pageSize: "fit", orientation: "auto" }), { width: 8, height: 16 });
  assert.deepEqual(pageDimensions(16, 8, { pageSize: "fit", orientation: "portrait" }), { width: 8, height: 16 });
  assert.deepEqual(pageDimensions(8, 16, { pageSize: "fit", orientation: "landscape" }), { width: 16, height: 8 });
  assert.deepEqual(pageDimensions(8, 16, { pageSize: "a4", orientation: "portrait" }), { width: A4_PAGE_SIZE[0], height: A4_PAGE_SIZE[1] });
  assert.deepEqual(pageDimensions(8, 16, { pageSize: "a4", orientation: "landscape" }), { width: A4_PAGE_SIZE[1], height: A4_PAGE_SIZE[0] });
  assert.deepEqual(pageDimensions(16, 8, { pageSize: "a4", orientation: "auto" }), { width: A4_PAGE_SIZE[1], height: A4_PAGE_SIZE[0] });
  assert.deepEqual(pageDimensions(8, 16, { pageSize: "a4", orientation: "auto" }), { width: A4_PAGE_SIZE[0], height: A4_PAGE_SIZE[1] });
  assert.deepEqual(pageDimensions(8, 16, { pageSize: "letter", orientation: "portrait" }), { width: LETTER_PAGE_SIZE[0], height: LETTER_PAGE_SIZE[1] });
  assert.deepEqual(pageDimensions(8, 16, { pageSize: "letter", orientation: "landscape" }), { width: LETTER_PAGE_SIZE[1], height: LETTER_PAGE_SIZE[0] });
});

test("imagePlacement is edge-to-edge with no margin, and inset or centred otherwise", () => {
  assert.deepEqual(imagePlacement(8, 16, 8, 16, 0), { x: 0, y: 0, width: 8, height: 16 });
  assert.deepEqual(imagePlacement(16, 8, 16, 8, 2), { x: 4, y: 2, width: 8, height: 4 });
  const letterboxed = imagePlacement(A4_PAGE_SIZE[0], A4_PAGE_SIZE[1], 16, 8, 0);
  assert.equal(letterboxed.width, A4_PAGE_SIZE[0]);
  assert.ok(letterboxed.height < A4_PAGE_SIZE[1]);
  assert.equal(letterboxed.x, 0);
  assert.ok(letterboxed.y > 0);
  const tight = imagePlacement(100, 100, 80, 80, 200);
  assert.equal(tight.width, 0);
  assert.equal(tight.height, 0);
  assert.equal(tight.x, 50);
  assert.equal(tight.y, 50);
});

test("assembleImagesPdf writes A4, Letter and landscape page sizes, and margin does not change them", async () => {
  const portrait = { name: "portrait.jpg", bytes: PORTRAIT, format: "jpeg" };
  const landscape = { name: "landscape.jpg", bytes: LANDSCAPE, format: "jpeg" };
  const { PDFDocument } = await import("pdf-lib");

  const a4 = await PDFDocument.load(await assembleImagesPdf([portrait], { pageSize: "a4", orientation: "portrait" }));
  assert.deepEqual(a4.getPages()[0].getSize(), { width: A4_PAGE_SIZE[0], height: A4_PAGE_SIZE[1] });

  const letter = await PDFDocument.load(await assembleImagesPdf([portrait], { pageSize: "letter", orientation: "portrait" }));
  assert.deepEqual(letter.getPages()[0].getSize(), { width: LETTER_PAGE_SIZE[0], height: LETTER_PAGE_SIZE[1] });

  const landscapeA4 = await PDFDocument.load(await assembleImagesPdf([landscape], { pageSize: "a4", orientation: "landscape" }));
  assert.deepEqual(landscapeA4.getPages()[0].getSize(), { width: A4_PAGE_SIZE[1], height: A4_PAGE_SIZE[0] });

  const fit = await PDFDocument.load(await assembleImagesPdf([portrait, landscape]));
  const fitSizes = fit.getPages().map((page) => page.getSize());
  assert.deepEqual(fitSizes[0], { width: 8, height: 16 });
  assert.deepEqual(fitSizes[1], { width: 16, height: 8 });

  const margined = await PDFDocument.load(
    await assembleImagesPdf([portrait], { pageSize: "a4", orientation: "portrait", margin: 36 }),
  );
  assert.deepEqual(margined.getPages()[0].getSize(), { width: A4_PAGE_SIZE[0], height: A4_PAGE_SIZE[1] });
  const box = imagePlacement(A4_PAGE_SIZE[0], A4_PAGE_SIZE[1], 8, 16, 36);
  assert.ok(box.x >= 36 && box.y >= 36);
  assert.ok(box.width < A4_PAGE_SIZE[0] - 72 || box.height < A4_PAGE_SIZE[1] - 72);
});

test("the tool withholds a download and a success mark when nothing is ready", () => {
  const source = read("src/components/tools/implementations/image/HeicToPdfTool.tsx");
  assert.match(source, /heicToPdfOutcome\(ready\.length\)/);
  assert.match(source, /if \(!outcome\.deliver\)/);
  assert.match(source, /No decoded photo is ready, so nothing was downloaded/);
  assert.match(source, /markToolSuccess\(blob\)/);
  const successAt = source.indexOf("markToolSuccess(blob)");
  const outcomeAt = source.indexOf("if (!outcome.deliver)");
  assert.ok(outcomeAt !== -1 && successAt !== -1 && outcomeAt < successAt);
  assert.match(source, /The decoder could not start in this browser/);
  assert.match(source, /This photo could not be decoded/);
  assert.doesNotMatch(source, /from "libheif-js"/);
  assert.match(source, /data-heic-pdf-page-size/);
  assert.match(source, /data-heic-pdf-orientation/);
  assert.match(source, /data-heic-pdf-margin/);
  assert.match(source, /data-heic-pdf-move-up/);
  assert.match(source, /data-heic-pdf-move-down/);
  assert.match(source, /data-heic-pdf-progress/);
  assert.match(source, /assembleImagesPdf\(images, \{ pageSize, orientation, margin \}\)/);
});

function loadSsr() {
  const entry = join(ROOT, "dist-ssg", "entry-ssg.js");
  const sources = [
    "src/data/landingPages.ts",
    "src/pages/LandingRoutePage.tsx",
    "src/lib/landingPageSchema.ts",
    "src/lib/leanShell.ts",
    "src/data/hubGuides.ts",
    "src/data/toolContent/heicToJpg.ts",
    "src/data/toolContent/imagesToPdf.ts",
    "src/pages/PdfToolsPage.tsx",
    "src/components/tools/implementations/image/HeicToPdfTool.tsx",
    "src/data/toolCatalog.ts",
    "src/lib/prerenderRoutes.ts",
    "src/lib/pdf/assembleImagesPdf.ts",
    "src/lib/allToolsForPalette.ts",
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
const page = ssr.LANDING_PAGES.find((entry) => entry.slug === SLUG);
const html = (await ssr.renderRoute(`/${SLUG}`)).html;
const hubs = {
  "image-tools": (await ssr.renderRoute("/image-tools")).html,
  "pdf-tools": (await ssr.renderRoute("/pdf-tools")).html,
  "converter-tools": (await ssr.renderRoute("/converter-tools")).html,
  "heic-to-jpg": (await ssr.renderRoute("/heic-to-jpg")).html,
  "heic-to-png": (await ssr.renderRoute("/heic-to-png")).html,
  "images-to-pdf": (await ssr.renderRoute("/images-to-pdf")).html,
  "jpg-to-pdf": (await ssr.renderRoute("/jpg-to-pdf")).html,
  "png-to-pdf": (await ssr.renderRoute("/png-to-pdf")).html,
  "all-tools": (await ssr.renderRoute("/all-tools")).html,
};

function graph() {
  const head = ssr.headForRoute(`/${SLUG}`);
  return [...head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(
    (m) => JSON.parse(m[1])["@graph"] ?? [],
  );
}

test("the landing exists with a unique title, description and H1, and a branded title that fits", () => {
  assert.ok(page);
  assert.deepEqual(page.embed, { tool: "heic-to-pdf" });
  assert.equal(page.seo.title, "HEIC to PDF – Convert iPhone Photos");
  assert.ok(page.seo.title.length + " | ToolOcean".length <= 60);
  assert.ok(!page.seo.title.includes("ToolOcean"));
  assert.ok(page.seo.description.length >= 140 && page.seo.description.length <= 165, page.seo.description.length);
  for (const other of ssr.LANDING_PAGES.filter((entry) => entry.slug !== SLUG)) {
    assert.notEqual(page.seo.title, other.seo.title);
    assert.notEqual(page.seo.description, other.seo.description);
    assert.notEqual(page.h1, other.h1);
  }
  assert.equal(page.h1, "Convert iPhone photos from HEIC to PDF");
  assert.equal(page.footerLabel, "HEIC to PDF");
  assert.ok(page.lede);
  assert.equal(page.palette?.name, "HEIC to PDF");
  assert.ok(ssr.PRERENDER_ROUTES.includes("/heic-to-pdf"));
});

test("the page has a 3-step how-to, 5 to 7 FAQs, FAQPage schema and a self canonical", () => {
  assert.equal(page.howTo.steps.length, 3);
  assert.ok(page.faqs.length >= 5 && page.faqs.length <= 7, page.faqs.length);
  const types = graph().map((node) => node["@type"]);
  assert.ok(types.includes("FAQPage"));
  assert.ok(types.includes("HowTo"));
  const faq = graph().find((node) => node["@type"] === "FAQPage");
  assert.equal(faq.mainEntity.length, page.faqs.length);
  const visible = page.faqs.map((entry) => entry.question);
  const schema = faq.mainEntity.map((entry) => entry.name);
  assert.deepEqual(schema, visible);
  const head = ssr.headForRoute(`/${SLUG}`);
  assert.match(head, /<link rel="canonical" href="https:\/\/toolocean\.co\/heic-to-pdf"/);
  assert.match(head, /<title>HEIC to PDF – Convert iPhone Photos \| ToolOcean<\/title>/);
});

test("privacy copy names Umami, optional GA, and tool-run fields tool and slug", () => {
  const privacy = page.faqs.find((entry) => /upload/i.test(entry.question));
  assert.ok(privacy);
  assert.match(privacy.answer, /aren't uploaded|never upload|not uploaded/i);
  assert.match(privacy.answer, /Umami/);
  assert.match(privacy.answer, /Google Analytics when configured/);
  assert.match(privacy.answer, /tool-run/);
  assert.match(privacy.answer, /heic-to-pdf and heic-to-pdf/);
});

test("related links resolve, and the hubs and parent tools point at the page", () => {
  const paths = page.related.map((link) => link.path);
  for (const required of [
    "/heic-to-jpg",
    "/heic-to-png",
    "/images-to-pdf",
    "/jpg-to-pdf",
    "/png-to-pdf",
    "/image-tools",
    "/pdf-tools",
    "/all-tools",
  ]) {
    assert.ok(paths.includes(required), `missing ${required}`);
  }
  for (const path of paths) assert.ok(ssr.PRERENDER_ROUTES.includes(path), `related ${path} is not prerendered`);
  for (const tool of page.tools) assert.ok(ssr.TOOL_CATALOG.some((entry) => entry.id === tool), tool);
  assert.ok(!ssr.TOOL_CATALOG.some((entry) => entry.id === SLUG), "a catalog entry would retitle / and /all-tools and break uniqueness allowlists");
  assert.equal(ssr.PRERENDER_ROUTES.filter((route) => route === "/heic-to-pdf").length, 1);
  assert.match(hubs["image-tools"], /href="\/heic-to-pdf"/);
  assert.match(hubs["pdf-tools"], /href="\/heic-to-pdf"/);
  assert.match(hubs["converter-tools"], /href="\/heic-to-pdf"/);
  assert.match(hubs["heic-to-jpg"], /href="\/heic-to-pdf"/);
  assert.match(hubs["heic-to-png"], /href="\/heic-to-pdf"/);
  assert.match(hubs["images-to-pdf"], /href="\/heic-to-pdf"/);
  assert.match(hubs["jpg-to-pdf"], /href="\/heic-to-pdf"/);
  assert.match(hubs["png-to-pdf"], /href="\/heic-to-pdf"/);
  const llms = read("public/llms.txt");
  assert.match(llms, /HEIC to PDF/);
  assert.match(llms, /https:\/\/toolocean\.co\/heic-to-pdf/);
});

test("the prerendered workbench dropzone accepts HEIC and the embed is wired", () => {
  assert.match(html, /data-lean-embed="heic-to-pdf"/);
  const inputs = html.match(/<input[^>]*type="file"[^>]*>/g) ?? [];
  assert.ok(inputs.length > 0, "no file input");
  assert.ok(
    inputs.some((tag) => /accept="[^"]*heic[^"]*"/i.test(tag) && /\bmultiple\b/.test(tag)),
    inputs.join("\n"),
  );
  const source = read("src/pages/LandingRoutePage.tsx");
  assert.match(source, /case "heic-to-pdf":\s*return <HeicToPdfTool/);
});

test("prerendered HTML in dist matches, when a build is present", (t) => {
  if (!existsSync(join(ROOT, "dist", "heic-to-pdf", "index.html"))) {
    t.skip("dist/ has no build with the new page; run npm run build");
    return;
  }
  const built = read("dist/heic-to-pdf/index.html");
  assert.equal((built.match(/<h1\b/g) ?? []).length, 1);
  assert.ok(built.includes('"@type":"FAQPage"') && built.includes('"@type":"HowTo"'));
  assert.match(built, /<link rel="canonical" href="https:\/\/toolocean\.co\/heic-to-pdf"/);
  const sitemap = read("public/sitemap.xml");
  assert.ok(sitemap.includes("<loc>https://toolocean.co/heic-to-pdf</loc>"));
});
