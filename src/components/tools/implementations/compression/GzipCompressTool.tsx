import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import pako from "pako";

export function GzipCompressTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { toast } = useToast();

  const compress = () => {
    try {
      const encoded = new TextEncoder().encode(input);
      const compressed = pako.gzip(encoded);
      const base64 = btoa(String.fromCharCode(...compressed));
      setOutput(base64);
      toast({ title: "Compressed", description: "Data compressed with gzip" });
    } catch {
      toast({ title: "Error", description: "Could not compress", variant: "destructive" });
    }
  };

  const download = () => {
    if (!output) return;
    const blob = new Blob([Uint8Array.from(atob(output), (c) => c.charCodeAt(0))], {
      type: "application/gzip",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "compressed.gz";
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ title: "Downloaded", description: "compressed.gz" });
  };

  const copy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      toast({ title: "Copied", description: "Base64 copied" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Input Text</Label>
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={8} className="font-mono text-sm mt-1" />
      </div>
      <Button onClick={compress} disabled={!input.trim()}>
        Compress (Gzip)
      </Button>
      {output && (
        <div className="space-y-2">
          <Label>Compressed (Base64)</Label>
          <Textarea value={output} readOnly rows={4} className="font-mono text-sm mt-1" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={download}>
              <Download className="h-4 w-4 mr-2" />
              Download .gz
            </Button>
            <Button variant="outline" size="sm" onClick={copy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Base64
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
