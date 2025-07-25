
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useHistory } from "@/hooks/useHistory";

export function RegexTesterTool() {
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState("");
  const [flags, setFlags] = useState({ global: true, ignoreCase: false, multiline: false });
  const [matches, setMatches] = useState<RegExpMatchArray[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState("");
  const { addToHistory } = useHistory();

  const testRegex = () => {
    if (!pattern || !testString) {
      setMatches([]);
      setIsValid(true);
      setError("");
      return;
    }

    try {
      const flagString = `${flags.global ? 'g' : ''}${flags.ignoreCase ? 'i' : ''}${flags.multiline ? 'm' : ''}`;
      const regex = new RegExp(pattern, flagString);
      
      let allMatches: RegExpMatchArray[] = [];
      
      if (flags.global) {
        let match;
        while ((match = regex.exec(testString)) !== null) {
          allMatches.push(match);
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      } else {
        const match = regex.exec(testString);
        if (match) {
          allMatches.push(match);
        }
      }
      
      setMatches(allMatches);
      setIsValid(true);
      setError("");

      // Add to history
      addToHistory({
        toolId: 'regex-tester',
        input: `Pattern: ${pattern}\nTest: ${testString}`,
        output: `${allMatches.length} matches found`,
        timestamp: new Date(),
        metadata: { pattern, matchCount: allMatches.length, flags }
      });
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : "Invalid regex");
      setMatches([]);
    }
  };

  // Test regex in real-time
  React.useEffect(() => {
    const timeoutId = setTimeout(testRegex, 300);
    return () => clearTimeout(timeoutId);
  }, [pattern, testString, flags]);

  const highlightMatches = (text: string, matches: RegExpMatchArray[]) => {
    if (matches.length === 0) return text;
    
    let result = text;
    let offset = 0;
    
    matches.forEach((match, index) => {
      const start = match.index! + offset;
      const end = start + match[0].length;
      const highlighted = `<mark class="bg-yellow-200 dark:bg-yellow-800">${match[0]}</mark>`;
      result = result.slice(0, start) + highlighted + result.slice(end);
      offset += highlighted.length - match[0].length;
    });
    
    return result;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Regex Tester
            {pattern && (
              <Badge variant={isValid ? "default" : "destructive"}>
                {isValid ? "Valid" : "Invalid"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pattern">Regular Expression Pattern</Label>
            <Input
              id="pattern"
              placeholder="Enter regex pattern (e.g., \d+)"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="font-mono"
            />
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="global"
                checked={flags.global}
                onCheckedChange={(checked) => setFlags(prev => ({ ...prev, global: checked }))}
              />
              <Label htmlFor="global">Global (g)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="ignoreCase"
                checked={flags.ignoreCase}
                onCheckedChange={(checked) => setFlags(prev => ({ ...prev, ignoreCase: checked }))}
              />
              <Label htmlFor="ignoreCase">Ignore Case (i)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="multiline"
                checked={flags.multiline}
                onCheckedChange={(checked) => setFlags(prev => ({ ...prev, multiline: checked }))}
              />
              <Label htmlFor="multiline">Multiline (m)</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="test-string">Test String</Label>
            <Textarea
              id="test-string"
              placeholder="Enter text to test against..."
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              className="h-32 font-mono"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Results ({matches.length} match{matches.length !== 1 ? 'es' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testString && (
              <div>
                <Label>Highlighted Text</Label>
                <div 
                  className="p-3 bg-muted rounded font-mono text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightMatches(testString, matches) 
                  }}
                />
              </div>
            )}
            
            {matches.length > 0 && (
              <div>
                <Label>Match Details</Label>
                <div className="space-y-2">
                  {matches.map((match, index) => (
                    <div key={index} className="p-3 bg-muted rounded">
                      <div className="font-mono text-sm">
                        <div><strong>Match {index + 1}:</strong> "{match[0]}"</div>
                        <div><strong>Position:</strong> {match.index} - {match.index! + match[0].length - 1}</div>
                        {match.length > 1 && (
                          <div><strong>Groups:</strong> {match.slice(1).map((group, i) => `$${i + 1}: "${group}"`).join(', ')}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
