/**
 * Minimal static server for dist/, used when driving the built site in a real
 * browser (see scripts/measure-tool.mjs and docs/CONTENT_FIXTURES.md).
 *
 * Deliberately not `vite preview`: the point is to serve exactly the files that
 * would be deployed, including the directory-index behaviour a static host gives
 * /pdf-merge, and to fall through to 404.html the way the real host does.
 *
 *   node scripts/serve-dist.mjs [port]
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PORT = Number(process.argv[2] ?? 4177);

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".ico": "image/x-icon", ".txt": "text/plain",
  ".xml": "application/xml", ".woff2": "font/woff2",
};

createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  let file = join(DIST, urlPath);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) file = join(DIST, urlPath, "index.html");
  if (!existsSync(file)) {
    res.writeHead(404, { "Content-Type": "text/html" });
    return res.end(existsSync(join(DIST, "404.html")) ? readFileSync(join(DIST, "404.html")) : "404");
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`serving dist/ on http://localhost:${PORT}`));
