/**
 * Grayscale PDF: luma, 1-bit packing, the gray JPEG encoder, the encoding
 * chooser, page geometry, PDF assembly with the real pdf-lib, names, size
 * messages, and the promises the page makes.
 *   node --experimental-strip-types --test scripts/grayscale-pdf.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { deflateSync, inflateSync } from "node:zlib";
import * as PdfLib from "pdf-lib";
import { encodeGrayJpeg, scaledQuantTable } from "../src/lib/jpegGray.ts";
import {
  DEFAULT_DPI,
  DEFAULT_THRESHOLD,
  MAX_PAGE_PIXELS,
  chooseSmaller,
  compareSizes,
  encodePageImage,
  formatBytes,
  grayscaleFileName,
  luminanceFromRgba,
  packedRowBytes,
  pageGeometry,
  planFromEstimate,
  sampleBands,
  thresholdGray,
  thresholdPack1Bit,
} from "../src/lib/pdf/grayscalePdf.ts";
import { createGrayscaleWriter } from "../src/lib/pdf/grayscaleAssemble.ts";
import { grayscalePdfContent, imageFiltersContent } from "../src/data/toolContent/grayscalePdf.ts";
import { toolSeoData } from "../src/data/toolSeo.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const TOOL = "src/components/tools/implementations/pdf/GrayscalePdfTool.tsx";
const LIB = "src/lib/pdf/grayscalePdf.ts";
const CLIENT = "src/lib/pdf/grayscaleClient.ts";
const deflate = (bytes) => new Uint8Array(deflateSync(bytes));

const rgba = (...pixels) => new Uint8Array(pixels.flat());

describe("luminanceFromRgba", () => {
  it("weights red, green and blue by Rec. 601", () => {
    const gray = luminanceFromRgba(rgba([255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255]), 3);
    assert.deepEqual([...gray], [76, 150, 29]);
  });

  it("maps white to 255 and black to 0", () => {
    assert.deepEqual([...luminanceFromRgba(rgba([255, 255, 255, 255], [0, 0, 0, 255]), 2)], [255, 0]);
  });

  it("composites transparent pixels over white", () => {
    const gray = luminanceFromRgba(rgba([0, 0, 0, 0], [0, 0, 0, 128], [255, 0, 0, 0]), 3);
    assert.equal(gray[0], 255);
    assert.equal(gray[1], 127); // 255 * (1 - 128/255) = 127
    assert.equal(gray[2], 255);
  });

  it("stays within one level of round(0.299R + 0.587G + 0.114B)", () => {
    for (let i = 0; i < 2000; i++) {
      const r = (i * 37) % 256, g = (i * 91) % 256, b = (i * 53) % 256;
      const exact = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      const got = luminanceFromRgba(rgba([r, g, b, 255]), 1)[0];
      assert.ok(Math.abs(got - exact) <= 1, `${r},${g},${b}: ${got} vs ${exact}`);
    }
  });
});

describe("1-bit threshold and packing", () => {
  it("sets a bit for white (at or above the threshold), MSB first", () => {
    const gray = new Uint8Array([0, 255, 127, 128, 0, 0, 0, 255]);
    assert.deepEqual([...thresholdPack1Bit(gray, 8, 1, 128)], [0b01010001]);
  });

  it("pads rows to a whole byte for widths that are not a multiple of 8", () => {
    assert.equal(packedRowBytes(1), 1);
    assert.equal(packedRowBytes(8), 1);
    assert.equal(packedRowBytes(9), 2);
    // 10 x 2, row 0 all white, row 1 all black except the last pixel.
    const gray = new Uint8Array(20);
    gray.fill(255, 0, 10);
    gray[19] = 255;
    const packed = thresholdPack1Bit(gray, 10, 2, DEFAULT_THRESHOLD);
    assert.deepEqual([...packed], [0xff, 0b11000000, 0x00, 0b01000000]);
  });

  it("previews the same threshold as 0/255", () => {
    assert.deepEqual([...thresholdGray(new Uint8Array([10, 200, 160]), 160)], [0, 255, 255]);
  });
});

/** Splits a JPEG into marker segments up to SOS. */
function jpegSegments(bytes) {
  const segments = [];
  let i = 2;
  while (i < bytes.length) {
    assert.equal(bytes[i], 0xff, `marker at ${i}`);
    const marker = bytes[i + 1];
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    segments.push({ marker, data: bytes.subarray(i + 4, i + 2 + length), end: i + 2 + length });
    if (marker === 0xda) break;
    i += 2 + length;
  }
  return segments;
}

