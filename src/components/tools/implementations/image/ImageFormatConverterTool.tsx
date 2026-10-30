import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { readImageFiles } from "@/lib/image/readImageFiles";
import { markToolSuccess } from "@/lib/toolResult";

const FORMATS = [
  { value: "image/png", label: "PNG" },
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/webp", label: "WebP" },
] as const;

type OutputFormat = (typeof FORMATS)[number]["value"];

export interface ImageFormatConverterPreset {
  /** Output format selected when the tool opens. Landing pages set this, e.g. WebP to JPG. */
  output?: OutputFormat;
}

export function ImageFormatConverterTool({ preset }: { preset?: ImageFormatConverterPreset } = {}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState("converted");
  const [format, setFormat] = useState<OutputFormat>(preset?.output ?? "image/jpeg");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    const { accepted, errors } = await readImageFiles([file]);
    if (!accepted[0]) {
      toast({ title: "Could not read that image", description: errors[0] ?? "Please select an image file", variant: "destructive" });
      return;
    }
    setImageUrl(URL.createObjectURL(accepted[0]));
    setSourceName(accepted[0].name.replace(/\.[^.]+$/, "") || "converted");
  };

  const convertAndDownload = () => {
    if (!imageUrl || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      // JPEG has no alpha. Unpainted canvas pixels would encode as black, so a
      // transparent PNG or WebP is laid on white first.
      if (format === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const ext = format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
      const quality = format === "image/jpeg" || format === "image/webp" ? 0.92 : undefined;
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${sourceName}.${ext}`;
          a.click();
          URL.revokeObjectURL(a.href);
          markToolSuccess(blob);
          toast({ title: "Downloaded", description: `Converted to ${ext.toUpperCase()}` });
        },
        format,
        quality
      );
    };
    img.src = imageUrl;
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline" data-analytics-label="Select Image">
        <Upload className="h-4 w-4 mr-2" />
        Select Image
      </Button>

      {imageUrl && (
        <>
          <div>
            <Label>Output Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <img src={imageUrl} alt="Preview" className="max-h-64 rounded-lg border object-contain" />
          <canvas ref={canvasRef} className="hidden" />
          <Button onClick={convertAndDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download Converted
          </Button>
        </>
      )}
    </div>
  );
}
