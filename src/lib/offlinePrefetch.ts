/**
 * After a tool page has loaded, pull every chunk a later click would import,
 * then ask the service worker to store those responses.
 *
 * Imports that finish before the worker controls the page still live in the
 * module map, which is why split and merge survived a cold cache. Chunks that
 * are imported only when the user clicks (exact-size compress, pdf.js worker,
 * the image encode worker) do not. The worker's fetch handler stores /assets/
 * and /fonts/ as they are requested, and a cache-urls message backfills
 * anything that was fetched before the worker claimed the page.
 *
 * This stays off the first paint: it arms on idle after load. The homepage
 * never calls it.
 */
import { pdfJsWorkerUrl, prefetchPdfJs, prefetchPdfJsWorker } from "@/lib/pdf/lazyPdf";

type Loader = () => Promise<unknown>;

const pdfLib: Loader = () => import("pdf-lib");
const cantoo: Loader = () => import("@cantoo/pdf-lib");
const pdfjs: Loader = () => Promise.all([prefetchPdfJs(), prefetchPdfJsWorker()]);
const compressTarget: Loader = () => import("@/lib/targetSize/compressPdfToTarget");
const parseSize: Loader = () => import("@/lib/targetSize/parseSize");
const encodeImage: Loader = () =>
  import("@/lib/targetSize/encodeImageToTarget").then((mod) => {
    mod.prefetchImageEncodeAssets();
    return mod;
  });
const jszip: Loader = () => import("jszip");
const jpeg: Loader = () => import("@/lib/targetSize/jpeg");
const signPdf: Loader = () => import("@/lib/pdf/signPdf");
const fillForm: Loader = () => import("@/lib/pdf/fillPdfForm");
const metadata: Loader = () => import("@/lib/pdf/pdfMetadata");
const unlock: Loader = () => import("@/lib/pdf/unlockPdf");

const BY_SLUG: Record<string, Loader[]> = {
  "pdf-merge": [pdfLib],
  "pdf-split": [pdfLib],
  "pdf-rotate": [pdfLib],
  "pdf-reorder": [pdfLib],
  "pdf-watermark": [pdfLib],
  "pdf-encrypt": [pdfLib, cantoo],
  "pdf-unlock": [unlock, cantoo, pdfjs],
  "pdf-metadata": [metadata],
  "pdf-form-fill": [fillForm],
  "pdf-sign": [signPdf, pdfjs],
  "pdf-compress": [pdfLib, pdfjs, compressTarget],
  "pdf-to-images": [pdfjs],
  "images-to-pdf": [pdfLib, parseSize, encodeImage],
  "image-compressor": [encodeImage, jszip],
  "image-resizer": [jpeg],
};

const FONT_PATHS = [
  "/fonts/instrument-sans-latin-wght-normal.woff2",
  "/fonts/geist-mono-latin-wght-normal.woff2",
];

function seenAssetUrls(): string[] {
  const urls = new Set(FONT_PATHS.map((path) => new URL(path, location.origin).href));
  for (const entry of performance.getEntriesByType("resource")) {
    try {
      const url = new URL(entry.name);
      if (url.origin !== location.origin) continue;
      if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/fonts/")) urls.add(url.href);
    } catch {
      /* Ignore a resource timing entry with an unusable name. */
    }
  }
  return [...urls];
}

