import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Upload, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Base64Tool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mode === "encode") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(result);
        let binary = "";
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        setOutput(btoa(binary));
        setInput(`[File: ${file.name} (${file.size} bytes)]`);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => { setInput(ev.target?.result as string); setOutput(""); };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  const process = () => {
    if (!input.trim()) { setOutput(""); return; }
    try {
      if (mode === "encode") {
        setOutput(btoa(unescape(encodeURIComponent(input))));
      } else {
        setOutput(decodeURIComponent(escape(atob(input.trim()))));
      }
    } catch {
      toast({ title: "Error", description: "Invalid Base64 input", variant: "destructive" });
    }
  };

  const swap = () => {
    setMode(mode === "encode" ? "decode" : "encode");
    setInput(output);
    setOutput("");
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Base64 Encoder / Decoder
            <Button variant="outline" size="sm" onClick={swap}>
              <ArrowUpDown className="h-4 w-4 mr-1" />
              {mode === "encode" ? "Encode" : "Decode"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload file
              </Button>
              <span className="text-xs text-muted-foreground">
                {mode === "encode" ? "Any file" : ".txt"}, or paste below
              </span>
            </div>
            <Textarea
              placeholder={mode === "encode" ? "Paste text to encode..." : "Paste Base64 string to decode..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[160px] font-mono text-sm"
            />
          </div>
          <Button onClick={process} className="w-full">
            {mode === "encode" ? "Encode to Base64" : "Decode from Base64"}
          </Button>
          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Output</span>
                <Button variant="outline" size="sm" onClick={copy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <Textarea value={output} readOnly className="min-h-[160px] font-mono text-sm bg-muted/50" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
