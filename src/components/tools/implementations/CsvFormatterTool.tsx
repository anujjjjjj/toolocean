import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        cells.push(current); current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current);
    rows.push(cells);
  }
  return rows;
}

function renderTable(rows: string[][]): string {
  if (!rows.length) return "";
  const colWidths = rows[0].map((_, ci) => Math.max(...rows.map((r) => (r[ci] || "").length)));
  return rows
    .map((row, ri) => {
      const line = row.map((cell, ci) => cell.padEnd(colWidths[ci])).join(" | ");
      if (ri === 0) return line + "\n" + colWidths.map((w) => "-".repeat(w)).join("-+-");
      return line;
    })
    .join("\n");
}

export function CsvFormatterTool() {
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

  const format = () => {
    if (!input.trim()) { setOutput(""); setError(""); return; }
    try {
      const rows = parseCsv(input, delimiter || ",");
      setOutput(renderTable(rows));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse CSV");
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
        <CardHeader><CardTitle>CSV Formatter / Viewer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="w-32 space-y-2">
              <Label>Delimiter</Label>
              <Input
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                placeholder=","
                className="font-mono"
                maxLength={3}
              />
            </div>
            <span className="text-xs text-muted-foreground pb-2">Use \t for tab</span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose a .csv
              </Button>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              placeholder="Paste CSV data here..."
              value={input}
              onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); }}
              className="min-h-[180px] font-mono text-sm"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive font-mono">
              {error}
            </div>
          )}

          <Button onClick={format} className="w-full">Format as Table</Button>

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Formatted Table</span>
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
