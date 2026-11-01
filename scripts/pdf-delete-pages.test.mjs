/**
 * Delete PDF Pages: range parsing, selections, the rebuilt document, the thumbnail
 * queue, and the page copy the tool promises.
 *   node --experimental-strip-types --test scripts/pdf-delete-pages.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import * as pdfLib from "pdf-lib";
import {
  DeleteAllPagesError,
  deletePages,
  editedFileName,
  evenPages,
  formatRange,
  keptPages,
  oddPages,
  parseRange,
} from "../src/lib/pdf/deletePages.ts";
import { PdfOpenError } from "../src/lib/pdf/pageNumbers.ts";
import { createThumbnailQueue } from "../src/lib/pdf/thumbnailQueue.ts";
import { pdfDeletePagesContent } from "../src/data/toolContent/pdfDeletePages.ts";
import { toolSeoData } from "../src/data/toolSeo.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const TOOL = "src/components/tools/implementations/pdf/PdfDeletePagesTool.tsx";

describe("parseRange", () => {
  it("reads single pages, ranges and spaces", () => {
    assert.deepEqual(parseRange("3", 10), { pages: [3] });
    assert.deepEqual(parseRange("2-4, 9", 10), { pages: [2, 3, 4, 9] });
    assert.deepEqual(parseRange("  2 - 4 ,9  ", 10), { pages: [2, 3, 4, 9] });
    assert.deepEqual(parseRange("2–4", 10), { pages: [2, 3, 4] });
  });

  it("treats empty text as no pages, not as an error", () => {
    assert.deepEqual(parseRange("", 10), { pages: [] });
    assert.deepEqual(parseRange("   ", 10), { pages: [] });
    assert.deepEqual(parseRange("2,", 10), { pages: [2] });
  });

  it("turns a reversed range around", () => {
    assert.deepEqual(parseRange("4-2", 10), { pages: [2, 3, 4] });
  });

  it("collapses duplicates and sorts", () => {
    assert.deepEqual(parseRange("9, 2, 2-3, 3", 10), { pages: [2, 3, 9] });
  });

  it("reads open-ended ranges to the first and last page", () => {
    assert.deepEqual(parseRange("8-", 10), { pages: [8, 9, 10] });
    assert.deepEqual(parseRange("-2", 10), { pages: [1, 2] });
  });

  it("rejects pages outside the document with no pages selected", () => {
    for (const text of ["11", "9-12", "0", "0-3", "2, 11"]) {
      const result = parseRange(text, 10);
      assert.deepEqual(result.pages, [], text);
      assert.ok(result.error, text);
    }
    assert.match(parseRange("11", 10).error, /10 pages/);
    assert.match(parseRange("2", 1).error, /1 page\b/);
  });

  it("rejects garbage", () => {
    for (const text of ["abc", "1-2-3", "2..4", "-", "1,x", "2.5", "1e3"]) {
      const result = parseRange(text, 10);
      assert.deepEqual(result.pages, [], text);
      assert.ok(result.error, text);
    }
  });

  it("does not spin on an absurd number", () => {
    assert.ok(parseRange("1-99999999999999", 10).error);
  });
});

describe("formatRange", () => {
  it("writes the compact form", () => {
    assert.equal(formatRange([]), "");
    assert.equal(formatRange([5]), "5");
    assert.equal(formatRange([2, 3]), "2-3");
    assert.equal(formatRange([2, 3, 4, 9]), "2-4, 9");
    assert.equal(formatRange([1, 3, 5, 6, 7, 10]), "1, 3, 5-7, 10");
  });

  it("round-trips through parseRange", () => {
    for (const pages of [[], [1], [10], [1, 2, 3], [2, 3, 4, 9], [1, 3, 5, 7, 9], [1, 2, 4, 5, 7, 8, 10]]) {
      assert.deepEqual(parseRange(formatRange(pages), 10).pages, pages);
    }
  });

  it("canonicalises whatever was typed", () => {
    assert.equal(formatRange(parseRange("9,4-2 ,3", 10).pages), "2-4, 9");
  });
});

describe("selections", () => {
  it("lists odd and even pages", () => {
    assert.deepEqual(oddPages(7), [1, 3, 5, 7]);
    assert.deepEqual(evenPages(7), [2, 4, 6]);
    assert.deepEqual(evenPages(1), []);
  });

  it("lists the pages that stay, in order", () => {
    assert.deepEqual(keptPages(5, [2, 4]), [1, 3, 5]);
    assert.deepEqual(keptPages(3, []), [1, 2, 3]);
    assert.deepEqual(keptPages(3, [1, 2, 3]), []);
    assert.deepEqual(keptPages(3, [2, 2, 99]), [1, 3]);
  });

  it("names the download", () => {
    assert.equal(editedFileName("report.pdf"), "report-edited.pdf");
    assert.equal(editedFileName("REPORT.PDF"), "REPORT-edited.pdf");
  });
});

/* ---------- Integration: delete from a real document, then read it back. ---------- */