describe("gray JPEG encoder", () => {
  const gradient = (w, h) => {
    const g = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g[y * w + x] = (x * 3 + y * 2) & 255;
    return g;
  };

  it("writes SOI, JFIF, DQT, a one-component SOF0, DHT, SOS and EOI", () => {
    const bytes = encodeGrayJpeg(gradient(37, 21), 37, 21, 80);
    assert.deepEqual([bytes[0], bytes[1]], [0xff, 0xd8]);
    assert.deepEqual([bytes.at(-2), bytes.at(-1)], [0xff, 0xd9]);
    const segments = jpegSegments(bytes);
    const markers = segments.map((s) => s.marker);
    assert.deepEqual(markers, [0xe0, 0xdb, 0xc0, 0xc4, 0xda]);
    assert.equal(String.fromCharCode(...segments[0].data.subarray(0, 4)), "JFIF");
    const sof = segments[2].data;
    assert.equal(sof[0], 8, "8-bit precision");
    assert.equal((sof[1] << 8) | sof[2], 21, "height");
    assert.equal((sof[3] << 8) | sof[4], 37, "width");
    assert.equal(sof[5], 1, "one component");
    const sos = segments[4].data;
    assert.equal(sos[0], 1);
  });

  it("stuffs every 0xFF in the entropy data", () => {
    const noisy = new Uint8Array(64 * 64);
    for (let i = 0; i < noisy.length; i++) noisy[i] = (i * 2654435761) >>> 24;
    const bytes = encodeGrayJpeg(noisy, 64, 64, 95);
    const start = jpegSegments(bytes).at(-1).end;
    for (let i = start; i < bytes.length - 2; i++) {
      if (bytes[i] === 0xff) assert.equal(bytes[i + 1], 0x00, `unstuffed 0xFF at ${i}`);
    }
  });

  it("scales the luminance table the libjpeg way", () => {
    const q50 = scaledQuantTable(50);
    assert.equal(q50[0], 16);
    assert.equal(q50[63], 99);
    const q80 = scaledQuantTable(80);
    assert.equal(q80[0], 6); // (16 * 40 + 50) / 100
    assert.equal(scaledQuantTable(100)[10], 1);
    const dqt = jpegSegments(encodeGrayJpeg(gradient(8, 8), 8, 8, 80))[1].data;
    assert.equal(dqt[1], 6);
  });

  it("encodes a flat gray page in very few bytes, and detail in many more", () => {
    const flat = new Uint8Array(1000 * 1000).fill(200);
    const flatBytes = encodeGrayJpeg(flat, 1000, 1000, 80);
    // A flat block costs a 2-bit DC code and a 4-bit end of block: 6 bits per 64 pixels.
    assert.ok(flatBytes.length < (1000 * 1000) / 64, `${flatBytes.length}`);
    const busy = encodeGrayJpeg(gradient(1000, 1000), 1000, 1000, 80);
    assert.ok(busy.length > flatBytes.length * 5);
  });

  it("rejects bad dimensions", () => {
    assert.throws(() => encodeGrayJpeg(new Uint8Array(4), 0, 4));
    assert.throws(() => encodeGrayJpeg(new Uint8Array(4), 4, 4));
  });
});

