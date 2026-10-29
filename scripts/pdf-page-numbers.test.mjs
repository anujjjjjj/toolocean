/**
 * Page numbering: labels, ranges, placement, rotation, CropBox, and a round trip
 * through pdf-lib and pdf.js.
 *   node --experimental-strip-types --test scripts/pdf-page-numbers.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as pdfLib from "pdf-lib";
import {
  DEFAULT_OPTIONS,
  NUMBER_POSITIONS,
  PdfOpenError,
  formatPageLabel,
  normalizeRotation,
  numberPdf,
  openPdf,
  parsePageRange,
  placeLabel,
  planNumbering,
  previewPdf,
  visibleBox,
  visualSize,
  visualToUser,
} from "../src/lib/pdf/pageNumbers.ts";

const close = (actual, expected, message) =>
  assert.ok(Math.abs(actual - expected) < 1e-6, `${message ?? ""} expected ${expected}, got ${actual}`);

describe("label formats", () => {
  it("renders all four formats", () => {
    assert.equal(formatPageLabel("n", 3, 9), "3");
    assert.equal(formatPageLabel("page-n", 3, 9), "Page 3");
    assert.equal(formatPageLabel("n-of-total", 3, 9), "3 of 9");
    assert.equal(formatPageLabel("page-n-of-total", 3, 9), "Page 3 of 9");
  });

  it("counts up from the start number", () => {
    const plan = planNumbering({ first: 1, last: 3 }, 7, "n");
    assert.deepEqual(
      plan.labels.map((l) => l.label),
      ["7", "8", "9"],
    );
    assert.equal(plan.total, 9);
  });
});

describe("page ranges and N", () => {
  it("parses the supported forms", () => {
    assert.deepEqual(parsePageRange("", 5), { ok: true, range: { first: 1, last: 5 } });
    assert.deepEqual(parsePageRange("all", 5), { ok: true, range: { first: 1, last: 5 } });
    assert.deepEqual(parsePageRange("2-", 5), { ok: true, range: { first: 2, last: 5 } });
    assert.deepEqual(parsePageRange("-3", 5), { ok: true, range: { first: 1, last: 3 } });
    assert.deepEqual(parsePageRange(" 2 - 4 ", 5), { ok: true, range: { first: 2, last: 4 } });
    assert.deepEqual(parsePageRange("2–4", 5), { ok: true, range: { first: 2, last: 4 } });
    assert.deepEqual(parsePageRange("4", 5), { ok: true, range: { first: 4, last: 4 } });
    assert.deepEqual(parsePageRange("2-10", 5), { ok: true, range: { first: 2, last: 5 } });
  });

  it("rejects ranges it cannot honour exactly", () => {
    for (const bad of ["1,3", "abc", "-", "0-3", "4-2", "6-", "6", "1-2-3"]) {
      assert.equal(parsePageRange(bad, 5).ok, false, bad);
    }
  });

  it("skip-cover numbers pages 2..N and N is the last number shown", () => {
    const parsed = parsePageRange("2-", 5);
    assert.ok(parsed.ok);
    const plan = planNumbering(parsed.range, 1, "n-of-total");
    assert.deepEqual(
      plan.labels.map((l) => [l.pageIndex, l.label]),
      [
        [1, "1 of 4"],
        [2, "2 of 4"],
        [3, "3 of 4"],
        [4, "4 of 4"],
      ],
    );
    assert.equal(plan.total, 4);
  });

  it("N follows the start number, not the file's page count", () => {
    const parsed = parsePageRange("2-", 5);
    assert.ok(parsed.ok);
    const plan = planNumbering(parsed.range, 2, "page-n-of-total");
    assert.equal(plan.labels[0].label, "Page 2 of 5");
    assert.equal(plan.labels.at(-1).label, "Page 5 of 5");
  });
});

describe("placement on an upright page", () => {
  const box = { x: 0, y: 0, width: 600, height: 800 };
  const base = { box, rotation: 0, margin: 20, textWidth: 40, capHeight: 10 };
  const expected = {
    "top-left": [20, 770],
    "top-center": [280, 770],
    "top-right": [540, 770],
    "bottom-left": [20, 20],
    "bottom-center": [280, 20],
    "bottom-right": [540, 20],
  };

  it("covers all six spots", () => {
    assert.equal(NUMBER_POSITIONS.length, 6);
    for (const position of NUMBER_POSITIONS) {
      const placed = placeLabel({ ...base, position });
      assert.deepEqual([placed.x, placed.y], expected[position], position);
      assert.equal(placed.rotate, 0);
    }
  });

  it("clamps a margin that would push the label off the page", () => {
    const placed = placeLabel({ ...base, position: "bottom-right", margin: 900 });
    assert.ok(placed.x >= 0 && placed.x <= 560);
    assert.ok(placed.y >= 0 && placed.y <= 790);
  });
});

describe("rotation", () => {
  it("normalizes /Rotate values", () => {
    assert.equal(normalizeRotation(0), 0);
    assert.equal(normalizeRotation(450), 90);
    assert.equal(normalizeRotation(-90), 270);
    assert.equal(normalizeRotation(-180), 180);
    assert.equal(normalizeRotation(360), 0);
  });

  it("swaps width and height on a quarter turn", () => {
    const box = { x: 0, y: 0, width: 600, height: 800 };
    assert.deepEqual(visualSize(box, 90), { width: 800, height: 600 });
    assert.deepEqual(visualSize(box, 270), { width: 800, height: 600 });
    assert.deepEqual(visualSize(box, 180), { width: 600, height: 800 });
  });

  /*
   * Forward map from user space to what a viewer shows, written independently of
   * visualToUser: a clockwise turn of the box by `rotation`.
   */
  function userToVisual(box, rotation, x, y) {
    const ux = x - box.x;
    const uy = y - box.y;
    if (rotation === 90) return { x: uy, y: box.width - ux };
    if (rotation === 180) return { x: box.width - ux, y: box.height - uy };
    if (rotation === 270) return { x: box.height - uy, y: ux };
    return { x: ux, y: uy };
  }

  it("visual corners land on the right user-space corners", () => {
    const box = { x: 10, y: 20, width: 600, height: 800 };
    // Visual bottom-left of the displayed page, per rotation.
    assert.deepEqual(visualToUser(box, 0, 0, 0), { x: 10, y: 20 });
    assert.deepEqual(visualToUser(box, 90, 0, 0), { x: 610, y: 20 });
    assert.deepEqual(visualToUser(box, 180, 0, 0), { x: 610, y: 820 });
    assert.deepEqual(visualToUser(box, 270, 0, 0), { x: 10, y: 820 });
  });

  it("maps every position back to the visual spot for 0/90/180/270", () => {
    const box = { x: 0, y: 0, width: 600, height: 800 };
    for (const rotation of [0, 90, 180, 270]) {
      const size = visualSize(box, rotation);
      for (const position of NUMBER_POSITIONS) {
        const placed = placeLabel({ box, rotation, position, margin: 20, textWidth: 40, capHeight: 10 });
        assert.equal(placed.rotate, rotation, `${rotation} ${position} text angle`);
        const seen = userToVisual(box, rotation, placed.x, placed.y);
        close(seen.x, placed.visual.x, `${rotation} ${position} x`);
        close(seen.y, placed.visual.y, `${rotation} ${position} y`);
        const [vertical, horizontal] = position.split("-");
        if (vertical === "bottom") close(seen.y, 20);
        else close(seen.y, size.height - 30);
        if (horizontal === "left") close(seen.x, 20);
        if (horizontal === "right") close(seen.x, size.width - 60);
        if (horizontal === "center") close(seen.x, (size.width - 40) / 2);
      }
    }
  });
});

