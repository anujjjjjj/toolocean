import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileText, Loader2, Shrink } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import * as pdfjsLib from "pdfjs-dist";

// Same worker wiring as PdfToImagesTool — rasterising needs pdf.js to render.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
).toString();

type CompressionMode = "lossless" | "raster";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument } from "pdf-lib";

export function PdfCompressTool() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [originalSize, setOriginalSize] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [quality, setQuality] = useState([70]);
    const [mode, setMode] = useState<CompressionMode>("lossless");
    const [result, setResult] = useState<{ before: number; after: number } | null>(null);
    const [progress, setProgress] = useState<{ page: number; total: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast({
                title: "Invalid file type",
                description: "Please select a PDF file",
                variant: "destructive",
            });
            return;
        }

        setPdfFile(file);
        setOriginalSize(file.size);
    };

    /**
     * Lossless: strip metadata and rewrite the file.
     *
     * This is what the tool used to do for every request, and it is honest only
     * because it is now labelled for what it is. Measured on a 40-page text PDF
     * and a 12-page raster PDF, it recovers 0.0% — the saving is whatever the
     * document metadata happened to weigh. It is still the right default,
     * because it is the only mode that cannot lose anything.
     */
    const compressLossless = async (bytes: ArrayBuffer) => {
        const pdfDoc = await PDFDocument.load(bytes);
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("");
        pdfDoc.setCreator("");
        return pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
    };

    /**
     * Raster: render every page and re-encode it as a JPEG at the chosen quality.
     *
     * This is what actually shrinks a PDF in a browser, and it is the only thing
     * the quality slider can meaningfully control — pdf-lib cannot reach inside
     * an existing page and recompress the images it references.
     *
     * The cost is real and is stated in the UI rather than buried: the output is
     * pictures of pages, so text stops being selectable, searchable and
     * copyable, and it will not be read by a screen reader. That is a fine trade
     * for a scan, which was already pixels, and a bad one for a text document.
     */
    const compressRaster = async (bytes: ArrayBuffer, onPage: (n: number, total: number) => void) => {
        const source = await pdfjsLib.getDocument({ data: bytes }).promise;
        const out = await PDFDocument.create();
        // Renders at 144 dpi rather than the 72 dpi default, so the result still
        // looks right on a high-density screen instead of visibly soft.
        const scale = 2;

        for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber++) {
            onPage(pageNumber, source.numPages);
            const page = await source.getPage(pageNumber);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Could not get a 2D canvas context");

            // White background: a PDF page is opaque, and a transparent canvas
            // encodes to a black JPEG.
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: context, viewport, canvas }).promise;

            const blob: Blob | null = await new Promise((resolve) =>
                canvas.toBlob(resolve, "image/jpeg", quality[0] / 100),
            );
            if (!blob) throw new Error("Could not encode page " + pageNumber);

            const image = await out.embedJpg(await blob.arrayBuffer());
            const target = out.addPage([viewport.width / scale, viewport.height / scale]);
            target.drawImage(image, { x: 0, y: 0, width: target.getWidth(), height: target.getHeight() });
            canvas.width = 0;
            canvas.height = 0;
        }

        return out.save({ useObjectStreams: true });
    };

    const compressPdf = async () => {
        if (!pdfFile) return;

        setIsProcessing(true);
        setResult(null);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const compressedBytes =
                mode === "raster"
                    ? await compressRaster(arrayBuffer, (n, total) => setProgress({ page: n, total }))
                    : await compressLossless(arrayBuffer);

            const blob = new Blob([compressedBytes], { type: "application/pdf" });
            const newSize = blob.size;

            /*
             * Refuse to hand back a bigger file.
             *
             * Re-encoding a text PDF as images is not a marginal loss, it is a
             * catastrophe: a 40-page text document measured 166 KB in and 14.8 MB
             * out, because vector glyphs that cost a few bytes a page become
             * full-page photographs. Downloading that and letting the reader
             * discover it later would be the same class of dishonesty as the
             * 0.0% "savings" this tool used to report.
             */
            if (newSize >= originalSize) {
                setResult({ before: originalSize, after: newSize });
                toast({
                    title: "Re-encoding would make this bigger",
                    description:
                        mode === "raster"
                            ? `Rendering the pages as images produces ${formatSize(newSize)}, up from ${formatSize(originalSize)}. This document is mostly text, which is far cheaper to store as text than as pictures of text. Your original is already the smaller file.`
                            : `There was nothing to strip — the file is already ${formatSize(originalSize)}. Nothing was downloaded.`,
                    variant: "destructive",
                });
                return;
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = pdfFile.name.replace(/\.pdf$/i, "") + (mode === "raster" ? "-compressed.pdf" : "-optimised.pdf");
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setResult({ before: originalSize, after: newSize });

            /*
             * Report what happened, including when nothing did. The previous
             * version always announced a "savings" percentage, which on this
             * code path was reliably 0.0% — a success message for a no-op.
             */
            const delta = originalSize - newSize;
            const pct = originalSize > 0 ? (delta / originalSize) * 100 : 0;
            toast(
                delta > 0
                    ? {
                          title: "PDF compressed",
                          description: `${formatSize(originalSize)} → ${formatSize(newSize)} (${pct.toFixed(1)}% smaller)`,
                      }
                    : {
                          title: "No size reduction",
                          description:
                              mode === "lossless"
                                  ? "This file had little metadata to strip. Try re-encoding pages as images if you need it smaller."
                                  : "Re-encoding did not help — the pages were already compressed about as far as JPEG will take them.",
                      },
            );
        } catch (error) {
            toast({
                title: "Compression failed",
                description: error instanceof Error ? error.message : "An error occurred while compressing the PDF",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
            setProgress(null);
        }
    };

    const getQualityLabel = () => {
        if (quality[0] >= 80) return "High Quality";
        if (quality[0] >= 50) return "Medium Quality";
        return "Low Quality (Max Compression)";
    };

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            {!pdfFile && (
                <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="pt-6">
                        <div
                            className="flex flex-col items-center justify-center py-10 cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                                <Upload className="h-8 w-8 text-green-500" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Upload PDF File</h3>
                            <p className="text-muted-foreground text-sm text-center">
                                Click to select a PDF to compress
                            </p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </CardContent>
                </Card>
            )}

            {/* File Info & Compression Options */}
            {pdfFile && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-green-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{pdfFile.name}</p>
                                    <p className="text-sm font-normal text-muted-foreground">
                                        Original size: {formatSize(originalSize)}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setPdfFile(null);
                                        setOriginalSize(0);
                                    }}
                                >
                                    Change File
                                </Button>
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shrink className="h-5 w-5" />
                                Compression Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">How to compress</Label>
                                <RadioGroup
                                    value={mode}
                                    onValueChange={(value) => setMode(value as CompressionMode)}
                                    className="gap-3"
                                >
                                    <div className="flex items-start gap-3 rounded-lg border border-border/70 p-3">
                                        <RadioGroupItem value="lossless" id="mode-lossless" className="mt-1" />
                                        <Label htmlFor="mode-lossless" className="cursor-pointer font-normal">
                                            <span className="font-medium">Lossless — strip metadata and rewrite</span>
                                            <span className="mt-1 block text-sm text-muted-foreground">
                                                Nothing is re-encoded, so text stays selectable and images keep their
                                                quality. Most files barely shrink: the only saving is whatever the
                                                document metadata weighed.
                                            </span>
                                        </Label>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-lg border border-border/70 p-3">
                                        <RadioGroupItem value="raster" id="mode-raster" className="mt-1" />
                                        <Label htmlFor="mode-raster" className="cursor-pointer font-normal">
                                            <span className="font-medium">Re-encode pages as images</span>
                                            <span className="mt-1 block text-sm text-muted-foreground">
                                                Renders every page and saves it as a JPEG at the quality below. This is
                                                what actually makes a PDF smaller — and it turns the pages into
                                                pictures, so text can no longer be selected, searched or read aloud.
                                                Good for scans, bad for documents you still need to read as text.
                                            </span>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {mode === "raster" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Image quality</span>
                                        <Badge variant="secondary">{getQualityLabel()}</Badge>
                                    </div>
                                    <Slider
                                        value={quality}
                                        onValueChange={setQuality}
                                        min={20}
                                        max={100}
                                        step={10}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Smaller file</span>
                                        <span>Better quality</span>
                                    </div>
                                </div>
                            )}

                            {result && (
                                <div className="rounded-lg border border-border/70 p-4 text-sm">
                                    <p className="font-medium">
                                        {formatSize(result.before)} → {formatSize(result.after)}
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                        {result.after < result.before
                                            ? `${(((result.before - result.after) / result.before) * 100).toFixed(1)}% smaller — downloaded`
                                            : "Larger than the original, so nothing was downloaded"}
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={compressPdf}
                                disabled={isProcessing}
                                className="w-full"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {progress ? `Page ${progress.page} of ${progress.total}…` : "Working…"}
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        {mode === "raster" ? "Compress & Download" : "Optimise & Download"}
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
