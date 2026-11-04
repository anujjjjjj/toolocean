/**
 * Browser half of Grayscale PDF: renders each page with pdf.js, hands the
 * pixels to the worker, and writes the results into a new PDF with pdf-lib.
 *
 * Imported by GrayscalePdfTool only after a file is converted (and by
 * offlinePrefetch on idle), so neither the worker URL nor pdf-lib is in the
 * route chunk. Nothing here runs during prerender.
 *
 * One page is in flight at a time. Its canvas is cleared (width = height = 0)
 * as soon as the pixels are read, the page is cleaned up, and the loop yields
 * between render, read and encode so the tab keeps painting on long files.
 */
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "./grayscale.worker.ts?worker&url";
import { loadPdfLib } from "./lazyPdf";
import { encodePageImage, pageGeometry, type Dpi, type EncodeOptions, type EncodeReport } from "./grayscalePdf";
import { createGrayscaleWriter } from "./grayscaleAssemble";
import { deflateBytes } from "./deflate";
import type { GrayscaleRequest, GrayscaleResponse } from "./grayscale.worker";

export function grayscaleWorkerUrl(): string {
  return new URL(workerUrl, import.meta.url).href;
}

export class ConversionCancelled extends Error {
  constructor() {
    super("Conversion cancelled");
    this.name = "ConversionCancelled";
  }
}

function yieldToBrowser(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (scheduler?.yield) return scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Encodes pages in a worker, or on this thread if a worker cannot start. */
class PageEncoder {
  private worker: Worker | null = null;
  private failed = false;
  private nextId = 1;
  private pending = new Map<number, { resolve: (report: EncodeReport) => void; reject: (error: Error) => void }>();

  private ensure(): Worker | null {
    if (this.worker || this.failed) return this.worker;
    try {
      const worker = new Worker(grayscaleWorkerUrl(), { type: "module" });
      worker.onmessage = (event: MessageEvent<GrayscaleResponse>) => {
        const data = event.data;
        const job = this.pending.get(data.id);
        if (!job) return;
        this.pending.delete(data.id);
        if (data.ok) job.resolve(data);
        else job.reject(new Error((data as Extract<GrayscaleResponse, { ok: false }>).message));
      };
      worker.onerror = (event) => {
        event.preventDefault();
        this.rejectAll(new Error("The conversion worker stopped"));
      };
      this.worker = worker;
    } catch {
      this.failed = true;
    }
    return this.worker;
  }

  encode(rgba: Uint8ClampedArray, width: number, height: number, options: EncodeOptions): Promise<EncodeReport> {
    const worker = this.ensure();
    if (!worker) return encodePageImage(rgba, width, height, options, deflateBytes);
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const request: GrayscaleRequest = { id, rgba: rgba.buffer as ArrayBuffer, width, height, options };
      worker.postMessage(request, [request.rgba]);
    });
  }

  private rejectAll(error: Error) {
    for (const job of this.pending.values()) job.reject(error);
    this.pending.clear();
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this.rejectAll(new ConversionCancelled());
  }
}

export interface ConvertOptions {
  dpi: Dpi;
  encode: EncodeOptions;
  signal: AbortSignal;
  /** Called before each page starts (done = pages finished so far). */
  onProgress: (done: number, total: number) => void;
}

/**
 * Converts every page of an open pdf.js document. Resolves with the new PDF
 * as a Blob, rejects with ConversionCancelled when `signal` aborts.
 * The caller owns (and destroys) the pdf.js document.
 */
export async function convertToGrayscale(pdf: PDFDocumentProxy, { dpi, encode, signal, onProgress }: ConvertOptions): Promise<Blob> {
  const encoder = new PageEncoder();
  let renderTask: RenderTask | null = null;
  const onAbort = () => {
    renderTask?.cancel();
    encoder.terminate();
  };
  signal.addEventListener("abort", onAbort, { once: true });
  const check = () => {
    if (signal.aborted) throw new ConversionCancelled();
  };

  try {
    const lib = await loadPdfLib();
    check();
    const writer = await createGrayscaleWriter(lib);
    const total = pdf.numPages;

    for (let number = 1; number <= total; number++) {
      onProgress(number - 1, total);
      const page = await pdf.getPage(number);
      check();
      // Rotation defaults to the page's /Rotate, so the output faces the way a viewer shows it.
      const base = page.getViewport({ scale: 1 });
      const geometry = pageGeometry(base.width, base.height, dpi);
      const viewport = page.getViewport({ scale: geometry.scale });

      const canvas = document.createElement("canvas");
      canvas.width = geometry.pixelWidth;
      canvas.height = geometry.pixelHeight;
      let rgba: Uint8ClampedArray;
      try {
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("No canvas");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        renderTask = page.render({ canvas, canvasContext: context, viewport });
        await renderTask.promise;
        renderTask = null;
        check();
        await yieldToBrowser();
        check();
        rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
      } finally {
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
      }
      await yieldToBrowser();
      check();

      const report = await encoder.encode(rgba, geometry.pixelWidth, geometry.pixelHeight, encode);
      check();
      writer.addPage(geometry.widthPt, geometry.heightPt, report.image);
      await yieldToBrowser();
      check();
    }

    onProgress(total, total);
    const bytes = await writer.save();
    check();
    return new Blob([bytes as BlobPart], { type: "application/pdf" });
  } catch (error) {
    if (signal.aborted || (error as { name?: string } | null)?.name === "RenderingCancelledException") {
      throw new ConversionCancelled();
    }
    throw error;
  } finally {
    signal.removeEventListener("abort", onAbort);
    encoder.terminate();
  }
}
