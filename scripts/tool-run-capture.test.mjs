/**
 * tool-run delivery: the Umami queue for events sent before the deferred tag
 * loads, and the copy/download capture for tools that never call
 * markToolSuccess.
 *
 *   node --experimental-strip-types --test scripts/tool-run-capture.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { createToolRunReporter } from "../src/lib/toolRunEvent.ts";
import { markCapturedToolSuccess, markToolSuccess, subscribeToolSuccess } from "../src/lib/toolResult.ts";
import { CAPTURE_DEFER_MS, INTERACTION_TTL_MS, installToolRunCapture } from "../src/lib/toolRunCapture.ts";
import {
  MAX_PENDING_EVENTS,
  TOOL_RUN_EVENT,
  clearUmamiQueue,
  flushUmamiQueue,
  pendingUmamiEvents,
  trackUmamiEvent,
} from "../src/lib/umami.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

function withWindow(run) {
  globalThis.window = new EventTarget();
  globalThis.document = new EventTarget();
  try {
    return run();
  } finally {
    clearUmamiQueue();
    delete globalThis.window;
    delete globalThis.document;
  }
}

function spyUmami() {
  const calls = [];
  window.umami = { track: (...args) => calls.push(args) };
  return calls;
}

/* ---------------------------- Umami queue ---------------------------- */

test("an event sent before window.umami exists is queued and flushed once the tag loads", () => {
  withWindow(() => {
    trackUmamiEvent(TOOL_RUN_EVENT, { tool: "word-counter", slug: "word-counter" });
    assert.equal(pendingUmamiEvents(), 1);
    assert.equal(flushUmamiQueue(), 0, "nothing to flush into yet");

    const calls = spyUmami();
    assert.equal(flushUmamiQueue(), 1);
    assert.deepEqual(calls, [["tool-run", { tool: "word-counter", slug: "word-counter" }]]);
    assert.equal(pendingUmamiEvents(), 0);
    assert.equal(flushUmamiQueue(), 0, "a flushed event is not sent twice");
  });
});

test("the next direct event flushes the queue first, in order", () => {
  withWindow(() => {
    trackUmamiEvent("tool-run", { tool: "a", slug: "a" });
    const calls = spyUmami();
    trackUmamiEvent("tool-run", { tool: "b", slug: "b" });
    assert.deepEqual(
      calls.map(([, data]) => data.tool),
      ["a", "b"],
    );
  });
});

test("the queue is bounded and a throwing tracker does not lose the rest or throw", () => {
  withWindow(() => {
    for (let i = 0; i < MAX_PENDING_EVENTS + 5; i += 1) trackUmamiEvent("tool-run", { tool: `t${i}`, slug: "s" });
    assert.equal(pendingUmamiEvents(), MAX_PENDING_EVENTS);
    let seen = 0;
    window.umami = {
      track() {
        seen += 1;
        if (seen === 1) throw new Error("blocked");
      },
    };
    assert.doesNotThrow(() => flushUmamiQueue());
    assert.equal(seen, MAX_PENDING_EVENTS);
  });
});

test("the queue retries on a timer, so a tag that loads late still gets the event", async () => {
  globalThis.window = new EventTarget();
  globalThis.document = new EventTarget();
  try {
    trackUmamiEvent("tool-run", { tool: "late", slug: "late" });
    await new Promise((resolve) => setTimeout(resolve, 100));
    const calls = spyUmami();
    await new Promise((resolve) => setTimeout(resolve, 600));
    assert.deepEqual(calls, [["tool-run", { tool: "late", slug: "late" }]]);
  } finally {
    clearUmamiQueue();
    delete globalThis.window;
    delete globalThis.document;
  }
});

test("outside a browser trackUmamiEvent neither queues nor throws", () => {
  assert.doesNotThrow(() => trackUmamiEvent("tool-run", { tool: "x", slug: "x" }));
  assert.equal(pendingUmamiEvents(), 0);
});

/* ------------------------- copy/download capture ------------------------- */

const inTool = { closest: (sel) => (sel.includes("#tool-workbench") ? {} : null) };
const outside = { closest: () => null };

function fakeEvent(type, target, isTrusted = true) {
  const event = new Event(type);
  Object.defineProperty(event, "target", { value: target });
  Object.defineProperty(event, "isTrusted", { value: isTrusted });
  return event;
}

function setup({ failCopy = false } = {}) {
  const document = new EventTarget();
  let clock = 1_000_000;
  const clipboardWrites = [];
  const clipboard = {
    writeText: async (text) => {
      if (failCopy) throw new Error("denied");
      clipboardWrites.push(text);
    },
  };
  const clicks = [];
  const anchorPrototype = {
    click() {
      clicks.push(this);
    },
  };
  const signals = [];
  const delays = [];
  const stop = installToolRunCapture({
    document,
    clipboard,
    anchorPrototype,
    now: () => clock,
    schedule: (run, ms) => {
      delays.push(ms);
      run();
    },
    signal: () => signals.push(clock),
  });
  return {
    document,
    clipboard,
    anchorPrototype,
    clipboardWrites,
    clicks,
    signals,
    delays,
    stop,
    tick: (ms) => (clock += ms),
    press: (target) => document.dispatchEvent(fakeEvent("pointerdown", target)),
  };
}

const anchor = (download) => ({ hasAttribute: (name) => name === "download" && download });
const settle = () => new Promise((resolve) => setImmediate(resolve));

test("a copy right after an interaction inside the tool signals a run, deferred", async () => {
  const env = setup();
  env.press(inTool);
  await env.clipboard.writeText("result");
  await settle();
  assert.deepEqual(env.clipboardWrites, ["result"], "the real write still happens");
  assert.equal(env.signals.length, 1);
  assert.deepEqual(env.delays, [CAPTURE_DEFER_MS]);
  env.stop();
});

