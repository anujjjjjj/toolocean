import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Download, FileText, GripVertical, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument } from "pdf-lib";

interface PdfFile {
    id: string;
    file: File;
    name: string;
    pageCount: number;
}

export function PdfMergeTool() {
    const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        for (const file of Array.from(files)) {
            if (file.type !== "application/pdf") {
                toast({
                    title: "Invalid file type",
                    description: `${file.name} is not a PDF file`,
                    variant: "destructive",
                });
                continue;
            }

            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const pageCount = pdfDoc.getPageCount();

                const newPdfFile: PdfFile = {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    file,
                    name: file.name,
                    pageCount,
                };

                setPdfFiles((prev) => [...prev, newPdfFile]);
            } catch (error) {
                toast({
                    title: "Error reading PDF",
                    description: `Could not read ${file.name}`,
                    variant: "destructive",
                });
            }
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeFile = (id: string) => {
        setPdfFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleDragStart = (id: string) => {
        setDraggedItem(id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === targetId) return;

        const draggedIndex = pdfFiles.findIndex((f) => f.id === draggedItem);
        const targetIndex = pdfFiles.findIndex((f) => f.id === targetId);

        const newFiles = [...pdfFiles];
        const [removed] = newFiles.splice(draggedIndex, 1);
        newFiles.splice(targetIndex, 0, removed);

        setPdfFiles(newFiles);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const mergePdfs = async () => {
        if (pdfFiles.length < 2) {
            toast({
                title: "Need more files",
                description: "Please add at least 2 PDF files to merge",
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);

        try {
            const mergedPdf = await PDFDocument.create();

            for (const pdfFile of pdfFiles) {
                const arrayBuffer = await pdfFile.file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                pages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "merged.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "PDFs merged successfully",
                description: `Combined ${pdfFiles.length} PDFs into one document`,
            });
        } catch (error) {
            toast({
                title: "Merge failed",
                description: "An error occurred while merging PDFs",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const totalPages = pdfFiles.reduce((sum, f) => sum + f.pageCount, 0);

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                    <div
                        className="flex flex-col items-center justify-center py-10 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center mb-4">
                            <Upload className="h-8 w-8 text-rose-500" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Upload PDF Files</h3>
                        <p className="text-muted-foreground text-sm text-center">
                            Click to select PDFs or drag and drop them here
                        </p>
                        <p className="text-muted-foreground text-xs mt-2">
                            Files are processed locally - never uploaded to a server
                        </p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </CardContent>
            </Card>

            {/* File List */}
            {pdfFiles.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Files to Merge ({pdfFiles.length})</span>
                            <Badge variant="secondary">{totalPages} total pages</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {pdfFiles.map((pdfFile, index) => (
                                <div
                                    key={pdfFile.id}
                                    draggable
                                    onDragStart={() => handleDragStart(pdfFile.id)}
                                    onDragOver={(e) => handleDragOver(e, pdfFile.id)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${draggedItem === pdfFile.id ? "opacity-50" : ""
                                        }`}
                                >
                                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                    <div className="w-8 h-8 rounded bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-rose-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{pdfFile.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {pdfFile.pageCount} page{pdfFile.pageCount !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                    <Badge variant="outline">{index + 1}</Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFile(pdfFile.id)}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                className="flex-1"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Add More Files
                            </Button>
                            <Button
                                onClick={mergePdfs}
                                disabled={pdfFiles.length < 2 || isProcessing}
                                className="flex-1"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Merging...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Merge & Download
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Instructions */}
            {pdfFiles.length === 0 && (
                <div className="text-center text-muted-foreground text-sm">
                    <p>Drag and drop to reorder files after uploading</p>
                </div>
            )}
        </div>
    );
}
