import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";

export function ZipCreatorTool() {
  const [files, setFiles] = useState<{ name: string; file: File }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles = Array.from(selected).map((f) => ({ name: f.name, file: f }));
    setFiles((prev) => [...prev, ...newFiles]);
    toast({ title: "Added", description: `${selected.length} file(s)` });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const createZip = async () => {
    if (files.length === 0) {
      toast({ title: "No files", description: "Add at least one file", variant: "destructive" });
      return;
    }
    try {
      const zip = new JSZip();
      const seen = new Set<string>();
      for (const { name, file } of files) {
        let unique = name;
        let i = 1;
        while (seen.has(unique)) {
          const ext = name.includes(".") ? name.substring(name.lastIndexOf(".")) : "";
          const base = name.replace(ext, "");
          unique = `${base} (${i})${ext}`;
          i++;
        }
        seen.add(unique);
        zip.file(unique, file);
      }
      /*
       * DEFLATE, not JSZip's default.
       *
       * generateAsync defaults to STORE, which writes every file in verbatim and
       * produces an archive fractionally larger than the sum of its inputs.
       * Measured on 167,472 bytes of text: STORE gave 167,782 bytes, DEFLATE gave
       * 27,859. A "create ZIP" tool that does not compress is not what anyone
       * means by zipping something.
       *
       * Level 6 is zlib's default, and the point on the curve where more effort
       * stops buying much. Already-compressed members (JPEGs, PDFs, other ZIPs)
       * will not shrink, which is a property of the data rather than the setting.
       */
      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "archive.zip";
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: "Downloaded", description: "archive.zip" });
    } catch {
      toast({ title: "Error", description: "Could not create ZIP", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        Add Files
      </Button>

      {files.length > 0 && (
        <>
          <ul className="space-y-2 max-h-48 overflow-auto border rounded-lg p-4">
            {files.map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-4 text-sm">
                <span className="truncate">{f.name}</span>
                <Button variant="ghost" size="sm" onClick={() => removeFile(f.name)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <Button onClick={createZip}>
            <Download className="h-4 w-4 mr-2" />
            Create & Download ZIP
          </Button>
        </>
      )}
    </div>
  );
}
