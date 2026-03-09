import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Loader2, Image, Download, X, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
).toString();

interface ConvertedImage {
    pageNumber: number;
    dataUrl: string;
    blob: Blob;
    filename: string;
}

export function PdfToImagesTool() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [format, setFormat] = useState<"png" | "jpeg">("png");
    const [quality, setQuality] = useState([90]);
    const [scale, setScale] = useState<"1x" | "2x" | "4x">("2x");
    const [pageRange, setPageRange] = useState<string>("all");
    const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
    const [totalPages, setTotalPages] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Load PDF and get page count when file is selected
    useEffect(() => {
        const loadPdfInfo = async () => {
            if (!pdfFile) {
                setTotalPages(0);
                setConvertedImages([]);
                return;
            }

            try {
                const arrayBuffer = await pdfFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                setTotalPages(pdf.numPages);
            } catch (error) {
                console.error("Error loading PDF:", error);
                toast({
                    title: "Error loading PDF",
                    description: "Failed to read PDF file",
                    variant: "destructive",
                });
            }
        };

        loadPdfInfo();
    }, [pdfFile, toast]);

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
        setConvertedImages([]);
    };

    const parsePageRange = (range: string, totalPages: number): number[] => {
        if (range === "all" || range.trim() === "") {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: number[] = [];
        const parts = range.split(",");

        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes("-")) {
                const [start, end] = trimmed.split("-").map((s) => parseInt(s.trim(), 10));
                if (!isNaN(start) && !isNaN(end) && start > 0 && end <= totalPages && start <= end) {
                    for (let i = start; i <= end; i++) {
                        pages.push(i);
                    }
                }
            } else {
                const pageNum = parseInt(trimmed, 10);
                if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
                    pages.push(pageNum);
                }
            }
        }

        return [...new Set(pages)].sort((a, b) => a - b);
    };

    const convertToImages = async () => {
        if (!pdfFile || totalPages === 0) return;

        setIsProcessing(true);
        setConvertedImages([]);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            const pagesToConvert = parsePageRange(pageRange, totalPages);
            if (pagesToConvert.length === 0) {
                toast({
                    title: "Invalid page range",
                    description: "Please enter a valid page range",
                    variant: "destructive",
                });
                setIsProcessing(false);
                return;
            }

            const scaleValue = scale === "1x" ? 1 : scale === "2x" ? 2 : 4;
            const converted: ConvertedImage[] = [];

            for (const pageNum of pagesToConvert) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: scaleValue });

                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext("2d");

                if (!context) {
                    throw new Error("Could not get canvas context");
                }

                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                }).promise;

                const mimeType = format === "png" ? "image/png" : "image/jpeg";
                const qualityValue = format === "jpeg" ? quality[0] / 100 : undefined;

                const dataUrl = canvas.toDataURL(mimeType, qualityValue);
                const blob = await new Promise<Blob>((resolve) => {
                    canvas.toBlob(
                        (blob) => resolve(blob!),
                        mimeType,
                        qualityValue,
                    );
                });

                const baseName = pdfFile.name.replace(/\.pdf$/i, "");
                const extension = format === "png" ? "png" : "jpg";
                const filename = `${baseName}_page_${pageNum}.${extension}`;

                converted.push({
                    pageNumber: pageNum,
                    dataUrl,
                    blob,
                    filename,
                });
            }

            setConvertedImages(converted);

            toast({
                title: "Conversion successful",
                description: `Converted ${converted.length} page(s) to ${format.toUpperCase()}`,
            });
        } catch (error) {
            console.error("Conversion error:", error);
            toast({
                title: "Conversion failed",
                description: "An error occurred during conversion",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadImage = (image: ConvertedImage) => {
        const url = URL.createObjectURL(image.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = image.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadAllAsZip = async () => {
        if (convertedImages.length === 0) return;

        try {
            const zip = new JSZip();

            for (const image of convertedImages) {
                zip.file(image.filename, image.blob);
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = pdfFile!.name.replace(/\.pdf$/i, "_images.zip");
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "ZIP downloaded",
                description: `Downloaded ${convertedImages.length} image(s) as ZIP`,
            });
        } catch (error) {
            console.error("ZIP creation error:", error);
            toast({
                title: "ZIP creation failed",
                description: "An error occurred while creating the ZIP file",
                variant: "destructive",
            });
        }
    };

    const getScaleLabel = () => {
        switch (scale) {
            case "1x":
                return "1x (72 DPI)";
            case "2x":
                return "2x (144 DPI)";
            case "4x":
                return "4x (288 DPI)";
        }
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
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                                <Upload className="h-8 w-8 text-blue-500" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Upload PDF File</h3>
                            <p className="text-muted-foreground text-sm text-center">
                                Click to select a PDF to convert to images
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

            {/* File Info */}
            {pdfFile && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{pdfFile.name}</p>
                                    <p className="text-sm font-normal text-muted-foreground">
                                        {totalPages > 0 ? `${totalPages} page(s)` : "Loading..."}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setPdfFile(null);
                                        setConvertedImages([]);
                                        setTotalPages(0);
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
                                <Image className="h-5 w-5" />
                                Convert Options
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Format Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="format">Image Format</Label>
                                <Select value={format} onValueChange={(value: "png" | "jpeg") => setFormat(value)}>
                                    <SelectTrigger id="format">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="png">PNG (Lossless)</SelectItem>
                                        <SelectItem value="jpeg">JPEG (Compressed)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* JPEG Quality (only shown for JPEG) */}
                            {format === "jpeg" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>JPEG Quality</Label>
                                        <Badge variant="secondary">{quality[0]}%</Badge>
                                    </div>
                                    <Slider
                                        value={quality}
                                        onValueChange={setQuality}
                                        min={50}
                                        max={100}
                                        step={5}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Lower Size</span>
                                        <span>Higher Quality</span>
                                    </div>
                                </div>
                            )}

                            {/* Scale/DPI Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="scale">Resolution Scale</Label>
                                <Select value={scale} onValueChange={(value: "1x" | "2x" | "4x") => setScale(value)}>
                                    <SelectTrigger id="scale">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1x">1x (72 DPI) - Standard</SelectItem>
                                        <SelectItem value="2x">2x (144 DPI) - High Quality</SelectItem>
                                        <SelectItem value="4x">4x (288 DPI) - Ultra High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Page Range */}
                            <div className="space-y-2">
                                <Label htmlFor="pageRange">Page Range</Label>
                                <Input
                                    id="pageRange"
                                    value={pageRange}
                                    onChange={(e) => setPageRange(e.target.value)}
                                    placeholder="all, 1-3, 5, 7-10"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Enter "all" for all pages, or specify ranges like "1-3, 5, 7-10"
                                </p>
                            </div>

                            <Button
                                onClick={convertToImages}
                                disabled={isProcessing || totalPages === 0}
                                className="w-full"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Converting...
                                    </>
                                ) : (
                                    <>
                                        <Image className="h-4 w-4 mr-2" />
                                        Convert to Images
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Converted Images Preview */}
                    {convertedImages.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Image className="h-5 w-5" />
                                        Converted Images ({convertedImages.length})
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={downloadAllAsZip}
                                            disabled={convertedImages.length === 0}
                                        >
                                            <Package className="h-4 w-4 mr-2" />
                                            Download ZIP
                                        </Button>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {convertedImages.map((image) => (
                                        <div
                                            key={image.pageNumber}
                                            className="relative group rounded-lg border-2 overflow-hidden"
                                        >
                                            <img
                                                src={image.dataUrl}
                                                alt={`Page ${image.pageNumber}`}
                                                className="w-full aspect-[3/4] object-contain bg-muted"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => downloadImage(image)}
                                                >
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Download
                                                </Button>
                                            </div>
                                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                                Page {image.pageNumber}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
