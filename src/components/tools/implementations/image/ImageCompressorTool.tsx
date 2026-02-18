import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ImageCompressorTool() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [originalSize, setOriginalSize] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    setOriginalSize(file.size);
    setImageUrl(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const compressAndDownload = () => {
    if (!imageUrl || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `compressed-${Math.round(quality * 100)}.jpg`;
          a.click();
          URL.revokeObjectURL(a.href);
          const pct = originalSize > 0 ? Math.round((1 - blob.size / originalSize) * 100) : 0;
          toast({ title: "Downloaded", description: `Compressed (${pct}% smaller)` });
        },
        "image/jpeg",
        quality
      );
    };
    img.src = imageUrl;
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        Select Image
      </Button>

      {imageUrl && (
        <>
          <div className="space-y-4">
            <Label>Quality: {Math.round(quality * 100)}%</Label>
            <Slider value={[quality]} onValueChange={([v]) => setQuality(v)} min={0.1} max={1} step={0.05} />
          </div>
          <img src={imageUrl} alt="Preview" className="max-h-64 rounded-lg border object-contain" />
          <p className="text-sm text-muted-foreground">Original size: {(originalSize / 1024).toFixed(1)} KB</p>
          <canvas ref={canvasRef} className="hidden" />
          <Button onClick={compressAndDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download Compressed (JPEG)
          </Button>
        </>
      )}
    </div>
  );
}
