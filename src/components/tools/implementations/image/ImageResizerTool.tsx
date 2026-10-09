import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/** Formats a canvas can actually encode. Anything else is written as PNG. */
const ENCODABLE = new Set(["image/png", "image/jpeg", "image/webp"]);

const EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

type LengthUnit = "px" | "cm" | "mm" | "in";

function toPixels(value: number, unit: LengthUnit, dpi: number): number {
  if (unit === "px") return Math.max(1, Math.round(value));
  if (unit === "in") return Math.max(1, Math.round(value * dpi));
  if (unit === "cm") return Math.max(1, Math.round((value / 2.54) * dpi));
  return Math.max(1, Math.round((value / 25.4) * dpi));
}

function fromPixels(pixels: number, unit: LengthUnit, dpi: number): string {
  if (unit === "px") return String(pixels);
  const inches = pixels / dpi;
  const value = unit === "in" ? inches : unit === "cm" ? inches * 2.54 : inches * 25.4;
  return String(Math.round(value * 100) / 100);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageResizerTool() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [aspectLock, setAspectLock] = useState(true);
  const [unit, setUnit] = useState<LengthUnit>("px");
  const [dpi, setDpi] = useState(96);
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 });
  const [sourceType, setSourceType] = useState<string>("image/png");
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
    /*
     * Remember what the source was so the result can be written back in the
     * same format. Canvas can only encode PNG, JPEG and WebP, so anything else
     * (HEIC, GIF, BMP, SVG) becomes PNG, which is lossless and always readable.
     */
    setSourceType(ENCODABLE.has(file.type) ? file.type : "image/png");
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
      /*
       * Encode back into the format that came in.
       *
       * toBlob with no type argument produces PNG, which meant every resize
       * returned a PNG whatever went in. For a photograph that is a disaster:
       * a 2,057,152 byte JPEG scaled down to a quarter of its pixels came back
       * as a 4,803,265 byte PNG, more than twice the size of the original,
       * because PNG stores photographic detail losslessly. People resize images
       * to make them smaller, so handing back something larger was the opposite
       * of the job.
       */
      canvas.toBlob(
        async (blob) => {
          if (!blob) return;
          let body: Blob = blob;
          if (sourceType === "image/jpeg") {
            const { setJfifDensity } = await import("@/lib/targetSize/jpeg");
            const marked = setJfifDensity(new Uint8Array(await blob.arrayBuffer()), dpi);
            body = new Blob([marked], { type: "image/jpeg" });
          }
          const a = document.createElement("a");
          a.href = URL.createObjectURL(body);
          a.download = `resized-${width}x${height}.${EXTENSION[sourceType] ?? "png"}`;
          a.click();
          URL.revokeObjectURL(a.href);
          toast({
            title: "Downloaded",
            description: `${width}x${height}, ${formatBytes(blob.size)}`,
          });
        },
        sourceType,
        sourceType === "image/png" ? undefined : 0.92,
      );
    };
    img.src = imageUrl;
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline" data-analytics-label="resizer-select">
        <Upload className="h-4 w-4 mr-2" />
        Select Image
      </Button>
      <p className="text-sm text-muted-foreground">
        Size the result in px, cm, mm, or inches. DPI defaults to 96, with 200 and 300 presets. A JPEG download stores that DPI in the JFIF header. PNG stays pixels only.
      </p>

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
              <div className="flex flex-wrap gap-2">
                {(["px", "cm", "mm", "in"] as LengthUnit[]).map((item) => (
                  <Button key={item} type="button" size="sm" variant={unit === item ? "default" : "outline"} data-analytics-label={`resizer-unit-${item}`} onClick={() => setUnit(item)}>
                    {item}
                  </Button>
                ))}
              </div>
              <div>
                <Label>DPI</Label>
                <Input type="number" value={dpi} min={1} onChange={(e) => setDpi(Math.max(1, parseInt(e.target.value) || 96))} />
                <div className="mt-2 flex gap-2">
                  {[96, 200, 300].map((value) => (
                    <Button key={value} type="button" size="sm" variant={dpi === value ? "default" : "outline"} data-analytics-label={`resizer-dpi-${value}`} onClick={() => setDpi(value)}>
                      {value}
                    </Button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Pixels are the default, at 96 DPI. JPEG downloads store this DPI in the JFIF header. PNG stays pixels only.</p>
              </div>
              <div>
                <Label>Width ({unit})</Label>
                <Input
                  type="number"
                  value={fromPixels(width, unit, dpi)}
                  onChange={(e) => handleWidthChange(toPixels(parseFloat(e.target.value) || 0, unit, dpi))}
                  min={1}
                />
              </div>
              <div>
                <Label>Height ({unit})</Label>
                <Input
                  type="number"
                  value={fromPixels(height, unit, dpi)}
                  onChange={(e) => handleHeightChange(toPixels(parseFloat(e.target.value) || 0, unit, dpi))}
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
          <Button onClick={resizeAndDownload} data-analytics-label="resizer-download">
            <Download className="h-4 w-4 mr-2" />
            Download Resized Image
          </Button>
        </>
      )}
    </div>
  );
}