test("a copy after an interaction outside every tool root does not signal", async () => {
  const env = setup();
  env.press(inTool);
  env.press(outside); // header "copy link", say
  await env.clipboard.writeText("https://toolocean.co/x");
  await settle();
  assert.equal(env.signals.length, 0);
  env.stop();
});

test("a failed clipboard write does not signal", async () => {
  const env = setup({ failCopy: true });
  env.press(inTool);
  await assert.rejects(env.clipboard.writeText("x"), /denied/);
  await settle();
  assert.equal(env.signals.length, 0);
  env.stop();
});

test("a programmatic <a download>.click() after a tool interaction signals; a plain link does not", () => {
  const env = setup();
  env.press(inTool);
  env.anchorPrototype.click.call(anchor(false));
  assert.equal(env.signals.length, 0);
  env.anchorPrototype.click.call(anchor(true));
  assert.equal(env.signals.length, 1);
  assert.equal(env.clicks.length, 2, "the original click still runs");
  env.stop();
});

test("a real click on a download link inside the tool signals; a synthetic one does not", () => {
  const env = setup();
  const link = { closest: (sel) => (sel === "a[download]" ? link : sel.includes("#tool-workbench") ? {} : null) };
  env.document.dispatchEvent(fakeEvent("click", link, false));
  assert.equal(env.signals.length, 0);
  env.document.dispatchEvent(fakeEvent("click", link, true));
  assert.equal(env.signals.length, 1);
  env.stop();
});

test("the interaction window expires", async () => {
  const env = setup();
  env.press(inTool);
  env.tick(INTERACTION_TTL_MS + 1);
  await env.clipboard.writeText("late");
  env.anchorPrototype.click.call(anchor(true));
  await settle();
  assert.equal(env.signals.length, 0);
  env.stop();
});

test("uninstalling restores the clipboard and the anchor click; installs are reference counted", () => {
  const document = new EventTarget();
  const proto = { click() {} };
  const originalClick = proto.click;
  const clipboard = { writeText: async () => {} };
  const env = { document, clipboard, anchorPrototype: proto, schedule: () => {}, signal: () => {} };
  const a = installToolRunCapture(env);
  const patched = proto.click;
  const b = installToolRunCapture(env);
  assert.equal(proto.click, patched, "a second install does not wrap twice");
  a();
  assert.equal(proto.click, patched, "still installed while one caller remains");
  b();
  assert.equal(proto.click, originalClick);
  assert.equal(Object.prototype.hasOwnProperty.call(clipboard, "writeText"), true);
  b();
  assert.equal(proto.click, originalClick, "cleanup is idempotent");
});

/* --------------------- reporter: captured vs explicit --------------------- */

test("a captured signal sends tool-run for a tool that never reports itself", () => {
  withWindow(() => {
    const calls = spyUmami();
    let clock = 0;
    const stop = subscribeToolSuccess(
      createToolRunReporter({ tool: "word-counter", slug: "word-counter", send: trackUmamiEvent, now: () => clock }),
      { includeCaptured: true },
    );
    markCapturedToolSuccess();
    markCapturedToolSuccess(); // copy pressed twice in a row
    assert.equal(calls.length, 1);
    clock += 5_000;
    markCapturedToolSuccess();
    assert.equal(calls.length, 2, "a later copy is a new run");
    stop();
    assert.deepEqual(calls[0], ["tool-run", { tool: "word-counter", slug: "word-counter" }]);
  });
});

test("captured signals are ignored once the tool has reported itself", () => {
  withWindow(() => {
    const calls = spyUmami();
    let clock = 0;
    const stop = subscribeToolSuccess(
      createToolRunReporter({ tool: "pdf-to-images", slug: "pdf-to-images", send: trackUmamiEvent, now: () => clock }),
      { includeCaptured: true },
    );
    markToolSuccess("pages"); // rendered
    clock += 10_000;
    markCapturedToolSuccess(); // the ZIP download of the same pages
    assert.equal(calls.length, 1);
    stop();
  });
});

test("subscribers that do not ask for captured signals (the tip jar) never see them", () => {
  withWindow(() => {
    const seen = [];
    const stop = subscribeToolSuccess((key, captured) => seen.push(captured));
    markCapturedToolSuccess();
    markToolSuccess();
    stop();
    assert.deepEqual(seen, [false]);
  });
});

/* ------------------------------ call sites ------------------------------ */

test("useToolRunEvent installs the capture and listens for captured signals", () => {
  const hook = read("src/hooks/useWorkbenchAnalytics.ts");
  assert.match(hook, /installToolRunCapture\(\)/);
  assert.match(hook, /subscribeToolSuccess\(report, \{ includeCaptured: true \}\)/);
  assert.match(hook, /useToolRunEvent\(tool, tool\)/);
  assert.match(read("src/pages/LandingRoutePage.tsx"), /useToolRunEvent\(tool, slug\)/);
  assert.doesNotMatch(read("src/components/layout/TipJar.tsx"), /includeCaptured/);
});

test("the capture roots match the workbench id and the landing embed attribute", () => {
  assert.match(read("src/lib/toolRunCapture.ts"), /#tool-workbench, \[data-lean-embed\]/);
  assert.match(read("src/pages/LandingRoutePage.tsx"), /data-lean-embed=\{tool\}/);
  assert.match(read("src/lib/toolActions.ts"), /WORKBENCH_ID = "tool-workbench"/);
  assert.match(read("src/components/tool-page/ToolWorkbench.tsx"), /id=\{WORKBENCH_ID\}/);
});
