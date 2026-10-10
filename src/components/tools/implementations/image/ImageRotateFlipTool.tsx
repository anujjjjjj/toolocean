import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, RotateCcw, RotateCw, FlipHorizontal, FlipVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { readImageFiles } from "@/lib/image/readImageFiles";

export function ImageRotateFlipTool() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const { accepted, errors } = await readImageFiles([file]);
    if (!accepted[0]) {
      toast({ title: "Could not read that image", description: errors[0] ?? "Please select an image file", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(accepted[0]);
    const img = new Image();
    img.onload = () => { imgRef.current = img; setImageSrc(url); };
    img.src = url;
  };

  const renderToCanvas = (): HTMLCanvasElement => {
    const img = imgRef.current!;
    const rad = (rotation * Math.PI) / 180;
    const swap = rotation === 90 || rotation === 270;
    const w = swap ? img.naturalHeight : img.naturalWidth;
    const h = swap ? img.naturalWidth : img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.translate(w / 2, h / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    return canvas;
  };

  const download = () => {
    if (!imgRef.current) { toast({ title: "Choose an image first", variant: "destructive" }); return; }
    const a = document.createElement("a");
    a.href = renderToCanvas().toDataURL("image/png");
    a.download = "transformed.png";
    a.click();
  };

  const previewStyle: React.CSSProperties = {
    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
    maxWidth: "100%",
    maxHeight: 400,
    transition: "transform 0.2s",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Image Rotate & Flip</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />Choose file
            </Button>
            <Button variant="outline" onClick={() => setRotation((r) => (r - 90 + 360) % 360)} disabled={!imageSrc}>
              <RotateCcw className="h-4 w-4 mr-2" />90° CCW
            </Button>
            <Button variant="outline" onClick={() => setRotation((r) => (r + 90) % 360)} disabled={!imageSrc}>
              <RotateCw className="h-4 w-4 mr-2" />90° CW
            </Button>
            <Button variant="outline" onClick={() => setFlipH((f) => !f)} disabled={!imageSrc}>
              <FlipHorizontal className="h-4 w-4 mr-2" />{flipH ? "Unflip H" : "Flip H"}
            </Button>
            <Button variant="outline" onClick={() => setFlipV((f) => !f)} disabled={!imageSrc}>
              <FlipVertical className="h-4 w-4 mr-2" />{flipV ? "Unflip V" : "Flip V"}
            </Button>
            {imageSrc && (
              <Button onClick={download}>
                <Download className="h-4 w-4 mr-2" />Download
              </Button>
            )}
          </div>

          {imageSrc && (
            <div className="flex items-center justify-center border rounded-md overflow-hidden bg-muted/30 min-h-[200px]">
              <img src={imageSrc} alt="Preview" style={previewStyle} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
