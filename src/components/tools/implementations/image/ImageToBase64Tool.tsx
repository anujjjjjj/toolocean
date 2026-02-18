import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ImageToBase64Tool() {
  const [base64, setBase64] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [format, setFormat] = useState<"dataurl" | "raw">("dataurl");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      if (format === "raw") {
        const base = result.split(",")[1] || "";
        setBase64(base);
      } else {
        setBase64(result);
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(base64);
    toast({ title: "Copied", description: "Base64 copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      <div className="flex gap-4 flex-wrap">
        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Select Image
        </Button>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="format"
            checked={format === "dataurl"}
            onChange={() => {
              setFormat("dataurl");
              if (preview) setBase64(preview);
            }}
          />
          Data URL (full)
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="format"
            checked={format === "raw"}
            onChange={() => {
              setFormat("raw");
              if (preview) setBase64(preview.split(",")[1] || "");
            }}
          />
          Raw Base64
        </label>
      </div>

      {base64 && (
        <>
          {preview && (
            <div>
              <Label>Preview</Label>
              <img src={preview} alt="Preview" className="max-h-40 rounded border mt-1" />
            </div>
          )}
          <div>
            <Label>Base64 Output</Label>
            <Textarea value={base64} readOnly rows={6} className="font-mono text-sm mt-1" />
            <Button variant="outline" size="sm" className="mt-2" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
