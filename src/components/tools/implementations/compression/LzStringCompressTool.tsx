import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Copy, Upload, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LZString from "lz-string";

type LzMethod = "compress" | "compressToBase64" | "compressToUTF16" | "compressToEncodedURIComponent";

const METHODS: { value: LzMethod; label: string; decompress: keyof typeof LZString }[] = [
  { value: "compress", label: "Raw (binary)", decompress: "decompress" },
  { value: "compressToBase64", label: "Base64", decompress: "decompressFromBase64" },
  { value: "compressToUTF16", label: "UTF-16", decompress: "decompressFromUTF16" },
  { value: "compressToEncodedURIComponent", label: "URI Component", decompress: "decompressFromEncodedURIComponent" },
];

export function LzStringCompressTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [method, setMethod] = useState<LzMethod>("compressToBase64");
  const [direction, setDirection] = useState<"compress" | "decompress">("compress");
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
      if (direction === "compress") {
        const result = (LZString[method] as (s: string) => string)(input);
        if (!result) throw new Error("Compression returned empty result");
        setOutput(result);
      } else {
        const m = METHODS.find((x) => x.value === method)!;
        const result = (LZString[m.decompress] as (s: string) => string | null)(input);
        if (result === null) throw new Error("Decompression failed, wrong method or corrupted data");
        setOutput(result);
      }
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setOutput("");
    }
  };

  const swap = () => {
    setDirection(direction === "compress" ? "decompress" : "compress");
    setInput(output);
    setOutput("");
    setError("");
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  const inputBytes = new TextEncoder().encode(input).length;
  const outputBytes = new TextEncoder().encode(output).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            LZ-String Compress / Decompress
            <Button variant="outline" size="sm" onClick={swap}>
              <ArrowUpDown className="h-4 w-4 mr-1" />
              {direction === "compress" ? "Compress" : "Decompress"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as LzMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".txt,.json,.md" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />Choose file
              </Button>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              placeholder={direction === "compress" ? "Paste text to compress..." : "Paste compressed string to decompress..."}
              value={input}
              onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); }}
              className="min-h-[160px] font-mono text-sm"
            />
            {inputBytes > 0 && <p className="text-xs text-muted-foreground mt-1">{inputBytes} bytes</p>}
          </div>

          {error && <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">{error}</div>}

          <Button onClick={process} className="w-full">
            {direction === "compress" ? "Compress" : "Decompress"}
          </Button>

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Output</span>
                  {direction === "compress" && inputBytes > 0 && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {outputBytes} bytes ({Math.round((1 - outputBytes / inputBytes) * 100)}% smaller)
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={copy}><Copy className="h-4 w-4 mr-2" />Copy</Button>
              </div>
              <Textarea value={output} readOnly className="min-h-[160px] font-mono text-sm bg-muted/50" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