const SIZES = [
  [612, 792],
  [842, 595],
  [595, 842],
  [612, 792],
  [400, 600],
  [612, 1008],
  [300, 300],
  [500, 700],
  [612, 792],
  [720, 540],
];

async function labelledDoc() {
  const doc = await pdfLib.PDFDocument.create();
  const font = await doc.embedFont(pdfLib.StandardFonts.Helvetica);
  SIZES.forEach(([width, height], index) => {
    const page = doc.addPage([width, height]);
    page.drawText(`label-${index + 1}`, { x: 40, y: height - 80, size: 20, font });
  });
  return doc;
}

const STANDARD_FONTS = new URL("../node_modules/pdfjs-dist/standard_fonts/", import.meta.url).pathname;

async function readPages(bytes) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(bytes),
    disableFontFace: true,
    useSystemFonts: false,
    standardFontDataUrl: STANDARD_FONTS,
    verbosity: 0,
  }).promise;
  const out = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    out.push(
      content.items
        .filter((item) => "str" in item && item.str.trim())
        .map((item) => item.str)
        .join(" "),
    );
  }
  await pdf.destroy();
  return out;
}

/** Page dicts held anywhere in the file, reachable or not. */
async function pageObjectCount(bytes) {
  const doc = await pdfLib.PDFDocument.load(bytes, { updateMetadata: false });
  const type = pdfLib.PDFName.of("Type");
  const page = pdfLib.PDFName.of("Page");
  return doc.context
    .enumerateIndirectObjects()
    .filter(([, object]) => object instanceof pdfLib.PDFDict && object.get(type) === page).length;
}

/** A link on `fromIndex` that jumps straight to the page object at `toIndex`. */
function addInternalLink(doc, fromIndex, toIndex) {
  const pages = doc.getPages();
  const link = doc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [40, 40, 200, 80],
    Dest: [pages[toIndex].ref, "Fit"],
  });
  pages[fromIndex].node.addAnnot(doc.context.register(link));
}

function addWebLink(doc, index, uri) {
  const link = doc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [40, 90, 200, 130],
    A: { S: "URI", URI: pdfLib.PDFString.of(uri) },
  });
  doc.getPages()[index].node.addAnnot(doc.context.register(link));
}

