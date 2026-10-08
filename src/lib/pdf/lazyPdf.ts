/**
 * PDF engines are fetched only when a tool actually needs them.
 *
 * A static `import "pdf-lib"` from a tool module makes the route's chunk depend
 * on the library, so the browser downloads it before the page can paint. Callers
 * import this module (it is tiny) and invoke the loaders from a file-pick or a
 * run handler. Hover and focus may prefetch; they must not be called at module scope.
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
