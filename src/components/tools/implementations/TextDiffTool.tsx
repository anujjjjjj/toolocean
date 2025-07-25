
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { GitCompare, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/useHistory";

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

export function TextDiffTool() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [diff, setDiff] = useState<DiffLine[]>([]);
  const { toast } = useToast();
  const { addToHistory } = useHistory();

  const calculateDiff = () => {
    if (!text1 && !text2) {
      setDiff([]);
      return;
    }

    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const result: DiffLine[] = [];

    // Simple diff algorithm
    let i = 0, j = 0;
    while (i < lines1.length || j < lines2.length) {
      if (i >= lines1.length) {
        result.push({ type: 'added', content: lines2[j], lineNumber: j + 1 });
        j++;
      } else if (j >= lines2.length) {
        result.push({ type: 'removed', content: lines1[i], lineNumber: i + 1 });
        i++;
      } else if (lines1[i] === lines2[j]) {
        result.push({ type: 'unchanged', content: lines1[i], lineNumber: i + 1 });
        i++;
        j++;
      } else {
        // Look ahead to see if there's a match
        let foundMatch = false;
        for (let k = j + 1; k < Math.min(j + 5, lines2.length); k++) {
          if (lines1[i] === lines2[k]) {
            // Add the intermediate lines as added
            for (let l = j; l < k; l++) {
              result.push({ type: 'added', content: lines2[l], lineNumber: l + 1 });
            }
            result.push({ type: 'unchanged', content: lines1[i], lineNumber: i + 1 });
            i++;
            j = k + 1;
            foundMatch = true;
            break;
          }
        }
        
        if (!foundMatch) {
          result.push({ type: 'removed', content: lines1[i], lineNumber: i + 1 });
          i++;
        }
      }
    }

    setDiff(result);
    addToHistory('compare', 'text-diff', { text1, text2, diffCount: result.length });
  };

  const getStats = () => {
    const added = diff.filter(d => d.type === 'added').length;
    const removed = diff.filter(d => d.type === 'removed').length;
    const unchanged = diff.filter(d => d.type === 'unchanged').length;
    return { added, removed, unchanged };
  };

  const stats = getStats();

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
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
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
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Compare Texts
            </div>
            <Button onClick={calculateDiff}>
              Generate Diff
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diff.length > 0 && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Plus className="h-3 w-3 text-green-500" />
                  {stats.added} added
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Minus className="h-3 w-3 text-red-500" />
                  {stats.removed} removed
                </Badge>
                <Badge variant="outline">
                  {stats.unchanged} unchanged
                </Badge>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/20 max-h-96 overflow-y-auto">
                {diff.map((line, index) => (
                  <div
                    key={index}
                    className={`font-mono text-sm p-1 ${
                      line.type === 'added' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                      line.type === 'removed' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                      'text-muted-foreground'
                    }`}
                  >
                    <span className="inline-block w-8 text-right mr-2 text-xs text-muted-foreground">
                      {line.lineNumber}
                    </span>
                    <span className="inline-block w-4 mr-2">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    {line.content || ' '}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
