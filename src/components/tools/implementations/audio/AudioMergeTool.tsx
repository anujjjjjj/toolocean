import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, X, GripVertical, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { audioBufferToWavBlob } from "@/lib/audioUtils";

interface AudioFile {
  id: string;
  file: File;
  buffer: AudioBuffer;
}

export function AudioMergeTool() {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadFiles = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsProcessing(true);
    const ctx = new AudioContext();
    const loaded: AudioFile[] = [];

    for (const file of Array.from(selectedFiles)) {
      if (!file.type.startsWith("audio/")) {
        toast({ title: "Skipped", description: `${file.name} is not an audio file`, variant: "destructive" });
        continue;
      }
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        loaded.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          buffer,
        });
      } catch (err) {
        toast({
          title: "Failed to load",
          description: `Could not decode ${file.name}`,
          variant: "destructive",
        });
      }
    }

    setFiles((prev) => [...prev, ...loaded]);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const merge = async () => {
    if (files.length === 0) {
      toast({ title: "No files", description: "Add audio files to merge", variant: "destructive" });
      return;
    }

    if (files.length === 1) {
      toast({ title: "Only one file", description: "Add at least one more file to merge", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const first = files[0].buffer;
      const sampleRate = first.sampleRate;
      const numChannels = first.numberOfChannels;

      let totalLength = 0;
      for (const { buffer } of files) {
        if (buffer.sampleRate !== sampleRate || buffer.numberOfChannels !== numChannels) {
          toast({
            title: "Incompatible formats",
            description: "All files must have the same sample rate and channel count. First file: " + sampleRate + " Hz, " + numChannels + " ch.",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }
        totalLength += buffer.length;
      }

      const ctx = new OfflineAudioContext(numChannels, totalLength, sampleRate);
      let offset = 0;

      for (const { buffer } of files) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0, 0, buffer.duration);
        offset += buffer.length;
      }

      const mergedBuffer = await ctx.startRendering();
      const blob = audioBufferToWavBlob(mergedBuffer);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged-audio.wav";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Merge complete", description: "merged-audio.wav downloaded" });
    } catch (err) {
      toast({
        title: "Merge failed",
        description: err instanceof Error ? err.message : "Could not merge audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDuration = (buffer: AudioBuffer) => {
    const secs = buffer.duration;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Audio Files
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={(e) => loadFiles(e.target.files)}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <Button onClick={merge} disabled={files.length < 2 || isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Merge & Download
              </Button>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Files are merged in order. Drag to reorder (future). Same sample rate & channels required.</p>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground cursor-pointer hover:border-primary/50"
              onClick={() => fileInputRef.current?.click()}
            >
              Click to upload audio files to merge
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {files.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-lg border p-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.file.name}</p>
                    <p className="text-sm text-muted-foreground">{formatDuration(item.buffer)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(item.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
