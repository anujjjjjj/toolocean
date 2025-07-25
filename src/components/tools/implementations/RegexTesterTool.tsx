
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/useHistory";

interface Match {
  match: string;
  index: number;
  groups: string[];
}

export function RegexTesterTool() {
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState("");
  const [flags, setFlags] = useState({
    global: true,
    ignoreCase: false,
    multiline: false
  });
  const [matches, setMatches] = useState<Match[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { addToHistory } = useHistory();

  const testRegex = () => {
    if (!pattern || !testString) {
      toast({
        title: "Missing input",
        description: "Please provide both pattern and test string",
        variant: "destructive",
      });
      return;
    }

    try {
      const flagString = (flags.global ? 'g' : '') + 
                        (flags.ignoreCase ? 'i' : '') + 
                        (flags.multiline ? 'm' : '');
      
      const regex = new RegExp(pattern, flagString);
      const results: Match[] = [];
      
      if (flags.global) {
        let match;
        while ((match = regex.exec(testString)) !== null) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1)
          });
        }
      } else {
        const match = regex.exec(testString);
        if (match) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1)
          });
        }
      }
      
      setMatches(results);
      setIsValid(true);
      setError("");
      
      addToHistory('test', 'regex-tester', { 
        pattern, 
        testString, 
        flags, 
        matchCount: results.length 
      });
      
      toast({
        title: "Regex tested",
        description: `Found ${results.length} matches`,
      });
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : "Invalid regex pattern");
      setMatches([]);
      
      toast({
        title: "Invalid regex",
        description: "Please check your regex pattern",
        variant: "destructive",
      });
    }
  };

  const copyMatches = () => {
    const matchText = matches.map(m => m.match).join('\n');
    navigator.clipboard.writeText(matchText);
    toast({ title: "Matches copied to clipboard!" });
  };

  const getHighlightedText = () => {
    if (!matches.length || !testString) return testString;
    
    let result = testString;
    let offset = 0;
    
    matches.forEach(match => {
      const start = match.index + offset;
      const end = start + match.match.length;
      const highlighted = `<mark class="bg-yellow-200 dark:bg-yellow-800">${match.match}</mark>`;
      result = result.substring(0, start) + highlighted + result.substring(end);
      offset += highlighted.length - match.match.length;
    });
    
    return result;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Regex Pattern</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <span className="text-2xl font-mono">/</span>
            <Input
              placeholder="Enter regex pattern..."
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="flex-1 font-mono"
            />
            <span className="text-2xl font-mono">/</span>
            <span className="text-sm text-muted-foreground self-center">
              {(flags.global ? 'g' : '') + (flags.ignoreCase ? 'i' : '') + (flags.multiline ? 'm' : '')}
            </span>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="global"
                checked={flags.global}
                onCheckedChange={(checked) => setFlags({...flags, global: checked})}
              />
              <Label htmlFor="global">Global (g)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="ignore-case"
                checked={flags.ignoreCase}
                onCheckedChange={(checked) => setFlags({...flags, ignoreCase: checked})}
              />
              <Label htmlFor="ignore-case">Ignore case (i)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="multiline"
                checked={flags.multiline}
                onCheckedChange={(checked) => setFlags({...flags, multiline: checked})}
              />
              <Label htmlFor="multiline">Multiline (m)</Label>
            </div>
          </div>

          {error && (
            <div className="text-destructive text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test String</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter text to test against..."
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            
            <Button onClick={testRegex} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Test Regex
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Matches
              {matches.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{matches.length} matches</Badge>
                  <Button variant="outline" size="sm" onClick={copyMatches}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matches.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {matches.map((match, index) => (
                  <div key={index} className="p-2 border rounded text-sm">
                    <div className="font-mono font-bold">{match.match}</div>
                    <div className="text-muted-foreground">
                      Index: {match.index}
                      {match.groups.length > 0 && (
                        <div>Groups: {match.groups.join(', ')}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-8">
                No matches found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {testString && (
        <Card>
          <CardHeader>
            <CardTitle>Highlighted Text</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="p-4 bg-muted/20 rounded border min-h-[100px] font-mono text-sm whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
