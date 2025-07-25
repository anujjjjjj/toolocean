
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/useHistory";

export function TextReplacerTool() {
  const [input, setInput] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [output, setOutput] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [replaceAll, setReplaceAll] = useState(true);
  const { toast } = useToast();
  const { addToHistory } = useHistory();

  const performReplace = () => {
    if (!input.trim() || !findText) {
      setOutput("");
      return;
    }

    try {
      let result = input;
      let replacements = 0;

      if (useRegex) {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(findText, replaceAll ? flags : flags.replace('g', ''));
        const matches = input.match(new RegExp(findText, flags));
        replacements = matches ? matches.length : 0;
        result = input.replace(regex, replaceText);
      } else {
        const searchValue = caseSensitive ? findText : findText.toLowerCase();
        const textToSearch = caseSensitive ? input : input.toLowerCase();
        
        if (replaceAll) {
          let startIndex = 0;
          result = input;
          
          while (true) {
            const index = textToSearch.indexOf(searchValue, startIndex);
            if (index === -1) break;
            
            result = result.substring(0, index) + replaceText + result.substring(index + findText.length);
            startIndex = index + replaceText.length;
            replacements++;
            
            // Update textToSearch to reflect the new text
            const newTextToSearch = caseSensitive ? result : result.toLowerCase();
            if (newTextToSearch !== textToSearch) {
              break; // Prevent infinite loop
            }
          }
        } else {
          const index = textToSearch.indexOf(searchValue);
          if (index !== -1) {
            result = input.substring(0, index) + replaceText + input.substring(index + findText.length);
            replacements = 1;
          }
        }
      }

      setOutput(result);

      // Add to history
      addToHistory({
        toolId: 'text-replacer',
        input,
        output: result,
        timestamp: new Date(),
        metadata: { 
          findText,
          replaceText,
          replacements,
          useRegex,
          caseSensitive
        }
      });

      toast({
        title: "Success",
        description: `Made ${replacements} replacement${replacements !== 1 ? 's' : ''}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: useRegex ? "Invalid regular expression" : "Replace operation failed",
        variant: "destructive",
      });
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
      <Card>
        <CardHeader>
          <CardTitle>Find and Replace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="find-text">Find</Label>
              <Input
                id="find-text"
                placeholder="Text to find..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="replace-text">Replace with</Label>
              <Input
                id="replace-text"
                placeholder="Replacement text..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                id="use-regex"
                checked={useRegex}
                onCheckedChange={setUseRegex}
              />
              <Label htmlFor="use-regex">Use regex</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="replace-all"
                checked={replaceAll}
                onCheckedChange={setReplaceAll}
              />
              <Label htmlFor="replace-all">Replace all</Label>
            </div>
          </div>

          <Button onClick={performReplace} className="w-full">
            Replace Text
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Original Text</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your text here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
            {input && (
              <div className="mt-2 text-sm text-muted-foreground">
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
              <div className="mt-2 text-sm text-muted-foreground">
                <Badge variant="outline">{output.length} characters</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
