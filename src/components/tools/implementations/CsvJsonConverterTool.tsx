import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Download, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CsvJsonConverterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"csv-to-json" | "json-to-csv">("csv-to-json");
  const [delimiter, setDelimiter] = useState(",");
  const [customDelimiter, setCustomDelimiter] = useState("");
  const [hasHeader, setHasHeader] = useState(true);
  const { toast } = useToast();

  const csvToJson = (csvText: string, delim: string, withHeader: boolean) => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    const actualDelimiter = delim === 'custom' ? customDelimiter : delim;
    const headers = withHeader ? lines[0].split(actualDelimiter).map(h => h.trim().replace(/"/g, '')) : null;
    const dataLines = withHeader ? lines.slice(1) : lines;

    return dataLines.map((line, index) => {
      const values = line.split(actualDelimiter).map(v => v.trim().replace(/"/g, ''));
      
      if (headers) {
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] || '';
        });
        return obj;
      } else {
        const obj: any = {};
        values.forEach((value, i) => {
          obj[`column_${i + 1}`] = value;
        });
        return obj;
      }
    });
  };

  const jsonToCsv = (jsonText: string, delim: string) => {
    try {
      const data = JSON.parse(jsonText);
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("JSON must be an array of objects");
      }

      const actualDelimiter = delim === 'custom' ? customDelimiter : delim;
      const headers = Object.keys(data[0]);
      const csvHeaders = headers.join(actualDelimiter);
      
      const csvRows = data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return typeof value === 'string' && value.includes(actualDelimiter) 
            ? `"${value}"` 
            : value;
        }).join(actualDelimiter)
      );

      return [csvHeaders, ...csvRows].join('\n');
    } catch (error) {
      throw new Error("Invalid JSON format");
    }
  };

  const convert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (mode === "csv-to-json") {
        const result = csvToJson(input, delimiter, hasHeader);
        setOutput(JSON.stringify(result, null, 2));
      } else {
        const result = jsonToCsv(input, delimiter);
        setOutput(result);
      }
    } catch (error) {
      toast({
        title: "Conversion Error",
        description: error instanceof Error ? error.message : "Failed to convert",
        variant: "destructive",
      });
      setOutput("");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadFile = () => {
    if (!output) return;
    
    const extension = mode === "csv-to-json" ? "json" : "csv";
    const mimeType = mode === "csv-to-json" ? "application/json" : "text/csv";
    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File downloaded",
      description: `converted.${extension} has been downloaded`,
    });
  };

  const swapMode = () => {
    setMode(mode === "csv-to-json" ? "json-to-csv" : "csv-to-json");
    setInput("");
    setOutput("");
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {mode === "csv-to-json" ? "CSV → JSON" : "JSON → CSV"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={swapMode}
              >
                <ArrowUpDown className="h-4 w-4" />
                Swap
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Delimiter</Label>
              <Select value={delimiter} onValueChange={setDelimiter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Comma (,)</SelectItem>
                  <SelectItem value=";">Semicolon (;)</SelectItem>
                  <SelectItem value="\t">Tab</SelectItem>
                  <SelectItem value="|">Pipe (|)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {delimiter === "custom" && (
              <div className="space-y-2">
                <Label>Custom Delimiter</Label>
                <Input
                  value={customDelimiter}
                  onChange={(e) => setCustomDelimiter(e.target.value)}
                  placeholder="Enter delimiter"
                  maxLength={1}
                />
              </div>
            )}

            {mode === "csv-to-json" && (
              <div className="space-y-2">
                <Label>CSV Format</Label>
                <Select value={hasHeader ? "header" : "no-header"} onValueChange={(v) => setHasHeader(v === "header")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Has Header Row</SelectItem>
                    <SelectItem value="no-header">No Header Row</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button onClick={convert} className="w-full">
            Convert {mode === "csv-to-json" ? "CSV to JSON" : "JSON to CSV"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "csv-to-json" ? "CSV Input" : "JSON Input"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={mode === "csv-to-json" 
                ? "Paste your CSV data here...\n\nExample:\nname,age,city\nJohn,30,New York\nJane,25,Boston" 
                : "Paste your JSON array here...\n\nExample:\n[\n  {\"name\": \"John\", \"age\": 30, \"city\": \"New York\"},\n  {\"name\": \"Jane\", \"age\": 25, \"city\": \"Boston\"}\n]"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {mode === "csv-to-json" ? "JSON Output" : "CSV Output"}
              {output && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(output)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadFile}
                  >
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
              placeholder="Converted output will appear here..."
              className="min-h-[300px] font-mono text-sm bg-muted/50"
            />
            
            {output && (
              <div className="mt-4 text-sm text-muted-foreground">
                Characters: {output.length.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}