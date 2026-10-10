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

/** Same URL loadPdfJs assigns to GlobalWorkerOptions. Fetching it stores the file. */
export function pdfJsWorkerUrl(): string {
  return new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;
}

export function prefetchPdfJs(): Promise<unknown> {
  const worker = pdfJsWorkerUrl();
  return import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker;
  });
}

/** The worker is not part of the pdfjs module graph. Fetch it so it can be cached. */
export function prefetchPdfJsWorker(): Promise<Response | void> {
  return fetch(pdfJsWorkerUrl()).catch(() => undefined);
}

export async function loadPdfLib() {
  return import("pdf-lib");
}

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = pdfJsWorkerUrl();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

