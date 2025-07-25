
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/useHistory";

export function SqlFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState("format");
  const { toast } = useToast();
  const { addToHistory } = useHistory();

  const formatSQL = (sql: string): string => {
    const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX', 'VIEW', 'FUNCTION', 'PROCEDURE', 'TRIGGER', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'TRUE', 'FALSE', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'EXISTS', 'BETWEEN', 'LIKE', 'IN', 'UNION', 'INTERSECT', 'EXCEPT'];
    
    let formatted = sql.trim();
    
    // Add line breaks before major keywords
    const majorKeywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'UNION'];
    majorKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword}`);
    });
    
    // Clean up extra spaces and line breaks
    formatted = formatted.replace(/\n\s*\n/g, '\n').trim();
    
    // Indent subqueries and nested content
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const indentedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.includes('(')) indentLevel++;
      const indented = '  '.repeat(Math.max(0, indentLevel)) + trimmed;
      if (trimmed.includes(')')) indentLevel--;
      return indented;
    });
    
    return indentedLines.join('\n');
  };

  const minifySQL = (sql: string): string => {
    return sql.replace(/\s+/g, ' ').trim();
  };

  const processSQL = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const result = mode === "format" ? formatSQL(input) : minifySQL(input);
      setOutput(result);

      // Add to history
      addToHistory({
        toolId: 'sql-formatter',
        input,
        output: result,
        timestamp: new Date(),
        metadata: { mode }
      });

      toast({
        title: "Success",
        description: `SQL ${mode === "format" ? "formatted" : "minified"} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process SQL",
        variant: "destructive",
      });
    }
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

  const downloadSQL = () => {
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
      <Card>
        <CardHeader>
          <CardTitle>SQL Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your SQL here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          
          <div className="flex gap-2">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="format">Format</SelectItem>
                <SelectItem value="minify">Minify</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={processSQL} className="flex-1">
              Process SQL
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Processed SQL
            {output && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadSQL}>
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
            placeholder="Processed SQL will appear here..."
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
