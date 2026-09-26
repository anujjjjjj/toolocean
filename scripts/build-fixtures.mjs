/**
 * Rebuilds the fixture corpus described in docs/CONTENT_FIXTURES.md.
 *
 * Usage: node scripts/build-fixtures.mjs <output-dir>
 *
 * The image sources come from the OS wallpaper via sips; see the doc. The
 * fixtures are not committed. They are large and reproducible.
 */
/**
 * Builds the fixture corpus. Source material is a real 3840x2160 photograph
 * (macOS Sequoia Sunrise wallpaper) and real prose (this project's own docs), so
 * compression numbers reflect real content rather than synthetic noise, which
 * compresses nothing like a photograph or a paragraph does.
 */
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";

const DIR = process.argv[2] ? process.argv[2].replace(/\/?$/, "/") : "./fixtures/";
const kb = (p) => statSync(p).size;

// --- Text-only PDF, from real prose -----------------------------------------
const prose = readFileSync(new URL("../docs/TOOL_AUDIT.md", import.meta.url), "utf-8")
  .replace(/[`#*|>\-]/g, " ")
  // Standard PDF fonts are WinAnsi-encoded, so anything outside Latin-1 throws.
  .replace(/[^\x20-\xFF]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

async function textPdf(pages, out) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const words = prose.split(" ");
  let cursor = 0;
  for (let p = 0; p < pages; p++) {
    const page = doc.addPage([595, 842]); // A4
    let y = 790;
    while (y > 50) {
      const line = [];
      let width = 0;
      while (cursor < words.length && width < 470) {
        const w = words[cursor];
        width += font.widthOfTextAtSize(w + " ", 11);
        line.push(w);
        cursor++;
      }
      if (cursor >= words.length) cursor = 0;
      page.drawText(line.join(" "), { x: 60, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
      y -= 16;
    }
  }
  writeFileSync(out, await doc.save());
}

// --- Image-heavy PDF, real photograph at ~300 dpi ---------------------------
async function scanPdf(pages, jpgPath, out) {
  const doc = await PDFDocument.create();
  const img = await doc.embedJpg(readFileSync(jpgPath));
  for (let p = 0; p < pages; p++) {
    const page = doc.addPage([595, 842]);
    page.drawImage(img, { x: 0, y: 0, width: 595, height: 842 });
  }
  writeFileSync(out, await doc.save());
}

// --- Archives ----------------------------------------------------------------
async function zipOf(files, out) {
  const zip = new JSZip();
  for (const [name, content] of files) zip.file(name, content);
  writeFileSync(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

await textPdf(40, DIR + "report-40p.pdf");
await textPdf(12, DIR + "report-12p.pdf");
await scanPdf(12, DIR + "scan-page.jpg", DIR + "scan-12p.pdf");

// Nested archive of many small text files.
const many = [];
for (let i = 0; i < 300; i++) many.push([`docs/section-${i}/notes.txt`, prose.slice(i * 200, i * 200 + 2000)]);
await zipOf(many, DIR + "many-files.zip");

// Archive holding one large incompressible member (the photo).
await zipOf([["photo.jpg", readFileSync(DIR + "photo-3840.jpg")]], DIR + "one-photo.zip");

for (const f of ["report-40p.pdf","report-12p.pdf","scan-12p.pdf","many-files.zip","one-photo.zip"]) {
  console.log(`  ${f.padEnd(20)} ${kb(DIR + f).toLocaleString()} bytes`);
}
