import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MIME_MAP: Record<string, string> = {
  // Text
  txt: "text/plain", html: "text/html", htm: "text/html", css: "text/css",
  csv: "text/csv", xml: "text/xml", js: "text/javascript", mjs: "text/javascript",
  ts: "text/typescript", md: "text/markdown", rtf: "text/rtf",
  // Application
  json: "application/json", pdf: "application/pdf", zip: "application/zip",
  gz: "application/gzip", tar: "application/x-tar",
  "7z": "application/x-7z-compressed", rar: "application/vnd.rar",
  wasm: "application/wasm", yaml: "application/yaml", yml: "application/yaml",
  toml: "application/toml", sql: "application/sql",
  jar: "application/java-archive", war: "application/java-archive",
  exe: "application/x-msdownload", dmg: "application/x-apple-diskimage",
  apk: "application/vnd.android.package-archive",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Images
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
  svg: "image/svg+xml", webp: "image/webp", avif: "image/avif",
  ico: "image/x-icon", bmp: "image/bmp", tiff: "image/tiff", tif: "image/tiff",
  // Audio
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", flac: "audio/flac",
  aac: "audio/aac", m4a: "audio/mp4", opus: "audio/opus",
  // Video
  mp4: "video/mp4", webm: "video/webm", ogv: "video/ogg",
  avi: "video/x-msvideo", mov: "video/quicktime", mkv: "video/x-matroska",
  // Fonts
  ttf: "font/ttf", otf: "font/otf", woff: "font/woff", woff2: "font/woff2",
  eot: "application/vnd.ms-fontobject",
};

// Reverse map: mime → extensions
const REVERSE_MAP: Record<string, string[]> = {};
for (const [ext, mime] of Object.entries(MIME_MAP)) {
  if (!REVERSE_MAP[mime]) REVERSE_MAP[mime] = [];
  REVERSE_MAP[mime].push(ext);
}

export function MimeTypeLookupTool() {
  const [query, setQuery] = useState("");
  const [detectedMime, setDetectedMime] = useState("");
  const [detectedExt, setDetectedExt] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lookup = (q: string) => {
    const trimmed = q.trim().toLowerCase().replace(/^\./, "");
    if (!trimmed) { setDetectedMime(""); setDetectedExt(""); return; }
    if (trimmed.includes("/")) {
      // It's a MIME type — find extensions
      setDetectedMime(trimmed);
      setDetectedExt((REVERSE_MAP[trimmed] || []).join(", ") || "unknown");
    } else {
      // It's an extension — find MIME
      const mime = MIME_MAP[trimmed] || "application/octet-stream";
      setDetectedMime(mime);
      setDetectedExt((REVERSE_MAP[mime] || []).join(", ") || trimmed);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    setQuery(ext);
    lookup(ext);
    e.target.value = "";
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>MIME Type Lookup</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter a file extension (e.g. <code>png</code>, <code>.mp4</code>) or a MIME type (e.g. <code>image/jpeg</code>) — or upload a file to auto-detect.
          </p>

          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Detect from file
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Extension or MIME type</Label>
            <div className="flex gap-2">
              <Input
                placeholder="png or image/png"
                value={query}
                onChange={(e) => { setQuery(e.target.value); lookup(e.target.value); }}
                className="font-mono"
              />
              <Button onClick={() => lookup(query)}>Lookup</Button>
            </div>
          </div>

          {detectedMime && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">MIME Type</Label>
                <div className="flex gap-2 items-center">
                  <code className="flex-1 p-2 rounded-md bg-muted font-mono text-sm">{detectedMime}</code>
                  <Button variant="outline" size="sm" onClick={() => copy(detectedMime)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Common Extensions</Label>
                <div className="flex gap-2 items-center">
                  <code className="flex-1 p-2 rounded-md bg-muted font-mono text-sm">{detectedExt}</code>
                  <Button variant="outline" size="sm" onClick={() => copy(detectedExt)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
