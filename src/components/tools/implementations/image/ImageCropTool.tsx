import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, Crop } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ImageCropTool() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImageSrc(url);
      setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
      setCrop({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = url;
    e.target.value = "";
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = imageSize.w / canvas.offsetWidth;
    const scaleY = imageSize.h / canvas.offsetHeight;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e);
    setDragStart(pos);
    setCrop({ x: pos.x, y: pos.y, w: 0, h: 0 });
    setDragging(true);
  }, [imageSize]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const pos = getCanvasCoords(e);
    const x = Math.min(pos.x, dragStart.x);
    const y = Math.min(pos.y, dragStart.y);
    const w = Math.abs(pos.x - dragStart.x);
    const h = Math.abs(pos.y - dragStart.y);
    setCrop({ x, y, w, h });
    drawOverlay({ x, y, w, h });
  }, [dragging, dragStart, imageSize]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  const drawOverlay = (c: typeof crop) => {
    const canvas = previewRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = imageSize.w;
    canvas.height = imageSize.h;
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, imageSize.w, imageSize.h);
    if (c.w > 0 && c.h > 0) {
      ctx.drawImage(img, c.x, c.y, c.w, c.h, c.x, c.y, c.w, c.h);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
    }
  };

  const download = () => {
    if (!imgRef.current || crop.w === 0 || crop.h === 0) {
      toast({ title: "Select a crop area first", variant: "destructive" });
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = crop.w;
    canvas.height = crop.h;
    canvas.getContext("2d")!.drawImage(imgRef.current, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "cropped.png";
    a.click();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Crop className="h-5 w-5" />Image Cropper</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />Choose image
            </Button>
            {imageSrc && (
              <Button onClick={download}>
                <Download className="h-4 w-4 mr-2" />Download Crop
              </Button>
            )}
          </div>

          {imageSrc && (
            <>
              <p className="text-sm text-muted-foreground">Click and drag on the image to select a crop region.</p>
              <div ref={containerRef} className="overflow-auto border rounded-md">
                <canvas
                  ref={previewRef}
                  width={imageSize.w}
                  height={imageSize.h}
                  style={{ maxWidth: "100%", cursor: "crosshair", display: "block" }}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                />
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                {(["x", "y", "w", "h"] as const).map((k) => (
                  <div key={k} className="space-y-1">
                    <Label className="text-xs">{k === "w" ? "Width" : k === "h" ? "Height" : k.toUpperCase()}</Label>
                    <Input
                      type="number"
                      value={crop[k]}
                      min={0}
                      max={k === "x" || k === "w" ? imageSize.w : imageSize.h}
                      onChange={(e) => {
                        const next = { ...crop, [k]: parseInt(e.target.value) || 0 };
                        setCrop(next);
                        drawOverlay(next);
                      }}
                      className="font-mono text-xs h-8"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
