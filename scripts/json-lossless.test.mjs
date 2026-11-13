/**
 * Lossless JSON numbers for the formatter and minifier.
 *
 *   node --experimental-strip-types --test scripts/json-lossless.test.mjs
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseJsonAst, sortKeysDeepAst, stringifyJsonAst } from "../src/lib/jsonLossless.ts";

function format(text, space = 2) {
  const result = parseJsonAst(text);
  assert.equal(result.status, "ok", result.status === "error" ? result.error.message : "");
  return stringifyJsonAst(result.ast, space);
}

function minify(text) {
  return format(text, 0);
}

function fail(text) {
  const result = parseJsonAst(text);
  assert.equal(result.status, "error");
  return result.error;
}

test("a big integer at the top level is kept exactly", () => {
  assert.equal(format("12345678901234567890", 0), "12345678901234567890");
  assert.notEqual(JSON.stringify(JSON.parse("12345678901234567890")), "12345678901234567890");
});

test("big integers in arrays and nested objects are kept exactly", () => {
  const source = '{"id":12345678901234567890,"items":[1,9007199254740993,{"n":-12345678901234567890}]}';
  const out = minify(source);
  assert.match(out, /"id":12345678901234567890/);
  assert.match(out, /9007199254740993/);
  assert.match(out, /"n":-12345678901234567890/);
  assert.doesNotMatch(out, /12345678901234567000/);
});

test("negative numbers are kept", () => {
  assert.equal(minify("-42"), "-42");
  assert.equal(minify('{"x":-0.5}'), '{"x":-0.5}');
});

test("exponents keep their original spelling, including values JSON.parse cannot hold", () => {
  assert.equal(minify("1e400"), "1e400");
  assert.equal(minify("-2.5E-10"), "-2.5E-10");
  assert.equal(JSON.parse("1e400"), Infinity);
});

test("decimals keep trailing zeros and extra digits that a float would drop", () => {
  assert.equal(minify("1.10"), "1.10");
  assert.equal(minify("0.1000000000000000055"), "0.1000000000000000055");
  assert.notEqual(JSON.stringify(JSON.parse("1.10")), "1.10");
});

test("normal JSON still round-trips identically to JSON.stringify", () => {
  const samples = [
    "null",
    "true",
    "false",
    "0",
    "42",
    "-3",
    "1.5",
    '""',
    '"hello"',
    "[]",
    "{}",
    "[1,2,3]",
    '{"a":1,"b":[true,null,"x"]}',
    { source: '{"z":1,"a":{"c":3,"b":2}}', space: 2 },
    { source: "{\n  \"name\": \"Ada\",\n  \"ok\": true\n}", space: 2 },
    { source: "[{\"q\":1},{\"q\":2}]", space: 4 },
  ];
  for (const sample of samples) {
    const source = typeof sample === "string" ? sample : sample.source;
    const space = typeof sample === "string" ? 0 : sample.space;
    const parsed = JSON.parse(source);
    const expected = space ? JSON.stringify(parsed, null, space) : JSON.stringify(parsed);
    assert.equal(format(source, space), expected, source);
  }
});

test("invalid JSON still reports a clear error with line and column", () => {
  const trailing = fail('{"ok": true,}');
  assert.match(trailing.message, /trailing comma/i);
  assert.equal(trailing.line, 1);
  assert.ok(trailing.column >= 1);

  const broken = fail("{\n  \"a\": 1,\n  \"b\": \n}");
  assert.ok(broken.message.length > 0);
  assert.equal(broken.line, 4);
  assert.ok(broken.column >= 1);

  const junk = fail("[1, 2] true");
  assert.match(junk.message, /unexpected token/i);
  assert.equal(junk.line, 1);

  const empty = fail("   ");
  assert.match(empty.message, /end of JSON/i);
  assert.equal(empty.line, 1);
});

test("sort keys reorders objects and leaves arrays and number spelling alone", () => {
  const result = parseJsonAst('{"b":1.10,"a":[9007199254740993,{"z":1,"y":2}]}');
  assert.equal(result.status, "ok");
  const sorted = sortKeysDeepAst(result.ast);
  assert.equal(stringifyJsonAst(sorted), '{"a":[9007199254740993,{"y":2,"z":1}],"b":1.10}');
});

test("pretty print uses the same punctuation as JSON.stringify", () => {
  const source = '{"a":1,"b":[2,3]}';
  assert.equal(format(source, 2), JSON.stringify({ a: 1, b: [2, 3] }, null, 2));
  assert.equal(format(source, "\t"), JSON.stringify({ a: 1, b: [2, 3] }, null, "\t"));
});
