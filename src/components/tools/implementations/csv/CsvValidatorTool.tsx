import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    rows: number;
    columns: number;
    headerRow?: string[];
  };
}

export function CsvValidatorTool() {
  const [input, setInput] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [customDelimiter, setCustomDelimiter] = useState("");
  const [hasHeader, setHasHeader] = useState(true);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validate = () => {
    if (!input.trim()) {
      setResult(null);
      return;
    }

    const actualDelimiter = delimiter === "custom" ? customDelimiter : delimiter;
    const lines = input.trim().split("\n").filter((line) => line.trim());
    const errors: string[] = [];
    const warnings: string[] = [];

    if (lines.length === 0) {
      setResult({
        valid: false,
        errors: ["File is empty"],
        warnings: [],
        stats: { rows: 0, columns: 0 },
      });
      return;
    }

    const firstLineCols = lines[0].split(actualDelimiter).length;
    let headerRow: string[] | undefined;
    let dataRows = lines;

    if (hasHeader && lines.length > 1) {
      headerRow = lines[0].split(actualDelimiter).map((h) => h.trim());
      dataRows = lines.slice(1);
    } else if (hasHeader && lines.length === 1) {
      warnings.push("Only header row present, no data rows");
    }

    const columnCounts = dataRows.map((line) => line.split(actualDelimiter).length);
    const inconsistentRows = columnCounts
      .map((count, i) => (count !== firstLineCols ? i + (hasHeader ? 2 : 1) : -1))
      .filter((i) => i >= 0);

    if (inconsistentRows.length > 0) {
      errors.push(`Row(s) ${inconsistentRows.slice(0, 5).join(", ")}${inconsistentRows.length > 5 ? "..." : ""} have different column count (expected ${firstLineCols})`);
    }

    const emptyHeaders = headerRow?.filter((h) => !h || h.trim() === "");
    if (emptyHeaders && emptyHeaders.length > 0) {
      warnings.push(`${emptyHeaders.length} empty header(s) found`);
    }

    const duplicateHeaders = headerRow ? headerRow.filter((item, index) => headerRow!.indexOf(item) !== index) : [];
    if (duplicateHeaders.length > 0) {
      warnings.push(`Duplicate header(s): ${[...new Set(duplicateHeaders)].join(", ")}`);
    }

    setResult({
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        rows: dataRows.length,
        columns: firstLineCols,
        headerRow,
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Validation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Input value={customDelimiter} onChange={(e) => setCustomDelimiter(e.target.value)} placeholder="Enter delimiter" maxLength={1} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Format</Label>
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
          </div>
          <Button onClick={validate} className="w-full">
            Validate CSV
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CSV Input</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste your CSV data here...\n\nExample:\nname,age,city\nJohn,30,New York\nJane,25,Boston"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[600px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validation Result</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <p className="text-muted-foreground text-sm">Paste CSV and click Validate to see results.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {result.valid ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                  <span className={`font-semibold ${result.valid ? "text-green-600" : "text-red-600"}`}>
                    {result.valid ? "Valid CSV" : "Invalid CSV"}
                  </span>
                </div>

                <div className=" rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="font-medium mb-1">Statistics</div>
                  <div>Rows: {result.stats.rows}</div>
                  <div>Columns: {result.stats.columns}</div>
                  {result.stats.headerRow && <div>Headers: {result.stats.headerRow.join(", ")}</div>}
                </div>

                {result.errors.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-medium text-red-600">
                      <XCircle className="h-4 w-4" />
                      Errors
                    </div>
                    <ul className="list-disc list-inside text-sm text-red-600/90">
                      {result.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.warnings.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-medium text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      Warnings
                    </div>
                    <ul className="list-disc list-inside text-sm text-amber-600/90">
                      {result.warnings.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
