import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as yaml from "js-yaml";

export function YamlFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const formatYaml = () => {
    if (!input.trim()) {
      setOutput("");
      setIsValid(null);
      setError("");
      return;
    }

    try {
      // Parse YAML
      const parsed = yaml.load(input);
      
      // Format with proper indentation
      const formatted = yaml.dump(parsed, {
        indent: 2,
        lineWidth: 120,
        noRefs: true,
        sortKeys: false
      });

      setOutput(formatted);
      setIsValid(true);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid YAML");
      setIsValid(false);
      setOutput("");
    }
  };

  const minifyYaml = () => {
    if (!input.trim()) {
      setOutput("");
      setIsValid(null);
      setError("");
      return;
    }

    try {
      const parsed = yaml.load(input);
      const minified = yaml.dump(parsed, {
        flowLevel: 0,
        indent: 1,
        lineWidth: -1
      });

      setOutput(minified);
      setIsValid(true);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid YAML");
      setIsValid(false);
      setOutput("");
    }
  };

  const validateYaml = () => {
    if (!input.trim()) {
      setIsValid(null);
      setError("");
      setOutput("");
      return;
    }

    try {
      yaml.load(input);
      setIsValid(true);
      setError("");
      setOutput("✅ Valid YAML");
    } catch (err) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : "Invalid YAML");
      setOutput("");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied to clipboard",
        description: "Formatted YAML has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadYaml = () => {
    if (!output) return;
    
    const blob = new Blob([output], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Input YAML</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your YAML here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
          
          <div className="flex gap-2 flex-wrap">
            <Button onClick={formatYaml}>Format</Button>
            <Button onClick={minifyYaml} variant="outline">Minify</Button>
            <Button onClick={validateYaml} variant="outline">Validate</Button>
          </div>
          
          {input && (
            <div className="flex gap-2">
              <Badge variant="outline">{input.length} characters</Badge>
              <Badge variant="outline">{input.split('\n').length} lines</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              Output
              {isValid === true && <CheckCircle className="h-4 w-4 text-green-500" />}
              {isValid === false && <XCircle className="h-4 w-4 text-red-500" />}
            </div>
            {output && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadYaml}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {error}
            </div>
          )}
          
          <Textarea
            value={output}
            readOnly
            placeholder="Formatted YAML will appear here..."
            className="min-h-[400px] font-mono text-sm bg-muted/50"
          />
          
          {output && (
            <div className="flex gap-2">
              <Badge variant="outline">{output.length} characters</Badge>
              <Badge variant="outline">{output.split('\n').length} lines</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}