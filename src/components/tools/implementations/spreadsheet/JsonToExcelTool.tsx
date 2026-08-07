import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export function JsonToExcelTool() {
  const [input, setInput] = useState("");
  const [filename, setFilename] = useState("export");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string[][] | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setInput(ev.target?.result as string); setPreview(null); setError(""); };
    reader.readAsText(file);
    e.target.value = "";
  };

  const parseJson = (): object[] => {
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array of objects");
    return parsed;
  };

  const generatePreview = () => {
    if (!input.trim()) { setPreview(null); setError(""); return; }
    try {
      const rows = parseJson();
      const keys = [...new Set(rows.flatMap((r) => Object.keys(r as object)))];
      const table = [keys, ...rows.map((r) => keys.map((k) => String((r as Record<string, unknown>)[k] ?? "")))];
      setPreview(table);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setPreview(null);
    }
  };

  const download = () => {
    if (!input.trim()) { toast({ title: "Paste JSON first", variant: "destructive" }); return; }
    try {
      const rows = parseJson();
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
      XLSX.writeFile(wb, `${filename || "export"}.xlsx`);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>JSON Array → Excel</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Filename</Label>
              <Input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="export" className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Sheet Name</Label>
              <Input value={sheetName} onChange={(e) => setSheetName(e.target.value)} placeholder="Sheet1" className="font-mono" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />Upload .json
              </Button>
              <span className="text-xs text-muted-foreground">or paste JSON array below</span>
            </div>
            <Textarea
              placeholder='[{"name":"Alice","age":30},{"name":"Bob","age":25}]'
              value={input}
              onChange={(e) => { setInput(e.target.value); setPreview(null); setError(""); }}
              className="min-h-[160px] font-mono text-sm"
            />
          </div>

          {error && <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive font-mono">{error}</div>}

          <div className="flex gap-2">
            <Button onClick={generatePreview} variant="outline" className="flex-1">Preview</Button>
            <Button onClick={download} className="flex-1">
              <Download className="h-4 w-4 mr-2" />Download .xlsx
            </Button>
          </div>

          {preview && (
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse w-full">
                <tbody>
                  {preview.slice(0, 11).map((row, ri) => (
                    <tr key={ri} className={ri === 0 ? "bg-muted font-medium" : "hover:bg-muted/30"}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="border border-border px-2 py-1 font-mono whitespace-nowrap max-w-[200px] truncate">{cell}</td>
                      ))}
                    </tr>
                  ))}
                  {preview.length > 11 && (
                    <tr><td colSpan={preview[0].length} className="text-center text-muted-foreground py-2">... {preview.length - 11} more rows</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
