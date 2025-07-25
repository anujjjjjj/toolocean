
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, Database, Minimize } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/useHistory";

export function SqlFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indentSize, setIndentSize] = useState("2");
  const { toast } = useToast();
  const { addToHistory } = useHistory();

  const formatSql = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const formatted = formatSqlString(input, parseInt(indentSize));
      setOutput(formatted);
      addToHistory('format', 'sql-formatter', { input, output: formatted });
      
      toast({
        title: "SQL formatted",
        description: "SQL has been formatted successfully",
      });
    } catch (error) {
      toast({
        title: "Format failed",
        description: "Could not format SQL",
        variant: "destructive",
      });
    }
  };

  const minifySql = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const minified = input
      .replace(/\s+/g, ' ')
      .replace(/\s*([(),;])\s*/g, '$1')
      .trim();
    
    setOutput(minified);
    addToHistory('minify', 'sql-formatter', { input, output: minified });
    
    toast({
      title: "SQL minified",
      description: "SQL has been minified successfully",
    });
  };

  const formatSqlString = (sql: string, indent: number): string => {
    const tab = ' '.repeat(indent);
    
    // Keywords that should be on new lines
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 
      'FULL JOIN', 'ON', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
      'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
      'ALTER', 'DROP', 'INDEX', 'UNION', 'UNION ALL', 'EXCEPT', 'INTERSECT'
    ];
    
    let result = sql;
    
    // Add line breaks before major keywords
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      result = result.replace(regex, `\n${keyword}`);
    });
    
    // Clean up extra whitespace
    result = result.replace(/\s+/g, ' ');
    
    // Split into lines and format
    const lines = result.split('\n').map(line => line.trim()).filter(line => line);
    
    let formatted = '';
    let level = 0;
    
    for (const line of lines) {
      const upperLine = line.toUpperCase();
      
      // Decrease indent for certain keywords
      if (upperLine.startsWith('FROM') || upperLine.startsWith('WHERE') || 
          upperLine.startsWith('GROUP BY') || upperLine.startsWith('ORDER BY') ||
          upperLine.startsWith('HAVING') || upperLine.startsWith('LIMIT')) {
        level = 0;
      }
      
      formatted += tab.repeat(level) + line + '\n';
      
      // Increase indent after SELECT
      if (upperLine.startsWith('SELECT')) {
        level = 1;
      }
    }
    
    return formatted.trim();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  const downloadSql = () => {
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
              <Database className="h-4 w-4 mr-2" />
              Format
            </Button>
            <Button onClick={minifySql} variant="outline">
              <Minimize className="h-4 w-4 mr-2" />
              Minify
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Formatted Output
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
              <Badge variant="outline">{output.length} characters</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
