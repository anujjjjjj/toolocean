import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Copy, Upload, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type EscapeMode = "json" | "js" | "regex" | "html" | "sql";

function escapeText(text: string, mode: EscapeMode, direction: "escape" | "unescape"): string {
  if (direction === "escape") {
    if (mode === "json" || mode === "js") {
      return JSON.stringify(text).slice(1, -1);
    }
    if (mode === "regex") {
      return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    if (mode === "html") {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    }
    if (mode === "sql") {
      return text.replace(/'/g, "''").replace(/\\/g, "\\\\");
    }
  } else {
    if (mode === "json" || mode === "js") {
      try {
        return JSON.parse(`"${text}"`);
      } catch {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }
    }
    if (mode === "html") {
      return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    }
    if (mode === "sql") {
      return text.replace(/''/g, "'").replace(/\\\\/g, "\\");
    }
    if (mode === "regex") {
      return text.replace(/\\([.*+?^${}()|[\]\\])/g, "$1");
    }
  }
  return text;
}

export function StringEscapeTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<EscapeMode>("json");
  const [direction, setDirection] = useState<"escape" | "unescape">("escape");
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
    setOutput(escapeText(input, mode, direction));
  };

  const swap = () => {
    setDirection(direction === "escape" ? "unescape" : "escape");
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
            String Escape / Unescape
            <Button variant="outline" size="sm" onClick={swap}>
              <ArrowUpDown className="h-4 w-4 mr-1" />
              {direction === "escape" ? "Escape" : "Unescape"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as EscapeMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON / JavaScript String</SelectItem>
                <SelectItem value="regex">Regular Expression</SelectItem>
                <SelectItem value="html">HTML Entities</SelectItem>
                <SelectItem value="sql">SQL String</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".txt,.json,.js,.ts,.html,.sql" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose file
              </Button>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              placeholder={direction === "escape" ? "Paste text to escape..." : "Paste escaped string to unescape..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[160px] font-mono text-sm"
            />
          </div>

          <Button onClick={process} className="w-full">
            {direction === "escape" ? "Escape String" : "Unescape String"}
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
