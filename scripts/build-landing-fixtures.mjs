/**
 * Seeded, generated PDF fixtures for the PDF landing-page benchmarks
 * (src/data/landingBenchmarks.json).
 *
 * Unlike build-fixtures.mjs, nothing here is read from disk: every byte comes
 * from a fixed seed, so anyone can rebuild the same files and compare hashes.
 * The text is invented syllables and the "photos" are seeded noise, so no
 * fixture contains anything personal or sensitive.
 *
 *   node scripts/build-landing-fixtures.mjs <output-dir>
 *
 * Writes the PDFs plus manifest.json (bytes, pages, SHA-256, recipe). Dates are
 * not written into the files (updateMetadata: false), which is what keeps the
 * hashes stable between runs.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, PDFNumber, PDFOperator, StandardFonts, rgb } from "pdf-lib";

const DIR = process.argv[2];
if (!DIR) {
  console.error("usage: node scripts/build-landing-fixtures.mjs <output-dir>");
  process.exit(1);
}
mkdirSync(DIR, { recursive: true });

const SEED = 20261106;
const A4 = [595.28, 841.89];

/** mulberry32: small, fast, and identical in every JavaScript engine. */
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SYLLABLES = ["ta", "lo", "ren", "vi", "sa", "mor", "el", "qua", "di", "nor", "be", "fin", "ul", "ra", "po", "ste", "ka", "mi"];

function words(rand, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const n = 1 + Math.floor(rand() * 3);
    let w = "";
    for (let s = 0; s < n; s++) w += SYLLABLES[Math.floor(rand() * SYLLABLES.length)];
    out.push(w);
  }
  return out;
}

async function newDoc() {
  // No CreationDate, ModDate or Producer, so the bytes depend only on the seed.
  return PDFDocument.create({ updateMetadata: false });
}

/** Full pages of text, then an optional short page of `tailLines` lines. */
async function textPages(doc, rand, pages, tailLines = 0, size = 10.5) {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const total = pages + (tailLines > 0 ? 1 : 0);
  for (let p = 0; p < total; p++) {
    const page = doc.addPage(A4);
    const bottom = p < pages ? 50 : 790 - tailLines * size * 1.45;
    let y = 790;
    while (y > bottom) {
      page.drawText(words(rand, 11).join(" "), { x: 56, y, size, font, color: rgb(0.1, 0.1, 0.1) });
      y -= size * 1.45;
    }
  }
}

/** Smooth gradients plus seeded grain: compresses roughly like a photograph. */
function photoPixels(rand, width, height) {
  const pixels = Buffer.alloc(width * height * 3);
  const cx = rand() * width;
  const cy = rand() * height;
  for (let yy = 0; yy < height; yy++) {
    for (let xx = 0; xx < width; xx++) {
      const d = Math.hypot(xx - cx, yy - cy) / Math.max(width, height);
      const grain = (rand() - 0.5) * 70;
      const i = (yy * width + xx) * 3;
      pixels[i] = Math.max(0, Math.min(255, 200 - 150 * d + grain));
      pixels[i + 1] = Math.max(0, Math.min(255, 120 + 90 * Math.sin(xx / 37) + grain));
      pixels[i + 2] = Math.max(0, Math.min(255, 80 + 140 * (yy / height) + grain));
    }
  }
  return { width, height, channels: 3, pixels };
}

/** Uniform gray noise: the worst case for JPEG, standing in for a dense scan. */
function noisePixels(rand, width, height) {
  const pixels = Buffer.alloc(width * height);
  for (let i = 0; i < pixels.length; i++) pixels[i] = Math.floor(rand() * 256);
  return { width, height, channels: 1, pixels };
}

/** One A4 page holding a raw 8-bit image XObject (Flate), scaled to `box`. */
async function imagePage(doc, image, box) {
  const page = doc.addPage(A4);
  const placed = drawRawImageOnly(doc, page, image);
  const { x, y, w, h } = box;
  page.pushOperators(
    PDFOperator.of("q"),
    PDFOperator.of("cm", [w, 0, 0, h, x, y].map((n) => PDFNumber.of(n))),
    PDFOperator.of("Do", [placed]),
    PDFOperator.of("Q"),
  );
  return page;
}

function drawRawImageOnly(doc, page, { width, height, channels, pixels }) {
  const stream = doc.context.flateStream(pixels, {
    Type: "XObject",
    Subtype: "Image",
    Width: width,
    Height: height,
    ColorSpace: channels === 1 ? "DeviceGray" : "DeviceRGB",
    BitsPerComponent: 8,
  });
  return page.node.newXObject("Im", doc.context.register(stream));
}

const RECIPES = [
  {
    file: "seed-letter-1p.pdf",
    what: "One A4 page of Helvetica text (invented syllables), no images.",
    async build(rand) {
      const doc = await newDoc();
      await textPages(doc, rand, 1);
      return doc;
    },
  },
  {
    file: "seed-report-36p.pdf",
    what: "35 full A4 pages plus a 15-line page of Helvetica text, no images. Sized so the lossless rewrite lands between 100,000 and 102,400 bytes.",
    async build(rand) {
      const doc = await newDoc();
      await textPages(doc, rand, 35, 15);
      return doc;
    },
  },
  {
    file: "seed-photo-1p.pdf",
    what: "One A4 page filled by a 1000x1414 RGB image of gradients plus seeded grain (Flate), no text.",
    async build(rand) {
      const doc = await newDoc();
      await imagePage(doc, photoPixels(rand, 1000, 1414), { x: 0, y: 0, w: A4[0], h: A4[1] });
      return doc;
    },
  },
  {
    file: "seed-noise-24p.pdf",
    what: "24 A4 pages, each filled by a different 400x566 gray noise image (Flate), no text. A deliberately hostile scan stand-in.",
    async build(rand) {
      const doc = await newDoc();
      for (let p = 0; p < 24; p++) {
        await imagePage(doc, noisePixels(rand, 400, 566), { x: 0, y: 0, w: A4[0], h: A4[1] });
      }
      return doc;
    },
  },
];

const manifest = { seed: SEED, generator: "scripts/build-landing-fixtures.mjs", prng: "mulberry32", fixtures: [] };

for (const [index, recipe] of RECIPES.entries()) {
  // Each fixture gets its own stream, so editing one recipe leaves the others' bytes alone.
  const rand = prng(SEED + index);
  const doc = await recipe.build(rand);
  const bytes = await doc.save({ useObjectStreams: false });
  writeFileSync(join(DIR, recipe.file), bytes);
  const entry = {
    file: recipe.file,
    seed: SEED + index,
    bytes: bytes.byteLength,
    pages: doc.getPageCount(),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    what: recipe.what,
  };
  manifest.fixtures.push(entry);
  console.log(`  ${entry.file.padEnd(22)} ${String(entry.bytes).padStart(9)} bytes  ${entry.pages}p  ${entry.sha256.slice(0, 16)}`);
}

writeFileSync(join(DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
