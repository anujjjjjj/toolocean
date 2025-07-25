
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, Code, Minimize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/useHistory";

export function HtmlFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indentSize, setIndentSize] = useState("2");
  const { toast } = useToast();
  const { addToHistory } = useHistory();

  const formatHtml = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const formatted = formatHtmlString(input, parseInt(indentSize));
      setOutput(formatted);
      addToHistory('format', 'html-formatter', { input, output: formatted });
      
      toast({
        title: "HTML formatted",
        description: "HTML has been formatted successfully",
      });
    } catch (error) {
      toast({
        title: "Format failed",
        description: "Could not format HTML",
        variant: "destructive",
      });
    }
  };

  const minifyHtml = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const minified = input
      .replace(/>\s+</g, '><')
      .replace(/\s+/g, ' ')
      .trim();
    
    setOutput(minified);
    addToHistory('minify', 'html-formatter', { input, output: minified });
    
    toast({
      title: "HTML minified",
      description: "HTML has been minified successfully",
    });
  };

  const formatHtmlString = (html: string, indent: number): string => {
    const tab = ' '.repeat(indent);
    let result = '';
    let level = 0;
    let inTag = false;
    let tagName = '';
    
    // Self-closing tags
    const selfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    
    const lines = html.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      let i = 0;
      while (i < trimmed.length) {
        const char = trimmed[i];
        
        if (char === '<') {
          if (trimmed[i + 1] === '/') {
            // Closing tag
            level--;
            result += tab.repeat(level) + extractTag(trimmed, i) + '\n';
            i = trimmed.indexOf('>', i) + 1;
          } else {
            // Opening tag
            const tag = extractTag(trimmed, i);
            const tagNameMatch = tag.match(/<(\w+)/);
            tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';
            
            result += tab.repeat(level) + tag + '\n';
            
            if (!selfClosing.includes(tagName) && !tag.endsWith('/>')) {
              level++;
            }
            
            i = trimmed.indexOf('>', i) + 1;
          }
        } else {
          // Text content
          let textEnd = trimmed.indexOf('<', i);
          if (textEnd === -1) textEnd = trimmed.length;
          
          const text = trimmed.substring(i, textEnd).trim();
          if (text) {
            result += tab.repeat(level) + text + '\n';
          }
          
          i = textEnd;
        }
      }
    }
    
    return result.trim();
  };

  const extractTag = (html: string, start: number): string => {
    const end = html.indexOf('>', start);
    return html.substring(start, end + 1);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  const downloadHtml = () => {
    const blob = new Blob([output], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>HTML Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your HTML here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          
          <div className="flex gap-2">
            <Select value={indentSize} onValueChange={setIndentSize}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 spaces</SelectItem>
                <SelectItem value="4">4 spaces</SelectItem>
                <SelectItem value="8">8 spaces</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={formatHtml} className="flex-1">
              <Code className="h-4 w-4 mr-2" />
              Format
            </Button>
            <Button onClick={minifyHtml} variant="outline">
              <Minimize className="h-4 w-4 mr-2" />
              Minify
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Formatted Output
            {output && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadHtml}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={output}
            readOnly
            placeholder="Formatted HTML will appear here..."
            className="min-h-[300px] font-mono text-sm bg-muted/50"
          />
          
          {output && (
            <div className="mt-4 text-sm text-muted-foreground">
              <Badge variant="outline">{output.length} characters</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
