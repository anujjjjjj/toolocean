import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Filters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  sepia: number;
  hueRotate: number;
  invert: number;
}

const DEFAULTS: Filters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  invert: 0,
};

export function ImageFiltersTool() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ ...DEFAULTS });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { imgRef.current = img; setImageSrc(url); };
    img.src = url;
    e.target.value = "";
  };

  const filterString = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) hue-rotate(${filters.hueRotate}deg) invert(${filters.invert}%)`;

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.filter = filterString;
    ctx.drawImage(img, 0, 0);
    ctx.filter = "none";
  };

  useEffect(() => {
    if (imageSrc) renderCanvas();
  }, [imageSrc, filters]);

  const download = () => {
    if (!canvasRef.current) { toast({ title: "Choose an image first", variant: "destructive" }); return; }
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = "filtered.png";
    a.click();
  };

  const CONTROLS: { key: keyof Filters; label: string; min: number; max: number; step?: number; unit: string }[] = [
    { key: "brightness",  label: "Brightness",  min: 0, max: 200, unit: "%" },
    { key: "contrast",    label: "Contrast",    min: 0, max: 200, unit: "%" },
    { key: "saturation",  label: "Saturation",  min: 0, max: 200, unit: "%" },
    { key: "grayscale",   label: "Grayscale",   min: 0, max: 100, unit: "%" },
    { key: "sepia",       label: "Sepia",       min: 0, max: 100, unit: "%" },
    { key: "invert",      label: "Invert",      min: 0, max: 100, unit: "%" },
    { key: "blur",        label: "Blur",        min: 0, max: 20, step: 0.5, unit: "px" },
    { key: "hueRotate",   label: "Hue Rotate",  min: 0, max: 360, unit: "°" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Image Filters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />Choose file
            </Button>
            <Button variant="outline" onClick={() => setFilters({ ...DEFAULTS })} disabled={!imageSrc}>
              <RotateCcw className="h-4 w-4 mr-2" />Reset
            </Button>
            {imageSrc && <Button onClick={download}><Download className="h-4 w-4 mr-2" />Download</Button>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {CONTROLS.map(({ key, label, min, max, step, unit }) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">{label}</Label>
                  <span className="text-sm text-muted-foreground font-mono">{filters[key]}{unit}</span>
                </div>
                <Slider
                  min={min}
                  max={max}
                  step={step || 1}
                  value={[filters[key]]}
                  onValueChange={([v]) => setFilters((f) => ({ ...f, [key]: v }))}
                  disabled={!imageSrc}
                />
              </div>
            ))}
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