describe("CropBox", () => {
  it("uses the CropBox and its offset, clipped to the MediaBox", () => {
    const media = { x: 0, y: 0, width: 400, height: 600 };
    assert.deepEqual(visibleBox(media, null), media);
    assert.deepEqual(visibleBox(media, { x: 50, y: 80, width: 300, height: 400 }), {
      x: 50,
      y: 80,
      width: 300,
      height: 400,
    });
    assert.deepEqual(visibleBox(media, { x: -10, y: 500, width: 100, height: 200 }), {
      x: 0,
      y: 500,
      width: 90,
      height: 100,
    });
    // A CropBox entirely off the page falls back to the MediaBox.
    assert.deepEqual(visibleBox(media, { x: 500, y: 700, width: 10, height: 10 }), media);
  });

  it("places relative to the CropBox origin, not the MediaBox origin", () => {
    const box = { x: 50, y: 80, width: 300, height: 400 };
    const placed = placeLabel({ box, rotation: 0, position: "bottom-left", margin: 20, textWidth: 40, capHeight: 10 });
    assert.deepEqual([placed.x, placed.y], [70, 100]);
    const top = placeLabel({ box, rotation: 0, position: "top-right", margin: 20, textWidth: 40, capHeight: 10 });
    assert.deepEqual([top.x, top.y], [50 + 300 - 20 - 40, 80 + 400 - 20 - 10]);
  });

  it("combines a CropBox offset with a 90 degree turn", () => {
    const box = { x: 30, y: 40, width: 500, height: 900 };
    const placed = placeLabel({ box, rotation: 90, position: "bottom-left", margin: 20, textWidth: 40, capHeight: 10 });
    // Visual bottom-left on a 90 page is the user-space bottom-right of the box.
    assert.deepEqual([placed.x, placed.y], [30 + 500 - 20, 40 + 20]);
  });
});

/* ---------- Integration: number a real document, then read it back. ---------- */

async function sampleDoc() {
  const doc = await pdfLib.PDFDocument.create();
  const font = await doc.embedFont(pdfLib.StandardFonts.Helvetica);
  const sizes = [
    [612, 792],
    [842, 595],
    [595, 842],
    [612, 792],
    [400, 600],
    [612, 1008],
  ];
  sizes.forEach(([w, h], i) => {
    const page = doc.addPage([w, h]);
    page.drawText(`body ${i + 1}`, { x: 60, y: h - 100, size: 20, font });
  });
  const pages = doc.getPages();
  pages[1].setRotation(pdfLib.degrees(90));
  pages[2].setRotation(pdfLib.degrees(180));
  pages[3].setRotation(pdfLib.degrees(270));
  pages[4].setCropBox(50, 80, 300, 400);
  pages[5].setRotation(pdfLib.degrees(90));
  pages[5].setCropBox(30, 40, 500, 900);
  // Leave a transform active at the end of page 1's content, as some producers do.
  pages[0].pushOperators(pdfLib.concatTransformationMatrix(1, 0, 0, 1, 200, 200));
  return doc.save();
}

