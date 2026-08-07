import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as smolToml from "smol-toml";

export function TomlFormatterTool() {
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

  const format = () => {
    if (!input.trim()) { setOutput(""); setError(""); return; }
    try {
      const parsed = smolToml.parse(input);
      setOutput(smolToml.stringify(parsed));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid TOML");
      setOutput("");
    }
  };

  const validate = () => {
    if (!input.trim()) { setError(""); return; }
    try {
      smolToml.parse(input);
      toast({ title: "Valid TOML!", description: "No syntax errors found." });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid TOML");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>TOML Formatter / Validator</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".toml" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload .toml
              </Button>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              placeholder="Paste TOML here..."
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
            <Button onClick={format} className="flex-1">Format TOML</Button>
            <Button onClick={validate} variant="outline">Validate</Button>
          </div>

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Formatted Output</span>
                <Button variant="outline" size="sm" onClick={copy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <Textarea value={output} readOnly className="min-h-[200px] font-mono text-sm bg-muted/50" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
