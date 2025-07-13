import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, ArrowUpDown, Check, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as yaml from 'js-yaml';

export function YamlJsonConverterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"yaml-to-json" | "json-to-yaml">("yaml-to-json");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const convert = () => {
    if (!input.trim()) {
      setOutput("");
      setIsValid(null);
      setError("");
      return;
    }

    try {
      if (mode === "yaml-to-json") {
        const parsed = yaml.load(input);
        const jsonOutput = JSON.stringify(parsed, null, 2);
        setOutput(jsonOutput);
        setIsValid(true);
        setError("");
      } else {
        const parsed = JSON.parse(input);
        const yamlOutput = yaml.dump(parsed, {
          indent: 2,
          lineWidth: 120,
          noRefs: true,
          sortKeys: false
        });
        setOutput(yamlOutput);
        setIsValid(true);
        setError("");
      }
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : "Conversion failed");
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
    
    const extension = mode === "yaml-to-json" ? "json" : "yaml";
    const mimeType = mode === "yaml-to-json" ? "application/json" : "text/yaml";
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
    setMode(mode === "yaml-to-json" ? "json-to-yaml" : "yaml-to-json");
    setInput("");
    setOutput("");
    setIsValid(null);
    setError("");
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {mode === "yaml-to-json" ? "YAML → JSON" : "JSON → YAML"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={swapMode}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Swap
            </Button>
            <Button onClick={convert} className="ml-auto">
              Convert
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {mode === "yaml-to-json" ? "YAML Input" : "JSON Input"}
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
              placeholder={mode === "yaml-to-json" 
                ? "Paste your YAML here...\n\nExample:\nname: John Doe\nage: 30\naddress:\n  street: 123 Main St\n  city: New York\n  zip: 10001\nhobbies:\n  - reading\n  - swimming\n  - coding" 
                : "Paste your JSON here...\n\nExample:\n{\n  \"name\": \"John Doe\",\n  \"age\": 30,\n  \"address\": {\n    \"street\": \"123 Main St\",\n    \"city\": \"New York\",\n    \"zip\": 10001\n  },\n  \"hobbies\": [\"reading\", \"swimming\", \"coding\"]\n}"}
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
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {mode === "yaml-to-json" ? "JSON Output" : "YAML Output"}
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
                <div className="flex justify-between">
                  <span>Characters: {output.length.toLocaleString()}</span>
                  <span>Lines: {output.split('\n').length}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}