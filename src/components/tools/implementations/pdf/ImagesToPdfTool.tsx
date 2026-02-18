import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, X, FileImage, GripVertical, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument } from "pdf-lib";

interface ImageFile {
    id: string;
    file: File;
    name: string;
    preview: string;
}

export function ImagesToPdfTool() {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        for (const file of Array.from(files)) {
            if (!file.type.startsWith("image/")) {
                toast({
                    title: "Invalid file type",
                    description: `${file.name} is not an image file`,
                    variant: "destructive",
                });
                continue;
            }

            const preview = URL.createObjectURL(file);
            const newImage: ImageFile = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                file,
                name: file.name,
                preview,
            };

            setImages((prev) => [...prev, newImage]);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeImage = (id: string) => {
        setImages((prev) => {
            const image = prev.find((img) => img.id === id);
            if (image) {
                URL.revokeObjectURL(image.preview);
            }
            return prev.filter((img) => img.id !== id);
        });
    };

    const handleDragStart = (id: string) => {
        setDraggedItem(id);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === targetId) return;

        const draggedIndex = images.findIndex((img) => img.id === draggedItem);
        const targetIndex = images.findIndex((img) => img.id === targetId);

        const newImages = [...images];
        const [removed] = newImages.splice(draggedIndex, 1);
        newImages.splice(targetIndex, 0, removed);

        setImages(newImages);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const convertToPdf = async () => {
        if (images.length === 0) {
            toast({
                title: "No images",
                description: "Please add at least one image",
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);

        try {
            const pdfDoc = await PDFDocument.create();

            for (const imageFile of images) {
                const arrayBuffer = await imageFile.file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                let image;
                if (imageFile.file.type === "image/png") {
                    image = await pdfDoc.embedPng(uint8Array);
                } else if (imageFile.file.type === "image/jpeg" || imageFile.file.type === "image/jpg") {
                    image = await pdfDoc.embedJpg(uint8Array);
                } else {
                    // For other formats, try to convert via canvas
                    const img = new window.Image();
                    img.src = imageFile.preview;
                    await new Promise((resolve) => {
                        img.onload = resolve;
                    });

                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0);

                    const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.9);
                    const base64Data = jpegDataUrl.split(",")[1];
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    image = await pdfDoc.embedJpg(bytes);
                }

                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "images_combined.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "PDF created successfully",
                description: `Combined ${images.length} image(s) into a PDF`,
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Conversion failed",
                description: "An error occurred while creating the PDF",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                    <div
                        className="flex flex-col items-center justify-center py-10 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                            <Upload className="h-8 w-8 text-purple-500" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Upload Images</h3>
                        <p className="text-muted-foreground text-sm text-center">
                            Click to select images (JPG, PNG) to combine into a PDF
                        </p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </CardContent>
            </Card>

            {/* Image List */}
            {images.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Images ({images.length})</span>
                            <Badge variant="secondary">{images.length} page(s)</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {images.map((image, index) => (
                                <div
                                    key={image.id}
                                    draggable
                                    onDragStart={() => handleDragStart(image.id)}
                                    onDragOver={(e) => handleDragOver(e, image.id)}
                                    onDragEnd={handleDragEnd}
                                    className={`relative group rounded-lg border-2 overflow-hidden cursor-grab ${draggedItem === image.id ? "opacity-50 border-dashed" : "border-transparent"
                                        }`}
                                >
                                    <img
                                        src={image.preview}
                                        alt={image.name}
                                        className="w-full aspect-[3/4] object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => removeImage(image.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                        {index + 1}
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <GripVertical className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                className="flex-1"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Add More Images
                            </Button>
                            <Button
                                onClick={convertToPdf}
                                disabled={images.length === 0 || isProcessing}
                                className="flex-1"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating PDF...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Create PDF
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {images.length === 0 && (
                <div className="text-center text-muted-foreground text-sm">
                    <p>Drag and drop to reorder images after uploading</p>
                </div>
            )}
        </div>
    );
}
