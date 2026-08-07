import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TurndownService from "turndown";

const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

export function HtmlMarkdownTool() {
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

  const convert = () => {
    if (!input.trim()) { setOutput(""); setError(""); return; }
    try {
      setOutput(td.turndown(input));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
      setOutput("");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>HTML → Markdown</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".html,.htm" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />Upload .html
              </Button>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              placeholder="Paste HTML here..."
              value={input}
              onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); }}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">{error}</div>
          )}

          <Button onClick={convert} className="w-full">Convert to Markdown</Button>

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Markdown Output</span>
                <Button variant="outline" size="sm" onClick={copy}><Copy className="h-4 w-4 mr-2" />Copy</Button>
              </div>
              <Textarea value={output} readOnly className="min-h-[200px] font-mono text-sm bg-muted/50" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
