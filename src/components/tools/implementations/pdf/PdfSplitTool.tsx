import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText, Loader2, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument } from "pdf-lib";

export function PdfSplitTool() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [pageRange, setPageRange] = useState("");
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
            setPageRange(`1-${count}`);
        } catch (error) {
            toast({
                title: "Error reading PDF",
                description: "Could not read the PDF file",
                variant: "destructive",
            });
        }
    };

    const parsePageRange = (range: string, maxPages: number): number[] => {
        const pages: Set<number> = new Set();
        const parts = range.split(",").map((p) => p.trim());

        for (const part of parts) {
            if (part.includes("-")) {
                const [start, end] = part.split("-").map((n) => parseInt(n.trim()));
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = Math.max(1, start); i <= Math.min(end, maxPages); i++) {
                        pages.add(i);
                    }
                }
            } else {
                const pageNum = parseInt(part);
                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
                    pages.add(pageNum);
                }
            }
        }

        return Array.from(pages).sort((a, b) => a - b);
    };

    const splitPdf = async () => {
        if (!pdfFile) return;

        const pages = parsePageRange(pageRange, pageCount);
        if (pages.length === 0) {
            toast({
                title: "Invalid page range",
                description: "Please enter a valid page range",
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const srcDoc = await PDFDocument.load(arrayBuffer);
            const newDoc = await PDFDocument.create();

            // pdf-lib uses 0-based indexing
            const pageIndices = pages.map((p) => p - 1);
            const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
            copiedPages.forEach((page) => newDoc.addPage(page));

            const pdfBytes = await newDoc.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `split_pages_${pageRange.replace(/,/g, "_")}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "PDF split successfully",
                description: `Extracted ${pages.length} page(s)`,
            });
        } catch (error) {
            toast({
                title: "Split failed",
                description: "An error occurred while splitting the PDF",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const pages = parsePageRange(pageRange, pageCount);

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
                            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4">
                                <Upload className="h-8 w-8 text-orange-500" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Upload PDF File</h3>
                            <p className="text-muted-foreground text-sm text-center">
                                Click to select a PDF to split
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

            {/* File Info & Split Options */}
            {pdfFile && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-orange-500" />
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
                                        setPageRange("");
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
                                <Scissors className="h-5 w-5" />
                                Select Pages to Extract
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="pageRange">Page Range</Label>
                                <Input
                                    id="pageRange"
                                    placeholder="e.g. 1-3, 5, 7-10"
                                    value={pageRange}
                                    onChange={(e) => setPageRange(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Enter page numbers or ranges separated by commas. Example: 1-3, 5, 7-10
                                </p>
                            </div>

                            {pages.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {pages.slice(0, 20).map((page) => (
                                        <Badge key={page} variant="secondary">
                                            Page {page}
                                        </Badge>
                                    ))}
                                    {pages.length > 20 && (
                                        <Badge variant="outline">+{pages.length - 20} more</Badge>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setPageRange(`1-${pageCount}`)}
                                    className="flex-1"
                                >
                                    Select All
                                </Button>
                                <Button
                                    onClick={splitPdf}
                                    disabled={pages.length === 0 || isProcessing}
                                    className="flex-1"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Extracting...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            Extract {pages.length} Page{pages.length !== 1 ? "s" : ""}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
