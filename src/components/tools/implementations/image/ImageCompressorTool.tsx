import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { KILOBYTE, formatBytes, parseSize } from "@/lib/targetSize/parseSize";
import { markToolSuccess } from "@/lib/toolResult";
import type { TargetMime } from "@/lib/targetSize/types";

const TARGETS = [
  { label: "20 KB", bytes: 20 * KILOBYTE },
  { label: "50 KB", bytes: 50 * KILOBYTE },
  { label: "100 KB", bytes: 100 * KILOBYTE },
  { label: "200 KB", bytes: 200 * KILOBYTE },
  { label: "500 KB", bytes: 500 * KILOBYTE },
  { label: "1 MB", bytes: KILOBYTE * KILOBYTE },
];

export function ImageCompressorTool({ preset }: { preset?: { targetBytes: number } } = {}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [mode, setMode] = useState<"quality" | "exact">(preset ? "exact" : "quality");
  const [targetBytes, setTargetBytes] = useState(preset?.targetBytes ?? 100 * KILOBYTE);
  const [customSize, setCustomSize] = useState("");
  const [minSize, setMinSize] = useState("");
  const [mime, setMime] = useState<TargetMime>("image/jpeg");
  const [note, setNote] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!preset) return;
    setMode("exact");
    setTargetBytes(preset.targetBytes);
  }, [preset]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = [...(e.target.files ?? [])].filter((file) => file.type.startsWith("image/"));
    if (!selected.length) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    setFiles(selected);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(selected[0]);
    });
    setNote(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const compressQuality = () => {
    const file = files[0];
    if (!file || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `compressed-${Math.round(quality * 100)}.jpg`;
          a.click();
          URL.revokeObjectURL(a.href);
          const pct = file.size > 0 ? Math.round((1 - blob.size / file.size) * 100) : 0;
          toast({ title: "Downloaded", description: `Compressed (${pct}% smaller)` });
          markToolSuccess();
        },
        "image/jpeg",
        quality,
      );
    };
    img.src = URL.createObjectURL(file);
  };

  const compressExact = async () => {
    if (!files.length) return;
    const minBytes = minSize.trim() ? parseSize(minSize) : undefined;
    if (minSize.trim() && !minBytes) {
      toast({ title: "Unrecognised minimum", description: "Use a number with KB. 1 KB = 1024 bytes.", variant: "destructive" });
      return;
    }
    if (minBytes && minBytes > targetBytes) {
      toast({ title: "Minimum is above the target", description: "The floor has to be smaller than the ceiling.", variant: "destructive" });
      return;
    }
    const { encodeImageToTarget } = await import("@/lib/targetSize/encodeImageToTarget");
    const JSZip = (await import("jszip")).default;
    const zip = files.length > 1 ? new JSZip() : null;
    const notes: string[] = [];
    for (const file of files) {
      const bitmap = await createImageBitmap(file);
      const result = await encodeImageToTarget(bitmap, { targetBytes, minBytes: minBytes ?? undefined, mime });
      bitmap.close();
      const ext = mime === "image/webp" ? "webp" : "jpg";
      const name = file.name.replace(/\.[^.]+$/, "") + `-sized.${ext}`;
      if (zip) zip.file(name, result.bytes);
      else {
        const blob = new Blob([result.bytes], { type: mime });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
      const pad = result.padded ? ` ${result.paddingBytes} bytes are JPEG comment padding so the file clears the minimum.` : "";
      const fit = result.withinTarget ? "within the target" : "still over the target";
      notes.push(`${name}: ${formatBytes(result.bytes.byteLength)}, ${fit}.${pad}`);
    }
    if (zip) {
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "compressed-images.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    }
    setNote(notes.join(" "));
    markToolSuccess();
    toast({ title: files.length > 1 ? "ZIP downloaded" : "Downloaded", description: notes[0] });
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline" data-analytics-label="image-select">
        <Upload className="h-4 w-4 mr-2" />
        Select Image
      </Button>

      <div className="flex gap-2">
        <Button type="button" size="sm" variant={mode === "quality" ? "default" : "outline"} data-analytics-label="image-mode-quality" onClick={() => setMode("quality")}>
          JPEG quality
        </Button>
        <Button type="button" size="sm" variant={mode === "exact" ? "default" : "outline"} data-analytics-label="image-mode-exact" onClick={() => setMode("exact")}>
          Exact size
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Preset ceilings: <Link className="text-primary underline" to="/compress-image-to-20kb">20 KB</Link>,{" "}
        <Link className="text-primary underline" to="/compress-image-to-50kb">50 KB</Link>,{" "}
        <Link className="text-primary underline" to="/compress-image-to-100kb">100 KB</Link>. 1 KB = 1024 bytes.
      </p>

      {files.length > 0 && mode === "quality" && (
        <>
          <div className="space-y-4">
            <Label>Quality: {Math.round(quality * 100)}%</Label>
            <Slider value={[quality]} onValueChange={([v]) => setQuality(v)} min={0.1} max={1} step={0.05} />
          </div>
          {previewUrl && <img src={previewUrl} alt="Preview" className="max-h-64 rounded-lg border object-contain" />}
          <p className="text-sm text-muted-foreground">Original size: {formatBytes(files[0].size)}. This mode always writes JPEG.</p>
          <canvas ref={canvasRef} className="hidden" />
          <Button onClick={compressQuality} data-analytics-label="image-quality-download">
            <Download className="h-4 w-4 mr-2" />
            Download Compressed (JPEG)
          </Button>
        </>
      )}

      {files.length > 0 && mode === "exact" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            1 KB = 1024 bytes. Transparency is flattened onto white. A JPEG that would land under the optional minimum is padded with comment bytes, and that padding is stated with the result. WebP is not padded.
          </p>
          <p className="text-sm">{files.length} file{files.length === 1 ? "" : "s"} selected{files.length > 1 ? ". They download as one ZIP." : "."}</p>
          <div className="flex flex-wrap gap-2">
            {TARGETS.map((item) => (
              <Button
                key={item.bytes}
                type="button"
                size="sm"
                variant={targetBytes === item.bytes ? "default" : "outline"}
                data-analytics-label={`image-target-${item.label.replace(/\s+/g, "-").toLowerCase()}`}
                onClick={() => setTargetBytes(item.bytes)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customSize}
              onChange={(event) => setCustomSize(event.target.value)}
              placeholder="Custom, e.g. 80 KB"
              aria-label="Custom image size"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              data-analytics-label="image-target-custom"
              onClick={() => {
                const parsed = parseSize(customSize);
                if (!parsed) {
                  toast({ title: "Unrecognised size", description: "Use a number with KB or MB. 1 KB = 1024 bytes.", variant: "destructive" });
                  return;
                }
                setTargetBytes(parsed);
              }}
            >
              Use
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant={mime === "image/jpeg" ? "default" : "outline"} data-analytics-label="image-mime-jpeg" onClick={() => setMime("image/jpeg")}>JPEG</Button>
            <Button type="button" size="sm" variant={mime === "image/webp" ? "default" : "outline"} data-analytics-label="image-mime-webp" onClick={() => setMime("image/webp")}>WebP</Button>
          </div>
          <div>
            <Label htmlFor="min-kb">Optional minimum (JPEG padding only)</Label>
            <input
              id="min-kb"
              value={minSize}
              onChange={(event) => setMinSize(event.target.value)}
              placeholder="e.g. 20 KB"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          {note && <p className="text-sm text-muted-foreground">{note}</p>}
          <Button onClick={compressExact} data-analytics-label="image-exact-size">
            <Download className="h-4 w-4 mr-2" />
            {files.length > 1 ? "Download ZIP" : "Download exact size"}
          </Button>
        </div>
      )}
    </div>
  );
}
