import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ImageResizerTool() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [aspectLock, setAspectLock] = useState(true);
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setOriginalSize({ w: img.width, h: img.height });
      setWidth(img.width);
      setHeight(img.height);
      setImageUrl(url);
    };
    img.src = url;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleWidthChange = (w: number) => {
    setWidth(w);
    if (aspectLock && originalSize.w > 0) {
      setHeight(Math.round((w * originalSize.h) / originalSize.w));
    }
  };

  const handleHeightChange = (h: number) => {
    setHeight(h);
    if (aspectLock && originalSize.h > 0) {
      setWidth(Math.round((h * originalSize.w) / originalSize.h));
    }
  };

  const resizeAndDownload = () => {
    if (!imageUrl || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `resized-${width}x${height}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast({ title: "Downloaded", description: "Resized image saved" });
      });
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
          <div className="flex gap-8 flex-wrap">
            <div>
              <img src={imageUrl} alt="Preview" className="max-h-64 rounded-lg border object-contain" />
              <p className="text-sm text-muted-foreground mt-1">
                Original: {originalSize.w} × {originalSize.h}
              </p>
            </div>
            <div className="space-y-4 min-w-[200px]">
              <div>
                <Label>Width</Label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                  min={1}
                />
              </div>
              <div>
                <Label>Height</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                  min={1}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={aspectLock} onChange={(e) => setAspectLock(e.target.checked)} />
                Lock aspect ratio
              </label>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <Button onClick={resizeAndDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download Resized Image
          </Button>
        </>
      )}
    </div>
  );
}
