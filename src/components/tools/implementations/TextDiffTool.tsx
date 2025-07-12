import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function TextDiffTool() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");

  const diff = useMemo(() => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    
    const result = [];
    let additions = 0;
    let deletions = 0;
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 === line2) {
        result.push({ type: 'unchanged', line1, line2, lineNumber: i + 1 });
      } else if (line1 && !line2) {
        result.push({ type: 'removed', line1, line2: '', lineNumber: i + 1 });
        deletions++;
      } else if (!line1 && line2) {
        result.push({ type: 'added', line1: '', line2, lineNumber: i + 1 });
        additions++;
      } else {
        result.push({ type: 'changed', line1, line2, lineNumber: i + 1 });
        deletions++;
        additions++;
      }
    }
    
    return { result, additions, deletions };
  }, [text1, text2]);

  const clearAll = () => {
    setText1("");
    setText2("");
  };

  const getLineClass = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-500/10 border-l-4 border-green-500';
      case 'removed':
        return 'bg-red-500/10 border-l-4 border-red-500';
      case 'changed':
        return 'bg-yellow-500/10 border-l-4 border-yellow-500';
      default:
        return 'bg-muted/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Panels */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Original Text</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter original text..."
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modified Text</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter modified text..."
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>

      {/* Diff Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Diff Results
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600">
                +{diff.additions} additions
              </Badge>
              <Badge variant="outline" className="text-red-600">
                -{diff.deletions} deletions
              </Badge>
              <Button variant="outline" size="sm" onClick={clearAll}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diff.result.length > 0 ? (
            <div className="space-y-1 font-mono text-sm max-h-[500px] overflow-y-auto">
              {diff.result.map((item, index) => (
                <div key={index} className={`p-2 rounded ${getLineClass(item.type)}`}>
                  <div className="flex text-xs text-muted-foreground mb-1">
                    Line {item.lineNumber}
                    {item.type !== 'unchanged' && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {item.type}
                      </Badge>
                    )}
                  </div>
                  {item.type === 'changed' ? (
                    <div className="space-y-1">
                      <div className="text-red-600">- {item.line1}</div>
                      <div className="text-green-600">+ {item.line2}</div>
                    </div>
                  ) : item.type === 'removed' ? (
                    <div className="text-red-600">- {item.line1}</div>
                  ) : item.type === 'added' ? (
                    <div className="text-green-600">+ {item.line2}</div>
                  ) : (
                    <div className="text-muted-foreground">  {item.line1}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Enter text in both fields to see differences
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}