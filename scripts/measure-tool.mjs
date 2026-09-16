/**
 * Drives a real tool page in a real browser with a real file and records the
 * bytes it produces. Measuring the library in Node would be easier and would be
 * measuring the wrong thing — these numbers are published as what the tool does.
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { statSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9410;
const PROFILE = "/tmp/cdp-measure-" + Date.now();
const [route, filePath, buttonText, waitMs = "8000"] = process.argv.slice(2);
const SETUP_JS = process.env.SETUP_JS;

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, "--headless=new", "--disable-gpu",
  "--no-first-run", "--user-data-dir=" + PROFILE, "about:blank",
], { stdio: "ignore" });
await sleep(6000);

const target = await (await fetch(`http://localhost:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
await new Promise((r) => (ws.onopen = r));
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;

await send("Page.enable"); await send("Runtime.enable"); await send("DOM.enable");
// Record every blob the page hands to a download, and how long the run took.
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  window.__outputs = [];
  const realCreate = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (obj) => {
    if (obj instanceof Blob) window.__outputs.push({ size: obj.size, type: obj.type, at: performance.now() });
    return realCreate(obj);
  };
  const realClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__clicked = true; return; } return realClick.call(this); };
` });

await send("Page.navigate", { url: `http://localhost:4177${route}` });
await sleep(4000);

const doc = await send("DOM.getDocument", { depth: -1 });
const input = await send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: '#tool-workbench input[type="file"]' });
if (!input.nodeId) { console.error("no file input found on " + route); ws.close(); chrome.kill(); process.exit(1); }
const files = filePath.split(",");
await send("DOM.setFileInputFiles", { nodeId: input.nodeId, files });
await sleep(2500);

if (SETUP_JS) { const r = await ev(SETUP_JS); console.error("  setup:", r); await sleep(1200); }

const started = await ev(`(() => {
  const btn = [...document.querySelectorAll('#tool-workbench button')]
    .find(b => b.textContent.trim().toLowerCase().includes(${JSON.stringify(buttonText.toLowerCase())}));
  if (!btn) return "button not found: " + [...document.querySelectorAll('#tool-workbench button')].map(b=>b.textContent.trim()).join(" | ");
  window.__t0 = performance.now(); btn.click(); return "clicked";
})()`);
if (started !== "clicked") { console.error(started); ws.close(); chrome.kill(); process.exit(1); }

await sleep(Number(waitMs));
const outputs = await ev("JSON.stringify(window.__outputs.map(o => ({...o, ms: Math.round(o.at - window.__t0)})))");
const parsed = JSON.parse(outputs).filter((o) => o.ms >= 0);
const before = filePath.split(",").reduce((s, f) => s + statSync(f).size, 0);
const result = parsed[parsed.length - 1];
if (!result) { console.error("no output blob produced"); ws.close(); chrome.kill(); process.exit(1); }

const pct = (((before - result.size) / before) * 100).toFixed(1);
console.log(JSON.stringify({
  route, file: filePath.split(",").map(f => f.split("/").pop()).join(" + "),
  before, after: result.size, reduction: pct + "%", type: result.type, ms: result.ms,
}));
ws.close(); chrome.kill();
