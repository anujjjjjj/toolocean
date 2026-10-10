import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { readImageFiles } from "@/lib/image/readImageFiles";

const POSITIONS = ["top-left", "top-center", "top-right", "center", "bottom-left", "bottom-center", "bottom-right"] as const;
type Position = typeof POSITIONS[number];

export function ImageWatermarkTool() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [text, setText] = useState("Watermark");
  const [fontSize, setFontSize] = useState("40");
  const [opacity, setOpacity] = useState("0.5");
  const [position, setPosition] = useState<Position>("bottom-right");
  const [color, setColor] = useState("#ffffff");
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const renderWatermark = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    const fs = Math.max(12, parseInt(fontSize) || 40);
    ctx.font = `bold ${fs}px sans-serif`;
    ctx.globalAlpha = parseFloat(opacity) || 0.5;
    ctx.fillStyle = color;
    const padding = fs;
    const tw = ctx.measureText(text).width;
    let x = 0, y = 0;
    const [vy, vx] = position.split("-");
    if (vy === "top") y = fs + padding;
    else if (vy === "bottom") y = canvas.height - padding;
    else y = canvas.height / 2;
    if (vx === "left") x = padding;
    else if (vx === "right") x = canvas.width - tw - padding;
    else x = (canvas.width - tw) / 2;
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  };

  useEffect(() => {
    if (imageSrc) renderWatermark();
  }, [imageSrc, text, fontSize, opacity, position, color]);

  const download = () => {
    if (!canvasRef.current) { toast({ title: "Choose an image first", variant: "destructive" }); return; }
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = "watermarked.png";
    a.click();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Image Watermark</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />Choose image
            </Button>
            {imageSrc && <Button onClick={download}><Download className="h-4 w-4 mr-2" />Download</Button>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Watermark Text</Label>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Watermark" />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Font Size (px)</Label>
              <Input type="number" value={fontSize} onChange={(e) => setFontSize(e.target.value)} min={10} max={300} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Opacity (0–1)</Label>
              <Input type="number" value={opacity} onChange={(e) => setOpacity(e.target.value)} min={0} max={1} step={0.1} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Text Color</Label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 rounded-md border cursor-pointer" />
            </div>
          </div>

          {imageSrc && (
            <div className="overflow-auto border rounded-md bg-muted/30">
              <canvas ref={canvasRef} style={{ maxWidth: "100%", display: "block" }} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
