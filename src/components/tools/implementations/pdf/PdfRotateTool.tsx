import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileText, Loader2, RotateCw, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument, degrees } from "pdf-lib";

export function PdfRotateTool() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [rotations, setRotations] = useState<number[]>([]);
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
            setRotations(new Array(count).fill(0));
        } catch (error) {
            toast({
                title: "Error reading PDF",
                description: "Could not read the PDF file",
                variant: "destructive",
            });
        }
    };

    const rotatePage = (index: number, direction: 90 | -90) => {
        setRotations((prev) => {
            const newRotations = [...prev];
            newRotations[index] = (newRotations[index] + direction + 360) % 360;
            return newRotations;
        });
    };

    const rotateAll = (direction: 90 | -90) => {
        setRotations((prev) => prev.map((r) => (r + direction + 360) % 360));
    };

    const applyRotations = async () => {
        if (!pdfFile) return;

        setIsProcessing(true);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();

            pages.forEach((page, index) => {
                if (rotations[index] !== 0) {
                    const currentRotation = page.getRotation().angle;
                    page.setRotation(degrees(currentRotation + rotations[index]));
                }
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = pdfFile.name.replace(".pdf", "_rotated.pdf");
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "PDF rotated successfully",
                description: "Your rotated PDF has been downloaded",
            });
        } catch (error) {
            toast({
                title: "Rotation failed",
                description: "An error occurred while rotating the PDF",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const hasRotations = rotations.some((r) => r !== 0);

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
                            <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center mb-4">
                                <Upload className="h-8 w-8 text-teal-500" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Upload PDF File</h3>
                            <p className="text-muted-foreground text-sm text-center">
                                Click to select a PDF to rotate pages
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

            {/* File Info & Rotation Controls */}
            {pdfFile && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-teal-500" />
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
                                        setRotations([]);
                                    }}
                                >
                                    Change File
                                </Button>
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <RotateCw className="h-5 w-5" />
                                    Rotate Pages
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => rotateAll(-90)}>
                                        <RotateCcw className="h-4 w-4 mr-1" />
                                        All Left
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => rotateAll(90)}>
                                        <RotateCw className="h-4 w-4 mr-1" />
                                        All Right
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 mb-6">
                                {rotations.map((rotation, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-muted/30"
                                    >
                                        <div
                                            className="w-12 h-16 bg-white dark:bg-gray-800 border rounded shadow-sm flex items-center justify-center transition-transform"
                                            style={{ transform: `rotate(${rotation}deg)` }}
                                        >
                                            <span className="text-xs text-muted-foreground">{index + 1}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => rotatePage(index, -90)}
                                            >
                                                <RotateCcw className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => rotatePage(index, 90)}
                                            >
                                                <RotateCw className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        {rotation !== 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                                {rotation}°
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={applyRotations}
                                disabled={!hasRotations || isProcessing}
                                className="w-full"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Applying...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Apply Rotations & Download
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
