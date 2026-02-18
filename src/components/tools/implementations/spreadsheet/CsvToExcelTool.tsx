import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export function CsvToExcelTool() {
  const [csv, setCsv] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsv(String(reader.result));
      toast({ title: "Loaded", description: file.name });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const convertAndDownload = () => {
    try {
      const lines = csv.trim().split(/\r?\n/);
      const rows = lines.map((line) => {
        const parts: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const c = line[i];
          if (c === '"') inQuotes = !inQuotes;
          else if ((c === delimiter || c === ",") && !inQuotes) {
            parts.push(current.trim());
            current = "";
          } else current += c;
        }
        parts.push(current.trim());
        return parts;
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(wb, "converted.xlsx");
      toast({ title: "Downloaded", description: "Excel file saved" });
    } catch {
      toast({ title: "Error", description: "Could not convert CSV", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileSelect} />
      <div className="flex gap-4 flex-wrap">
        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Load CSV File
        </Button>
        <div>
          <Label>Delimiter</Label>
          <Input
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value || ",")}
            className="w-16"
            maxLength={1}
          />
        </div>
      </div>
      <div>
        <Label>CSV Data</Label>
        <Textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10} className="font-mono text-sm mt-1" />
      </div>
      <Button onClick={convertAndDownload} disabled={!csv.trim()}>
        <Download className="h-4 w-4 mr-2" />
        Download as Excel
      </Button>
    </div>
  );
}
