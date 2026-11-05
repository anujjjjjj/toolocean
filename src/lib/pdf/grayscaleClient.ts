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
 *
 * Failures come out as ConvertStageError (stage + page) so the tool can say
 * what went wrong. A page that runs out of memory while drawing is retried
 * once at about 150 DPI before giving up.
 */
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "./grayscale.worker.ts?worker&url";
import { loadPdfLib } from "./lazyPdf";
import {
  ConvertStageError,
  encodePageImage,
  fallbackGeometry,
  isMemoryError,
  pageGeometry,
  type Dpi,
  type EncodeOptions,
  type EncodeReport,
  type PageGeometry,
} from "./grayscalePdf";
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

/**
 * A page encode that takes this long means the worker died without an error
 * event (Chrome can kill a worker that runs out of memory). Real pages take
 * well under a few seconds.
 */
const ENCODE_TIMEOUT_MS = 120_000;

function namedError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
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
  private timer: ReturnType<typeof setTimeout> | null = null;

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
        else {
          const failure = data as Extract<GrayscaleResponse, { ok: false }>;
          job.reject(namedError(failure.name, failure.message));
        }
      };
      worker.onerror = (event) => {
        event.preventDefault();
        this.rejectAll(namedError("WorkerStoppedError", "The conversion worker stopped"));
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
    return new Promise<EncodeReport>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const request: GrayscaleRequest = { id, rgba: rgba.buffer as ArrayBuffer, width, height, options };
      this.timer = setTimeout(() => {
        // Stop the stuck worker so it lets go of the page's pixels.
        this.worker?.terminate();
        this.worker = null;
        this.rejectAll(namedError("TimeoutError", "The conversion worker stopped responding"));
      }, ENCODE_TIMEOUT_MS);
      worker.postMessage(request, [request.rgba]);
    }).finally(() => this.clearTimer());
  }

  private clearTimer() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  private rejectAll(error: Error) {
    for (const job of this.pending.values()) job.reject(error);
    this.pending.clear();
  }

  terminate() {
    this.clearTimer();
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

export interface ConvertResult {
  blob: Blob;
  /** Pages (1-based) that ran out of memory and were redrawn at about 150 DPI. */
  reducedPages: number[];
}

/**
 * Converts every page of an open pdf.js document. Rejects with
 * ConversionCancelled when `signal` aborts, and with ConvertStageError for
 * anything else. The caller owns (and destroys) the pdf.js document.
 */
export async function convertToGrayscale(pdf: PDFDocumentProxy, { dpi, encode, signal, onProgress }: ConvertOptions): Promise<ConvertResult> {
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
    const writer = await createGrayscaleWriter(lib).catch((error: unknown) => {
      throw new ConvertStageError("save", 0, error);
    });
    const total = pdf.numPages;
    const reducedPages: number[] = [];

    for (let number = 1; number <= total; number++) {
      onProgress(number - 1, total);
      const page = await pdf.getPage(number).catch((error: unknown) => {
        throw new ConvertStageError("render", number, error);
      });
      check();

      /** Draws the page at `size` and reads its pixels; the canvas is freed either way. */
      const rasterize = async (size: PageGeometry): Promise<Uint8ClampedArray> => {
        let stage: "canvas" | "render" | "read" = "canvas";
        const canvas = document.createElement("canvas");
        try {
          canvas.width = size.pixelWidth;
          canvas.height = size.pixelHeight;
          // A canvas over the browser's limits can come back 0 x 0 or without a context.
          if (canvas.width !== size.pixelWidth || canvas.height !== size.pixelHeight) {
            throw namedError("RangeError", "Canvas size was refused");
          }
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) throw new Error("Could not get a 2D canvas context");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          stage = "render";
          const viewport = page.getViewport({ scale: size.scale });
          renderTask = page.render({ canvas, canvasContext: context, viewport });
          await renderTask.promise;
          renderTask = null;
          check();
          await yieldToBrowser();
          check();
          stage = "read";
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          if (pixels.length !== size.pixelWidth * size.pixelHeight * 4) throw namedError("RangeError", "Canvas pixels were not readable");
          return pixels;
        } catch (error) {
          renderTask = null;
          if (signal.aborted || error instanceof ConversionCancelled || (error as { name?: string } | null)?.name === "RenderingCancelledException") {
            throw error;
          }
          throw new ConvertStageError(stage, number, error);
        } finally {
          canvas.width = 0;
          canvas.height = 0;
        }
      };
      // Rotation defaults to the page's /Rotate, so the output faces the way a viewer shows it.
      const base = page.getViewport({ scale: 1 });
      let geometry = pageGeometry(base.width, base.height, dpi);
      let rgba: Uint8ClampedArray;
      try {
        try {
          rgba = await rasterize(geometry);
        } catch (error) {
          const smaller = fallbackGeometry(geometry);
          if (signal.aborted || !smaller || !isMemoryError(error)) throw error;
          geometry = smaller;
          reducedPages.push(number);
          await yieldToBrowser();
          check();
          rgba = await rasterize(geometry);
        }
      } finally {
        page.cleanup();
      }
      await yieldToBrowser();
      check();

      const report = await encoder.encode(rgba, geometry.pixelWidth, geometry.pixelHeight, encode).catch((error: unknown) => {
        if (signal.aborted || error instanceof ConversionCancelled) throw error;
        throw new ConvertStageError("encode", number, error);
      });
      check();
      try {
        writer.addPage(geometry.widthPt, geometry.heightPt, report.image);
      } catch (error) {
        throw new ConvertStageError("save", number, error);
      }
      await yieldToBrowser();
      check();
    }

    onProgress(total, total);
    let blob: Blob;
    try {
      const bytes = await writer.save();
      check();
      blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
    } catch (error) {
      if (signal.aborted) throw error;
      throw new ConvertStageError("save", 0, error);
    }
    return { blob, reducedPages };
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
