import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Loader2, PenLine, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadPdf, pdfDownloadName } from "@/lib/pdf/downloadPdf";
import { useStashedFileInput } from "@/hooks/useStashedFileInput";
import { markToolSuccess } from "@/lib/toolResult";

/**
 * Visual signature only. The mark is a PNG drawn onto the page. Nothing about
 * this flow creates a certificate, a signature dictionary, or a qualified
 * electronic signature.
 */
export function PdfSignTool() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    useStashedFileInput(fileInputRef);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const drawRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const drawing = useRef(false);
    const drag = useRef<{ dx: number; dy: number } | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [pageIndex, setPageIndex] = useState(0);
    const [typed, setTyped] = useState("");
    const [signaturePng, setSignaturePng] = useState<Uint8Array | null>(null);
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [xRatio, setXRatio] = useState(0.58);
    const [yRatio, setYRatio] = useState(0.72);
    const [widthRatio, setWidthRatio] = useState(0.28);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        return () => {
            if (signatureUrl) URL.revokeObjectURL(signatureUrl);
        };
    }, [signatureUrl]);

    useEffect(() => {
        if (!pdfBytes || !previewRef.current) return;
        const canvas = previewRef.current;
        let cancelled = false;

        (async () => {
            try {
                const pdfjs = await import("pdfjs-dist");
                pdfjs.GlobalWorkerOptions.workerSrc = new URL(
                    "pdfjs-dist/build/pdf.worker.min.mjs",
                    import.meta.url,
                ).toString();
                const pdf = await pdfjs.getDocument({ data: pdfBytes.slice() }).promise;
                const page = await pdf.getPage(pageIndex + 1);
                const base = page.getViewport({ scale: 1 });
                const viewport = page.getViewport({ scale: Math.min(2, 720 / base.width) });
                if (cancelled) return;
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                const context = canvas.getContext("2d");
                if (!context) return;
                await page.render({ canvasContext: context, viewport, canvas }).promise;
                await pdf.destroy();
            } catch (error) {
                if (!cancelled) {
                    toast({
                        title: "Could not preview this page",
                        description: error instanceof Error ? error.message : "The preview failed.",
                        variant: "destructive",
                    });
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [pdfBytes, pageIndex, toast]);

    const rememberPng = (png: Uint8Array) => {
        setSignaturePng(png);
        setSignatureUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return URL.createObjectURL(new Blob([png], { type: "image/png" }));
        });
    };

    const onPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.files?.[0];
        event.target.value = "";
        if (!next) return;
        if (next.type && next.type !== "application/pdf") {
            toast({ title: "Choose a PDF", description: "This tool only opens PDF files.", variant: "destructive" });
            return;
        }
        try {
            const bytes = new Uint8Array(await next.arrayBuffer());
            const { readPdfPageCount } = await import("@/lib/pdf/signPdf");
            const count = await readPdfPageCount(bytes);
            setFile(next);
            setPdfBytes(bytes);
            setPageCount(count);
            setPageIndex(0);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not read that PDF.";
            toast({
                title: message.includes("encrypted") ? "This PDF is encrypted" : "Could not open the PDF",
                description: message.includes("encrypted")
                    ? "Unlock it first if you know the password, then sign the unlocked copy."
                    : message,
                variant: "destructive",
            });
        }
    };

    const pointerDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = drawRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
        if (event.type === "pointerdown") {
            drawing.current = true;
            canvas.setPointerCapture(event.pointerId);
            context.strokeStyle = "#111827";
            context.lineWidth = 2.75;
            context.lineCap = "round";
            context.lineJoin = "round";
            context.beginPath();
            context.moveTo(x, y);
            return;
        }
        if (!drawing.current) return;
        if (event.type === "pointerup" || event.type === "pointerleave") {
            drawing.current = false;
            return;
        }
        context.lineTo(x, y);
        context.stroke();
    };

    const useDrawing = async () => {
        const canvas = drawRef.current;
        if (!canvas) return;
        const png = await canvasToPng(trimCanvas(canvas));
        rememberPng(png);
    };

    const useTyped = async () => {
        const text = typed.trim();
        if (!text) {
            toast({ title: "Type a name first", variant: "destructive" });
            return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = 900;
        canvas.height = 260;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#111827";
        context.font = "italic 92px 'Segoe Script', 'Brush Script MT', 'Snell Roundhand', cursive";
        context.textBaseline = "middle";
        context.fillText(text, 24, canvas.height / 2);
        rememberPng(await canvasToPng(trimCanvas(canvas)));
    };

    const onImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const image = event.target.files?.[0];
        event.target.value = "";
        if (!image) return;
        const url = URL.createObjectURL(image);
        try {
            const element = await loadImage(url);
            const canvas = document.createElement("canvas");
            canvas.width = element.naturalWidth;
            canvas.height = element.naturalHeight;
            canvas.getContext("2d")?.drawImage(element, 0, 0);
            rememberPng(await canvasToPng(canvas));
        } catch {
            toast({ title: "Could not read that image", variant: "destructive" });
        } finally {
            URL.revokeObjectURL(url);
        }
    };

    const clearDrawing = () => {
        const canvas = drawRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
    };

    const onDrag = (event: React.PointerEvent<HTMLImageElement>) => {
        const box = overlayRef.current?.getBoundingClientRect();
        if (!box) return;
        if (event.type === "pointerdown") {
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = {
                dx: event.clientX - box.left - xRatio * box.width,
                dy: event.clientY - box.top - yRatio * box.height,
            };
            return;
        }
        if (!drag.current) return;
        if (event.type === "pointerup") {
            drag.current = null;
            return;
        }
        setXRatio(clamp((event.clientX - box.left - drag.current.dx) / box.width, 0, 0.92));
        setYRatio(clamp((event.clientY - box.top - drag.current.dy) / box.height, 0, 0.92));
    };

    const save = async () => {
        if (!file || !pdfBytes || !signaturePng) return;
        setBusy(true);
        try {
            const { applySignatureImage } = await import("@/lib/pdf/signPdf");
            const bytes = await applySignatureImage(pdfBytes, signaturePng, {
                pageIndex,
                xRatio,
                yRatio,
                widthRatio,
            });
            downloadPdf(bytes, pdfDownloadName(file.name, "signed"));
            markToolSuccess();
            toast({
                title: "Signature placed",
                description: "Downloaded a copy with the mark drawn on the page. This is not a certified signature.",
            });
        } catch (error) {
            toast({
                title: "Could not sign this PDF",
                description: error instanceof Error ? error.message : "The file could not be written.",
                variant: "destructive",
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed">
                This draws a picture of a signature onto the page. It is a visual mark only. It is not a certified,
                qualified, or cryptographic electronic signature, and it will not satisfy a process that requires a
                digital certificate.
            </div>

            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onPdf} />

            {!file && (
                <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="pt-6">
                        <button
                            type="button"
                            className="flex w-full flex-col items-center justify-center py-10"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">Choose a PDF</h3>
                            <p className="text-center text-sm text-muted-foreground">
                                The file stays in this tab. Nothing is uploaded.
                            </p>
                        </button>
                    </CardContent>
                </Card>
            )}

            {file && pdfBytes && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="flex-1 truncate text-base font-medium">{file.name}</span>
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    Change file
                                </Button>
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <PenLine className="h-5 w-5" />
                                Make the mark
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="draw">
                                <TabsList>
                                    <TabsTrigger value="draw">Draw</TabsTrigger>
                                    <TabsTrigger value="type">Type</TabsTrigger>
                                    <TabsTrigger value="image">Upload image</TabsTrigger>
                                </TabsList>
                                <TabsContent value="draw" className="space-y-3">
                                    <canvas
                                        ref={drawRef}
                                        width={720}
                                        height={200}
                                        className="h-40 w-full touch-none rounded-md border border-border bg-white"
                                        onPointerDown={pointerDraw}
                                        onPointerMove={pointerDraw}
                                        onPointerUp={pointerDraw}
                                        onPointerLeave={pointerDraw}
                                    />
                                    <div className="flex gap-2">
                                        <Button type="button" onClick={useDrawing} data-analytics-label="use-drawn-signature">
                                            Use this drawing
                                        </Button>
                                        <Button type="button" variant="outline" onClick={clearDrawing}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Clear
                                        </Button>
                                    </div>
                                </TabsContent>
                                <TabsContent value="type" className="space-y-3">
                                    <Label htmlFor="signature-name">Name to render in a script face</Label>
                                    <Input
                                        id="signature-name"
                                        value={typed}
                                        onChange={(event) => setTyped(event.target.value)}
                                        placeholder="Ada Lovelace"
                                    />
                                    <Button type="button" onClick={useTyped} data-analytics-label="use-typed-signature">
                                        Use this name
                                    </Button>
                                </TabsContent>
                                <TabsContent value="image" className="space-y-3">
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="hidden"
                                        onChange={onImage}
                                    />
                                    <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()}>
                                        Choose a PNG or JPEG
                                    </Button>
                                    <p className="text-sm text-muted-foreground">
                                        A photo of a signature on white paper will keep that white background. A PNG with
                                        a transparent background sits on the page more cleanly.
                                    </p>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Place it</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {pageCount > 1 && (
                                <div className="max-w-xs space-y-2">
                                    <Label>Page</Label>
                                    <Select value={String(pageIndex)} onValueChange={(value) => setPageIndex(Number(value))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: pageCount }, (_, index) => (
                                                <SelectItem key={index} value={String(index)}>
                                                    Page {index + 1}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div ref={overlayRef} className="relative inline-block max-w-full">
                                <canvas ref={previewRef} className="h-auto max-w-full rounded-md border border-border" />
                                {signatureUrl && (
                                    <img
                                        src={signatureUrl}
                                        alt="Signature placement preview"
                                        draggable={false}
                                        onPointerDown={onDrag}
                                        onPointerMove={onDrag}
                                        onPointerUp={onDrag}
                                        className="absolute cursor-grab touch-none"
                                        style={{
                                            left: `${xRatio * 100}%`,
                                            top: `${yRatio * 100}%`,
                                            width: `${widthRatio * 100}%`,
                                            height: "auto",
                                        }}
                                    />
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>From the left</Label>
                                    <Slider value={[Math.round(xRatio * 100)]} max={92} onValueChange={([value]) => setXRatio(value / 100)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>From the top</Label>
                                    <Slider value={[Math.round(yRatio * 100)]} max={92} onValueChange={([value]) => setYRatio(value / 100)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Width</Label>
                                    <Slider
                                        value={[Math.round(widthRatio * 100)]}
                                        min={8}
                                        max={70}
                                        onValueChange={([value]) => setWidthRatio(value / 100)}
                                    />
                                </div>
                            </div>

                            <Button type="button" onClick={save} disabled={!signaturePng || busy} data-analytics-label="download-signed-pdf">
                                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Download signed PDF
                            </Button>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("image"));
        image.src = url;
    });
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
            if (!blob) {
                reject(new Error("Could not export the signature image"));
                return;
            }
            resolve(new Uint8Array(await blob.arrayBuffer()));
        }, "image/png");
    });
}

function trimCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
    const context = source.getContext("2d");
    if (!context) return source;
    const { width, height } = source;
    const pixels = context.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (pixels[(y * width + x) * 4 + 3] > 12) {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }
    if (maxX < minX) return source;
    const pad = 10;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);
    const trimmed = document.createElement("canvas");
    trimmed.width = maxX - minX + 1;
    trimmed.height = maxY - minY + 1;
    trimmed.getContext("2d")?.drawImage(source, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
    return trimmed;
}
