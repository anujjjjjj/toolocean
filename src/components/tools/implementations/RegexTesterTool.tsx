import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RegexTesterTool() {
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState("");
  const [flags, setFlags] = useState({
    global: true,
    ignoreCase: false,
    multiline: false,
    dotAll: false,
    unicode: false,
    sticky: false
  });
  const [error, setError] = useState("");
  const { toast } = useToast();

  const results = useMemo(() => {
    if (!pattern || !testString) {
      return { matches: [], isValid: false, regex: null };
    }

    try {
      const flagString = Object.entries(flags)
        .filter(([_, enabled]) => enabled)
        .map(([flag, _]) => {
          switch (flag) {
            case 'global': return 'g';
            case 'ignoreCase': return 'i';
            case 'multiline': return 'm';
            case 'dotAll': return 's';
            case 'unicode': return 'u';
            case 'sticky': return 'y';
            default: return '';
          }
        })
        .join('');

      const regex = new RegExp(pattern, flagString);
      const matches = Array.from(testString.matchAll(regex));
      
      setError("");
      return { matches, isValid: true, regex };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid regular expression");
      return { matches: [], isValid: false, regex: null };
    }
  }, [pattern, testString, flags]);

  const highlightMatches = () => {
    if (!results.matches.length) return testString;

    let highlighted = testString;
    let offset = 0;

    results.matches.forEach((match) => {
      const start = match.index! + offset;
      const end = start + match[0].length;
      const before = highlighted.slice(0, start);
      const matchText = highlighted.slice(start, end);
      const after = highlighted.slice(end);
      
      highlighted = `${before}<mark class="bg-yellow-200 dark:bg-yellow-900">${matchText}</mark>${after}`;
      offset += 47; // Length of mark tags
    });

    return highlighted;
  };

  const copyPattern = async () => {
    try {
      await navigator.clipboard.writeText(pattern);
      toast({
        title: "Copied to clipboard",
        description: "Regex pattern has been copied",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const updateFlag = (flag: keyof typeof flags) => {
    setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
  };

  return (
    <div className="space-y-6">
      {/* Pattern Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Regular Expression Pattern
            {pattern && (
              <Button variant="outline" size="sm" onClick={copyPattern}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Pattern
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter your regex pattern..."
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="font-mono"
          />
          
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="global"
                checked={flags.global}
                onCheckedChange={() => updateFlag('global')}
              />
              <Label htmlFor="global">Global (g)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="ignoreCase"
                checked={flags.ignoreCase}
                onCheckedChange={() => updateFlag('ignoreCase')}
              />
              <Label htmlFor="ignoreCase">Ignore case (i)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="multiline"
                checked={flags.multiline}
                onCheckedChange={() => updateFlag('multiline')}
              />
              <Label htmlFor="multiline">Multiline (m)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="dotAll"
                checked={flags.dotAll}
                onCheckedChange={() => updateFlag('dotAll')}
              />
              <Label htmlFor="dotAll">Dot all (s)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="unicode"
                checked={flags.unicode}
                onCheckedChange={() => updateFlag('unicode')}
              />
              <Label htmlFor="unicode">Unicode (u)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="sticky"
                checked={flags.sticky}
                onCheckedChange={() => updateFlag('sticky')}
              />
              <Label htmlFor="sticky">Sticky (y)</Label>
            </div>
          </div>
          
          {pattern && results.isValid && (
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Regex:</Label>
              <code className="block mt-1 font-mono text-sm">
                /{pattern}/{Object.entries(flags).filter(([_, enabled]) => enabled).map(([flag]) => {
                  switch (flag) {
                    case 'global': return 'g';
                    case 'ignoreCase': return 'i';
                    case 'multiline': return 'm';
                    case 'dotAll': return 's';
                    case 'unicode': return 'u';
                    case 'sticky': return 'y';
                    default: return '';
                  }
                }).join('')}
              </code>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test String and Results */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test String</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter text to test against your regex..."
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Results
              {results.matches.length > 0 && (
                <Badge variant="default">
                  {results.matches.length} match{results.matches.length === 1 ? '' : 'es'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testString && pattern ? (
              results.isValid ? (
                <>
                  <div 
                    className="min-h-[200px] p-3 border rounded-md bg-muted/30 font-mono text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: highlightMatches() }}
                  />
                  
                  {results.matches.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Matches:</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {results.matches.map((match, index) => (
                          <div key={index} className="text-xs p-2 bg-muted rounded">
                            <div><strong>Match {index + 1}:</strong> "{match[0]}"</div>
                            <div><strong>Index:</strong> {match.index}</div>
                            {match.length > 1 && (
                              <div><strong>Groups:</strong> {match.slice(1).join(', ')}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Fix the regex pattern to see results
                </div>
              )
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Enter a regex pattern and test string to see results
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}