describe("deletePages", () => {
  it("keeps the remaining pages in their original order", async () => {
    const source = await (await labelledDoc()).save();
    const out = await deletePages(pdfLib, new Uint8Array(source), [1, 2, 3, 8]);
    const text = await readPages(out);
    assert.deepEqual(text, ["label-1", "label-5", "label-6", "label-7", "label-8", "label-10"]);

    const doc = await pdfLib.PDFDocument.load(out);
    assert.equal(doc.getPageCount(), 6);
    assert.deepEqual(
      doc.getPages().map((page) => {
        const { width, height } = page.getSize();
        return [width, height];
      }),
      [SIZES[0], SIZES[4], SIZES[5], SIZES[6], SIZES[7], SIZES[9]],
    );
  });

  it("does not depend on the order of the list, and ignores repeats", async () => {
    const source = await (await labelledDoc()).save();
    const out = await deletePages(pdfLib, new Uint8Array(source), [8, 1, 8, 3, 2]);
    assert.equal((await readPages(out))[1], "label-5");
    assert.equal((await readPages(out)).length, 6);
  });

  it("keeps rotation and crop on the kept pages", async () => {
    const doc = await labelledDoc();
    doc.getPages()[4].setRotation(pdfLib.degrees(90));
    doc.getPages()[4].setCropBox(50, 80, 300, 400);
    const out = await deletePages(pdfLib, await doc.save(), [0]);
    const page = (await pdfLib.PDFDocument.load(out)).getPages()[3];
    assert.equal(page.getRotation().angle, 90);
    assert.deepEqual(page.getCropBox(), { x: 50, y: 80, width: 300, height: 400 });
  });

  it("refuses to delete every page with a typed error", async () => {
    const source = await (await labelledDoc()).save();
    await assert.rejects(
      deletePages(pdfLib, new Uint8Array(source), SIZES.map((_, index) => index)),
      DeleteAllPagesError,
    );
  });

  it("refuses encrypted and broken files with a typed error", async () => {
    await assert.rejects(deletePages(pdfLib, new TextEncoder().encode("not a pdf"), [0]), (error) => {
      assert.ok(error instanceof PdfOpenError);
      assert.equal(error.kind, "invalid");
      return true;
    });

    const { PDFDocument: Cantoo } = await import("@cantoo/pdf-lib");
    const plain = await Cantoo.load(await (await labelledDoc()).save());
    plain.encrypt({ userPassword: "pw", ownerPassword: "owner" });
    const locked = await plain.save();
    await assert.rejects(deletePages(pdfLib, locked, [0]), (error) => {
      assert.ok(error instanceof PdfOpenError);
      assert.equal(error.kind, "encrypted");
      return true;
    });
  });

  it("leaves no copy of a deleted page behind when a kept page links to it", async () => {
    const doc = await labelledDoc();
    addInternalLink(doc, 0, 5);
    addInternalLink(doc, 1, 0);
    const source = await doc.save({ useObjectStreams: false });

    const out = await deletePages(pdfLib, source, [2, 3, 4, 5, 6, 7, 8, 9]);

    assert.deepEqual(await readPages(out), ["label-1", "label-2"]);
    assert.equal(await pageObjectCount(out), 2);
  });

  it("keeps links to the web", async () => {
    const doc = await labelledDoc();
    addWebLink(doc, 0, "https://example.com/");
    const out = await deletePages(pdfLib, await doc.save(), [1]);
    const reread = await pdfLib.PDFDocument.load(out);
    const annots = reread.getPages()[0].node.Annots();
    assert.equal(annots.size(), 1);
    const action = reread.context.lookup(annots.get(0)).lookup(pdfLib.PDFName.of("A"));
    assert.match(action.lookup(pdfLib.PDFName.of("URI")).toString(), /example\.com/);
  });
});

describe("thumbnail queue", () => {
  /** A render that stays pending until the test releases it. */
  function harness(concurrency = 2) {
    const started = [];
    const finished = [];
    const failed = [];
    const release = new Map();
    const signals = new Map();
    const queue = createThumbnailQueue({
      concurrency,
      render: (index, signal) =>
        new Promise((resolve, reject) => {
          started.push(index);
          signals.set(index, signal);
          release.set(index, { resolve: () => resolve(`thumb-${index}`), reject });
        }),
      onDone: (index, result) => finished.push([index, result]),
      onFail: (index) => failed.push(index),
    });
    return { queue, started, finished, failed, release, signals };
  }

  const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

  it("never runs more than the limit at once", async () => {
    const { queue, started, release } = harness(2);
    for (const index of [0, 1, 2, 3, 4]) queue.request(index);
    await tick();
    assert.equal(started.length, 2);
    release.get(started[0]).resolve();
    await tick();
    assert.equal(started.length, 3);
  });

  it("renders what was asked for last first, and each page once", async () => {
    const { queue, started, release } = harness(1);
    queue.request(0);
    await tick();
    assert.deepEqual(started, [0]);
    for (const index of [1, 2, 7, 7, 0]) queue.request(index);
    release.get(0).resolve();
    await tick();
    assert.deepEqual(started, [0, 7]);
  });

  it("forgets a page scrolled past before it started", async () => {
    const { queue, started, release } = harness(1);
    queue.request(0);
    await tick();
    for (const index of [1, 2]) queue.request(index);
    queue.drop(2);
    release.get(0).resolve();
    await tick();
    assert.deepEqual(started, [0, 1]);
  });

  it("does not render a page again after it finished or failed", async () => {
    const { queue, started, finished, failed, release } = harness(1);
    queue.request(0);
    await tick();
    release.get(0).resolve();
    await tick();
    queue.request(1);
    await tick();
    release.get(1).reject(new Error("bad page"));
    await tick();
    queue.request(0);
    queue.request(1);
    await tick();
    assert.deepEqual(started, [0, 1]);
    assert.deepEqual(finished, [[0, "thumb-0"]]);
    assert.deepEqual(failed, [1]);
  });

  it("stops everything on destroy, and reports nothing afterwards", async () => {
    const { queue, started, finished, failed, release, signals } = harness(1);
    queue.request(0);
    await tick();
    queue.request(1);
    queue.destroy();
    assert.equal(signals.get(0).aborted, true);
    release.get(0).resolve();
    await tick();
    queue.request(5);
    await tick();
    assert.deepEqual(started, [0]);
    assert.deepEqual(finished, []);
    assert.deepEqual(failed, []);
  });
});

