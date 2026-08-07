import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function JsonCsvTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"json-to-csv" | "csv-to-json">("json-to-csv");
  const { toast } = useToast();

  const jsonToCsv = (jsonText: string) => {
    const data = JSON.parse(jsonText);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("JSON must be an array of objects");
    }

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(",");

    const csvRows = data.map((row: Record<string, unknown>) =>
      headers
        .map((header) => {
          const value = row[header] ?? "";
          return typeof value === "string" && value.includes(",") ? `"${value}"` : String(value);
        })
        .join(",")
    );

    return [csvHeaders, ...csvRows].join("\n");
  };

  const csvToJson = (csvText: string) => {
    const lines = csvText.trim().split("\n");
    if (lines.length === 0) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const dataLines = lines.slice(1);

    return dataLines.map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] || "";
      });
      return obj;
    });
  };

  const convert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (mode === "json-to-csv") {
        const result = jsonToCsv(input);
        setOutput(result);
      } else {
        const result = csvToJson(input);
        setOutput(JSON.stringify(result, null, 2));
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
      toast({ title: "Copied to clipboard", description: "Content has been copied to your clipboard" });
    } catch {
      toast({ title: "Failed to copy", description: "Could not copy to clipboard", variant: "destructive" });
    }
  };

  const swapMode = () => {
    setMode(mode === "json-to-csv" ? "csv-to-json" : "json-to-csv");
    setInput("");
    setOutput("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conversion Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{mode === "json-to-csv" ? "JSON → CSV" : "CSV → JSON"}</span>
            <Button variant="outline" size="sm" onClick={swapMode}>
              <ArrowUpDown className="h-4 w-4" />
              Swap
            </Button>
          </div>
          <Button onClick={convert} className="w-full" disabled={!input.trim()}>
            Convert {mode === "json-to-csv" ? "JSON to CSV" : "CSV to JSON"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "json-to-csv" ? "JSON Input" : "CSV Input"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={
                mode === "json-to-csv"
                  ? '[\n  {"name": "John", "age": 30, "city": "New York"},\n  {"name": "Jane", "age": 25, "city": "Boston"}\n]'
                  : "name,age,city\nJohn,30,New York\nJane,25,Boston"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[600px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {mode === "json-to-csv" ? "CSV Output" : "JSON Output"}
              {output && (
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(output)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={output} readOnly placeholder="Converted output will appear here..." className="min-h-[600px] font-mono text-sm bg-muted/50" />
            {output && <div className="mt-4 text-sm text-muted-foreground">Characters: {output.length.toLocaleString()}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
