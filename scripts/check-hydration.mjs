/**
 * Loads prerendered pages in a real browser and reports whether they hydrate.
 *
 * The build can only prove a page was written, not that React reattaches to it.
 * A hydration mismatch discards the server markup and replaces it with a
 * client render, which looks fine in a screenshot and throws away the whole
 * point of prerendering. This catches that, plus any console error.
 *
 *   node scripts/serve-dist.mjs &
 *   node --experimental-websocket scripts/check-hydration.mjs /pdf-merge /zip-creator
 *
 * The flag is needed on Node 20, which has no global WebSocket.
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = Number(process.env.CDP_PORT ?? 9222);
const BASE = `http://localhost:${process.env.BASE_PORT ?? 4177}`;
const routes = process.argv.slice(2);

if (routes.length === 0) {
  console.error("Usage: node --experimental-websocket scripts/check-hydration.mjs <route...>");
  process.exit(1);
}

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, "--headless=new", "--disable-gpu", "--no-first-run",
  "--no-default-browser-check", `--user-data-dir=/tmp/cdp-hydration-${Date.now()}`, "about:blank",
], { stdio: "ignore" });
await sleep(6000);

let failures = 0;

for (const route of routes) {
  const target = await (await fetch(`http://localhost:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const messages = [];
  let id = 0;
  const pending = new Map();
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type))
      messages.push(m.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
    if (m.method === "Runtime.exceptionThrown")
      messages.push("EXCEPTION " + (m.params.exceptionDetails.exception?.description ?? ""));
  };
  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.navigate", { url: BASE + route });
  await sleep(3500);
  const probe = await send("Runtime.evaluate", {
    expression: `JSON.stringify({
      h1Count: document.querySelectorAll('h1').length,
      workbench: !!document.querySelector('#tool-workbench'),
      bodyLen: document.body.innerText.length,
    })`,
    returnByValue: true,
  });
  ws.close();

  const result = JSON.parse(probe.result.value);
  const hydration = messages.filter((m) => /hydrat|did not match|Minified React error #4\d\d/i.test(m));
  const other = messages.filter((m) => !hydration.includes(m));
  const bad = hydration.length > 0 || other.length > 0 || result.h1Count !== 1 || !result.workbench;
  if (bad) failures++;

  console.log(`${bad ? "✗" : "✓"} ${route}`);
  console.log(`    h1: ${result.h1Count} | workbench: ${result.workbench} | body: ${result.bodyLen} chars`);
  if (hydration.length) console.log(`    hydration: ${hydration.slice(0, 3).join(" / ")}`);
  if (other.length) console.log(`    console: ${other.slice(0, 3).join(" / ")}`);
}

chrome.kill();
process.exit(failures > 0 ? 1 : 0);
