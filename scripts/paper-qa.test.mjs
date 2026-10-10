/**
 * Regression checks for the post-redesign QA pass.
 *   node --experimental-strip-types --test scripts/paper-qa.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { describe, it } from "node:test";
import { rankPaletteTools, scorePaletteQuery } from "../src/lib/paletteSearch.ts";

function loadPaletteTools() {
  const data = JSON.parse(readFileSync(new URL("../src/data/tools.json", import.meta.url), "utf8"));
  const names = new Map(data.categories.map((category) => [category.id, category.name]));
  const devTools = data.tools.map((tool) => ({
    id: tool.id,
    name: tool.name,
    description: tool.description,
    keywords: tool.keywords ?? [],
    category: names.get(tool.category) ?? "Developer Tools",
  }));
  const source = readFileSync(new URL("../src/lib/allToolsForPalette.ts", import.meta.url), "utf8");
  const hardcoded = [];
  const line =
    /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*keywords:\s*(\[[^\]]*\]),\s*path:\s*"[^"]+",\s*icon:\s*"[^"]+",\s*category:\s*"([^"]+)"\s*\}/g;
  for (const match of source.matchAll(line)) {
    hardcoded.push({
      id: match[1],
      name: match[2],
      description: match[3],
      keywords: JSON.parse(match[4].replace(/'/g, '"')),
      category: match[5],
    });
  }
  const all = [...devTools, ...hardcoded];
  const categoryOrder = [...data.categories.map((category) => category.name), ...hardcoded.map((tool) => tool.category)];
  const seen = new Set();
  const ordered = categoryOrder.filter((category) => (seen.has(category) ? false : seen.add(category)));
  return ordered.flatMap((category) => all.filter((tool) => tool.category === category));
}

const tools = loadPaletteTools();

function firstId(query) {
  return rankPaletteTools(tools, query)[0]?.id ?? null;
}

describe("palette ranking", () => {
  it("puts the best name or synonym match first", () => {
    assert.equal(firstId("merge"), "pdf-merge");
    assert.equal(firstId("pdf"), "pdf-merge");
    assert.equal(firstId("resize"), "image-resizer");
    assert.equal(firstId("json"), "json-formatter");
    assert.equal(firstId("compress"), "pdf-compress");
    assert.equal(firstId("convert"), "case-converter");
    assert.equal(firstId("qr"), "qr-code-generator");
    assert.equal(firstId("base64"), "base64-tool");
  });

  it("hides tools that do not match and keeps an empty result", () => {
    assert.equal(rankPaletteTools(tools, "zzzz-not-a-tool").length, 0);
    assert.equal(scorePaletteQuery(tools[0], "   "), 1);
    assert.equal(rankPaletteTools(tools, "").length, tools.length);
  });

  it("does not treat a fuzzy subsequence as a match", () => {
    const lorem = tools.find((tool) => tool.id === "lorem-ipsum-generator");
    assert.ok(lorem);
    assert.equal(scorePaletteQuery(lorem, "merge"), 0);
  });
});

function vercelDestination(host, path) {
  const { redirects } = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  for (const rule of redirects) {
    const hostRule = rule.has?.find((entry) => entry.type === "host");
    if (hostRule && hostRule.value !== host) continue;
    const names = [];
    const pattern = rule.source.replace(/\/:([A-Za-z0-9_]+)/g, (_match, name) => {
      names.push(name);
      return "/([^/]+)";
    }).replace(/\(\.\*\)/g, () => {
      names.push("__rest");
      return "(.*)";
    });
    const match = new RegExp(`^${pattern}$`).exec(path);
    if (!match) continue;
    let destination = rule.destination;
    names.forEach((name, index) => {
      destination = destination.replaceAll(`:${name}`, match[index + 1]).replaceAll(`$${index + 1}`, match[index + 1]);
    });
    if (destination.startsWith("/")) destination = `https://${host}${destination}`;
    return destination;
  }
  return null;
}

describe("host plus legacy path", () => {
  it("resolves toolocean.vercel.app legacy paths in one hop", () => {
    assert.equal(
      vercelDestination("toolocean.vercel.app", "/tools/json-formatter"),
      "https://toolocean.co/json-formatter",
    );
    assert.equal(
      vercelDestination("toolocean.vercel.app", "/pdf-tools/pdf-merge"),
      "https://toolocean.co/pdf-merge",
    );
    assert.equal(
      vercelDestination("toolocean.vercel.app", "/tools/csv-json-converter"),
      "https://toolocean.co/csv-to-json",
    );
    assert.equal(
      vercelDestination("www.toolocean.co", "/image-tools/image-resizer"),
      "https://toolocean.co/image-resizer",
    );
    assert.equal(vercelDestination("toolocean.vercel.app", "/pdf-merge"), "https://toolocean.co/pdf-merge");
    assert.equal(vercelDestination("toolocean.co", "/tools/json-formatter"), "https://toolocean.co/json-formatter");
  });
});

function relLuminance(hex) {
  const value = parseInt(hex.slice(1), 16);
  const channel = (shift) => {
    const raw = ((value >> shift) & 255) / 255;
    return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
}

function contrast(foreground, background) {
  const lighter = Math.max(relLuminance(foreground), relLuminance(background));
  const darker = Math.min(relLuminance(foreground), relLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("paper contrast tokens", () => {
  it("keeps muted ink at AA on the search chip and dark surfaces", () => {
    const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
    const light = css.match(/:root \{[\s\S]*?--muted-ink:\s*(#[0-9a-f]{6})/i)?.[1];
    const dark = css.match(/\.dark \{[\s\S]*?--muted-ink:\s*(#[0-9a-f]{6})/i)?.[1];
    assert.equal(light, "#68645c");
    assert.equal(dark, "#a39d90");
    assert.ok(contrast(light, "#efece4") >= 4.5);
    assert.ok(contrast(light, "#fcfbf9") >= 4.5);
    assert.ok(contrast(dark, "#1e1b17") >= 4.5);
    assert.ok(contrast(dark, "#211d19") >= 4.5);
    assert.equal(css.includes("opacity: 0.7"), false);
  });
});

describe("breadcrumb markup", () => {
  it("does not put a span or separator between list items", () => {
    const source = readFileSync(new URL("../src/components/seo/Breadcrumbs.tsx", import.meta.url), "utf8");
    assert.equal(source.includes("<span"), false);
    assert.equal(source.includes("BreadcrumbSeparator"), false);
    assert.match(source, /<BreadcrumbItem/);
  });
});

describe("choose-file wording", () => {
  it("does not tell a tool visitor to upload a file", () => {
    const hits = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir)) {
        const full = `${dir}/${entry}`;
        if (statSync(full).isDirectory()) walk(full);
        else if (entry.endsWith(".tsx")) {
          const text = readFileSync(full, "utf8");
          for (const line of text.split("\n")) {
            const visible = line
              .replace(/<Upload\b[^>]*>/g, "")
              .replace(/import\s*\{[^}]*\}/g, "")
              .replace(/^\s*Upload,\s*$/g, "")
              .replace(/action\.type === "upload"/g, "")
              .replace(/handleFileUpload|makeUploadHandler/g, "");
            if (/\bupload\b/i.test(visible) && !/not uploaded|never uploaded|nothing is uploaded|no uploads/i.test(visible)) {
              if (visible.trim().startsWith("//") || visible.trim().startsWith("*") || visible.trim().startsWith("{/*")) continue;
              hits.push(`${full}: ${line.trim()}`);
            }
          }
        }
      }
    };
    walk(new URL("../src/components/tools/implementations", import.meta.url).pathname);
    assert.deepEqual(hits, []);
  });
});

describe("palette and offline shell", () => {
  it("keeps the header clickable while a dialog locks the page", () => {
    const header = readFileSync(new URL("../src/components/layout/Header.tsx", import.meta.url), "utf8");
    assert.match(header, /DismissableLayerBranch/);
    assert.match(header, /pointer-events-auto/);
  });

  it("caches hashed assets and fonts, never HTML, and claims only after that store", () => {
    const worker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
    assert.match(worker, /toolocean-assets-v2/);
    assert.match(worker, /pathname\.startsWith\("\/assets\/"\)/);
    assert.match(worker, /pathname\.startsWith\("\/fonts\/"\)/);
    assert.match(worker, /caches\.delete/);
    assert.match(worker, /clients\.claim/);
    assert.equal(worker.includes("text/html"), false);
    assert.equal(worker.includes(".html"), false);
    const activate = worker.slice(worker.indexOf('addEventListener("activate"'), worker.indexOf('addEventListener("fetch"'));
    assert.equal(activate.includes("clients.claim"), false);
    const message = worker.slice(worker.indexOf('data.type !== "cache-urls"'));
    assert.match(message, /clients\.claim/);
  });

  it("prefetches the lazy chunks each heavy tool imports on click", () => {
    const source = readFileSync(new URL("../src/lib/offlinePrefetch.ts", import.meta.url), "utf8");
    for (const needle of [
      "compressPdfToTarget",
      "prefetchPdfJs",
      "prefetchPdfJsWorker",
      "pdfJsWorkerUrl",
      "imageEncodeWorkerUrl",
      "serviceWorker.ready",
      "@cantoo/pdf-lib",
      "encodeImageToTarget",
      "prefetchImageEncodeAssets",
      "jszip",
      "signPdf",
      "fillPdfForm",
      "pdfMetadata",
      "unlockPdf",
      '"pdf-compress"',
      '"image-compressor"',
      '"image-resizer"',
      "toolocean-assets-v2",
      'cache: "force-cache"',
    ]) {
      assert.equal(source.includes(needle), true, needle);
    }
    const pdf = readFileSync(new URL("../src/lib/pdf/lazyPdf.ts", import.meta.url), "utf8");
    assert.match(pdf, /pdfjs-dist/);
    assert.match(pdf, /pdf\.worker\.min\.mjs/);
    const image = readFileSync(new URL("../src/lib/targetSize/encodeImageToTarget.ts", import.meta.url), "utf8");
    assert.match(image, /imageEncode\.worker\.ts/);
  });

  it("does not tell a tool page to upload the reader's file", () => {
    const hits = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir)) {
        const full = `${dir}/${entry}`;
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry)) scan(full);
      }
    };
    const scan = (full) => {
      for (const line of readFileSync(full, "utf8").split("\n")) {
        if (!/\bupload\b/i.test(line)) continue;
        if (/no upload|without upload|never upload|not uploaded|nothing is uploaded|nothing uploads|is not an upload|rather not upload|would not upload|uploads\?|action: "upload"|action\.type/i.test(line)) continue;
        if (/\bupload (an|a|the|your|panel)\b/i.test(line)) hits.push(`${full}: ${line.trim()}`);
      }
    };
    scan(new URL("../src/data/toolSeo.ts", import.meta.url).pathname);
    walk(new URL("../src/data/toolContent", import.meta.url).pathname);
    assert.deepEqual(hits, []);
    const mime = readFileSync(new URL("../src/data/toolSeo.ts", import.meta.url), "utf8");
    assert.match(mime, /Content-Type headers and uploads/);
  });

  it("keeps the cookie notice in the document flow", () => {
    const banner = readFileSync(new URL("../src/components/analytics/ConsentBanner.tsx", import.meta.url), "utf8");
    assert.equal(banner.includes("fixed "), false);
    assert.match(banner, /data-consent-banner/);
  });
});
