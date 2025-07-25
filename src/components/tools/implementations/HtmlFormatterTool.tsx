
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/useHistory";

export function HtmlFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState("beautify");
  const [indentSize, setIndentSize] = useState("2");
  const { toast } = useToast();
  const { addToHistory } = useHistory();

  const beautifyHTML = (html: string, indent: string): string => {
    let result = '';
    let indentLevel = 0;
    const indentStr = indent === 'tab' ? '\t' : ' '.repeat(parseInt(indent));
    
    // Remove extra whitespace
    html = html.replace(/\s+/g, ' ').trim();
    
    // Split by tags
    const tokens = html.split(/(<[^>]*>)/);
    
    for (const token of tokens) {
      if (token.trim() === '') continue;
      
      if (token.startsWith('<')) {
        if (token.startsWith('</')) {
          // Closing tag
          indentLevel--;
          result += indentStr.repeat(Math.max(0, indentLevel)) + token + '\n';
        } else if (token.endsWith('/>')) {
          // Self-closing tag
          result += indentStr.repeat(indentLevel) + token + '\n';
        } else {
          // Opening tag
          result += indentStr.repeat(indentLevel) + token + '\n';
          indentLevel++;
        }
      } else {
        // Text content
        if (token.trim()) {
          result += indentStr.repeat(indentLevel) + token.trim() + '\n';
        }
      }
    }
    
    return result.trim();
  };

  const minifyHTML = (html: string): string => {
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/^\s+|\s+$/g, '');
  };

  const formatHTML = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const result = mode === "beautify" ? beautifyHTML(input, indentSize) : minifyHTML(input);
      setOutput(result);

      // Add to history
      addToHistory({
        toolId: 'html-formatter',
        input,
        output: result,
        timestamp: new Date(),
        metadata: { mode, indentSize }
      });

      toast({
        title: "Success",
        description: `HTML ${mode === "beautify" ? "beautified" : "minified"} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to format HTML",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied to clipboard",
        description: "HTML has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadHTML = () => {
    if (!output) return;
    
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
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beautify">Beautify</SelectItem>
                <SelectItem value="minify">Minify</SelectItem>
              </SelectContent>
            </Select>
            
            {mode === "beautify" && (
              <Select value={indentSize} onValueChange={setIndentSize}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 spaces</SelectItem>
                  <SelectItem value="4">4 spaces</SelectItem>
                  <SelectItem value="8">8 spaces</SelectItem>
                  <SelectItem value="tab">Tab</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <Button onClick={formatHTML} className="flex-1">
              Format HTML
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Formatted HTML
            {output && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadHTML}>
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
              <div className="flex justify-between">
                <span>Characters: {output.length.toLocaleString()}</span>
                <span>Lines: {output.split('\n').length}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
