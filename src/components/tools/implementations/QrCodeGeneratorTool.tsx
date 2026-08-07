import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

export function QrCodeGeneratorTool() {
  const [text, setText] = useState("https://example.com");
  const [size, setSize] = useState("256");
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [dataUrl, setDataUrl] = useState("");
  const { toast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const generate = async (value: string) => {
    if (!value.trim()) { setDataUrl(""); return; }
    try {
      const url = await QRCode.toDataURL(value, {
        width: parseInt(size) || 256,
        errorCorrectionLevel: errorLevel,
        margin: 2,
      });
      setDataUrl(url);
    } catch {
      toast({ title: "Error generating QR code", variant: "destructive" });
    }
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => generate(text), 300);
    return () => clearTimeout(debounceRef.current);
  }, [text, size, errorLevel]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    a.click();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>QR Code Generator</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Text / URL</Label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text or URL..."
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Size (px)</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="128">128 × 128</SelectItem>
                  <SelectItem value="256">256 × 256</SelectItem>
                  <SelectItem value="512">512 × 512</SelectItem>
                  <SelectItem value="1024">1024 × 1024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Error Correction</Label>
              <Select value={errorLevel} onValueChange={(v) => setErrorLevel(v as typeof errorLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">L — Low (7%)</SelectItem>
                  <SelectItem value="M">M — Medium (15%)</SelectItem>
                  <SelectItem value="Q">Q — Quartile (25%)</SelectItem>
                  <SelectItem value="H">H — High (30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {dataUrl && (
            <div className="flex flex-col items-center gap-4">
              <img src={dataUrl} alt="QR Code" className="border rounded-md" style={{ maxWidth: 256 }} />
              <Button onClick={download} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
