import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Download, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function TextReplacerTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [globalReplace, setGlobalReplace] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const performReplace = () => {
    if (!input || !searchText) {
      setOutput(input);
      setError("");
      return;
    }

    try {
      let result = input;
      let matchCount = 0;

      if (useRegex) {
        const flags = `${globalReplace ? 'g' : ''}${caseSensitive ? '' : 'i'}`;
        const regex = new RegExp(searchText, flags);
        
        // Count matches first
        const matches = input.match(regex);
        matchCount = matches ? matches.length : 0;
        
        result = input.replace(regex, replaceText);
      } else {
        if (globalReplace) {
          const searchRegex = new RegExp(
            searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            caseSensitive ? 'g' : 'gi'
          );
          const matches = input.match(searchRegex);
          matchCount = matches ? matches.length : 0;
          result = input.replace(searchRegex, replaceText);
        } else {
          const searchRegex = new RegExp(
            searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            caseSensitive ? '' : 'i'
          );
          if (searchRegex.test(input)) {
            matchCount = 1;
            result = input.replace(searchRegex, replaceText);
          }
        }
      }

      setOutput(result);
      setError("");
      
      if (matchCount > 0) {
        toast({
          title: "Text replaced",
          description: `Made ${matchCount} replacement${matchCount === 1 ? '' : 's'}`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid regular expression");
      setOutput("");
    }
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
    a.download = 'replaced-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Search and Replace Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Find and Replace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Find</Label>
              <Input
                id="search"
                placeholder="Enter text to find..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="replace">Replace with</Label>
              <Input
                id="replace"
                placeholder="Enter replacement text..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="regex"
                checked={useRegex}
                onCheckedChange={setUseRegex}
              />
              <Label htmlFor="regex">Use Regex</Label>
            </div>
            
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
                id="global"
                checked={globalReplace}
                onCheckedChange={setGlobalReplace}
              />
              <Label htmlFor="global">Replace all</Label>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button onClick={performReplace} className="w-full" disabled={!searchText}>
            {globalReplace ? 'Replace All' : 'Replace First'}
          </Button>
        </CardContent>
      </Card>

      {/* Input and Output */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Original Text</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter text to process..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
            
            {input && (
              <div className="mt-4 text-sm text-muted-foreground">
                <Badge variant="outline">{input.length} characters</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Replaced Text
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
              placeholder="Replaced text will appear here..."
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
    </div>
  );
}