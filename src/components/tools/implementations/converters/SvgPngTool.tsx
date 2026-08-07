import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SvgPngTool() {
  const [svgSrc, setSvgSrc] = useState("");
  const [scale, setScale] = useState("2");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setSvgSrc(ev.target?.result as string); setPreview(null); setError(""); };
    reader.readAsText(file);
    e.target.value = "";
  };

  const convert = () => {
    if (!svgSrc.trim()) { setError("Paste or upload SVG first"); return; }
    try {
      const s = parseFloat(scale) || 2;
      const blob = new Blob([svgSrc], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const w = (img.naturalWidth || 300) * s;
        const h = (img.naturalHeight || 300) * s;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        setPreview(canvas.toDataURL("image/png"));
        setError("");
      };
      img.onerror = () => { setError("Invalid SVG"); URL.revokeObjectURL(url); };
      img.src = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    }
  };

  const download = () => {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    a.download = "image.png";
    a.click();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>SVG → PNG</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="w-32 space-y-2">
              <Label>Scale</Label>
              <Input type="number" value={scale} onChange={(e) => setScale(e.target.value)} min={0.5} max={8} step={0.5} className="font-mono" />
            </div>
            <span className="text-xs text-muted-foreground pb-2">Higher = more pixels (2× recommended)</span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".svg" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />Upload .svg
              </Button>
              <span className="text-xs text-muted-foreground">or paste SVG below</span>
            </div>
            <Textarea
              placeholder="<svg xmlns='http://www.w3.org/2000/svg' ...>...</svg>"
              value={svgSrc}
              onChange={(e) => { setSvgSrc(e.target.value); setPreview(null); setError(""); }}
              className="min-h-[150px] font-mono text-sm"
            />
          </div>

          {error && <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-2">
            <Button onClick={convert} className="flex-1">Convert to PNG</Button>
            {preview && <Button onClick={download} variant="outline"><Download className="h-4 w-4 mr-2" />Download</Button>}
          </div>

          {preview && (
            <div className="border rounded-md overflow-auto bg-muted/30 p-2">
              <img src={preview} alt="PNG preview" style={{ maxWidth: "100%" }} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
