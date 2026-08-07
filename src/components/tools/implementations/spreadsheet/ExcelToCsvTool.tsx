import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, Copy } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export function ExcelToCsvTool() {
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [csv, setCsv] = useState("");
  const [error, setError] = useState("");
  const wbRef = useRef<XLSX.WorkBook | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        wbRef.current = wb;
        setSheets(wb.SheetNames);
        setSelectedSheet(wb.SheetNames[0]);
        convertSheet(wb, wb.SheetNames[0]);
        setError("");
      } catch {
        setError("Failed to read Excel file");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const convertSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    const result = XLSX.utils.sheet_to_csv(ws);
    setCsv(result);
  };

  const handleSheetChange = (name: string) => {
    setSelectedSheet(name);
    if (wbRef.current) convertSheet(wbRef.current, name);
  };

  const download = () => {
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSheet}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = () => {
    navigator.clipboard.writeText(csv);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Excel → CSV</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.ods" className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />Upload Excel file
            </Button>
          </div>

          {error && <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">{error}</div>}

          {sheets.length > 0 && (
            <div className="space-y-2">
              <Label>Sheet</Label>
              <Select value={selectedSheet} onValueChange={handleSheetChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sheets.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {csv && (
            <>
              <div className="flex gap-2">
                <Button onClick={download} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />Download {selectedSheet}.csv
                </Button>
                <Button variant="outline" onClick={copy}>
                  <Copy className="h-4 w-4 mr-2" />Copy
                </Button>
              </div>
              <Textarea value={csv} readOnly className="min-h-[300px] font-mono text-xs bg-muted/50" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
