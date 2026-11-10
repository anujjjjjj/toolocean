import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { KILOBYTE, formatBytes, parseSize } from "@/lib/targetSize/parseSize";
import { markToolSuccess } from "@/lib/toolResult";
import type { TargetMime } from "@/lib/targetSize/types";
import { readImageFiles } from "@/lib/image/readImageFiles";
import {
  byteCount,
  createRunGuard,
  decideImageOutcome,
  formatChangeLabel,
  planImageDelivery,
  sniffImageInput,
  type ImageDeliveryLine,
  type ImageOutcome,
  type ImageOutputFormat,
} from "@/lib/targetOutcome";

const TARGETS = [
  { label: "10 KB", bytes: 10 * KILOBYTE },
  { label: "20 KB", bytes: 20 * KILOBYTE },
  { label: "50 KB", bytes: 50 * KILOBYTE },
  { label: "100 KB", bytes: 100 * KILOBYTE },
  { label: "200 KB", bytes: 200 * KILOBYTE },
  { label: "500 KB", bytes: 500 * KILOBYTE },
  { label: "1 MB", bytes: KILOBYTE * KILOBYTE },
];

interface ImageNote {
  name: string;
  outcome: ImageOutcome;
  originalBytes: number;
  outputBytes: number;
  /** Null in JPEG-quality mode, which has no ceiling. */
  targetBytes: number | null;
  width: number;
  height: number;
  formatChange: string | null;
  paddingBytes: number;
}

const linkClass = "text-primary underline";

