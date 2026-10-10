/**
 * PDF engines are fetched only when a tool actually needs them.
 *
 * A static `import "pdf-lib"` from a tool module makes the route's chunk depend
 * on the library, so the browser downloads it before the page can paint. Callers
 * import this module (it is tiny) and invoke the loaders from a file-pick or a
 * run handler. Hover and focus may prefetch; they must not be called at module scope.
 *
 * After the tool page has loaded, the engine is also fetched on idle. Evaluating
 * the dynamic import puts the module in the browser's module map, so a later
 * import while offline does not hit the network. That is what the on-page
 * "works offline once this page has loaded" claim is about. It stays off the
 * first paint: idle, after `load`, and not on pages that never open a PDF.
 */

export function prefetchPdfLib(): void {
  void import("pdf-lib");
}

export function prefetchPdfJs(): void {
  void import("pdfjs-dist");
}

export async function loadPdfLib() {
  return import("pdf-lib");
}

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

const PDF_LIB_SLUGS = new Set([
  "pdf-merge",
  "pdf-split",
  "pdf-compress",
  "pdf-rotate",
  "pdf-watermark",
  "pdf-reorder",
  "pdf-encrypt",
  "pdf-unlock",
  "pdf-sign",
  "pdf-metadata",
  "pdf-form-fill",
  "images-to-pdf",
]);

const PDF_JS_SLUGS = new Set(["pdf-compress", "pdf-to-images"]);

/**
 * Warm the PDF engine after this document has loaded, without competing with
 * first paint. Returns a cancel function for the effect that scheduled it.
 */
export function schedulePdfEnginePrefetch(slug: string | undefined): () => void {
  const lib = slug ? PDF_LIB_SLUGS.has(slug) : false;
  const js = slug ? PDF_JS_SLUGS.has(slug) : false;
  if (!lib && !js) return () => {};

  let cancelled = false;
  let idleId = 0;
  let timerId = 0;

  const run = () => {
    if (cancelled) return;
    if (lib) prefetchPdfLib();
    if (js) prefetchPdfJs();
  };

  const arm = () => {
    if (cancelled) return;
    const ric = window.requestIdleCallback;
    if (typeof ric === "function") {
      idleId = ric(run, { timeout: 2500 });
    } else {
      timerId = window.setTimeout(run, 1200);
    }
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
