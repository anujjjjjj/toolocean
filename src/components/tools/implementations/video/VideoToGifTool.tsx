import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// @ts-expect-error no types for gif-encoder-2
import GIFEncoder from "gif-encoder-2";

export function VideoToGifTool() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [gifDuration, setGifDuration] = useState(3);
  const [fps, setFps] = useState(10);
  const [scale, setScale] = useState(320);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
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
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    setStartTime(0);
    setGifDuration(Math.min(3, v.duration));
  };

  const convertToGif = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const totalFrames = Math.floor(gifDuration * fps);
    if (totalFrames < 1) return;

    setConverting(true);
    setProgress(0);

    try {
      // Determine dimensions maintaining aspect ratio
      const aspectRatio = video.videoHeight / video.videoWidth;
      const w = scale;
      const h = Math.round(scale * aspectRatio);

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      const encoder = new GIFEncoder(w, h);
      encoder.setDelay(Math.round(1000 / fps));
      encoder.setRepeat(0); // loop forever
      encoder.start();

      const frameInterval = gifDuration / totalFrames;

      for (let i = 0; i < totalFrames; i++) {
        const targetTime = startTime + i * frameInterval;

        // Seek to frame
        await new Promise<void>((resolve) => {
          video.currentTime = targetTime;
          video.onseeked = () => {
            video.onseeked = null;
            ctx.drawImage(video, 0, 0, w, h);
            encoder.addFrame(ctx);
            resolve();
          };
        });

        setProgress(Math.round(((i + 1) / totalFrames) * 100));
      }

      encoder.finish();
      // Use encoder.out.data directly (plain number array) to avoid Node.js Buffer dependency
      const data = new Uint8Array(encoder.out.data as number[]);
      const blob = new Blob([data], { type: "image/gif" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `output_${startTime.toFixed(1)}s_${gifDuration}s.gif`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: "GIF created", description: `${totalFrames} frames at ${fps} fps` });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to create GIF", variant: "destructive" });
    } finally {
      setConverting(false);
      setProgress(0);
    }
  };

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <canvas ref={canvasRef} className="hidden" />

      {!videoUrl ? (
        <div
          className="border-2 border-dashed border-muted rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click to upload a video file</p>
        </div>
      ) : (
        <div className="space-y-5">
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            className="max-w-full w-full rounded border"
            controls
            muted
            playsInline
          />

          {duration > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start time (s)</Label>
                  <Input
                    type="number"
                    value={startTime}
                    onChange={(e) => setStartTime(clamp(parseFloat(e.target.value) || 0, 0, duration))}
                    min={0}
                    max={duration}
                    step={0.1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>GIF duration (s)</Label>
                  <Input
                    type="number"
                    value={gifDuration}
                    onChange={(e) => setGifDuration(clamp(parseFloat(e.target.value) || 1, 0.5, Math.min(15, duration - startTime)))}
                    min={0.5}
                    max={15}
                    step={0.5}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Frame rate: {fps} fps ({Math.round(gifDuration * fps)} frames)</Label>
                <Slider
                  value={[fps]}
                  onValueChange={([v]) => setFps(v)}
                  min={3}
                  max={24}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Width: {scale}px</Label>
                <Slider
                  value={[scale]}
                  onValueChange={([v]) => setScale(v)}
                  min={120}
                  max={640}
                  step={8}
                />
              </div>

              {converting && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Converting… {progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                <Button onClick={convertToGif} disabled={converting}>
                  {converting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Converting…</>
                  ) : (
                    "Convert to GIF"
                  )}
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={converting}>
                  <Upload className="h-4 w-4 mr-2" />
                  Load another
                </Button>
              </div>

              <div className="flex gap-2 items-start text-xs text-muted-foreground bg-muted/50 rounded p-3">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Frame extraction happens by seeking through the video. Longer durations or higher FPS take more time. Keep GIF duration under 10s for best results.
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
