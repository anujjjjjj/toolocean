import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseCsv } from "@/lib/csv/parseCsv";

function csvToMarkdown(csv: string, delim: string): string {
  const parsed = parseCsv(csv, delim).filter((row) => row.some((cell) => cell.trim() !== ""));
  if (!parsed.length) return "";
  const cols = Math.max(...parsed.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, i) =>
    Math.max(...parsed.map((r) => (r[i] || "").length), 3)
  );
  const pad = (s: string, w: number) => s.padEnd(w);
  const separator = widths.map((w) => "-".repeat(w)).join(" | ");
  return parsed.map((row, ri) => {
    const line = widths.map((w, i) => pad(row[i] || "", w)).join(" | ");
    return ri === 1 ? separator + "\n" + line : line;
  }).join("\n").replace(separator + "\n" + separator, separator); // dedup separator
}

function properCsvToMarkdown(csv: string, delim: string): string {
  const parsed = parseCsv(csv, delim)
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row) => row.map((cell) => cell.replace(/\r?\n/g, " ")));
  if (!parsed.length) return "";
  const cols = Math.max(...parsed.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, i) =>
    Math.max(...parsed.map((r) => (r[i] || "").trim().length), 3)
  );
  const lines: string[] = [];
  parsed.forEach((row, ri) => {
    const line = "| " + widths.map((w, i) => (row[i] || "").trim().padEnd(w)).join(" | ") + " |";
    lines.push(line);
    if (ri === 0) lines.push("| " + widths.map((w) => "-".repeat(w)).join(" | ") + " |");
  });
  return lines.join("\n");
}

export function CsvMarkdownTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [delimiter, setDelimiter] = useState(",");
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
      setOutput(properCsvToMarkdown(input, delimiter || ","));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>CSV → Markdown Table</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="w-32 space-y-2">
              <Label>Delimiter</Label>
              <Input value={delimiter} onChange={(e) => setDelimiter(e.target.value)} placeholder="," className="font-mono" maxLength={3} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />Choose a .csv
              </Button>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              placeholder="Paste CSV data here..."
              value={input}
              onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); }}
              className="min-h-[150px] font-mono text-sm"
            />
          </div>

          {error && <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">{error}</div>}

          <Button onClick={convert} className="w-full">Convert to Markdown Table</Button>

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Markdown Table</span>
                <Button variant="outline" size="sm" onClick={copy}><Copy className="h-4 w-4 mr-2" />Copy</Button>
              </div>
              <Textarea value={output} readOnly className="min-h-[150px] font-mono text-sm bg-muted/50" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
