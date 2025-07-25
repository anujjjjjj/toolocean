
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/useHistory";

export function DuplicateRemoverTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [preserveOrder, setPreserveOrder] = useState(true);
  const { toast } = useToast();
  const { addToHistory } = useHistory();

  const removeDuplicates = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const lines = input.split('\n');
    const seen = new Set<string>();
    const result: string[] = [];

    for (const line of lines) {
      const key = caseSensitive ? line : line.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(line);
      }
    }

    if (!preserveOrder) {
      result.sort((a, b) => caseSensitive ? a.localeCompare(b) : a.toLowerCase().localeCompare(b.toLowerCase()));
    }

    const outputText = result.join('\n');
    setOutput(outputText);
    
    addToHistory('remove-duplicates', 'duplicate-remover', { 
      input, 
      output: outputText,
      originalCount: lines.length,
      uniqueCount: result.length
    });

    toast({
      title: "Duplicates removed",
      description: `Removed ${lines.length - result.length} duplicate lines`,
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter text with duplicate lines..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[300px]"
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
                id="preserve-order"
                checked={preserveOrder}
                onCheckedChange={setPreserveOrder}
              />
              <Label htmlFor="preserve-order">Preserve original order</Label>
            </div>
          </div>

          <Button onClick={removeDuplicates} className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Duplicates
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Unique Lines
            {output && (
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={output}
            readOnly
            placeholder="Unique lines will appear here..."
            className="min-h-[300px] bg-muted/50"
          />
          
          {output && (
            <div className="mt-4 flex gap-2">
              <Badge variant="outline">
                {output.split('\n').length} unique lines
              </Badge>
              <Badge variant="outline">
                {input.split('\n').length - output.split('\n').length} duplicates removed
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
