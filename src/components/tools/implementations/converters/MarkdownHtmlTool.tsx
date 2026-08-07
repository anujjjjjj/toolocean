import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { marked } from "marked";
import TurndownService from "turndown";

const turndownService = new TurndownService();

export function MarkdownHtmlTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"md-to-html" | "html-to-md">("md-to-html");
  const { toast } = useToast();

  const convert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (mode === "md-to-html") {
        const html = marked.parse(input) as string;
        setOutput(html);
      } else {
        const markdown = turndownService.turndown(input);
        setOutput(markdown);
      }
    } catch (error) {
      toast({
        title: "Conversion Error",
        description: error instanceof Error ? error.message : "Failed to convert",
        variant: "destructive",
      });
      setOutput("");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard", description: "Content has been copied to your clipboard" });
    } catch {
      toast({ title: "Failed to copy", description: "Could not copy to clipboard", variant: "destructive" });
    }
  };

  const swapMode = () => {
    setMode(mode === "md-to-html" ? "html-to-md" : "md-to-html");
    setInput("");
    setOutput("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conversion Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{mode === "md-to-html" ? "Markdown → HTML" : "HTML → Markdown"}</span>
            <Button variant="outline" size="sm" onClick={swapMode}>
              <ArrowUpDown className="h-4 w-4" />
              Swap
            </Button>
          </div>
          <Button onClick={convert} className="w-full" disabled={!input.trim()}>
            Convert {mode === "md-to-html" ? "Markdown to HTML" : "HTML to Markdown"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "md-to-html" ? "Markdown Input" : "HTML Input"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={
                mode === "md-to-html"
                  ? "# Heading 1\n\nThis is a paragraph with **bold** and *italic* text.\n\n## Heading 2\n\n- List item 1\n- List item 2"
                  : '<h1>Heading 1</h1>\n<p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>\n<h2>Heading 2</h2>\n<ul>\n<li>List item 1</li>\n<li>List item 2</li>\n</ul>'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[600px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {mode === "md-to-html" ? "HTML Output" : "Markdown Output"}
              {output && (
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(output)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={output} readOnly placeholder="Converted output will appear here..." className="min-h-[600px] font-mono text-sm bg-muted/50" />
            {output && <div className="mt-4 text-sm text-muted-foreground">Characters: {output.length.toLocaleString()}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
