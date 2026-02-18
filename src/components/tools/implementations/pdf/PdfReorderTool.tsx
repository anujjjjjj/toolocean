import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileText, Loader2, GripVertical, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument } from "pdf-lib";

interface PageItem {
    index: number;
    originalIndex: number;
}

export function PdfReorderTool() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageItem[]>([]);
    const [draggedItem, setDraggedItem] = useState<number | null>(null);
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
            setPages(
                Array.from({ length: count }, (_, i) => ({
                    index: i,
                    originalIndex: i,
                }))
            );
        } catch (error) {
            toast({
                title: "Error reading PDF",
                description: "Could not read the PDF file",
                variant: "destructive",
            });
        }
    };

    const handleDragStart = (index: number) => {
        setDraggedItem(index);
    };

    const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === targetIndex) return;

        const newPages = [...pages];
        const [removed] = newPages.splice(draggedItem, 1);
        newPages.splice(targetIndex, 0, removed);

        // Update indices
        newPages.forEach((page, i) => {
            page.index = i;
        });

        setPages(newPages);
        setDraggedItem(targetIndex);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const reorderPdf = async () => {
        if (!pdfFile || pages.length === 0) return;

        setIsProcessing(true);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const srcDoc = await PDFDocument.load(arrayBuffer);
            const newDoc = await PDFDocument.create();

            // Copy pages in new order
            const pageIndices = pages.map((p) => p.originalIndex);
            const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
            copiedPages.forEach((page) => newDoc.addPage(page));

            const pdfBytes = await newDoc.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = pdfFile.name.replace(".pdf", "_reordered.pdf");
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "PDF reordered successfully",
                description: "Your reordered PDF has been downloaded",
            });
        } catch (error) {
            toast({
                title: "Reorder failed",
                description: "An error occurred while reordering the PDF",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const resetOrder = () => {
        setPages((prev) =>
            [...prev]
                .sort((a, b) => a.originalIndex - b.originalIndex)
                .map((p, i) => ({ ...p, index: i }))
        );
    };

    const isModified = pages.some((p, i) => p.originalIndex !== i);

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
                            <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center mb-4">
                                <Upload className="h-8 w-8 text-pink-500" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Upload PDF File</h3>
                            <p className="text-muted-foreground text-sm text-center">
                                Click to select a PDF to reorder pages
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

            {/* Page Reorder Interface */}
            {pdfFile && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-pink-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{pdfFile.name}</p>
                                    <p className="text-sm font-normal text-muted-foreground">
                                        {pages.length} page{pages.length !== 1 ? "s" : ""}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setPdfFile(null);
                                        setPages([]);
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
                                    <ArrowUpDown className="h-5 w-5" />
                                    Reorder Pages
                                </span>
                                {isModified && (
                                    <Button variant="outline" size="sm" onClick={resetOrder}>
                                        Reset Order
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Drag and drop pages to reorder them
                            </p>

                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-6">
                                {pages.map((page, index) => (
                                    <div
                                        key={page.originalIndex}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border cursor-grab transition-all ${draggedItem === index
                                                ? "opacity-50 border-dashed border-primary"
                                                : "hover:border-primary/50 hover:bg-muted/30"
                                            } ${page.originalIndex !== index ? "bg-pink-50 dark:bg-pink-900/10" : ""
                                            }`}
                                    >
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        <div className="w-full aspect-[3/4] bg-white dark:bg-gray-800 border rounded shadow-sm flex items-center justify-center">
                                            <span className="text-lg font-medium">{page.originalIndex + 1}</span>
                                        </div>
                                        <Badge
                                            variant={page.originalIndex !== index ? "default" : "outline"}
                                            className="text-xs"
                                        >
                                            → {index + 1}
                                        </Badge>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={reorderPdf}
                                disabled={isProcessing}
                                className="w-full"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Reordering...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        {isModified ? "Apply New Order & Download" : "Download PDF"}
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
