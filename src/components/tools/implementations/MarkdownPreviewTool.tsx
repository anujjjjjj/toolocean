import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

const DEFAULT_MD = `# Hello, Markdown!

Write **bold**, *italic*, or \`inline code\`.

## Lists

- Item one
- Item two
  - Nested item

## Code Block

\`\`\`typescript
const greet = (name: string) => \`Hello, \${name}!\`;
console.log(greet("World"));
\`\`\`

## Table

| Name   | Age |
|--------|-----|
| Alice  | 30  |
| Bob    | 25  |

> Blockquote here
`;

export function MarkdownPreviewTool() {
  const [md, setMd] = useState(DEFAULT_MD);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setMd(ev.target?.result as string);
    reader.readAsText(file);
    e.target.value = "";
  };

  const copy = () => {
    navigator.clipboard.writeText(md);
    toast({ title: "Markdown copied!" });
  };

  const downloadMd = () => {
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const html = marked(md) as string;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept=".md,.markdown,.txt" className="hidden" onChange={handleFileUpload} />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Upload .md file
        </Button>
        <Button variant="outline" size="sm" onClick={copy}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Markdown
        </Button>
        <Button variant="outline" size="sm" onClick={downloadMd}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      <Tabs defaultValue="split">
        <TabsList>
          <TabsTrigger value="split">Split</TabsTrigger>
          <TabsTrigger value="editor">Editor only</TabsTrigger>
          <TabsTrigger value="preview">Preview only</TabsTrigger>
        </TabsList>

        <TabsContent value="split">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Markdown</CardTitle></CardHeader>
              <CardContent>
                <Textarea
                  value={md}
                  onChange={(e) => setMd(e.target.value)}
                  className="min-h-[600px] font-mono text-sm"
                  placeholder="Write Markdown here..."
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Preview</CardTitle></CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none min-h-[600px]"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="editor">
          <Card>
            <CardContent className="pt-4">
              <Textarea
                value={md}
                onChange={(e) => setMd(e.target.value)}
                className="min-h-[700px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardContent className="pt-4">
              <div
                className="prose prose-sm dark:prose-invert max-w-none min-h-[700px]"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
