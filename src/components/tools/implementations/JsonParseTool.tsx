import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Download, Check, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function JsonParseTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [indentSize, setIndentSize] = useState("2");
  const { toast } = useToast();

  const parseJson = () => {
    if (!input.trim()) {
      setOutput("");
      setIsValid(null);
      setError("");
      return;
    }

    try {
      // Clean the input - remove surrounding quotes if present
      let cleanInput = input.trim();
      
      // If the input is wrapped in quotes (string), remove them
      if (cleanInput.startsWith('"') && cleanInput.endsWith('"')) {
        cleanInput = cleanInput.slice(1, -1);
        // Unescape quotes
        cleanInput = cleanInput.replace(/\\"/g, '"');
      }
      
      // Parse the JSON
      const parsed = JSON.parse(cleanInput);
      
      // Format the output
      const formatted = JSON.stringify(parsed, null, parseInt(indentSize));
      setOutput(formatted);
      setIsValid(true);
      setError("");
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : "Invalid JSON string");
      setOutput("");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied to clipboard",
        description: "Parsed JSON has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadJson = () => {
    if (!output) return;
    
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parsed.json';
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
            JSON String Input
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
            placeholder='Enter JSON string here, e.g., "{\"name\":\"John\",\"age\":30}"'
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
            
            <Button onClick={parseJson} className="flex-1">
              Parse JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Output Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Parsed JSON Object
            {output && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadJson}>
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
            placeholder="Parsed JSON object will appear here..."
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
          
          {output && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Usage Example:</h3>
              <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`const obj = JSON.parse(jsonString);
console.log(obj.propertyName);`}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}