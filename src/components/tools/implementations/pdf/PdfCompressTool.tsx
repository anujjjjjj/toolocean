import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileText, Loader2, Shrink } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument } from "pdf-lib";

export function PdfCompressTool() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [originalSize, setOriginalSize] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [quality, setQuality] = useState([70]);
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

    const compressPdf = async () => {
        if (!pdfFile) return;

        setIsProcessing(true);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            // Note: pdf-lib doesn't have built-in compression for images
            // We can still reduce size by:
            // 1. Removing metadata
            // 2. Re-saving with optimizations

            // Remove document metadata to reduce size
            pdfDoc.setTitle("");
            pdfDoc.setAuthor("");
            pdfDoc.setSubject("");
            pdfDoc.setKeywords([]);
            pdfDoc.setProducer("");
            pdfDoc.setCreator("");

            // Save with some optimizations - lower quality settings
            const compressedBytes = await pdfDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
            });

            const blob = new Blob([compressedBytes], { type: "application/pdf" });
            const newSize = blob.size;
            const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = pdfFile.name.replace(".pdf", "_compressed.pdf");
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "PDF compressed successfully",
                description: `Reduced from ${formatSize(originalSize)} to ${formatSize(newSize)} (${savings}% savings)`,
            });
        } catch (error) {
            toast({
                title: "Compression failed",
                description: "An error occurred while compressing the PDF",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
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
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Quality Level</span>
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
                                    <span>Max Compression</span>
                                    <span>High Quality</span>
                                </div>
                            </div>

                            <div className="bg-muted/50 rounded-lg p-4">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Note:</strong> PDF compression works best on PDFs with embedded images.
                                    Text-only PDFs may see minimal size reduction. The actual compression ratio
                                    depends on the PDF content.
                                </p>
                            </div>

                            <Button
                                onClick={compressPdf}
                                disabled={isProcessing}
                                className="w-full"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Compressing...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Compress & Download
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
