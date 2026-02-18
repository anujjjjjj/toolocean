import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

interface ZipEntry {
  name: string;
  type: string;
}

export function ZipPreviewTool() {
  const [entries, setEntries] = useState<ZipEntry[]>([]);
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
      const list: ZipEntry[] = [];
      zip.forEach((path, entry) => {
        list.push({ name: path, type: entry.dir ? "Folder" : "File" });
      });
      setEntries(list.sort((a, b) => a.name.localeCompare(b.name)));
      toast({ title: "Loaded", description: `${list.length} entries` });
    } catch {
      toast({ title: "Error", description: "Could not read ZIP", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleFileSelect} />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        Select ZIP File
      </Button>

      {entries.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-right px-4 py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.name} className="border-t">
                  <td className="px-4 py-2 font-mono">{e.name}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{e.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
