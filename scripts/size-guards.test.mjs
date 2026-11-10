/**
 * Behaviour of the run guard and the delivery plan that the image and PDF
 * size tools call. Pure .ts imports only: no DOM, no build output.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { createRunGuard, decideImageOutcome, planImageDelivery } from "../src/lib/targetOutcome.ts";

const exact = (overrides = {}) =>
  decideImageOutcome({
    mode: "exact",
    originalBytes: 300_000,
    outputBytes: 90_000,
    targetBytes: 102_400,
    withinTarget: true,
    scale: 1,
    inputFormat: "jpeg",
    outputFormat: "jpeg",
    formatExplicit: false,
    ...overrides,
  });

const line = (name, outcome, format = "jpeg") => ({ name, outcome, bytes: new Uint8Array([name.length]), format });

test("run guard: a second start while busy is refused until the first finishes", () => {
  const run = createRunGuard();
  assert.equal(run.tryStart(), true);
  assert.equal(run.busy(), true);
  assert.equal(run.tryStart(), false);
  run.finish();
  assert.equal(run.busy(), false);
  assert.equal(run.tryStart(), true);
});

test("run guard: a token taken before a file change is stale", () => {
  const run = createRunGuard();
  const token = run.token();
  assert.equal(run.isCurrent(token), true);
  run.bump();
  assert.equal(run.isCurrent(token), false);
  assert.equal(run.isCurrent(run.token()), true);
});

test("image outcome: bytes in another format than requested are withheld, before any other check", () => {
  const outcome = exact({ outputFormat: "webp", actualFormat: "png", formatExplicit: true, withinTarget: false });
  assert.deepEqual(outcome, { kind: "format-unsupported", deliver: false, success: false });
  assert.equal(exact({ outputFormat: "webp", actualFormat: "webp" }).kind, "fit");
  assert.equal(exact({ actualFormat: "jpeg" }).kind, "fit");
});

test("delivery: a batch of withheld outcomes plans no download and no signal", () => {
  const miss = exact({ withinTarget: false });
  const notSmaller = exact({ outputBytes: 400_000 });
  const wrongFormat = exact({ outputFormat: "webp", actualFormat: "png" });
  for (const [lines, title] of [
    [[line("a.jpg", miss), line("b.jpg", notSmaller)], "Still over the target"],
    [[line("a.jpg", wrongFormat, "webp")], "Format not supported by this browser"],
    [[line("a.jpg", notSmaller)], "Nothing downloaded"],
  ]) {
    const plan = planImageDelivery(lines, { batch: lines.length > 1 });
    assert.equal(plan.kind, "none");
    assert.deepEqual(plan.files, []);
    assert.equal(plan.signal, false);
    assert.equal(plan.toastTitle, title);
  }
});

test("delivery: a mixed batch zips only delivered files, with unique names, and signals once", () => {
  const fit = exact();
  const plan = planImageDelivery(
    [
      line("photo.jpg", fit),
      line("photo.png", fit),
      line("other.jpg", exact({ withinTarget: false })),
      line("photo.jpeg", fit),
      line("wrong.jpg", exact({ outputFormat: "webp", actualFormat: "png" }), "webp"),
    ],
    { batch: true },
  );
  assert.equal(plan.kind, "zip");
  assert.equal(plan.signal, true);
  assert.deepEqual(
    plan.files.map((file) => file.name),
    ["photo-sized.jpg", "photo-sized-2.jpg", "photo-sized-3.jpg"],
  );
});

test("delivery: one delivered file plans a single download", () => {
  const plan = planImageDelivery([line("sign.png", exact())], { batch: false });
  assert.equal(plan.kind, "single");
  assert.equal(plan.signal, true);
  assert.deepEqual(plan.files.map((file) => file.name), ["sign-sized.jpg"]);
  assert.equal(plan.toastTitle, "Downloaded");
});

test("pending decision: padded output not smaller than original is currently withheld", () => {
  // A 15,000-byte JPEG padded up to a 20 KB minimum, under a 50 KB target.
  const outcome = exact({ originalBytes: 15_000, outputBytes: 20_480, targetBytes: 51_200, withinTarget: true });
  assert.deepEqual(outcome, { kind: "not-smaller", deliver: false, success: false });
  assert.equal(planImageDelivery([line("small.jpg", outcome)], { batch: false }).kind, "none");
});