async function sniffFile(file: File) {
  return sniffImageInput(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
}

function saveBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function ResizeFirst() {
  return (
    <>
      resize it to the form's pixel size with the <Link className={linkClass} to="/image-resizer">Image Resizer</Link>
    </>
  );
}

function ImageNoteLine({ note }: { note: ImageNote }) {
  const { outcome, originalBytes, outputBytes, targetBytes, width, height, formatChange, paddingBytes } = note;
  const headline = [
    `${note.name}: ${byteCount(originalBytes)} → ${byteCount(outputBytes)}`,
    targetBytes != null ? `target ${byteCount(targetBytes)}` : null,
    `${width}×${height} px`,
    formatChange,
  ]
    .filter(Boolean)
    .join(" · ");
  const pad = paddingBytes > 0 ? ` ${paddingBytes} bytes are JPEG comment padding so the file clears the minimum.` : "";
  let body: React.ReactNode;
  switch (outcome.kind) {
    case "fit":
      body = `Under the target. Downloaded.${pad}`;
      break;
    case "fit-scaled":
      body = (
        <>
          Under the target after the tool reduced the pixel size to {width}×{height}. Downloaded.{pad} To choose the pixel size yourself,{" "}
          <ResizeFirst /> first, then compress.
        </>
      );
      break;
    case "converted-larger":
      body = `Larger than the original, because it was converted to the format you picked. Downloaded.${pad}`;
      break;
    case "smaller":
      body = "Smaller than the original. Downloaded.";
      break;
    case "miss":
      body = (
        <>
          Still over the target: the smallest attempt, at {width}×{height} and the lowest quality the tool tries, is {byteCount(outputBytes)}. Not
          downloaded. Next: <Link className={linkClass} to="/image-crop">crop</Link> it, <ResizeFirst />, or check the form's limit.
        </>
      );
      break;
    case "not-smaller":
      body = `Your original is already ${byteCount(originalBytes)}${targetBytes != null ? ", under the target," : ""} and the new copy was not smaller, so nothing was downloaded. Upload the original as it is.`;
      break;
    case "format-unsupported":
      body = "This browser could not save WebP and returned a different format, so nothing was saved. Choose JPEG and try again.";
      break;
    default: {
      const _exhaustive: never = outcome;
      return _exhaustive;
    }
  }
  return (
    <li>
      <span className="font-medium text-foreground">{headline}</span>
      <span className="block">{body}</span>
    </li>
  );
}

function ImageNotes({ notes, summary }: { notes: ImageNote[]; summary: string | null }) {
  return (
    <div className="space-y-2 text-sm text-muted-foreground" role="status">
      {summary && <p>{summary}</p>}
      <ul className="space-y-2">
        {notes.map((note, index) => (
          <ImageNoteLine key={`${note.name}-${index}`} note={note} />
        ))}
      </ul>
    </div>
  );
}

export function ImageCompressorTool({ preset }: { preset?: { targetBytes: number } } = {}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [mode, setMode] = useState<"quality" | "exact">(preset ? "exact" : "quality");
  const [targetBytes, setTargetBytes] = useState(preset?.targetBytes ?? 100 * KILOBYTE);
  const [customSize, setCustomSize] = useState("");
  const [minSize, setMinSize] = useState("");
  const [mime, setMime] = useState<TargetMime>("image/jpeg");
  // Only a press on JPEG or WebP is a choice. The default JPEG is not.
  const [formatExplicit, setFormatExplicit] = useState(false);
  const [notes, setNotes] = useState<ImageNote[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // State updates land a render late; the guard stops a second click starting a second run.
  const [run] = useState(createRunGuard);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const presetTarget = preset?.targetBytes;
  useEffect(() => {
    if (presetTarget == null) return;
    setMode("exact");
    setTargetBytes(presetTarget);
  }, [presetTarget]);

  const switchMode = (next: "quality" | "exact") => {
    setMode(next);
    setNotes(null);
    setSummary(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = [...(e.target.files ?? [])];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (run.busy()) {
      toast({ title: "Still working", description: "Wait for the current file to finish before choosing another." });
      return;
    }
    const { accepted, errors } = await readImageFiles(selected);
    // A run can start while the read is pending; don't swap its input mid-run.
    if (run.busy()) {
      toast({ title: "Still working", description: "Wait for the current file to finish before choosing another." });
      return;
    }
    if (errors.length) {
      toast({ title: "Could not read an image", description: errors.join(" "), variant: "destructive" });
    }
    if (!accepted.length) return;
    run.bump();
    setFiles(accepted);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(accepted[0]);
    });
    setNotes(null);
    setSummary(null);
  };

  /** Runs one job at a time, and reports a thrown error instead of failing silently. */
  const guarded = async (job: () => Promise<void>) => {
    if (!run.tryStart()) return;
    setBusy(true);
    setNotes(null);
    setSummary(null);
    try {
      await job();
    } catch (error) {
      toast({
        title: "Compression failed",
        description: error instanceof Error ? error.message : "An error occurred while compressing the image.",
        variant: "destructive",
      });
    } finally {
      run.finish();
      setBusy(false);
    }
  };

  const compressQuality = async () => {
    const file = files[0];
    const canvas = canvasRef.current;
    if (!file || !canvas) return;
    const token = run.token();
    const inputFormat = await sniffFile(file);
    const bitmap = await createImageBitmap(file);
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      throw new Error("Could not get a 2D canvas context.");
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error("The browser could not encode a JPEG.");
    const outcome = decideImageOutcome({
      mode: "quality",
      originalBytes: file.size,
      outputBytes: blob.size,
      inputFormat,
      outputFormat: "jpeg",
      formatExplicit: false,
    });
    if (!run.isCurrent(token)) return;
    setNotes([
      {
        name: file.name,
        outcome,
        originalBytes: file.size,
        outputBytes: blob.size,
        targetBytes: null,
        width: canvas.width,
        height: canvas.height,
        formatChange: formatChangeLabel({ input: inputFormat, output: "jpeg" }),
        paddingBytes: 0,
      },
    ]);
    if (!outcome.success) {
      toast({ title: "Nothing downloaded", description: `The original is already ${byteCount(file.size)}. Upload it as it is.` });
      return;
    }
    saveBlob(blob, `compressed-${Math.round(quality * 100)}.jpg`);
    toast({ title: "Downloaded", description: `${byteCount(file.size)} → ${byteCount(blob.size)}` });
    markToolSuccess(blob);
  };

  const compressExact = async () => {
    if (!files.length) return;
    const minBytes = minSize.trim() ? parseSize(minSize) : undefined;
    if (minSize.trim() && !minBytes) {
      toast({ title: "Unrecognised minimum", description: "Use KB, or a plain number of bytes. 1 KB = 1024 bytes.", variant: "destructive" });
      return;
    }
    if (minBytes && minBytes > targetBytes) {
      toast({ title: "Minimum is above the target", description: "The floor has to be smaller than the ceiling.", variant: "destructive" });
      return;
    }
    const token = run.token();
    const { encodeImageToTarget } = await import("@/lib/targetSize/encodeImageToTarget");
    const outputFormat: ImageOutputFormat = mime === "image/webp" ? "webp" : "jpeg";
    const batch = files.length > 1;
    const lines: ImageNote[] = [];
    const outputs: ImageDeliveryLine[] = [];
    const skipped: string[] = [];
    for (const file of files) {
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(file);
      } catch {
        skipped.push(`${file.name} was skipped because it could not be decoded.`);
        continue;
      }
      const inputFormat = await sniffFile(file);
      let result: Awaited<ReturnType<typeof encodeImageToTarget>>;
      try {
        result = await encodeImageToTarget(bitmap, { targetBytes, minBytes: minBytes ?? undefined, mime });
      } finally {
        bitmap.close();
      }
      const outcome = decideImageOutcome({
        mode: "exact",
        originalBytes: file.size,
        outputBytes: result.bytes.byteLength,
        targetBytes,
        withinTarget: result.withinTarget,
        scale: result.scale,
        inputFormat,
        outputFormat,
        // The browser may ignore the requested type, e.g. PNG bytes when WebP is unsupported.
        actualFormat: sniffImageInput(result.bytes.subarray(0, 12)),
        formatExplicit,
      });
      lines.push({
        name: file.name,
        outcome,
        originalBytes: file.size,
        outputBytes: result.bytes.byteLength,
        targetBytes,
        width: result.width,
        height: result.height,
        formatChange: formatChangeLabel({ input: inputFormat, output: outputFormat }),
        paddingBytes: result.paddingBytes,
      });
      outputs.push({ name: file.name, outcome, bytes: result.bytes, format: outputFormat });
    }
    if (!run.isCurrent(token)) return;
    if (skipped.length) {
      toast({ title: "Skipped a file", description: skipped.join(" "), variant: "destructive" });
    }
    if (!lines.length) return;
    setNotes(lines);
    const plan = planImageDelivery(outputs, { batch });
    if (batch) {
      const undecodable = skipped.length ? ` ${skipped.length} could not be decoded and were skipped.` : "";
      setSummary(
        `${plan.files.length} of ${files.length} selected files went into the ZIP.${undecodable} Files that missed the target, were not smaller or came back in another format are listed below and were left out.`,
      );
    }

    if (plan.kind === "none") {
      toast({ title: plan.toastTitle, description: "No file was saved. The note above the button says why." });
      return;
    }

    let saved: Blob;
    if (plan.kind === "zip") {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const item of plan.files) zip.file(item.name, item.bytes);
      saved = await zip.generateAsync({ type: "blob" });
      saveBlob(saved, "compressed-images.zip");
    } else {
      saved = new Blob([plan.files[0].bytes], { type: mime });
      saveBlob(saved, plan.files[0].name);
    }
    if (plan.signal) markToolSuccess(saved);
    toast({
      title: plan.toastTitle,
      description: plan.kind === "zip" ? `${plan.files.length} of ${files.length} files.` : `${byteCount(lines[0].originalBytes)} → ${byteCount(lines[0].outputBytes)}`,
    });
  };

  const working = (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Working…
    </>
  );

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={busy} data-analytics-label="image-select">
        <Upload className="h-4 w-4 mr-2" />
        Select Image
      </Button>

      <div className="flex gap-2">
        <Button type="button" size="sm" variant={mode === "quality" ? "default" : "outline"} data-analytics-label="image-mode-quality" disabled={busy} onClick={() => switchMode("quality")}>
          JPEG quality
        </Button>
        <Button type="button" size="sm" variant={mode === "exact" ? "default" : "outline"} data-analytics-label="image-mode-exact" disabled={busy} onClick={() => switchMode("exact")}>
          Exact size
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Preset ceilings: <Link className="text-primary underline" to="/compress-image-to-10kb">10 KB</Link>,{" "}
        <Link className="text-primary underline" to="/compress-image-to-20kb">20 KB</Link>,{" "}
        <Link className="text-primary underline" to="/compress-image-to-50kb">50 KB</Link>,{" "}
        <Link className="text-primary underline" to="/compress-image-to-100kb">100 KB</Link>,{" "}
        <Link className="text-primary underline" to="/compress-image-to-200kb">200 KB</Link>. 1 KB = 1024 bytes.
      </p>

      {files.length > 0 && mode === "quality" && (
        <>
          <div className="space-y-4">
            <Label>Quality: {Math.round(quality * 100)}%</Label>
            <Slider value={[quality]} onValueChange={([v]) => setQuality(v)} min={0.1} max={1} step={0.05} />
          </div>
          {previewUrl && <img src={previewUrl} alt="Preview" className="max-h-64 rounded-lg border object-contain" />}
          <p className="text-sm text-muted-foreground">
            Original size: {formatBytes(files[0].size)}. This mode always writes JPEG, and a copy that is not smaller than the original is not downloaded.
          </p>
          <canvas ref={canvasRef} className="hidden" />
          {notes && <ImageNotes notes={notes} summary={summary} />}
          <Button onClick={() => guarded(compressQuality)} disabled={busy} data-analytics-label="image-quality-download">
            {busy ? (
              working
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Compressed (JPEG)
              </>
            )}
          </Button>
        </>
      )}

      {files.length > 0 && mode === "exact" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            1 KB = 1024 bytes. Transparency is flattened onto white. A JPEG that would land under the optional minimum is padded with comment bytes, and that padding is stated with the result. WebP is not padded. A file that misses the target, or comes out no smaller than the original, is not downloaded.
          </p>
          <p className="text-sm">{files.length} file{files.length === 1 ? "" : "s"} selected{files.length > 1 ? ". The ones that land under the target download as one ZIP." : "."}</p>
          <div className="flex flex-wrap gap-2">
            {TARGETS.map((item) => (
              <Button
                key={item.bytes}
                type="button"
                size="sm"
                variant={targetBytes === item.bytes ? "default" : "outline"}
                data-analytics-label={`image-target-${item.label.replace(/\s+/g, "-").toLowerCase()}`}
                disabled={busy}
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
              disabled={busy}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              data-analytics-label="image-target-custom"
              disabled={busy}
              onClick={() => {
                const parsed = parseSize(customSize);
                if (!parsed) {
                  toast({ title: "Unrecognised size", description: "Use KB or MB, or a plain number of bytes. 1 KB = 1024 bytes.", variant: "destructive" });
                  return;
                }
                setTargetBytes(parsed);
              }}
            >
              Use
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mime === "image/jpeg" ? "default" : "outline"}
              data-analytics-label="image-mime-jpeg"
              disabled={busy}
              onClick={() => {
                setMime("image/jpeg");
                setFormatExplicit(true);
              }}
            >
              JPEG
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mime === "image/webp" ? "default" : "outline"}
              data-analytics-label="image-mime-webp"
              disabled={busy}
              onClick={() => {
                setMime("image/webp");
                setFormatExplicit(true);
              }}
            >
              WebP
            </Button>
          </div>
          <div>
            <Label htmlFor="min-kb">Optional minimum (JPEG padding only)</Label>
            <input
              id="min-kb"
              value={minSize}
              onChange={(event) => setMinSize(event.target.value)}
              placeholder="e.g. 20 KB"
              disabled={busy}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            />
          </div>
          {notes && <ImageNotes notes={notes} summary={summary} />}
          <Button onClick={() => guarded(compressExact)} disabled={busy} data-analytics-label="image-exact-size">
            {busy ? (
              working
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {files.length > 1 ? "Download ZIP" : "Download exact size"}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
