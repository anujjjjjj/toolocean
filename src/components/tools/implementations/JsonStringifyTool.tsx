import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Download, Check, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function JsonStringifyTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [escapeQuotes, setEscapeQuotes] = useState(true);
  const { toast } = useToast();

  const stringifyJson = () => {
    if (!input.trim()) {
      setOutput("");
      setIsValid(null);
      setError("");
      return;
    }

    try {
      // First parse to validate
      const parsed = JSON.parse(input);
      
      // Then stringify
      let stringified = JSON.stringify(parsed);
      
      // Escape quotes if enabled
      if (escapeQuotes) {
        stringified = stringified.replace(/"/g, '\\"');
        stringified = `"${stringified}"`;
      }
      
      setOutput(stringified);
      setIsValid(true);
      setError("");
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : "Invalid JSON");
      setOutput("");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied to clipboard",
        description: "Stringified JSON has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadText = () => {
    if (!output) return;
    
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stringified.txt';
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
          <CardTitle className="flex items-center justify-between">
            JSON Object Input
            {isValid !== null && (
              <Badge variant={isValid ? "default" : "destructive"} className="flex items-center gap-1">
                {isValid ? (
                  <>
                    <Check className="h-3 w-3" />
                    Valid
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3" />
                    Invalid
                  </>
                )}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder='Enter JSON object here, e.g., {"name": "John", "age": 30}'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="escape-quotes"
                checked={escapeQuotes}
                onCheckedChange={setEscapeQuotes}
              />
              <Label htmlFor="escape-quotes">Escape quotes and wrap in string</Label>
            </div>
          </div>

          <Button onClick={stringifyJson} className="w-full">
            Convert to String
          </Button>
        </CardContent>
      </Card>

      {/* Output Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            JSON String Output
            {output && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadText}>
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
            placeholder="Stringified JSON will appear here..."
            className="min-h-[300px] font-mono text-sm bg-muted/50"
          />
          
          {output && (
            <div className="mt-4 text-sm text-muted-foreground">
              <Badge variant="outline">{output.length} characters</Badge>
            </div>
          )}
          
          {output && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Usage Example:</h3>
              <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`const jsonString = ${output.substring(0, 50)}${output.length > 50 ? '...' : ''};
const parsed = JSON.parse(jsonString);`}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}