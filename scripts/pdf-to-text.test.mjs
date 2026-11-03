/**
 * PDF to Text: line reconstruction, page ranges, trimming, scan notices, assembly,
 * counts, file names, and the promises the page makes.
 *   node --experimental-strip-types --test scripts/pdf-to-text.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  NO_TEXT_MARKER,
  assembleText,
  countCharacters,
  countWords,
  extractPage,
  isScannedPage,
  looksLikePdf,
  pageSeparator,
  parsePageRange,
  reconstructLines,
  scanMessage,
  scannedPages,
  textFileName,
  trimWhitespace,
} from "../src/lib/pdfToText.ts";
import { pdfToTextContent, wordCounterContent } from "../src/data/toolContent/pdfToText.ts";
import { toolSeoData } from "../src/data/toolSeo.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const TOOL = "src/components/tools/implementations/pdf/PdfToTextTool.tsx";
const LIB = "src/lib/pdfToText.ts";

/** A text item at (x, y) in a 10pt font. Width defaults to 5pt per character. */
const item = (str, x, y, { size = 10, width, eol = false } = {}) => ({
  str,
  transform: [size, 0, 0, size, x, y],
  width: width ?? str.length * size * 0.5,
  height: size,
  hasEOL: eol,
});
const eol = () => ({ str: "", transform: [1, 0, 0, 1, 0, 0], width: 0, height: 0, hasEOL: true });

describe("reconstructLines", () => {
  it("joins runs on one baseline and breaks on hasEOL", () => {
    const items = [item("Hello", 10, 700), item(" world", 35, 700, { eol: true }), item("Next", 10, 688)];
    assert.equal(reconstructLines(items), "Hello world\nNext");
  });

  it("treats an empty item with hasEOL as a line break", () => {
    const items = [item("One", 10, 700), eol(), item("Two", 10, 700)];
    assert.equal(reconstructLines(items), "One\nTwo");
  });

  it("starts a new line when y moves by more than half the font height", () => {
    const items = [item("First", 10, 700), item("Second", 10, 688)];
    assert.equal(reconstructLines(items), "First\nSecond");
  });

  it("keeps a small baseline shift, like a superscript, on the line", () => {
    const items = [item("E=mc", 10, 700), item("2", 30, 703, { size: 7 })];
    assert.equal(reconstructLines(items), "E=mc2");
  });

  it("inserts a space when the x gap is over about 0.2 em", () => {
    // "Hello" ends at 10 + 25 = 35; the next run starts 3pt (0.3 em) later.
    const items = [item("Hello", 10, 700), item("world", 38, 700)];
    assert.equal(reconstructLines(items), "Hello world");
  });

  it("does not add spaces between adjacent glyph runs of one word", () => {
    const items = [item("Ex", 10, 700), item("tra", 20, 700), item("ct", 35.5, 700)];
    assert.equal(reconstructLines(items), "Extract");
  });

  it("does not double a space that is already there", () => {
    const items = [item("Hello ", 10, 700), item("world", 50, 700)];
    assert.equal(reconstructLines(items), "Hello world");
    const lead = [item("Hello", 10, 700), item(" world", 50, 700)];
    assert.equal(reconstructLines(lead), "Hello world");
  });

  it("turns a large vertical gap into a blank line", () => {
    const items = [
      item("Line one", 10, 700),
      item("Line two", 10, 688),
      item("Line three", 10, 676),
      item("New paragraph", 10, 640),
      item("continues", 10, 628),
    ];
    assert.equal(reconstructLines(items), "Line one\nLine two\nLine three\n\nNew paragraph\ncontinues");
  });

  it("uses a default leading when a page has too few lines to measure", () => {
    assert.equal(reconstructLines([item("Title", 10, 700), item("Body", 10, 660)]), "Title\n\nBody");
    assert.equal(reconstructLines([item("Title", 10, 700), item("Body", 10, 688)]), "Title\nBody");
  });

  it("keeps stream order rather than sorting", () => {
    const items = [item("Bottom", 10, 100), item("Top", 10, 700)];
    assert.match(reconstructLines(items), /^Bottom\n+Top$/);
  });

  it("returns an empty string for no items", () => {
    assert.equal(reconstructLines([]), "");
    assert.equal(reconstructLines([eol(), item("   ", 10, 700)]).trim(), "");
  });
});

