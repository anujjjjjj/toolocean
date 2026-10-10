import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Upload, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UrlEncoderTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [scope, setScope] = useState<"component" | "full">("component");
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
    if (!input.trim()) { setOutput(""); return; }
    try {
      if (mode === "encode") {
        setOutput(scope === "component" ? encodeURIComponent(input) : encodeURI(input));
      } else {
        setOutput(scope === "component" ? decodeURIComponent(input) : decodeURI(input));
      }
    } catch {
      toast({ title: "Error", description: "Invalid input for decoding", variant: "destructive" });
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
            URL Encoder / Decoder
            <div className="flex gap-2">
              <Select value={scope} onValueChange={(v) => setScope(v as "component" | "full")}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="component">encodeURIComponent</SelectItem>
                  <SelectItem value="full">encodeURI (full URL)</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={swap}>
                <ArrowUpDown className="h-4 w-4 mr-1" />
                {mode === "encode" ? "Encode" : "Decode"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".txt,.url" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose file
              </Button>
              <span className="text-xs text-muted-foreground">Input</span>
            </div>
            <Textarea
              placeholder={mode === "encode" ? "Paste text to encode..." : "Paste encoded URL to decode..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[160px] font-mono text-sm"
            />
          </div>
          <Button onClick={process} className="w-full">
            {mode === "encode" ? "Encode" : "Decode"}
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
