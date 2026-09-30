/**
 * Screenshots routes from the built site at a given viewport.
 *
 *   node scripts/serve-dist.mjs &
 *   node --experimental-websocket scripts/screenshot.mjs 1280 900 /pdf-merge /
 *
 * Writes PNGs to .screenshots/<width>-<route>.png. Full-page by default so
 * layout problems below the fold are visible too.
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { mkdirSync, writeFileSync } from "node:fs";

const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = Number(process.env.CDP_PORT ?? 9333);
const BASE = `http://localhost:${process.env.BASE_PORT ?? 4177}`;
const OUT = ".screenshots";
const [width, height, ...routes] = process.argv.slice(2);
const FULL = process.env.FULL_PAGE !== "0";

mkdirSync(OUT, { recursive: true });
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, "--headless=new", "--disable-gpu", "--no-first-run",
  "--hide-scrollbars", `--user-data-dir=/tmp/cdp-shot-${Date.now()}`, "about:blank",
], { stdio: "ignore" });
await sleep(6000);

for (const route of routes) {
  const t = await (await fetch(`http://localhost:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: Number(width), height: Number(height), deviceScaleFactor: 2,
    mobile: Number(width) < 700,
  });
  await send("Page.navigate", { url: BASE + route });
  await sleep(3500);
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: FULL });
  const name = `${width}-${(route === "/" ? "home" : route.replace(/\//g, "")) }.png`;
  writeFileSync(`${OUT}/${name}`, Buffer.from(shot.data, "base64"));
  console.log(`  ${OUT}/${name}`);
  ws.close();
}
chrome.kill();
