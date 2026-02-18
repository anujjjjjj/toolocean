import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

export function ZipExtractorTool() {
  const [files, setFiles] = useState<{ name: string; blob: Blob }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith(".zip")) {
      toast({ title: "Invalid file", description: "Please select a ZIP file", variant: "destructive" });
      return;
    }
    try {
      const zip = await JSZip.loadAsync(file);
      const extracted: { name: string; blob: Blob }[] = [];
      const entries = Object.entries(zip.files).filter(([, v]) => !v.dir);
      for (const [name, entry] of entries) {
        const blob = await entry.async("blob");
        extracted.push({ name, blob });
      }
      setFiles(extracted);
      toast({ title: "Extracted", description: `${extracted.length} file(s)` });
    } catch {
      toast({ title: "Error", description: "Could not read ZIP file", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadFile = (name: string, blob: Blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name.split("/").pop() || name;
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ title: "Downloaded", description: name });
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleFileSelect} />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        Select ZIP File
      </Button>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Files ({files.length})</h4>
          <ul className="space-y-2 max-h-64 overflow-auto border rounded-lg p-4">
            {files.map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-4">
                <span className="truncate text-sm">{f.name}</span>
                <Button variant="outline" size="sm" onClick={() => downloadFile(f.name, f.blob)}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
