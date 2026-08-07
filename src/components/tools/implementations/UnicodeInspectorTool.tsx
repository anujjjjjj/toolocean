import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CharInfo {
  char: string;
  codepoint: number;
  hex: string;
  utf8: string;
  name: string;
}

function getUtf8Bytes(char: string): string {
  const bytes: string[] = [];
  const encoded = new TextEncoder().encode(char);
  encoded.forEach((b) => bytes.push(b.toString(16).toUpperCase().padStart(2, "0")));
  return bytes.join(" ");
}

function getCategory(cp: number): string {
  if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0)) return "Control";
  if (cp < 0x7f) return "ASCII";
  if (cp < 0x100) return "Latin-1 Supplement";
  if (cp < 0x250) return "IPA / Extended Latin";
  if (cp < 0x370) return "Spacing Modifiers";
  if (cp < 0x400) return "Greek & Coptic";
  if (cp < 0x500) return "Cyrillic";
  if (cp < 0x600) return "Armenian / Hebrew";
  if (cp < 0x700) return "Arabic";
  if (cp >= 0x4e00 && cp <= 0x9fff) return "CJK Unified Ideographs";
  if (cp >= 0x1f300 && cp <= 0x1faff) return "Emoji";
  return "Unicode";
}

function analyzeText(text: string): CharInfo[] {
  const chars: CharInfo[] = [];
  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0;
    chars.push({
      char,
      codepoint: cp,
      hex: "U+" + cp.toString(16).toUpperCase().padStart(4, "0"),
      utf8: getUtf8Bytes(char),
      name: getCategory(cp),
    });
  }
  return chars;
}

export function UnicodeInspectorTool() {
  const [input, setInput] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setInput((ev.target?.result as string).slice(0, 500));
    reader.readAsText(file);
    e.target.value = "";
  };

  const chars = input ? analyzeText(input) : [];

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Unicode / Character Inspector</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input ref={fileInputRef} type="file" accept=".txt,.md,.json,.csv" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload file
              </Button>
              <span className="text-xs text-muted-foreground">or type / paste below (max 500 chars shown)</span>
            </div>
            <Textarea
              placeholder="Type or paste text to inspect characters..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[80px] font-mono text-sm"
              maxLength={500}
            />
          </div>

          {chars.length > 0 && (
            <>
              <div className="text-xs text-muted-foreground">{chars.length} character{chars.length !== 1 ? "s" : ""}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 border border-border">Char</th>
                      <th className="text-left p-2 border border-border">Codepoint</th>
                      <th className="text-left p-2 border border-border">Decimal</th>
                      <th className="text-left p-2 border border-border">UTF-8 Bytes</th>
                      <th className="text-left p-2 border border-border">Category</th>
                      <th className="p-2 border border-border"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {chars.map((c, i) => (
                      <tr key={i} className="border-b border-border hover:bg-muted/30">
                        <td className="p-2 border border-border text-base">
                          {c.codepoint < 0x20 || (c.codepoint >= 0x7f && c.codepoint < 0xa0) ? "·" : c.char}
                        </td>
                        <td className="p-2 border border-border text-primary">{c.hex}</td>
                        <td className="p-2 border border-border">{c.codepoint}</td>
                        <td className="p-2 border border-border">{c.utf8}</td>
                        <td className="p-2 border border-border text-muted-foreground">{c.name}</td>
                        <td className="p-2 border border-border">
                          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copy(c.hex)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