const STANDARD_FONTS = new URL("../node_modules/pdfjs-dist/standard_fonts/", import.meta.url).pathname;

async function readLabels(bytes) {
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
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = content.items
      .filter((item) => "str" in item && item.str.trim() && !item.str.startsWith("body"))
      .map((item) => {
        const m = pdfjs.Util.transform(viewport.transform, item.transform);
        // Viewport space is y-down. Convert to the y-up visual frame used above.
        return {
          text: item.str,
          x: m[4],
          y: viewport.height - m[5],
          upright: m[0] > 0 && Math.abs(m[1]) < 1e-6,
          width: viewport.width,
          height: viewport.height,
        };
      });
    out.push(items);
  }
  await pdf.destroy();
  return out;
}

describe("round trip through pdf-lib and pdf.js", () => {
  it("draws upright labels at the chosen visual spot on rotated, cropped, mixed pages", async () => {
    const source = await sampleDoc();
    for (const position of ["bottom-center", "top-right", "bottom-left"]) {
      const options = { ...DEFAULT_OPTIONS, position, format: "page-n-of-total", margin: 24, fontSize: 12 };
      const { bytes, plan } = await numberPdf(pdfLib, new Uint8Array(source), options);
      assert.equal(plan.total, 6);
      const pages = await readLabels(bytes);
      pages.forEach((items, index) => {
        assert.equal(items.length, 1, `page ${index + 1} has one label`);
        const [item] = items;
        assert.equal(item.text, `Page ${index + 1} of 6`);
        assert.ok(item.upright, `${position} page ${index + 1} upright`);
        const [vertical, horizontal] = position.split("-");
        if (vertical === "bottom") close(Math.round(item.y), 24, `${position} page ${index + 1} y`);
        else assert.ok(item.y > item.height - 24 - 12 && item.y < item.height - 24, `${position} page ${index + 1} top`);
        if (horizontal === "left") close(Math.round(item.x), 24, `${position} page ${index + 1} x`);
        if (horizontal === "right") assert.ok(item.x > item.width / 2 && item.x < item.width - 24, `${position} page ${index + 1} right`);
        if (horizontal === "center") assert.ok(Math.abs(item.x - item.width / 2) < 50, `${position} page ${index + 1} center`);
      });
    }
  });

  it("skips the cover and counts N from the numbered pages", async () => {
    const source = await sampleDoc();
    const { bytes } = await numberPdf(pdfLib, new Uint8Array(source), {
      ...DEFAULT_OPTIONS,
      range: "2-",
      format: "n-of-total",
    });
    const pages = await readLabels(bytes);
    assert.deepEqual(pages[0], []);
    assert.deepEqual(
      pages.slice(1).map((items) => items[0].text),
      ["1 of 5", "2 of 5", "3 of 5", "4 of 5", "5 of 5"],
    );
  });

  it("the preview page is drawn by the same code as the download", async () => {
    const source = await sampleDoc();
    const options = { ...DEFAULT_OPTIONS, position: "top-left", format: "page-n" };
    const doc = await openPdf(pdfLib, new Uint8Array(source));
    const full = await readLabels((await numberPdf(pdfLib, new Uint8Array(source), options)).bytes);
    // Page 1 leaves a transform active; page 6 is rotated and cropped.
    for (const index of [0, 5]) {
      const preview = await readLabels(await previewPdf(pdfLib, doc, options, index));
      assert.equal(preview.length, 1);
      assert.equal(preview[0][0].text, full[index][0].text);
      close(preview[0][0].x, full[index][0].x, `page ${index + 1} x`);
      close(preview[0][0].y, full[index][0].y, `page ${index + 1} y`);
    }
  });

  it("refuses encrypted and broken files with a typed error", async () => {
    await assert.rejects(openPdf(pdfLib, new TextEncoder().encode("not a pdf")), (error) => {
      assert.ok(error instanceof PdfOpenError);
      assert.equal(error.kind, "invalid");
      return true;
    });
    await assert.rejects(openPdf(pdfLib, new TextEncoder().encode("%PDF-1.7\n1 0 obj << /Type /Catalog garbage")), PdfOpenError);

    const { PDFDocument: Cantoo } = await import("@cantoo/pdf-lib");
    const plain = await Cantoo.load(await sampleDoc());
    plain.encrypt({ userPassword: "pw", ownerPassword: "owner" });
    const locked = await plain.save();
    await assert.rejects(openPdf(pdfLib, locked), (error) => {
      assert.ok(error instanceof PdfOpenError);
      assert.equal(error.kind, "encrypted");
      return true;
    });
  });
});
