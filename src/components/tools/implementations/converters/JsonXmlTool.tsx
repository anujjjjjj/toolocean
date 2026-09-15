import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { xmlToJson, jsonToXml } from "@/lib/xmlJson";

export function JsonXmlTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"json-to-xml" | "xml-to-json">("json-to-xml");
  const { toast } = useToast();

  const convert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      // Both directions are synchronous now. xml2js was callback-based *and*
      // non-functional in the browser, which is why this used to be half-async.
      setOutput(
        mode === "json-to-xml"
          ? jsonToXml(input)
          : JSON.stringify(xmlToJson(input, { preserveAttributes: true, explicitArray: false }), null, 2),
      );
    } catch (error) {
      toast({
        title: "Conversion Error",
        description: error instanceof Error ? error.message : "Conversion failed",
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
    setMode(mode === "json-to-xml" ? "xml-to-json" : "json-to-xml");
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
            <span className="text-sm font-medium">{mode === "json-to-xml" ? "JSON → XML" : "XML → JSON"}</span>
            <Button variant="outline" size="sm" onClick={swapMode}>
              <ArrowUpDown className="h-4 w-4" />
              Swap
            </Button>
          </div>
          <Button onClick={convert} className="w-full" disabled={!input.trim()}>
            Convert {mode === "json-to-xml" ? "JSON to XML" : "XML to JSON"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "json-to-xml" ? "JSON Input" : "XML Input"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={
                mode === "json-to-xml"
                  ? '{\n  "title": "Example",\n  "author": "John Doe",\n  "tags": ["example", "test"]\n}'
                  : '<?xml version="1.0"?>\n<root>\n  <title>Example</title>\n  <author>John Doe</author>\n  <tags>\n    <item>example</item>\n    <item>test</item>\n  </tags>\n</root>'
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
              {mode === "json-to-xml" ? "XML Output" : "JSON Output"}
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