describe("choosing an encoding", () => {
  it("keeps the smaller candidate, Flate on a tie", () => {
    const a = { filter: "FlateDecode", bytes: new Uint8Array(10) };
    const b = { filter: "DCTDecode", bytes: new Uint8Array(5) };
    assert.equal(chooseSmaller([a, b]), b);
    assert.equal(chooseSmaller([{ filter: "DCTDecode", bytes: new Uint8Array(10) }, a]), a);
  });

  it("plans one encoder only when a sample is decisive", () => {
    assert.equal(planFromEstimate(100, 1000), "flate");
    assert.equal(planFromEstimate(1000, 100), "jpeg");
    assert.equal(planFromEstimate(800, 1000), "both");
  });

  it("samples four bands on tall pages and skips short ones", () => {
    assert.equal(sampleBands(new Uint8Array(10 * 100), 10, 100), null);
    const gray = new Uint8Array(4 * 1000).map((_, i) => Math.floor(i / 4) & 255);
    const strip = sampleBands(gray, 4, 1000);
    assert.equal(strip.length, 4 * 256);
    assert.equal(strip[0], 0); // first band starts at row 0
    assert.equal(strip.at(-1), (999) & 255); // last band ends at the last row
  });

  /** RGBA for a white page with black "text" strokes. */
  const textPage = (w, h) => {
    const px = new Uint8Array(w * h * 4).fill(255);
    for (let y = 40; y < h - 40; y += 24) {
      for (let x = 30; x < w - 30; x++) {
        if ((x >> 3) % 4 === 3) continue;
        for (let dy = 0; dy < 6; dy++) px.fill(0, ((y + dy) * w + x) * 4, ((y + dy) * w + x) * 4 + 3);
      }
    }
    return px;
  };
  /** RGBA noise, like a photograph. */
  const photoPage = (w, h) => {
    const px = new Uint8Array(w * h * 4);
    let seed = 7;
    for (let i = 0; i < px.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const v = 96 + ((seed >>> 24) & 63) + ((i / 4) % w) / 8;
      px[i] = v;
      px[i + 1] = v * 0.9;
      px[i + 2] = v * 0.8;
      px[i + 3] = 255;
    }
    return px;
  };

  it("picks Flate for text, gray JPEG for a photo, and never something larger", async () => {
    const text = await encodePageImage(textPage(600, 800), 600, 800, { mode: "gray" }, deflate);
    assert.equal(text.image.filter, "FlateDecode");
    assert.equal(text.image.bitsPerComponent, 8);
    const photo = await encodePageImage(photoPage(600, 800), 600, 800, { mode: "gray" }, deflate);
    assert.equal(photo.image.filter, "DCTDecode");
    for (const report of [text, photo]) {
      for (const size of Object.values(report.sizes)) assert.ok(report.image.bytes.length <= size);
    }
  });

  it("writes black and white as 1-bit Flate that inflates to packed rows", async () => {
    const report = await encodePageImage(textPage(101, 50), 101, 50, { mode: "bw", threshold: 128 }, deflate);
    assert.equal(report.image.filter, "FlateDecode");
    assert.equal(report.image.bitsPerComponent, 1);
    assert.equal(inflateSync(report.image.bytes).length, packedRowBytes(101) * 50);
  });
});

describe("page geometry", () => {
  it("scales points by DPI / 72", () => {
    const a4 = pageGeometry(595.28, 841.89, 150);
    assert.equal(a4.scale, 150 / 72);
    assert.equal(a4.pixelWidth, 1240);
    assert.equal(a4.pixelHeight, 1754);
    assert.equal(pageGeometry(612, 792, 300).pixelWidth, 2550);
    assert.equal(DEFAULT_DPI, 150);
  });

  it("keeps a rotated page's shown orientation (viewport width and height)", () => {
    const landscape = pageGeometry(792, 612, 150);
    assert.ok(landscape.pixelWidth > landscape.pixelHeight);
    assert.equal(landscape.widthPt, 792);
  });

  it("caps giant pages under the pixel limit, evenly", () => {
    const poster = pageGeometry(2384, 3370, 300);
    assert.ok(poster.pixelWidth * poster.pixelHeight <= MAX_PAGE_PIXELS * 1.001);
    assert.ok(poster.dpi < 300);
    assert.ok(Math.abs(poster.pixelWidth / poster.pixelHeight - 2384 / 3370) < 0.001);
  });
});

