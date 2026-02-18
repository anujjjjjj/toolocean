import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export function ExcelReaderTool() {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [data, setData] = useState<string[][]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const buf = ev.target?.result;
        const wb = XLSX.read(buf, { type: "array" });
        setWorkbook(wb);
        const names = wb.SheetNames;
        setSheetNames(names);
        if (names.length > 0) {
          setActiveSheet(names[0]);
          updateSheetData(wb, names[0]);
        }
        toast({ title: "Loaded", description: `${file.name}` });
      } catch (err) {
        toast({ title: "Error", description: "Could not read Excel file", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateSheetData = (wb: XLSX.WorkBook, name: string) => {
    const sheet = wb.Sheets[name];
    if (!sheet) return;
    const arr = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    setData(arr);
  };

  const handleSheetChange = (name: string) => {
    setActiveSheet(name);
    if (workbook) updateSheetData(workbook, name);
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        Select Excel File
      </Button>

      {workbook && (
        <>
          {sheetNames.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {sheetNames.map((name) => (
                <Button
                  key={name}
                  variant={activeSheet === name ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSheetChange(name)}
                >
                  {name}
                </Button>
              ))}
            </div>
          )}
          <div className="overflow-auto max-h-[500px] border rounded-lg">
            <table className="w-full text-sm border-collapse">
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border px-3 py-2">
                        {String(cell ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
