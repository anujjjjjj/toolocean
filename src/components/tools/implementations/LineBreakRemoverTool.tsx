import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LineBreakRemoverTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [preserveSpaces, setPreserveSpaces] = useState(true);
  const [removeParagraphBreaks, setRemoveParagraphBreaks] = useState(false);
  const { toast } = useToast();

  const removeLineBreaks = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    let result = input;

    if (removeParagraphBreaks) {
      // Remove all line breaks
      result = result.replace(/\r?\n/g, preserveSpaces ? ' ' : '');
    } else {
      // Only remove single line breaks, preserve paragraph breaks (double line breaks)
      result = result.replace(/(?<!\n)\r?\n(?!\r?\n)/g, preserveSpaces ? ' ' : '');
    }

    // Clean up multiple spaces if preserveSpaces is false
    if (!preserveSpaces) {
      result = result.replace(/\s+/g, ' ').trim();
    }

    setOutput(result);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied to clipboard",
        description: "Text has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadText = () => {
    if (!output) return;
    
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'single-line.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputLines = input.split('\n').length;
  const outputLines = output.split('\n').length;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-line Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter multi-line text here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="preserve-spaces"
                checked={preserveSpaces}
                onCheckedChange={setPreserveSpaces}
              />
              <Label htmlFor="preserve-spaces">Replace line breaks with spaces</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="paragraph-breaks"
                checked={removeParagraphBreaks}
                onCheckedChange={setRemoveParagraphBreaks}
              />
              <Label htmlFor="paragraph-breaks">Remove paragraph breaks too</Label>
            </div>
          </div>

          <Button onClick={removeLineBreaks} className="w-full">
            Remove Line Breaks
          </Button>

          {input && (
            <div className="text-sm text-muted-foreground">
              <Badge variant="outline">{inputLines} lines</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Single Line Text
            {output && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadText}>
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
            placeholder="Single line text will appear here..."
            className="min-h-[300px] font-mono text-sm bg-muted/50"
          />
          
          {output && (
            <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
              <Badge variant="outline">{outputLines} lines</Badge>
              <Badge variant="outline">{output.length} characters</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}