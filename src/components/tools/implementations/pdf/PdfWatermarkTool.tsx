import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, FileText, Loader2, Droplets } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export function PdfWatermarkTool() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
    const [opacity, setOpacity] = useState([0.3]);
    const [fontSize, setFontSize] = useState([48]);
    const [position, setPosition] = useState("center");
    const [color, setColor] = useState("#888888");
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

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

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const count = pdfDoc.getPageCount();

            setPdfFile(file);
            setPageCount(count);
        } catch (error) {
            toast({
                title: "Error reading PDF",
                description: "Could not read the PDF file",
                variant: "destructive",
            });
        }
    };

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                r: parseInt(result[1], 16) / 255,
                g: parseInt(result[2], 16) / 255,
                b: parseInt(result[3], 16) / 255,
            }
            : { r: 0.5, g: 0.5, b: 0.5 };
    };

    const applyWatermark = async () => {
        if (!pdfFile || !watermarkText.trim()) {
            toast({
                title: "Missing watermark text",
                description: "Please enter watermark text",
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const rgbColor = hexToRgb(color);

            for (const page of pages) {
                const { width, height } = page.getSize();
                const textWidth = font.widthOfTextAtSize(watermarkText, fontSize[0]);
                const textHeight = fontSize[0];

                let x = (width - textWidth) / 2;
                let y = (height - textHeight) / 2;

                switch (position) {
                    case "top-left":
                        x = 50;
                        y = height - 50 - textHeight;
                        break;
                    case "top-right":
                        x = width - textWidth - 50;
                        y = height - 50 - textHeight;
                        break;
                    case "bottom-left":
                        x = 50;
                        y = 50;
                        break;
                    case "bottom-right":
                        x = width - textWidth - 50;
                        y = 50;
                        break;
                    case "center":
                    default:
                        // Already set above
                        break;
                }

                page.drawText(watermarkText, {
                    x,
                    y,
                    size: fontSize[0],
                    font,
                    color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
                    opacity: opacity[0],
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = pdfFile.name.replace(".pdf", "_watermarked.pdf");
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "Watermark applied successfully",
                description: "Your watermarked PDF has been downloaded",
            });
        } catch (error) {
            toast({
                title: "Watermark failed",
                description: "An error occurred while applying the watermark",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
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
                            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                                <Upload className="h-8 w-8 text-indigo-500" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Upload PDF File</h3>
                            <p className="text-muted-foreground text-sm text-center">
                                Click to select a PDF to add watermark
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

            {/* Watermark Options */}
            {pdfFile && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-indigo-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{pdfFile.name}</p>
                                    <p className="text-sm font-normal text-muted-foreground">
                                        {pageCount} page{pageCount !== 1 ? "s" : ""}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setPdfFile(null);
                                        setPageCount(0);
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
                                <Droplets className="h-5 w-5" />
                                Watermark Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="watermarkText">Watermark Text</Label>
                                    <Input
                                        id="watermarkText"
                                        placeholder="Enter watermark text"
                                        value={watermarkText}
                                        onChange={(e) => setWatermarkText(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="position">Position</Label>
                                    <Select value={position} onValueChange={setPosition}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="center">Center</SelectItem>
                                            <SelectItem value="top-left">Top Left</SelectItem>
                                            <SelectItem value="top-right">Top Right</SelectItem>
                                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <Label>Opacity</Label>
                                        <span className="text-sm text-muted-foreground">{Math.round(opacity[0] * 100)}%</span>
                                    </div>
                                    <Slider
                                        value={opacity}
                                        onValueChange={setOpacity}
                                        min={0.1}
                                        max={1}
                                        step={0.1}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <Label>Font Size</Label>
                                        <span className="text-sm text-muted-foreground">{fontSize[0]}px</span>
                                    </div>
                                    <Slider
                                        value={fontSize}
                                        onValueChange={setFontSize}
                                        min={12}
                                        max={120}
                                        step={4}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="color">Color</Label>
                                <div className="flex gap-3">
                                    <Input
                                        id="color"
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="w-16 h-10 p-1 cursor-pointer"
                                    />
                                    <Input
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="border rounded-lg p-6 bg-white dark:bg-gray-800 relative overflow-hidden">
                                <div className="text-xs text-muted-foreground mb-2">Preview</div>
                                <div className="aspect-[8.5/11] border rounded bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span
                                            style={{
                                                fontSize: `${fontSize[0] / 3}px`,
                                                opacity: opacity[0],
                                                color: color,
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {watermarkText || "WATERMARK"}
                                        </span>
                                    </div>
                                    <div className="w-3/4 space-y-2 opacity-30">
                                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-4/6"></div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={applyWatermark}
                                disabled={!watermarkText.trim() || isProcessing}
                                className="w-full"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Applying Watermark...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Apply Watermark & Download
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