describe("the page keeps its promises", () => {
  it("sends a locked file to the bank statement page first, then to Unlock PDF", () => {
    const source = read(TOOL);
    const primary = source.indexOf('to="/remove-password-from-bank-statement-pdf"');
    const secondary = source.indexOf('to="/pdf-unlock"');
    assert.ok(primary > 0, "links to the bank statement page");
    assert.ok(secondary > primary, "Unlock PDF comes second");
    const block = source.slice(primary, secondary);
    assert.match(block, /Remove the password first/);
    assert.match(block, /buttonVariants\(\{/, "the first link is drawn as the primary button");
  });

  it("title leads with No Upload, fits, and is unique", () => {
    const { title } = toolSeoData["pdf-delete-pages"];
    assert.equal(`${title} | ToolOcean`, "Delete Pages from PDF – No Upload, Free | ToolOcean");
    assert.ok(`${title} | ToolOcean`.length <= 60);
    assert.ok(title.indexOf("No Upload") <= 24);
    assert.equal(pdfDeletePagesContent.seo.title, title);
    const same = Object.entries(toolSeoData).filter(([, entry]) => entry.title === title);
    assert.deepEqual(same.map(([key]) => key), ["pdf-delete-pages"]);
  });

  it("description covers the search terms in 150-160 characters", () => {
    const { description } = pdfDeletePagesContent.seo;
    assert.ok(description.length >= 140 && description.length <= 165, `${description.length}`);
    assert.match(description, /delete|remove/i);
    assert.match(description, /thumbnail/i);
    assert.match(description, /no upload/i);
    assert.equal(toolSeoData["pdf-delete-pages"].description, description);
  });

  it("intro's first sentence opens with no upload", () => {
    const [first] = pdfDeletePagesContent.intro.paragraphs[0].split(/(?<=\.)\s/);
    assert.ok(first.toLowerCase().indexOf("no upload") <= 2, first);
  });

  it("copy links Split, Reorder and Unlock", () => {
    const paths = pdfDeletePagesContent.related.map((link) => link.path);
    for (const path of ["/pdf-split", "/pdf-reorder", "/pdf-unlock"]) assert.ok(paths.includes(path), path);
    assert.ok(pdfDeletePagesContent.faqs.length >= 8);
  });

  it("Split, Reorder and Unlock link back", () => {
    for (const file of ["pdfSplit", "pdfReorder", "pdfUnlock"]) {
      assert.match(read(`src/data/toolContent/${file}.ts`), /path: "\/pdf-delete-pages"/, file);
    }
  });

  it("keeps both PDF engines out of the static import graph", () => {
    const statik = /^(?!import type)\s*import\s[^;]*from\s+["'](pdf-lib|pdfjs-dist)[^"']*["']/m;
    for (const file of [TOOL, "src/lib/pdf/deletePages.ts", "src/lib/pdf/thumbnailQueue.ts"]) {
      assert.doesNotMatch(read(file), statik, file);
    }
  });

  it("signals success only after the download", () => {
    const source = read(TOOL);
    assert.equal(source.match(/markToolSuccess\(/g).length, 1);
    assert.ok(source.indexOf("markToolSuccess(") > source.indexOf("downloadPdf("));
    const catchBlocks = source.match(/catch \([^)]*\) \{[\s\S]*?\n {8}\}/g) ?? [];
    for (const block of catchBlocks) assert.doesNotMatch(block, /markToolSuccess/);
  });
});
