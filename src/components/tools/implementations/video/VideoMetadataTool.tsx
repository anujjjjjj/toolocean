import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileVideo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoMeta {
  name: string;
  size: number;
  type: string;
  duration: number;
  width: number;
  height: number;
  lastModified: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}.${ms.toString().padStart(3, "0")}s`);
  return parts.join(" ");
}

export function VideoMetadataTool() {
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) {
      toast({ title: "Invalid file", description: "Please select a video file", variant: "destructive" });
      return;
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setMeta(null);

    const video = videoRef.current!;
    video.src = url;
    video.onloadedmetadata = () => {
      setMeta({
        name: file.name,
        size: file.size,
        type: file.type,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        lastModified: file.lastModified,
      });
    };
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const rows = meta
    ? [
        { label: "File name", value: meta.name },
        { label: "File size", value: formatBytes(meta.size) },
        { label: "MIME type", value: meta.type },
        { label: "Duration", value: formatDuration(meta.duration) },
        { label: "Resolution", value: `${meta.width} × ${meta.height} px` },
        {
          label: "Aspect ratio",
          value: (() => {
            const g = (a: number, b: number): number => (b === 0 ? a : g(b, a % b));
            const d = g(meta.width, meta.height);
            return `${meta.width / d}:${meta.height / d}`;
          })(),
        },
        {
          label: "Last modified",
          value: new Date(meta.lastModified).toLocaleString(),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <video ref={videoRef} className="hidden" muted playsInline preload="metadata" />

      {!meta ? (
        <div
          className="border-2 border-dashed border-muted rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileVideo className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click to upload a video file</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Video Metadata</h3>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Load another
            </Button>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {rows.map(({ label, value }, i) => (
                  <tr key={label} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="px-4 py-2.5 font-medium text-muted-foreground w-36 shrink-0">{label}</td>
                    <td className="px-4 py-2.5 font-mono break-all">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
