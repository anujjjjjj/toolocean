import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";

export function JsonTomlTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"json-to-toml" | "toml-to-json">("json-to-toml");
  const { toast } = useToast();

  const convert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (mode === "json-to-toml") {
        const json = JSON.parse(input);
        const toml = stringifyToml(json);
        setOutput(toml);
      } else {
        const toml = parseToml(input);
        const json = JSON.stringify(toml, null, 2);
        setOutput(json);
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
    setMode(mode === "json-to-toml" ? "toml-to-json" : "json-to-toml");
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
            <span className="text-sm font-medium">{mode === "json-to-toml" ? "JSON → TOML" : "TOML → JSON"}</span>
            <Button variant="outline" size="sm" onClick={swapMode}>
              <ArrowUpDown className="h-4 w-4" />
              Swap
            </Button>
          </div>
          <Button onClick={convert} className="w-full" disabled={!input.trim()}>
            Convert {mode === "json-to-toml" ? "JSON to TOML" : "TOML to JSON"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "json-to-toml" ? "JSON Input" : "TOML Input"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={
                mode === "json-to-toml"
                  ? '{\n  "title": "Example",\n  "author": "John Doe",\n  "tags": ["example", "test"]\n}'
                  : 'title = "Example"\nauthor = "John Doe"\ntags = ["example", "test"]'
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
              {mode === "json-to-toml" ? "TOML Output" : "JSON Output"}
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
