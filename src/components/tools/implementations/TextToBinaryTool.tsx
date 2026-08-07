import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Copy, Upload, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type OutputFormat = "binary" | "hex" | "decimal" | "octal";

function textToFormat(text: string, format: OutputFormat): string {
  const bytes = new TextEncoder().encode(text);
  const parts: string[] = [];
  bytes.forEach((b) => {
    if (format === "binary") parts.push(b.toString(2).padStart(8, "0"));
    else if (format === "hex") parts.push(b.toString(16).toUpperCase().padStart(2, "0"));
    else if (format === "decimal") parts.push(b.toString(10));
    else if (format === "octal") parts.push(b.toString(8).padStart(3, "0"));
  });
  return parts.join(" ");
}

function formatToText(encoded: string, format: OutputFormat): string {
  const tokens = encoded.trim().split(/\s+/);
  const bytes: number[] = [];
  for (const t of tokens) {
    if (!t) continue;
    let val: number;
    if (format === "binary") val = parseInt(t, 2);
    else if (format === "hex") val = parseInt(t, 16);
    else if (format === "decimal") val = parseInt(t, 10);
    else val = parseInt(t, 8);
    if (isNaN(val)) throw new Error(`Invalid token: "${t}"`);
    bytes.push(val);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function TextToBinaryTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState<OutputFormat>("binary");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setInput(ev.target?.result as string); setOutput(""); setError(""); };
    reader.readAsText(file);
    e.target.value = "";
  };

  const process = () => {
    if (!input.trim()) { setOutput(""); setError(""); return; }
    try {
      setOutput(direction === "encode" ? textToFormat(input, format) : formatToText(input, format));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
      setOutput("");
    }
  };

  const swap = () => {
    setDirection(direction === "encode" ? "decode" : "encode");
    setInput(output);
    setOutput("");
    setError("");
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  const FORMAT_LABELS: Record<OutputFormat, string> = {
    binary: "Binary (base 2)",
    hex: "Hexadecimal (base 16)",
    decimal: "Decimal (base 10)",
    octal: "Octal (base 8)",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Text ↔ Binary / Hex
            <Button variant="outline" size="sm" onClick={swap}>
              <ArrowUpDown className="h-4 w-4 mr-1" />
              {direction === "encode" ? "Text → Bytes" : "Bytes → Text"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Output Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as OutputFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FORMAT_LABELS) as OutputFormat[]).map((f) => (
                  <SelectItem key={f} value={f}>{FORMAT_LABELS[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".txt,.md" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload file
              </Button>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              placeholder={direction === "encode" ? "Enter text to convert..." : `Enter space-separated ${format} values...`}
              value={input}
              onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); }}
              className="min-h-[120px] font-mono text-sm"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive font-mono">
              {error}
            </div>
          )}

          <Button onClick={process} className="w-full">Convert</Button>

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Output</span>
                <Button variant="outline" size="sm" onClick={copy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <Textarea value={output} readOnly className="min-h-[120px] font-mono text-sm bg-muted/50" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