describe("PDF assembly with pdf-lib", () => {
  it("writes one full-page image XObject per page at the given sizes", async () => {
    const writer = await createGrayscaleWriter(PdfLib);
    const gray = new Uint8Array(40 * 30).fill(180);
    writer.addPage(612, 792, { bytes: deflate(gray), filter: "FlateDecode", bitsPerComponent: 8, pixelWidth: 40, pixelHeight: 30 });
    writer.addPage(792, 612, { bytes: encodeGrayJpeg(gray, 40, 30), filter: "DCTDecode", bitsPerComponent: 8, pixelWidth: 40, pixelHeight: 30 });
    writer.addPage(595.28, 841.89, {
      bytes: deflate(thresholdPack1Bit(gray, 40, 30, 128)),
      filter: "FlateDecode",
      bitsPerComponent: 1,
      pixelWidth: 40,
      pixelHeight: 30,
    });
    assert.equal(writer.pageCount, 3);
    const saved = await writer.save();

    const { PDFDocument, PDFName, PDFDict, PDFRawStream } = PdfLib;
    const doc = await PDFDocument.load(saved);
    assert.equal(doc.getPageCount(), 3);
    const expected = [
      [612, 792, "FlateDecode", 8],
      [792, 612, "DCTDecode", 8],
      [595.28, 841.89, "FlateDecode", 1],
    ];
    doc.getPages().forEach((page, index) => {
      const [w, h, filter, bpc] = expected[index];
      const size = page.getSize();
      assert.ok(Math.abs(size.width - w) < 0.01 && Math.abs(size.height - h) < 0.01, `page ${index + 1} size`);
      const xobjects = page.node.Resources().lookup(PDFName.of("XObject"), PDFDict);
      const [, ref] = xobjects.entries()[0];
      const image = doc.context.lookup(ref, PDFRawStream);
      const dict = image.dict;
      assert.equal(dict.get(PDFName.of("Subtype")).toString(), "/Image");
      assert.equal(dict.get(PDFName.of("ColorSpace")).toString(), "/DeviceGray");
      assert.equal(dict.get(PDFName.of("BitsPerComponent")).toString(), String(bpc));
      assert.equal(dict.get(PDFName.of("Filter")).toString(), `/${filter}`);
      assert.equal(dict.get(PDFName.of("Width")).toString(), "40");
      assert.equal(dict.get(PDFName.of("Height")).toString(), "30");
    });
  });
});

describe("names and sizes", () => {
  it("keeps the base name exactly and adds -grayscale", () => {
    assert.equal(grayscaleFileName("Bank Statement.pdf"), "Bank Statement-grayscale.pdf");
    assert.equal(grayscaleFileName("REPORT.PDF"), "REPORT-grayscale.pdf");
    assert.equal(grayscaleFileName("notes"), "notes-grayscale.pdf");
    assert.equal(grayscaleFileName("q3.final.v2.pdf"), "q3.final.v2-grayscale.pdf");
    assert.equal(grayscaleFileName(".pdf"), "document-grayscale.pdf");
  });

  it("formats bytes", () => {
    assert.equal(formatBytes(900), "900 B");
    assert.equal(formatBytes(840 * 1024), "840 KB");
    assert.equal(formatBytes(1.2 * 1024 * 1024), "1.20 MB");
  });

  it("says smaller, larger or the same", () => {
    const smaller = compareSizes(1.2 * 1024 * 1024, 840 * 1024);
    assert.equal(smaller.change, "smaller");
    assert.equal(smaller.text, "1.20 MB → 840 KB, 32% smaller");
    const larger = compareSizes(1000 * 1024, 2.4 * 1000 * 1024);
    assert.equal(larger.change, "larger");
    assert.equal(larger.delta, "2.4× larger");
    assert.equal(compareSizes(1000, 1500).delta, "50% larger");
    assert.equal(compareSizes(100_000, 100_400).change, "same");
  });
});

