import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatXml(xml: string, indent = 2): string {
  const INDENT = " ".repeat(indent);
  let result = "";
  let depth = 0;
  let inText = false;

  const tokens = xml.match(/<[^>]+>|[^<]+/g) || [];
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      result += INDENT.repeat(depth) + trimmed + "\n";
      inText = false;
    } else if (trimmed.startsWith("<?") || trimmed.startsWith("<!")) {
      result += INDENT.repeat(depth) + trimmed + "\n";
    } else if (trimmed.startsWith("<") && trimmed.endsWith("/>")) {
      result += INDENT.repeat(depth) + trimmed + "\n";
    } else if (trimmed.startsWith("<")) {
      result += INDENT.repeat(depth) + trimmed + "\n";
      depth++;
      inText = false;
    } else {
      result += INDENT.repeat(depth) + trimmed + "\n";
    }
  }
  return result.trim();
}

function minifyXml(xml: string): string {
  return xml
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}

function validateXml(xml: string): string | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) return parseError.textContent || "Invalid XML";
    return null;
  } catch {
    return "Invalid XML";
  }
}

export function XmlFormatterTool() {
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
    const err = validateXml(input);
    if (err) { setError(err); setOutput(""); return; }
    setOutput(formatXml(input));
    setError("");
  };

  const minify = () => {
    if (!input.trim()) { setOutput(""); setError(""); return; }
    const err = validateXml(input);
    if (err) { setError(err); setOutput(""); return; }
    setOutput(minifyXml(input));
    setError("");
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>XML Formatter / Minifier</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".xml,.svg,.xhtml" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose a .xml
              </Button>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              placeholder="Paste XML here..."
              value={input}
              onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); }}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive font-mono whitespace-pre-wrap">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={format} className="flex-1">Format / Prettify</Button>
            <Button onClick={minify} variant="outline">Minify</Button>
          </div>

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Output</span>
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
