/**
 * Renders public/favicon.svg into the PNG sizes browsers and platforms expect,
 * and packs a real favicon.ico.
 *
 * The previous favicon.ico was a 73x74 PNG with an .ico extension and was not
 * linked from anywhere, so every browser that probes /favicon.ico by convention
 * got a file it could not parse.
 *
 *   node --experimental-websocket scripts/generate-icons.mjs
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = Number(process.env.CDP_PORT ?? 9366);

const SIZES = [
  { size: 32, file: "favicon-32.png" },
  { size: 180, file: "apple-touch-icon.png" },
  { size: 192, file: "icon-192.png" },
  { size: 512, file: "icon-512.png" },
];

const svg = readFileSync(join(PUBLIC, "favicon.svg"), "utf-8");
const dataUri = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, "--headless=new", "--disable-gpu", "--no-first-run",
  "--hide-scrollbars", "--default-background-color=00000000",
  `--user-data-dir=/tmp/cdp-icons-${Date.now()}`, "about:blank",
], { stdio: "ignore" });
await sleep(6000);

const rendered = new Map();
for (const { size, file } of SIZES) {
  const t = await (await fetch(`http://localhost:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", {
    url: "data:text/html," + encodeURIComponent(
      `<body style="margin:0"><img src="${dataUri}" width="${size}" height="${size}"></body>`),
  });
  await sleep(1200);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  const buf = Buffer.from(shot.data, "base64");
  writeFileSync(join(PUBLIC, file), buf);
  rendered.set(size, buf);
  console.log(`  public/${file}  ${buf.length} bytes`);
  ws.close();
}
chrome.kill();

/*
 * An ICO can embed PNG data directly, which every browser since IE11 reads, so
 * there is no need to encode a BMP. Header, then one directory entry per image,
 * then the image data.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = [], blobs = [];
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8); e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e); blobs.push(data);
  }
  return Buffer.concat([header, ...entries, ...blobs]);
}

const icoBuf = ico([{ size: 32, data: rendered.get(32) }]);
writeFileSync(join(PUBLIC, "favicon.ico"), icoBuf);
console.log(`  public/favicon.ico  ${icoBuf.length} bytes (PNG-in-ICO, 32x32)`);
