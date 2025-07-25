
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useHistory } from "@/hooks/useHistory";

export function TextDiffTool() {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [diff, setDiff] = useState<Array<{line: string, type: 'equal' | 'insert' | 'delete', lineNumber?: number}>>([]);
  const { addToHistory } = useHistory();

  const calculateDiff = () => {
    const leftLines = leftText.split('\n');
    const rightLines = rightText.split('\n');
    const maxLines = Math.max(leftLines.length, rightLines.length);
    const result: Array<{line: string, type: 'equal' | 'insert' | 'delete', lineNumber?: number}> = [];

    for (let i = 0; i < maxLines; i++) {
      const leftLine = leftLines[i] || '';
      const rightLine = rightLines[i] || '';

      if (leftLine === rightLine) {
        result.push({ line: leftLine, type: 'equal', lineNumber: i + 1 });
      } else {
        if (leftLine && !rightLine) {
          result.push({ line: leftLine, type: 'delete', lineNumber: i + 1 });
        } else if (!leftLine && rightLine) {
          result.push({ line: rightLine, type: 'insert', lineNumber: i + 1 });
        } else {
          result.push({ line: leftLine, type: 'delete', lineNumber: i + 1 });
          result.push({ line: rightLine, type: 'insert', lineNumber: i + 1 });
        }
      }
    }

    setDiff(result);
    
    // Add to history
    addToHistory({
      toolId: 'text-diff',
      input: `Text 1: ${leftText.substring(0, 50)}...\nText 2: ${rightText.substring(0, 50)}...`,
      output: `${result.filter(r => r.type === 'insert').length} additions, ${result.filter(r => r.type === 'delete').length} deletions`,
      timestamp: new Date(),
      metadata: { 
        additions: result.filter(r => r.type === 'insert').length,
        deletions: result.filter(r => r.type === 'delete').length
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Original Text</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter original text here..."
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
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
              placeholder="Enter modified text here..."
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button onClick={calculateDiff} className="w-full max-w-md">
          Compare Texts
        </Button>
      </div>

      {diff.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Differences
              <Badge variant="destructive">
                {diff.filter(d => d.type === 'delete').length} deletions
              </Badge>
              <Badge variant="default">
                {diff.filter(d => d.type === 'insert').length} additions
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
              {diff.map((item, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    item.type === 'equal' ? 'bg-background' :
                    item.type === 'insert' ? 'bg-green-100 dark:bg-green-900/20' :
                    'bg-red-100 dark:bg-red-900/20'
                  }`}
                >
                  <span className="text-muted-foreground mr-2">
                    {item.lineNumber}:
                  </span>
                  <span className={
                    item.type === 'insert' ? 'text-green-700 dark:text-green-300' :
                    item.type === 'delete' ? 'text-red-700 dark:text-red-300' :
                    ''
                  }>
                    {item.type === 'insert' ? '+ ' : item.type === 'delete' ? '- ' : '  '}
                    {item.line}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
