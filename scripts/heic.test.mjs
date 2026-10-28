/**
 * HEIC converter pieces that run without a browser: the magic-byte sniffer,
 * the per-file checks, output names, and alpha flattening for JPG.
 *   node --experimental-strip-types --test scripts/heic.test.mjs
 *
 * The fixtures are the first 64 bytes of two real HEIC files: the ftyp box and
 * the start of meta. That is all the sniffer reads.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  HEIC_SNIFF_BYTES,
  MAX_HEIC_BYTES,
  fitWithin,
  flattenOnWhite,
  heicFileError,
  heicOutputName,
  sniffHeic,
  uniqueNames,
} from "../src/lib/image/heic.ts";

const fixture = (name) => new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));
const MIF1_HEIC = fixture("example-heic-head.bin"); // major brand mif1, compatible heic + hevc
const HEIC = fixture("image1-heic-head.bin"); // major brand heic

/** A synthetic ftyp box: size, "ftyp", major brand, minor version 0, compatible brands. */
function ftyp(major, ...compatible) {
  const brands = [major, "\0\0\0\0", ...compatible];
  const size = 8 + brands.length * 4;
  const bytes = new Uint8Array(size);
  new DataView(bytes.buffer).setUint32(0, size);
  bytes.set(Buffer.from("ftyp"), 4);
  brands.forEach((brand, index) => bytes.set(Buffer.from(brand, "latin1"), 8 + index * 4));
  return bytes;
}

test("real HEIC headers are recognised by their ftyp brand", () => {
  assert.equal(HEIC.length, HEIC_SNIFF_BYTES);
  assert.deepEqual(sniffHeic(HEIC), { kind: "heic", brand: "heic" });
  assert.deepEqual(sniffHeic(MIF1_HEIC), { kind: "heic", brand: "mif1" });
});

test("each HEVC and generic HEIF brand is accepted", () => {
  for (const brand of ["heic", "heix", "hevc", "heim", "heis", "hevx"]) {
    assert.equal(sniffHeic(ftyp(brand, "mif1")).kind, "heic", brand);
  }
  assert.equal(sniffHeic(ftyp("msf1", "hevc")).kind, "heic");
  assert.equal(sniffHeic(ftyp("mif1")).kind, "heic", "a bare mif1 is left to the decoder");
});

test("AVIF, JPEG, PNG and other files are told apart from HEIC", () => {
  assert.equal(sniffHeic(ftyp("avif", "mif1", "miaf")).kind, "avif");
  assert.equal(sniffHeic(ftyp("mif1", "avif", "miaf")).kind, "avif");
  assert.equal(sniffHeic(ftyp("isom", "mp41")).kind, "unknown", "an MP4 also has ftyp");
  assert.equal(sniffHeic(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])).kind, "jpeg");
  assert.equal(sniffHeic(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])).kind, "png");
  assert.equal(sniffHeic(new TextEncoder().encode("not a photo at all")).kind, "unknown");
  assert.equal(sniffHeic(new Uint8Array(0)).kind, "unknown");
});

test("file checks: empty, too large, wrong content, and the 50 MB boundary", () => {
  assert.equal(heicFileError({ name: "IMG_0001.HEIC", size: 2_994_394 }, HEIC), null);
  assert.equal(heicFileError({ name: "edge.heic", size: MAX_HEIC_BYTES }, HEIC), null);
  assert.match(heicFileError({ name: "big.heic", size: MAX_HEIC_BYTES + 1 }, HEIC), /big\.heic is 50 MB\. The limit is 50 MB per file/);
  assert.match(heicFileError({ name: "huge.heic", size: 120 * 1024 * 1024 }, HEIC), /is 120 MB/);
  assert.match(heicFileError({ name: "empty.heic", size: 0 }, new Uint8Array(0)), /empty/);
  assert.match(heicFileError({ name: "photo.heic", size: 64 }, Uint8Array.from([0xff, 0xd8, 0xff])), /already a JPEG/);
  assert.match(heicFileError({ name: "pic.heif", size: 64 }, ftyp("avif", "mif1")), /AVIF image, not HEIC/);
  assert.match(heicFileError({ name: "notes.heic", size: 11 }, new TextEncoder().encode("not a photo")), /not a HEIC or HEIF photo/);
  // The name is irrelevant: a HEIC with no extension still passes.
  assert.equal(heicFileError({ name: "download", size: 1000 }, MIF1_HEIC), null);
});

test("output names swap the extension and never come out empty", () => {
  assert.equal(heicOutputName("IMG_0412.HEIC", "jpg"), "IMG_0412.jpg");
  assert.equal(heicOutputName("holiday.photo.heif", "png"), "holiday.photo.png");
  assert.equal(heicOutputName("no-extension", "jpg"), "no-extension.jpg");
  assert.equal(heicOutputName(".heic", "jpg"), "image.jpg");
  assert.equal(heicOutputName("", "png"), "image.png");
});

test("ZIP entry names are made unique without changing the first one", () => {
  assert.deepEqual(uniqueNames(["a.jpg", "b.jpg", "a.jpg", "A.jpg", "a (2).jpg"]), [
    "a.jpg",
    "b.jpg",
    "a (2).jpg",
    "A (3).jpg",
    "a (2) (2).jpg",
  ]);
});

test("transparent pixels are flattened onto white for JPG", () => {
  const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 128]);
  assert.equal(flattenOnWhite(rgba), true);
  assert.deepEqual([...rgba], [255, 0, 0, 255, 255, 255, 255, 255, 127, 127, 127, 255]);
  assert.equal(flattenOnWhite(new Uint8ClampedArray([1, 2, 3, 255])), false);
});

test("thumbnails fit the box and are never upscaled", () => {
  assert.deepEqual(fitWithin(3992, 2992, 112), { width: 112, height: 84 });
  assert.deepEqual(fitWithin(854, 1280, 112), { width: 75, height: 112 });
  assert.deepEqual(fitWithin(40, 20, 112), { width: 40, height: 20 });
});
