import assert from "node:assert/strict";
import test from "node:test";
import { csvToRecords, parseCsv, serializeCsv } from "../src/lib/csv/parseCsv.ts";
import { imageFileError } from "../src/lib/image/readImageFiles.ts";
import { createClickGate } from "../src/lib/singleFlight.ts";

const QUOTED = 'name,city\nAda,London\n"Grace, Hopper","New York"\n';

test("quoted commas stay one cell and trailing fields are kept", () => {
  const rows = parseCsv(QUOTED, ",");
  assert.deepEqual(rows, [
    ["name", "city"],
    ["Ada", "London"],
    ["Grace, Hopper", "New York"],
  ]);
  assert.deepEqual(parseCsv("a,b,", ","), [["a", "b", ""]]);
  assert.deepEqual(parseCsv("a,b,\n", ","), [["a", "b", ""]]);
});

test("escaped quotes, quoted newlines, CRLF, and a BOM", () => {
  assert.deepEqual(parseCsv('"say ""hi""",next\r\n', ","), [['say "hi"', "next"]]);
  assert.deepEqual(parseCsv('name,note\nAda,"line1\nline2"\n', ","), [
    ["name", "note"],
    ["Ada", "line1\nline2"],
  ]);
  assert.deepEqual(parseCsv("\uFEFFname,city\nAda,London\n", ","), [
    ["name", "city"],
    ["Ada", "London"],
  ]);
  assert.throws(() => parseCsv('"open\n', ","), /unclosed quote/);
});

test("semicolon, tab, and pipe delimiters", () => {
  assert.deepEqual(parseCsv('name;city\n"Hopper; Grace";NY\n', ";"), [
    ["name", "city"],
    ["Hopper; Grace", "NY"],
  ]);
  assert.deepEqual(parseCsv("name\tcity\nAda\tLondon\n", "\t"), [
    ["name", "city"],
    ["Ada", "London"],
  ]);
  assert.deepEqual(parseCsv("name|city\nAda|London\n", "|"), [
    ["name", "city"],
    ["Ada", "London"],
  ]);
});

test("csv-to-json records keep the quoted city", () => {
  assert.deepEqual(csvToRecords(QUOTED, ",", true), [
    { name: "Ada", city: "London" },
    { name: "Grace, Hopper", city: "New York" },
  ]);
});

test("serializeCsv quotes delimiters, quotes, and newlines", () => {
  const csv = serializeCsv(
    [
      ["name", "city"],
      ['Grace, "Hopper"', "New\nYork"],
    ],
    ",",
  );
  assert.equal(csv, 'name,city\n"Grace, ""Hopper""","New\nYork"');
  assert.deepEqual(parseCsv(csv, ","), [
    ["name", "city"],
    ['Grace, "Hopper"', "New\nYork"],
  ]);
});

test("empty and non-image files are rejected before decode", () => {
  assert.match(imageFileError({ name: "empty.jpg", size: 0, type: "image/jpeg" }) ?? "", /empty/);
  assert.match(imageFileError({ name: "notes.txt", size: 12, type: "text/plain" }) ?? "", /not an image/);
  assert.equal(imageFileError({ name: "photo.jpg", size: 20, type: "image/jpeg" }), null);
});

test("a second click is ignored while a job is in flight and during the cooldown", async () => {
  let clock = 0;
  const gate = createClickGate(() => clock);
  const calls = [];
  const run = (label) => {
    if (!gate.enter()) return;
    calls.push(label);
    return new Promise((resolve) => {
      setTimeout(() => {
        gate.leave();
        resolve(label);
      }, 20);
    });
  };

  const first = run("first");
  run("second");
  await first;
  clock = 100;
  run("during-cooldown");
  clock = 600;
  const third = run("third");
  await third;
  assert.deepEqual(calls, ["first", "third"]);
});

test("inflation uses supplied CPI ratios and handles same-year and invalid inputs", async () => {
  const { calculateThenVsNow } = await import("../src/lib/thenVsNow.ts");
  const { readFileSync } = await import("node:fs");
  const cpi = JSON.parse(readFileSync(new URL("../src/data/cpiThenVsNow.json", import.meta.url), "utf8"));
  for (const currency of ["INR", "USD"]) {
    const series = cpi[currency];
    const result = calculateThenVsNow(1000, 1995, series);
    assert.equal(result.value, 1000 * (series.latest.value / series.annual[1995]));
    assert.ok(Math.abs((1 + result.annualRate / 100) ** (series.latest.year - 1995) - result.multiplier) < 1e-10);
  }
  assert.deepEqual(calculateThenVsNow(1000, 2025, cpi.INR), { value: 1000, multiplier: 1, annualRate: null });
  assert.equal(calculateThenVsNow(0, 1990, cpi.USD).value, 0);
  for (const [amount, year] of [[-1, 1995], [Infinity, 1995], [1, 1989], [1, 2026], [1, 1995.5]]) {
    assert.throws(() => calculateThenVsNow(amount, year, cpi.INR));
  }
});
