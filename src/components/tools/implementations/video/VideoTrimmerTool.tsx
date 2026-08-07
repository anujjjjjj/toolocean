import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Scissors, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function VideoTrimmerTool() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [trimming, setTrimming] = useState(false);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    setStartTime(0);
    setEndTime(Math.min(v.duration, 30));
  };

  const handleTrim = () => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const trimDuration = endTime - startTime;
    if (trimDuration <= 0) {
      toast({ title: "Invalid range", description: "End time must be after start time", variant: "destructive" });
      return;
    }

    // Check captureStream support
    if (typeof (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream !== "function") {
      toast({ title: "Not supported", description: "Your browser does not support captureStream(). Please use Chrome or Firefox.", variant: "destructive" });
      return;
    }

    setTrimming(true);
    toast({ title: "Trimming…", description: `Recording ${trimDuration.toFixed(1)}s segment. Please wait.` });

    const stream = (video as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream();
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `trimmed_${startTime.toFixed(1)}-${endTime.toFixed(1)}s.webm`;
      a.click();
      URL.revokeObjectURL(a.href);
      video.pause();
      video.muted = false;
      setTrimming(false);
      toast({ title: "Done", description: "Trimmed video downloaded" });
    };

    video.muted = true;
    video.currentTime = startTime;

    video.onseeked = () => {
      video.onseeked = null;
      recorder.start(100);
      video.play();

      const onTimeUpdate = () => {
        if (video.currentTime >= endTime) {
          video.removeEventListener("timeupdate", onTimeUpdate);
          recorder.stop();
        }
      };
      video.addEventListener("timeupdate", onTimeUpdate);
    };
  };

  const clamp = (v: number) => Math.max(0, Math.min(duration, v));

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {!videoUrl ? (
        <div
          className="border-2 border-dashed border-muted rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click to upload a video file</p>
        </div>
      ) : (
        <div className="space-y-4">
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            className="max-w-full w-full rounded border"
            controls
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
                    onChange={(e) => setStartTime(clamp(parseFloat(e.target.value) || 0))}
                    min={0}
                    max={endTime}
                    step={0.1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End time (s)</Label>
                  <Input
                    type="number"
                    value={endTime}
                    onChange={(e) => setEndTime(clamp(parseFloat(e.target.value) || 0))}
                    min={startTime}
                    max={duration}
                    step={0.1}
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Segment: {(endTime - startTime).toFixed(1)}s &nbsp;/&nbsp; Total: {duration.toFixed(1)}s
              </p>

              <div className="flex gap-3 flex-wrap">
                <Button onClick={handleTrim} disabled={trimming}>
                  <Scissors className="h-4 w-4 mr-2" />
                  {trimming ? "Recording segment…" : "Trim & Download"}
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={trimming}>
                  <Upload className="h-4 w-4 mr-2" />
                  Load another
                </Button>
              </div>

              <div className="flex gap-2 items-start text-xs text-muted-foreground bg-muted/50 rounded p-3">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Trimming plays the segment in real-time using your browser's MediaRecorder API. Output is saved as WebM. Works in Chrome and Firefox.
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