describe("parsePageRange", () => {
  it("reads lists, ranges and open ends, whitespace tolerant", () => {
    assert.deepEqual(parsePageRange("1-3, 5, 8-", 10), { pages: [1, 2, 3, 5, 8, 9, 10] });
    assert.deepEqual(parsePageRange("  2 - 4 ,9 ", 10), { pages: [2, 3, 4, 9] });
    assert.deepEqual(parsePageRange("-2", 10), { pages: [1, 2] });
    assert.deepEqual(parsePageRange("2–4", 10), { pages: [2, 3, 4] });
  });

  it("sorts, removes repeats and turns reversed ranges around", () => {
    assert.deepEqual(parsePageRange("9, 2, 3-2, 3", 10), { pages: [2, 3, 9] });
  });

  it("rejects pages outside the document with the page count", () => {
    const result = parsePageRange("2, 12", 10);
    assert.equal(result.pages, undefined);
    assert.match(result.error, /Page 12 does not exist/);
    assert.match(result.error, /10 pages/);
    assert.match(parsePageRange("2", 1).error, /1 page\./);
    assert.match(parsePageRange("0-2", 10).error, /start at 1/);
  });

  it("rejects syntax it does not understand", () => {
    for (const text of ["abc", "1-2-3", "-", "3 4", "1.5"]) {
      assert.ok(parsePageRange(text, 10).error, text);
    }
  });

  it("asks for at least one page when the list is empty", () => {
    assert.ok(parsePageRange("", 10).error);
    assert.ok(parsePageRange(" , ", 10).error);
  });
});

describe("trimWhitespace", () => {
  it("collapses spaces, strips line ends and squeezes blank lines", () => {
    assert.equal(trimWhitespace("a   b\t\tc  \nd \n\n\n\ne"), "a b c\nd\n\ne");
    assert.equal(trimWhitespace("\n\nhello\n\n"), "hello");
    assert.equal(trimWhitespace("one\n\ntwo"), "one\n\ntwo");
  });
});

describe("scan detection and message", () => {
  it("flags a page with only whitespace items", () => {
    assert.equal(isScannedPage([]), true);
    assert.equal(isScannedPage([item(" ", 0, 0), eol()]), true);
    assert.equal(isScannedPage([item("x", 0, 0)]), false);
  });

  it("lists exact page numbers", () => {
    assert.equal(scanMessage([], 5, true), null);
    assert.equal(
      scanMessage([3], 9, true),
      "Page 3 looks like a scan, no text layer, so there is no text to copy from it.",
    );
    assert.equal(
      scanMessage([3, 7], 9, true),
      "Pages 3, 7 look like scans, no text layer, so there is no text to copy from them.",
    );
  });

  it("says so plainly when every page is a scan", () => {
    assert.match(scanMessage([1, 2, 3], 3, true), /^Every page in this PDF looks like a scan/);
    assert.match(scanMessage([1], 1, true), /only page looks like a scan/);
    assert.match(scanMessage([4, 5], 2, false), /^Every page you chose/);
  });

  it("never promises to read the scans", () => {
    for (const message of [scanMessage([3], 9, true), scanMessage([1, 2], 2, true)]) {
      assert.doesNotMatch(message, /OCR|recogni/i);
    }
  });
});

describe("assembleText", () => {
  const pages = [
    extractPage(1, [item("Alpha  one", 10, 700)]),
    extractPage(2, []),
    extractPage(3, [item("Gamma", 10, 700)]),
  ];

  it("puts a separator before each page and marks scans", () => {
    assert.equal(pageSeparator(4), "--- Page 4 ---");
    assert.equal(
      assembleText(pages, { pageBreaks: true, trim: true }),
      `--- Page 1 ---\nAlpha one\n\n--- Page 2 ---\n${NO_TEXT_MARKER}\n\n--- Page 3 ---\nGamma`,
    );
  });

  it("flows plain text and leaves scans out without breaks", () => {
    assert.equal(assembleText(pages, { pageBreaks: false, trim: true }), "Alpha one\n\nGamma");
    assert.equal(assembleText(pages, { pageBreaks: false, trim: false }), "Alpha  one\n\nGamma");
  });

  it("reports scanned pages in order", () => {
    assert.deepEqual(scannedPages(pages), [2]);
  });
});

describe("counts and names", () => {
  it("counts code points and whitespace-separated words", () => {
    assert.equal(countCharacters("abc"), 3);
    assert.equal(countCharacters("a😀b"), 3);
    assert.equal(countCharacters(""), 0);
    assert.equal(countWords("  one two\nthree\t four  "), 4);
    assert.equal(countWords(""), 0);
  });

  it("keeps the base name exactly and swaps the extension", () => {
    assert.equal(textFileName("Bank Statement.pdf"), "Bank Statement.txt");
    assert.equal(textFileName("report.final.PDF"), "report.final.txt");
    assert.equal(textFileName("notes"), "notes.txt");
    assert.equal(textFileName(".pdf"), "document.txt");
  });

  it("recognises a PDF header", () => {
    assert.equal(looksLikePdf(new TextEncoder().encode("%PDF-1.7\n...")), true);
    assert.equal(looksLikePdf(new TextEncoder().encode("PK\u0003\u0004 zip")), false);
  });
});

