import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Upload, Download, Play, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { audioBufferToWavBlob } from "@/lib/audioUtils";

export function AudioCutterTool() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  const loadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Invalid file",
        description: "Please select an audio file (MP3, WAV, OGG, etc.)",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = new AudioContext();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      setAudioBuffer(buffer);
      setDuration(buffer.duration);
      setStartTime(0);
      setEndTime(buffer.duration);
      setAudioFile(file);
    } catch (err) {
      toast({
        title: "Failed to load audio",
        description: err instanceof Error ? err.message : "Could not decode audio file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  };

  const handleCut = () => {
    if (!audioBuffer) return;

    setIsProcessing(true);
    try {
      const ctx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        (endTime - startTime) * audioBuffer.sampleRate,
        audioBuffer.sampleRate
      );

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0, startTime, endTime);

      ctx.startRendering().then((trimmedBuffer) => {
        const blob = audioBufferToWavBlob(trimmedBuffer);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = (audioFile?.name ?? "audio").replace(/\.[^.]+$/, "-trimmed.wav");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "Download ready", description: "Trimmed audio saved as WAV" });
        setIsProcessing(false);
      });
    } catch (err) {
      toast({
        title: "Cut failed",
        description: err instanceof Error ? err.message : "Could not process audio",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handlePlayPreview = () => {
    if (!audioBuffer) return;

    if (isPlaying && sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // Already stopped
      }
      setIsPlaying(false);
      return;
    }

    const ctx = audioContextRef.current ?? new AudioContext();
    audioContextRef.current = ctx;

    const source = ctx.createBufferSource();
    sourceNodeRef.current = source;
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(0, startTime, endTime);
    source.onended = () => {
      sourceNodeRef.current = null;
      setIsPlaying(false);
    };

    setIsPlaying(true);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Load Audio</CardTitle>
        </CardHeader>
        <CardContent>
          <input type="file" accept="audio/*" className="hidden" id="audio-cutter-input" onChange={handleFileSelect} />
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => document.getElementById("audio-cutter-input")?.click()}
          >
            {isProcessing ? (
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            ) : audioFile ? (
              <div>
                <p className="font-medium">{audioFile.name}</p>
                <p className="text-sm text-muted-foreground">{formatTime(duration)}</p>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p>Click or drag to upload audio</p>
                <p className="text-sm text-muted-foreground">MP3, WAV, OGG, M4A supported</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {audioBuffer && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Trim Range</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatTime(startTime)} – {formatTime(endTime)} (of {formatTime(duration)})
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Start: {formatTime(startTime)}</Label>
                <Slider
                  value={[startTime]}
                  min={0}
                  max={duration}
                  step={0.1}
                  onValueChange={([v]) => setStartTime(Math.min(v, endTime - 0.1))}
                />
              </div>
              <div className="space-y-2">
                <Label>End: {formatTime(endTime)}</Label>
                <Slider
                  value={[endTime]}
                  min={0}
                  max={duration}
                  step={0.1}
                  onValueChange={([v]) => setEndTime(Math.max(v, startTime + 0.1))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePlayPreview} variant="outline">
                  {isPlaying ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isPlaying ? "Stop" : "Preview"}
                </Button>
                <Button onClick={handleCut} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Download Trimmed (WAV)
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
