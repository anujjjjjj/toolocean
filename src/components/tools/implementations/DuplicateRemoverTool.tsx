import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DuplicateRemoverTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [trimLines, setTrimLines] = useState(true);
  const { toast } = useToast();

  const removeDuplicates = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const lines = input.split('\n');
    const seen = new Set();
    const result = [];
    let duplicatesCount = 0;

    for (const line of lines) {
      const processedLine = trimLines ? line.trim() : line;
      const keyLine = caseSensitive ? processedLine : processedLine.toLowerCase();
      
      if (!seen.has(keyLine)) {
        seen.add(keyLine);
        result.push(line);
      } else {
        duplicatesCount++;
      }
    }

    setOutput(result.join('\n'));
    
    toast({
      title: "Duplicates removed",
      description: `Removed ${duplicatesCount} duplicate lines`,
    });
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
    a.download = 'deduplicated.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputLines = input.split('\n').length;
  const outputLines = output.split('\n').filter(line => line.trim()).length;
  const removedLines = inputLines - outputLines;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter text with duplicate lines..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="case-sensitive"
                checked={caseSensitive}
                onCheckedChange={setCaseSensitive}
              />
              <Label htmlFor="case-sensitive">Case sensitive</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="trim-lines"
                checked={trimLines}
                onCheckedChange={setTrimLines}
              />
              <Label htmlFor="trim-lines">Trim whitespace</Label>
            </div>
          </div>

          <Button onClick={removeDuplicates} className="w-full">
            Remove Duplicates
          </Button>

          {input && (
            <div className="text-sm text-muted-foreground">
              <Badge variant="outline">{inputLines} total lines</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Unique Lines
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
            placeholder="Unique lines will appear here..."
            className="min-h-[300px] font-mono text-sm bg-muted/50"
          />
          
          {output && (
            <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
              <Badge variant="outline">{outputLines} unique lines</Badge>
              <Badge variant="outline" className="text-red-600">
                {removedLines} duplicates removed
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}