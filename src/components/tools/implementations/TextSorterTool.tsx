import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type SortMode = "alpha" | "alpha-desc" | "length" | "length-desc" | "numeric" | "numeric-desc" | "random";

export function TextSorterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<SortMode>("alpha");
  const [removeDupes, setRemoveDupes] = useState(false);
  const [trimLines, setTrimLines] = useState(true);
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

  const sort = () => {
    if (!input) { setOutput(""); return; }
    let lines = input.split("\n");
    if (trimLines) lines = lines.map((l) => l.trim());
    lines = lines.filter((l) => l.length > 0);
    if (removeDupes) lines = [...new Set(lines)];

    lines.sort((a, b) => {
      switch (mode) {
        case "alpha": return a.localeCompare(b);
        case "alpha-desc": return b.localeCompare(a);
        case "length": return a.length - b.length || a.localeCompare(b);
        case "length-desc": return b.length - a.length || a.localeCompare(b);
        case "numeric": return (parseFloat(a) || 0) - (parseFloat(b) || 0);
        case "numeric-desc": return (parseFloat(b) || 0) - (parseFloat(a) || 0);
        case "random": return Math.random() - 0.5;
        default: return 0;
      }
    });

    setOutput(lines.join("\n"));
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Text Line Sorter</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px] space-y-2">
              <Label>Sort Order</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as SortMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alpha">Alphabetical A → Z</SelectItem>
                  <SelectItem value="alpha-desc">Alphabetical Z → A</SelectItem>
                  <SelectItem value="length">Length (short → long)</SelectItem>
                  <SelectItem value="length-desc">Length (long → short)</SelectItem>
                  <SelectItem value="numeric">Numeric ascending</SelectItem>
                  <SelectItem value="numeric-desc">Numeric descending</SelectItem>
                  <SelectItem value="random">Shuffle / randomize</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4 pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={removeDupes} onCheckedChange={(v) => setRemoveDupes(!!v)} />
                Remove duplicates
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={trimLines} onCheckedChange={(v) => setTrimLines(!!v)} />
                Trim whitespace
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".txt,.md,.csv" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose file
              </Button>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              placeholder="Paste lines of text here, one per line..."
              value={input}
              onChange={(e) => { setInput(e.target.value); setOutput(""); }}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <Button onClick={sort} className="w-full">Sort Lines</Button>

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sorted Output</span>
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
