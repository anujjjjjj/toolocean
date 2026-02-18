import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import pako from "pako";

export function GzipDecompressTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const decompress = () => {
    try {
      const binary = atob(input.replace(/\s/g, ""));
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const decompressed = pako.ungzip(bytes);
      const text = new TextDecoder().decode(decompressed);
      setOutput(text);
      toast({ title: "Decompressed", description: "Data restored" });
    } catch {
      toast({ title: "Error", description: "Could not decompress. Check input.", variant: "destructive" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(buf);
      const base64 = btoa(String.fromCharCode(...bytes));
      setInput(base64);
      toast({ title: "Loaded", description: file.name });
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept=".gz,application/gzip" className="hidden" onChange={handleFileSelect} />
      <div className="flex gap-4">
        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Load .gz File
        </Button>
      </div>
      <div>
        <Label>Base64 Gzip Data (or paste)</Label>
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={6} className="font-mono text-sm mt-1" />
      </div>
      <Button onClick={decompress} disabled={!input.trim()}>
        Decompress
      </Button>
      {output && (
        <div>
          <Label>Decompressed Output</Label>
          <Textarea value={output} readOnly rows={10} className="font-mono text-sm mt-1" />
        </div>
      )}
    </div>
  );
}
