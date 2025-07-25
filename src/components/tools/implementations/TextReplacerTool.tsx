
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Search, Replace } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/useHistory";

export function TextReplacerTool() {
  const [input, setInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [output, setOutput] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [replaceCount, setReplaceCount] = useState(0);
  const { toast } = useToast();
  const { addToHistory } = useHistory();

  const performReplace = () => {
    if (!input || !searchText) {
      toast({
        title: "Missing input",
        description: "Please provide both text and search term",
        variant: "destructive",
      });
      return;
    }

    try {
      let result = input;
      let count = 0;

      if (useRegex) {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(searchText, flags);
        const matches = result.match(regex);
        count = matches ? matches.length : 0;
        result = result.replace(regex, replaceText);
      } else {
        if (caseSensitive) {
          const parts = result.split(searchText);
          count = parts.length - 1;
          result = parts.join(replaceText);
        } else {
          const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const matches = result.match(regex);
          count = matches ? matches.length : 0;
          result = result.replace(regex, replaceText);
        }
      }

      setOutput(result);
      setReplaceCount(count);
      
      addToHistory('replace', 'text-replacer', { 
        input, 
        searchText, 
        replaceText, 
        output: result,
        count
      });

      toast({
        title: "Replace completed",
        description: `Made ${count} replacements`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: useRegex ? "Invalid regular expression" : "Replace failed",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="space-y-6">
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
                placeholder="Text to find..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="replace">Replace with</Label>
              <Input
                id="replace"
                placeholder="Replacement text..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
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
              <Label htmlFor="use-regex">Use regular expressions</Label>
            </div>
          </div>

          <Button onClick={performReplace} className="w-full">
            <Replace className="h-4 w-4 mr-2" />
            Replace All
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
              placeholder="Enter text to search and replace..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[300px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Modified Text
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
              placeholder="Modified text will appear here..."
              className="min-h-[300px] bg-muted/50"
            />
            
            {output && (
              <div className="mt-4">
                <Badge variant="outline">
                  {replaceCount} replacements made
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
