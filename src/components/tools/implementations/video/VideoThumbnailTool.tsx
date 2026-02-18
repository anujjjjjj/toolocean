import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function VideoThumbnailTool() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) {
      toast({ title: "Invalid file", description: "Please select a video file", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setTimestamp(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (v) {
      setDuration(v.duration);
      setTimestamp(0);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    video.currentTime = timestamp;
    video.onseeked = () => {
      const canvas = canvasRef.current!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `thumbnail-${Math.floor(timestamp)}s.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast({ title: "Downloaded", description: "Thumbnail saved" });
      });
    };
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        Select Video
      </Button>

      {videoUrl && (
        <>
          <div className="space-y-2">
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={handleLoadedMetadata}
              className="max-w-full rounded border"
              controls
              muted
              playsInline
            />
            <p className="text-sm text-muted-foreground">Duration: {duration.toFixed(1)}s</p>
          </div>
          <div className="space-y-2">
            <Label>Timestamp (seconds)</Label>
            <Input
              type="number"
              value={timestamp}
              onChange={(e) => setTimestamp(parseFloat(e.target.value) || 0)}
              min={0}
              max={duration}
              step={0.5}
            />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <Button onClick={captureFrame}>
            <Download className="h-4 w-4 mr-2" />
            Capture & Download Thumbnail
          </Button>
        </>
      )}
    </div>
  );
}
