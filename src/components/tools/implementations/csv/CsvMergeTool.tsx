import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Download, Upload, X, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CsvFile {
  id: string;
  content: string;
  name: string;
}

export function CsvMergeTool() {
  const [files, setFiles] = useState<CsvFile[]>([]);
  const [delimiter, setDelimiter] = useState(",");
  const [customDelimiter, setCustomDelimiter] = useState("");
  const [mergeStrategy, setMergeStrategy] = useState<"first-header" | "no-header">("first-header");
  const [output, setOutput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const toRead = Array.from(selectedFiles).filter((file) => {
      if (!file.name.endsWith(".csv") && !file.name.match(/\.(txt|tsv)$/i)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} - CSV/TXT/TSV files only`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    const newFiles: CsvFile[] = await Promise.all(
      toRead.map(
        (file) =>
          new Promise<CsvFile>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const content = (e.target?.result as string) || "";
              resolve({
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                content,
                name: file.name,
              });
            };
            reader.readAsText(file);
          })
      )
    );

    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const addPasteArea = () => {
    setFiles((prev) => [
      ...prev,
      {
        id: `paste-${Date.now()}`,
        content: "",
        name: "Paste CSV content below",
      },
    ]);
  };

  const updateFileContent = (id: string, content: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, content } : f)));
  };

  const merge = () => {
    if (files.length === 0) {
      toast({ title: "No files", description: "Add CSV files to merge", variant: "destructive" });
      return;
    }

    const actualDelimiter = delimiter === "custom" ? customDelimiter : delimiter;

    try {
      const validFiles = files.filter((f) => f.content.trim());
      if (validFiles.length === 0) {
        toast({ title: "No content", description: "All files are empty", variant: "destructive" });
        return;
      }

      let header: string[] | null = null;
      const rows: string[][] = [];

      for (const file of validFiles) {
        const lines = file.content.trim().split("\n").filter((l) => l.trim());
        if (lines.length === 0) continue;

        const firstLineCols = lines[0].split(actualDelimiter);
        if (mergeStrategy === "first-header") {
          if (header === null) {
            header = firstLineCols.map((h) => h.trim().replace(/"/g, ""));
            rows.push(header);
            rows.push(...lines.slice(1).map((line) => line.split(actualDelimiter).map((v) => v.trim().replace(/"/g, ""))));
          } else {
            rows.push(...lines.slice(1).map((line) => line.split(actualDelimiter).map((v) => v.trim().replace(/"/g, ""))));
          }
        } else {
          rows.push(...lines.map((line) => line.split(actualDelimiter).map((v) => v.trim().replace(/"/g, ""))));
        }
      }

      const escapeValue = (v: string) => (v.includes(actualDelimiter) ? `"${v}"` : v);
      const csv = rows.map((row) => row.map(escapeValue).join(actualDelimiter)).join("\n");
      setOutput(csv);
      toast({ title: "Merge complete", description: `Merged ${validFiles.length} file(s)` });
    } catch (error) {
      toast({
        title: "Merge failed",
        description: error instanceof Error ? error.message : "Could not merge CSV files",
        variant: "destructive",
      });
      setOutput("");
    }
  };

  const copyToClipboard = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const downloadFile = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merged.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "merged.csv" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Merge Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Delimiter</Label>
              <Select value={delimiter} onValueChange={setDelimiter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Comma (,)</SelectItem>
                  <SelectItem value=";">Semicolon (;)</SelectItem>
                  <SelectItem value="\t">Tab</SelectItem>
                  <SelectItem value="|">Pipe (|)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {delimiter === "custom" && (
              <div className="space-y-2">
                <Label>Custom Delimiter</Label>
                <Input value={customDelimiter} onChange={(e) => setCustomDelimiter(e.target.value)} placeholder="Enter delimiter" maxLength={1} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Header handling</Label>
              <Select value={mergeStrategy} onValueChange={(v: "first-header" | "no-header") => setMergeStrategy(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first-header">Use first file&apos;s header only</SelectItem>
                  <SelectItem value="no-header">Include all rows (no header)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            CSV Files
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv" multiple className="hidden" onChange={handleFileSelect} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <Button variant="outline" size="sm" onClick={addPasteArea}>
                Add paste area
              </Button>
              <Button onClick={merge}>Merge</Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {files.length === 0 ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground cursor-pointer hover:border-primary/50"
              onClick={() => fileInputRef.current?.click()}
            >
              Click to upload CSV files or use &quot;Add paste area&quot; to paste content
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {files.map((file) => (
                <div key={file.id} className="flex items-start gap-2 rounded-lg border p-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1">{file.name}</div>
                    <Textarea
                      placeholder="Paste CSV content..."
                      value={file.content}
                      onChange={(e) => updateFileContent(file.id, e.target.value)}
                      className="min-h-[80px] font-mono text-xs"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Merged Output
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadFile}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={output} readOnly className="min-h-[400px] font-mono text-sm bg-muted/50" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