const IMPORT_SPEC = /(?:\bimport\s*\(|\bfrom|\bimport)\s*["']([^"']+)["']/g;
const URL_SPEC = /new URL\(\s*["']([^"']+)["']/g;

/** Follow relative imports so a worker's chunks are cached, not only the worker entry. */
async function expandScriptImports(url: string, into: Set<string>, depth = 0): Promise<void> {
  if (depth > 5 || into.has(url)) return;
  into.add(url);
  let text = "";
  try {
    const response = await fetch(url);
    if (!response.ok) return;
    text = await response.text();
  } catch {
    return;
  }
  const specs = new Set<string>();
  for (const match of text.matchAll(IMPORT_SPEC)) specs.add(match[1]);
  for (const match of text.matchAll(URL_SPEC)) specs.add(match[1]);
  for (const spec of specs) {
    if (!/\.(?:m?js|css|wasm|woff2)(?:$|\?)/i.test(spec)) continue;
    if (!spec.startsWith(".") && !spec.startsWith("/")) continue;
    try {
      await expandScriptImports(new URL(spec, url).href, into, depth + 1);
    } catch {
      /* A relative specifier that does not resolve is not a chunk. */
    }
  }
}

function whenActive(): Promise<ServiceWorker | null> {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), 12000);
    navigator.serviceWorker.ready
      .then((registration) => {
        window.clearTimeout(timer);
        resolve(registration.active);
      })
      .catch(() => {
        window.clearTimeout(timer);
        resolve(null);
      });
  });
}

const CACHE = "toolocean-assets-v2";

/** Store URLs from this page so the HTTP cache satisfies the read. The worker only claims. */
function allowedAsset(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.origin === location.origin && (parsed.pathname.startsWith("/assets/") || parsed.pathname.startsWith("/fonts/"));
  } catch {
    return false;
  }
}

async function storeUrls(urls: string[]): Promise<void> {
  if (!("caches" in window)) return;
  const cache = await caches.open(CACHE);
  await Promise.all(
    urls.filter(allowedAsset).map(async (url) => {
      try {
        if (await cache.match(url)) return;
        const response = await fetch(url, { cache: "force-cache" });
        if (response.ok) await cache.put(url, response);
      } catch {
        /* A module that already evaluated can still run offline. */
      }
    }),
  );
}

function askCache(): Promise<boolean> {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return Promise.resolve(false);
  return whenActive().then((worker) => {
    if (!worker) return false;
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => finish(false), 15000);
      function finish(ok: boolean) {
        window.clearTimeout(timer);
        navigator.serviceWorker.removeEventListener("message", onMessage);
        resolve(ok);
      }
      function onMessage(event: MessageEvent) {
        if (event.data?.type === "cache-urls-done") finish(true);
      }
      navigator.serviceWorker.addEventListener("message", onMessage);
      worker.postMessage({ type: "cache-urls" });
    });
  });
}

/**
 * Warm this tool's lazy chunks and the asset cache. Returns a cancel function.
 */
export function scheduleOfflinePrefetch(slug: string | undefined): () => void {
  if (!slug || typeof window === "undefined") return () => {};

  let cancelled = false;
  let idleId = 0;
  let timerId = 0;

  const run = () => {
    if (cancelled) return;
    void (async () => {
      const loaders = BY_SLUG[slug] ?? [];
      await Promise.all(loaders.map((load) => load().catch(() => undefined)));
      if (cancelled) return;
      const graph = new Set<string>();
      if (loaders.includes(pdfjs)) graph.add(pdfJsWorkerUrl());
      if (loaders.includes(encodeImage)) {
        const { imageEncodeWorkerUrl } = await import("@/lib/targetSize/encodeImageToTarget");
        await expandScriptImports(imageEncodeWorkerUrl(), graph);
      }
      if (cancelled) return;
      const urls = [...new Set([...seenAssetUrls(), ...graph])];
      await storeUrls(urls);
      if (cancelled) return;
      const cached = await askCache();
      if (cancelled) return;
      if (cached || !import.meta.env.PROD) document.documentElement.dataset.offlineReady = slug;
    })();
  };

  const arm = () => {
    if (cancelled) return;
    const ric = window.requestIdleCallback;
    if (typeof ric === "function") idleId = ric(run, { timeout: 2500 });
    else timerId = window.setTimeout(run, 1200);
  };

  if (document.readyState === "complete") arm();
  else window.addEventListener("load", arm, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", arm);
    if (idleId && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
    if (timerId) window.clearTimeout(timerId);
  };
}
