import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Upload, Download, TableProperties } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { parseCsv } from "@/lib/csv/parseCsv";

interface ParsedData {
  columns: string[];
  rows: Record<string, unknown>[];
  fileName: string;
  ext: string;
}

export function ColumnExtractorTool() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      toast({ title: "Unsupported file", description: "Please upload a CSV, XLSX, or XLS file", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const buf = ev.target?.result as ArrayBuffer;
        const textName = file.name.toLowerCase();
        const wb = textName.endsWith(".csv") || textName.endsWith(".tsv")
          ? (() => {
              const book = XLSX.utils.book_new();
              const rows = parseCsv(new TextDecoder().decode(buf), textName.endsWith(".tsv") ? "\t" : ",");
              XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "Sheet1");
              return book;
            })()
          : XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

        if (jsonData.length === 0) {
          toast({ title: "Empty file", description: "No data found in the file", variant: "destructive" });
          return;
        }

        const columns = Object.keys(jsonData[0]);
        setData({ columns, rows: jsonData, fileName: file.name.replace(/\.[^.]+$/, ""), ext });
        setSelected(new Set(columns));
      } catch {
        toast({ title: "Parse error", description: "Failed to read the file", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleColumn = (col: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const selectAll = () => {
    if (!data) return;
    setSelected(new Set(data.columns));
  };

  const clearAll = () => setSelected(new Set());

  const download = (format: "csv" | "xlsx") => {
    if (!data || selected.size === 0) {
      toast({ title: "No columns selected", description: "Select at least one column to export", variant: "destructive" });
      return;
    }

    const selectedCols = data.columns.filter((c) => selected.has(c));
    const filteredRows = data.rows.map((row) => {
      const out: Record<string, unknown> = {};
      for (const col of selectedCols) out[col] = row[col];
      return out;
    });

    const ws = XLSX.utils.json_to_sheet(filteredRows, { header: selectedCols });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    const ext = format === "csv" ? "csv" : "xlsx";
    const type = format === "csv" ? "csv" : "xlsx";
    XLSX.writeFile(wb, `${data.fileName}_extracted.${ext}`, { bookType: type as XLSX.BookType });
    toast({ title: "Downloaded", description: `Exported ${selectedCols.length} columns, ${filteredRows.length} rows` });
  };

  const previewCols = data ? data.columns.filter((c) => selected.has(c)).slice(0, 5) : [];
  const previewRows = data ? data.rows.slice(0, 5) : [];

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileSelect}
      />

      {!data ? (
        <div
          className="border-2 border-dashed border-muted rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <TableProperties className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click to upload a CSV or Excel file</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="font-medium text-sm">{data.fileName}.{data.ext}</p>
              <p className="text-xs text-muted-foreground">{data.rows.length} rows · {data.columns.length} columns</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Load another
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select columns to keep</Label>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-primary hover:underline">Select all</button>
                <span className="text-xs text-muted-foreground">·</span>
                <button onClick={clearAll} className="text-xs text-primary hover:underline">Clear</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {data.columns.map((col) => (
                <div key={col} className="flex items-center gap-2">
                  <Checkbox
                    id={`col-${col}`}
                    checked={selected.has(col)}
                    onCheckedChange={() => toggleColumn(col)}
                  />
                  <label
                    htmlFor={`col-${col}`}
                    className="text-sm truncate cursor-pointer"
                    title={col}
                  >
                    {col}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{selected.size} of {data.columns.length} columns selected</p>
          </div>

          {previewCols.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Preview (first 5 rows)</Label>
              <div className="overflow-x-auto rounded border">
                <table className="text-xs w-full min-w-max">
                  <thead className="bg-muted/50">
                    <tr>
                      {previewCols.map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-medium">{col}</th>
                      ))}
                      {selected.size > 5 && <th className="px-3 py-2 text-muted-foreground">+{selected.size - 5} more…</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        {previewCols.map((col) => (
                          <td key={col} className="px-3 py-1.5 max-w-[200px] truncate">{String(row[col] ?? "")}</td>
                        ))}
                        {selected.size > 5 && <td />}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => download("csv")} disabled={selected.size === 0}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
            <Button variant="outline" onClick={() => download("xlsx")} disabled={selected.size === 0}>
              <Download className="h-4 w-4 mr-2" />
              Download XLSX
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
