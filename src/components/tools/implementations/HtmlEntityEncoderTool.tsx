import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Upload, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

const REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(ENTITIES).map(([k, v]) => [v, k])
);

function encode(text: string): string {
  return text.replace(/[&<>"'`=/]/g, (c) => ENTITIES[c] || c);
}

function decode(text: string): string {
  return text
    .replace(/&amp;|&lt;|&gt;|&quot;|&#x27;|&#x2F;|&#x60;|&#x3D;/g, (e) => REVERSE[e] || e)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export function HtmlEntityEncoderTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setInput(ev.target?.result as string); setOutput(""); };
    reader.readAsText(file);
    e.target.value = "";
  };

  const process = () => {
    if (!input) { setOutput(""); return; }
    setOutput(mode === "encode" ? encode(input) : decode(input));
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
            HTML Entity Encoder / Decoder
            <Button variant="outline" size="sm" onClick={swap}>
              <ArrowUpDown className="h-4 w-4 mr-1" />
              {mode === "encode" ? "Encode" : "Decode"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".html,.htm,.txt" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose file
              </Button>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              placeholder={mode === "encode" ? "Paste text with special characters..." : "Paste HTML with entities to decode..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[160px] font-mono text-sm"
            />
          </div>
          <Button onClick={process} className="w-full">
            {mode === "encode" ? "Encode to HTML Entities" : "Decode HTML Entities"}
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
