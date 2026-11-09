import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { readImageFiles } from "@/lib/image/readImageFiles";
import {
  FORMAT_ACCEPT,
  FORMAT_LABEL,
  FORMAT_MIME,
  rejectionReason,
  sniffImageFile,
  summarizeBatch,
  type KnownFormat,
} from "@/lib/image/sniffImageFormat";
import { markToolSuccess } from "@/lib/toolResult";

const FORMATS = [
  { value: "image/png", label: "PNG" },
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/webp", label: "WebP" },
] as const;

type OutputFormat = (typeof FORMATS)[number]["value"];

export interface ImageFormatConverterPreset {
  /** The only format accepted, decided by the file's first bytes. Landing pages set this, e.g. WebP to JPG. */
  input: KnownFormat;
  /** Fixed output format. With a preset the format menu is hidden. */
  output: OutputFormat;
}

/**
 * Safari's canvas has no WebP encoder and returns a PNG instead, so ask once
 * with a 1x1 canvas rather than trusting the requested type.
 */
function probeWebpEncoding(done: (supported: boolean) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  canvas.toBlob((blob) => done(blob?.type === "image/webp"), "image/webp");
}

export function ImageFormatConverterTool({ preset }: { preset?: ImageFormatConverterPreset } = {}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState("converted");
  const [chosenFormat, setFormat] = useState<OutputFormat>("image/jpeg");
  const format = preset?.output ?? chosenFormat;
  const ext = format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
  const [status, setStatus] = useState<{ text: string; rejected: boolean } | null>(null);
  const [webpSupported, setWebpSupported] = useState<boolean | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const webpOffered = !preset || preset.output === "image/webp";

  useEffect(() => {
    let active = true;
    probeWebpEncoding((supported) => {
      if (active) setWebpSupported(supported);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    // Bytes first: a preset page takes its format whatever the MIME type or
    // extension says, and refuses anything else. Empty files fall through so
    // readImageFiles can say they are empty.
    const found = await sniffImageFile(file);
    const rejected: string[] = [];
    let candidate: File | null = file;
    if (preset && file.size > 0 && found !== preset.input) {
      rejected.push(rejectionReason(file.name, found, preset.input));
      candidate = null;
    } else if (found !== "other" && file.type !== FORMAT_MIME[found]) {
      // A blank or odd MIME type would fail readImageFiles; the bytes already decided.
      candidate = new File([file], file.name, { type: FORMAT_MIME[found], lastModified: file.lastModified });
    }

    const { accepted, errors } = candidate ? await readImageFiles([candidate]) : { accepted: [], errors: [] };
    const problems = [...rejected, ...errors];
    setStatus({ text: summarizeBatch(accepted.length, problems), rejected: problems.length > 0 });

    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (!accepted[0]) {
      setImageUrl(null);
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
      const quality = format === "image/jpeg" || format === "image/webp" ? 0.92 : undefined;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            toast({ title: "Could not create the file in this browser", variant: "destructive" });
            return;
          }
          // Without a WebP encoder the browser hands back a PNG. Saving that as
          // .webp would mislabel the file, so nothing is downloaded.
          if (format === "image/webp" && blob.type !== "image/webp") {
            toast({
              title: "This browser can't create WebP files",
              description: "It returned a different format, so nothing was downloaded. Choose PNG or JPEG, or try Chrome, Edge or Firefox.",
              variant: "destructive",
            });
            return;
          }
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
      {webpOffered && webpSupported === false && (
        <p role="note" className="text-sm text-muted-foreground">
          This browser can't create WebP files, so WebP output is unavailable here. Try Chrome, Edge or Firefox, or use{" "}
          <Link to="/png-to-jpg" className="underline underline-offset-2">PNG to JPG</Link>.
        </p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={preset ? FORMAT_ACCEPT[preset.input] : "image/*"}
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline" data-analytics-label="Select Image">
        <Upload className="h-4 w-4 mr-2" />
        {preset ? `Choose ${FORMAT_LABEL[preset.input]}` : "Select Image"}
      </Button>

      <div role="status" aria-live="polite" className="text-sm" data-batch-status>
        {status && (
          <p className={status.rejected ? "text-destructive" : "text-muted-foreground"}>
            {status.text}
            {preset && status.rejected && (
              <>
                {" "}For other formats, use the{" "}
                <Link to="/image-format-converter" className="underline underline-offset-2">image format converter</Link>.
              </>
            )}
          </p>
        )}
      </div>

      {imageUrl && (
        <>
          {!preset && (
            <div>
              <Label>Output Format</Label>
              <Select value={chosenFormat} onValueChange={(v) => setFormat(v as OutputFormat)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value} disabled={f.value === "image/webp" && webpSupported === false}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <img src={imageUrl} alt="Preview" className="max-h-64 rounded-lg border object-contain" />
          <canvas ref={canvasRef} className="hidden" />
          <Button onClick={convertAndDownload} data-analytics-label="Download Converted">
            <Download className="h-4 w-4 mr-2" />
            {preset ? `Download ${ext.toUpperCase()}` : "Download Converted"}
          </Button>
        </>
      )}
    </div>
  );
}
