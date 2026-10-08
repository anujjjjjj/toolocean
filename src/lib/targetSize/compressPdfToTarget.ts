import type { EncodeImageResult } from "./types";

export interface PdfTargetResult {
  bytes: Uint8Array;
  mode: "lossless" | "raster";
  textSelectable: boolean;
  scale: number;
  quality: number;
  withinTarget: boolean;
}

async function lossless(data: ArrayBuffer): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.load(data);
  pdf.setTitle("");
  pdf.setAuthor("");
  pdf.setSubject("");
  pdf.setKeywords([]);
  pdf.setProducer("");
  pdf.setCreator("");
  return pdf.save({ useObjectStreams: true, addDefaultPage: false });
}

interface PaintedPage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

async function paintPages(data: ArrayBuffer, scale: number): Promise<PaintedPage[]> {
  const pdfjs = await import("@/lib/pdf/lazyPdf").then((mod) => mod.loadPdfJs());
  const source = await pdfjs.getDocument({ data }).promise;
  const pages: PaintedPage[] = [];
  for (let number = 1; number <= source.numPages; number++) {
    const page = await source.getPage(number);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get a 2D canvas context");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    pages.push({ canvas, width: viewport.width / scale, height: viewport.height / scale });
  }
  return pages;
}

async function rasterPdf(pages: PaintedPage[], drawScale: number, quality: number): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const out = await PDFDocument.create();
  for (const page of pages) {
    const width = Math.max(1, Math.round(page.canvas.width * drawScale));
    const height = Math.max(1, Math.round(page.canvas.height * drawScale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get a 2D canvas context");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(page.canvas, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error("Could not encode a page");
    const image = await out.embedJpg(await blob.arrayBuffer());
    const pdfPage = out.addPage([page.width, page.height]);
    pdfPage.drawImage(image, { x: 0, y: 0, width: page.width, height: page.height });
  }
  return out.save({ useObjectStreams: true });
}

/**
 * Lossless rewrite first. If that already fits, the text stays selectable.
 * Otherwise pages are rasterised and the copy says text is no longer selectable.
 */
export async function compressPdfToTarget(data: ArrayBuffer, targetBytes: number): Promise<PdfTargetResult> {
  const stripped = await lossless(data);
  if (stripped.byteLength <= targetBytes) {
    return {
      bytes: stripped,
      mode: "lossless",
      textSelectable: true,
      scale: 1,
      quality: 1,
      withinTarget: true,
    };
  }

  const painted = await paintPages(data, 2);
  let drawScale = 1;
  let best: { bytes: Uint8Array; quality: number; drawScale: number } | null = null;
  let smallest: { bytes: Uint8Array; quality: number; drawScale: number } | null = null;

  for (let attempt = 0; attempt < 6; attempt++) {
    let low = 0.15;
    let high = 0.85;
    let fit: { bytes: Uint8Array; quality: number } | null = null;
    for (let step = 0; step < 6; step++) {
      const quality = (low + high) / 2;
      const bytes = await rasterPdf(painted, drawScale, quality);
      const candidate = { bytes, quality, drawScale };
      if (!smallest || bytes.byteLength < smallest.bytes.byteLength) smallest = candidate;
      if (bytes.byteLength <= targetBytes) {
        fit = { bytes, quality };
        low = quality;
      } else {
        high = quality;
      }
    }
    if (fit) {
      best = { ...fit, drawScale };
      break;
    }
    drawScale *= 0.7;
  }

  const chosen = best ?? smallest;
  if (!chosen) throw new Error("Could not recompress the PDF");
  return {
    bytes: chosen.bytes,
    mode: "raster",
    textSelectable: false,
    scale: 2 * chosen.drawScale,
    quality: chosen.quality,
    withinTarget: chosen.bytes.byteLength <= targetBytes,
  };
}

export type { EncodeImageResult };