describe("the page keeps its promises", () => {
  it("title leads with printing, fits with the brand, and is unique", () => {
    const { title } = toolSeoData["grayscale-pdf"];
    assert.equal(`${title} | ToolOcean`, "Grayscale PDF – Print Black and White, Save Ink | ToolOcean");
    assert.ok(`${title} | ToolOcean`.length <= 60);
    assert.equal(grayscalePdfContent.seo.title, title);
    const same = Object.entries(toolSeoData).filter(([, entry]) => entry.title === title);
    assert.deepEqual(same.map(([key]) => key), ["grayscale-pdf"]);
  });

  it("description covers grayscale, black and white, printing, ink and no upload", () => {
    const { description, keywords } = grayscalePdfContent.seo;
    assert.ok(description.length >= 140 && description.length <= 165, `${description.length}`);
    for (const pattern of [/grayscale/i, /black and white/i, /printing/i, /ink/i, /no upload/i, /browser/i]) assert.match(description, pattern);
    assert.equal(toolSeoData["grayscale-pdf"].description, description);
    for (const query of ["convert pdf to grayscale", "pdf to black and white", "make pdf black and white for printing"]) {
      assert.ok(keywords.includes(query), query);
    }
  });

  it("intro and first FAQ lead with printing in black and white to save ink", () => {
    assert.match(grayscalePdfContent.intro.paragraphs[0], /^Print in black and white and save ink/);
    assert.match(grayscalePdfContent.faqs[0].question, /print.*black and white.*ink/i);
  });

  it("has the FAQs the page needs, without cookie or network claims", () => {
    const all = grayscalePdfContent.faqs.map((faq) => `${faq.question} ${faq.answer}`).join("\n");
    assert.ok(grayscalePdfContent.faqs.length >= 8);
    for (const pattern of [/never uploaded/, /select/i, /150 DPI/, /300 DPI/, /threshold/i, /bigger|larger/i, /password/i, /limit/i]) {
      assert.match(all, pattern);
    }
    for (const link of ["(/pdf-to-text)", "(/pdf-compress)", "(/remove-password-from-bank-statement-pdf)", "(/pdf-unlock)"]) {
      assert.ok(all.includes(link), link);
    }
    assert.doesNotMatch(all + JSON.stringify(grayscalePdfContent), /cookie|network request/i);
  });

  it("links PDF Compress, PDF to Images, Image Filters and PDF to Text", () => {
    const paths = grayscalePdfContent.related.map((link) => link.path);
    for (const path of ["/pdf-compress", "/pdf-to-images", "/image-filters", "/pdf-to-text"]) assert.ok(paths.includes(path), path);
  });

  it("each of those pages links back", () => {
    for (const file of ["pdfCompress", "pdfToImages"]) {
      assert.match(read(`src/data/toolContent/${file}.ts`), /path: "\/grayscale-pdf"/, file);
    }
    assert.equal(imageFiltersContent.related[0].path, "/grayscale-pdf");
    const index = read("src/data/toolContent/index.ts");
    assert.match(index, /"image-filters": imageFiltersContent/);
    assert.match(index, /"grayscale-pdf": grayscalePdfContent/);
  });

  it("keeps pdf.js and pdf-lib out of the static import graph", () => {
    const statik = /^\s*import\s(?!type\b)[^;]*from\s+["'](pdf-lib|pdfjs-dist)[^"']*["']/m;
    for (const file of [TOOL, LIB, CLIENT, "src/lib/pdf/grayscaleAssemble.ts", "src/lib/jpegGray.ts", "src/lib/pdf/grayscale.worker.ts"]) {
      assert.doesNotMatch(read(file), statik, file);
    }
    assert.doesNotMatch(read(LIB), /pdfjs|document\.|window\./);
    const tool = read(TOOL);
    assert.match(tool, /import \{ loadPdfJs \} from "@\/lib\/pdf\/lazyPdf";/);
    assert.match(tool, /await import\("@\/lib\/pdf\/grayscaleClient"\)/);
    assert.doesNotMatch(tool, /from "@\/lib\/pdf\/grayscaleClient"/);
    assert.match(read(CLIENT), /loadPdfLib/);
  });

  it("creates the worker lazily, never at module scope", () => {
    const client = read(CLIENT);
    const at = client.indexOf("new Worker(");
    assert.ok(at > client.indexOf("private ensure()"), "worker is created inside ensure()");
  });

  it("releases pages, canvases and the document", () => {
    const source = read(TOOL) + read(CLIENT);
    assert.match(source, /page\.cleanup\(\)/);
    assert.match(source, /canvas\.width = 0;\s*canvas\.height = 0;/);
    assert.match(source, /loading\.destroy\(\)/);
    assert.match(source, /renderTask\?\.cancel\(\)/);
    assert.match(source, /yieldToBrowser\(\)/);
  });

  it("sends a locked file to the bank statement page first, then Unlock PDF", () => {
    const source = read(TOOL);
    const primary = source.indexOf('to="/remove-password-from-bank-statement-pdf"');
    const secondary = source.indexOf('to="/pdf-unlock"');
    assert.ok(primary > 0 && secondary > primary);
  });

  it("warns before converting and links PDF to Text and PDF Compress from the tool", () => {
    const source = read(TOOL);
    const warning = source.indexOf("data-gs-text-warning");
    assert.ok(warning > 0 && warning < source.indexOf("data-gs-convert"));
    assert.ok(source.indexOf('to="/pdf-to-text"') > warning);
    assert.ok(source.indexOf('to="/pdf-compress"') > source.indexOf("data-gs-larger"));
  });

  it("signals success once, on download, keyed by the output blob", () => {
    const source = read(TOOL);
    assert.equal(source.match(/markToolSuccess\(/g).length, 1);
    const call = source.indexOf("markToolSuccess(result.blob)");
    const downloadAt = source.indexOf("const download = ");
    assert.ok(call > downloadAt && call > source.indexOf("a.click();", downloadAt), "follows the download click");
    const convertStart = source.indexOf("const convert = async");
    const convertEnd = source.indexOf("const cancel = ", convertStart);
    assert.doesNotMatch(source.slice(convertStart, convertEnd), /markToolSuccess/);
  });

  it("carries the QA hooks", () => {
    const source = read(TOOL);
    for (const attr of [
      "data-gs-state",
      "data-gs-pages",
      "data-gs-progress",
      "data-gs-current",
      "data-gs-total",
      "data-gs-cancel",
      "data-gs-convert",
      "data-gs-dpi",
      "data-gs-mode",
      "data-gs-threshold",
      "data-gs-download",
      "data-gs-insize",
      "data-gs-outsize",
      "data-gs-larger",
      "data-gs-error",
      "data-gs-reset",
      "data-gs-text-warning",
    ]) {
      assert.ok(source.includes(attr), attr);
    }
    assert.match(source, /aria-pressed=\{value === option\}/);
  });

  it("is registered everywhere a tool needs to be", () => {
    for (const file of [
      "src/data/toolCatalog.ts",
      "src/lib/allToolsForPalette.ts",
      "src/lib/lazyToolRegistry.ts",
      "src/lib/toolRegistry.ts",
      "src/lib/leanShell.ts",
      "src/lib/offlinePrefetch.ts",
      "src/data/workbenchHeights.json",
      "src/data/toolSeo.ts",
      "scripts/content-baseline.json",
    ]) {
      assert.match(read(file), /"grayscale-pdf"/, file);
    }
    assert.match(read("docs/ANALYTICS_EVENTS.md"), /\| grayscale-pdf \| `src\/components\/tools\/implementations\/pdf\/GrayscalePdfTool\.tsx` \| 1 \|/);
    assert.match(read("public/llms.txt"), /^> 124 file and developer/m);
    assert.match(read("src/index.css"), /data-lean-shell="grayscale-pdf"/);
    assert.match(read("src/data/pdfHubContent.ts"), /Seventeen tools/);
  });
});
