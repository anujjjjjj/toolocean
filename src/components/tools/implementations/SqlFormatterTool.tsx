import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SqlFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indentSize, setIndentSize] = useState("2");
  const { toast } = useToast();

  const formatSql = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const formatted = formatSqlString(input, parseInt(indentSize));
    setOutput(formatted);
  };

  const minifySql = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const minified = input
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\s*([(),;])\s*/g, '$1') // Remove spaces around punctuation
      .trim();
    
    setOutput(minified);
  };

  const formatSqlString = (sql: string, indentSize: number): string => {
    const tab = ' '.repeat(indentSize);
    
    // SQL keywords that should start new lines
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
      'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET', 'UNION', 'UNION ALL',
      'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'ALTER', 'DROP',
      'INDEX', 'TABLE', 'DATABASE', 'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER',
      'IF', 'ELSE', 'ELSIF', 'END IF', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
      'BEGIN', 'END', 'DECLARE', 'CURSOR', 'FOR', 'WHILE', 'LOOP', 'END LOOP'
    ];

    // Clean and normalize the SQL
    let formatted = sql
      .replace(/\s+/g, ' ')
      .trim();

    // Add line breaks before major keywords
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword}`);
    });

    // Split into lines and process
    const lines = formatted.split('\n');
    const result = [];
    let indentLevel = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Decrease indent for certain keywords
      if (/^(END|ELSE|ELSIF|WHEN|THEN|\)|UNION)/i.test(line)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Add the line with proper indentation
      result.push(tab.repeat(indentLevel) + line);

      // Increase indent for certain keywords
      if (/^(SELECT|FROM|WHERE|JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|GROUP BY|HAVING|ORDER BY|CASE|BEGIN|IF|FOR|WHILE|LOOP|\()/i.test(line)) {
        indentLevel++;
      }
    }

    return result.join('\n');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied to clipboard",
        description: "SQL has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadSql = () => {
    if (!output) return;
    
    const blob = new Blob([output], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle>SQL Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your SQL query here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />

          <div className="flex gap-2">
            <Select value={indentSize} onValueChange={setIndentSize}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 spaces</SelectItem>
                <SelectItem value="4">4 spaces</SelectItem>
                <SelectItem value="8">8 spaces</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={formatSql} className="flex-1">
              Format
            </Button>
            <Button onClick={minifySql} variant="outline">
              Minify
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Output Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Formatted SQL
            {output && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadSql}>
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
            placeholder="Formatted SQL will appear here..."
            className="min-h-[300px] font-mono text-sm bg-muted/50"
          />
          
          {output && (
            <div className="mt-4 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Characters: {output.length.toLocaleString()}</span>
                <span>Lines: {output.split('\n').length}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}