describe("the page keeps its promises", () => {
  it("title is as specified, fits, and is unique", () => {
    const { title } = toolSeoData["pdf-to-text"];
    assert.equal(`${title} | ToolOcean`, "PDF to Text – Copy Text From a PDF, No Upload | ToolOcean");
    assert.ok(`${title} | ToolOcean`.length <= 60);
    assert.equal(pdfToTextContent.seo.title, title);
    const same = Object.entries(toolSeoData).filter(([, entry]) => entry.title === title);
    assert.deepEqual(same.map(([key]) => key), ["pdf-to-text"]);
  });

  it("description covers the queries in 140-165 characters", () => {
    const { description } = pdfToTextContent.seo;
    assert.ok(description.length >= 140 && description.length <= 165, `${description.length}`);
    assert.match(description, /pdf to text/i);
    assert.match(description, /copy text from a pdf/i);
    assert.match(description, /no upload/i);
    assert.equal(toolSeoData["pdf-to-text"].description, description);
  });

  it("intro leads with copy text from a PDF, no upload", () => {
    assert.match(pdfToTextContent.intro.paragraphs[0], /^Copy text from a PDF, no upload/);
  });

  it("has the FAQs the page needs", () => {
    const all = pdfToTextContent.faqs.map((faq) => `${faq.question} ${faq.answer}`).join("\n");
    assert.ok(pdfToTextContent.faqs.length >= 8);
    for (const pattern of [/never leaves your browser/, /password/i, /scan/i, /page range|1-3, 5, 8-/i, /large/i, /column/i, /bank statement/i]) {
      assert.match(all, pattern);
    }
    assert.match(all, /\(\/remove-password-from-bank-statement-pdf\)/);
    assert.doesNotMatch(all, /cookie/i);
  });

  it("links PDF to Images, Split, Unlock and Word Counter", () => {
    const paths = pdfToTextContent.related.map((link) => link.path);
    for (const path of ["/pdf-to-images", "/pdf-split", "/pdf-unlock", "/word-counter"]) assert.ok(paths.includes(path), path);
  });

  it("each of those pages links back", () => {
    for (const file of ["pdfToImages", "pdfSplit", "pdfUnlock"]) {
      assert.match(read(`src/data/toolContent/${file}.ts`), /path: "\/pdf-to-text"/, file);
    }
    assert.equal(wordCounterContent.related[0].path, "/pdf-to-text");
    assert.match(read("src/data/toolContent/index.ts"), /"word-counter": wordCounterContent/);
  });

  it("never promises OCR or links an image-to-text tool", () => {
    const text = JSON.stringify(pdfToTextContent) + read(TOOL) + read(LIB) + read("public/llms.txt").split("## Honest limitations")[0];
    assert.doesNotMatch(text, /\bOCR\b/);
    assert.doesNotMatch(text, /image-to-text|\/ocr/i);
  });

  it("keeps pdf.js out of the static import graph", () => {
    const statik = /^\s*import\s(?!type\b)[^;]*from\s+["'](pdf-lib|pdfjs-dist)[^"']*["']/m;
    for (const file of [TOOL, LIB]) assert.doesNotMatch(read(file), statik, file);
    assert.doesNotMatch(read(LIB), /pdfjs|document\.|window\./);
    assert.match(read(TOOL), /import \{ loadPdfJs \} from "@\/lib\/pdf\/lazyPdf";/);
  });

  it("sends a locked file to the bank statement page first, then Unlock PDF", () => {
    const source = read(TOOL);
    const primary = source.indexOf('to="/remove-password-from-bank-statement-pdf"');
    const secondary = source.indexOf('to="/pdf-unlock"');
    assert.ok(primary > 0 && secondary > primary);
  });

  it("signals success only on copy and download", () => {
    const source = read(TOOL);
    assert.equal(source.match(/markToolSuccess\(/g).length, 2);
    const copyAt = source.indexOf("const copy = async");
    const downloadAt = source.indexOf("const download = ");
    const calls = [...source.matchAll(/markToolSuccess\(/g)].map((m) => m.index);
    assert.ok(calls[0] > copyAt && calls[0] < downloadAt, "first call is in copy");
    assert.ok(calls[1] > downloadAt && calls[1] > source.indexOf("a.click();"), "second call follows the download click");
    const readStart = source.indexOf("const read = useCallback");
    const readEnd = source.indexOf("useEffect(", readStart);
    assert.doesNotMatch(source.slice(readStart, readEnd), /markToolSuccess/);
  });

  it("carries the QA hooks", () => {
    const source = read(TOOL);
    for (const attr of ["data-p2t-state", "data-p2t-progress", "data-p2t-cancel", "data-p2t-output", "data-p2t-chars", "data-p2t-words", "data-p2t-copy", "data-p2t-download", "data-p2t-scan", "data-p2t-error", "data-p2t-range", "data-p2t-mode", "data-p2t-breaks", "data-p2t-trim"]) {
      assert.ok(source.includes(attr), attr);
    }
    assert.match(source, /page\.cleanup\(\)/);
    assert.match(source, /loading\.destroy\(\)/);
  });
});
