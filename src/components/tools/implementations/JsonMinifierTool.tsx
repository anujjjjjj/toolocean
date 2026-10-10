import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function JsonMinifierTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
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

  const minify = () => {
    if (!input.trim()) { setOutput(""); setError(""); return; }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
    }
  };

  const prettify = () => {
    if (!input.trim()) { setOutput(""); setError(""); return; }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  const inputBytes = new TextEncoder().encode(input).length;
  const outputBytes = new TextEncoder().encode(output).length;
  const saved = inputBytes > 0 && outputBytes > 0 ? Math.round((1 - outputBytes / inputBytes) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>JSON Minifier</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose a .json
              </Button>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              placeholder="Paste JSON here..."
              value={input}
              onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); }}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive font-mono">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={minify} className="flex-1">Minify</Button>
            <Button onClick={prettify} variant="outline">Prettify</Button>
          </div>

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Output</span>
                  {saved > 0 && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {saved}% smaller ({inputBytes} → {outputBytes} bytes)
                    </span>
                  )}
                </div>
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
