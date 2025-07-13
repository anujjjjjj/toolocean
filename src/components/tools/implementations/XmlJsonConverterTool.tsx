import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Download, ArrowUpDown, Check, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseString, Builder } from 'xml2js';

export function XmlJsonConverterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"xml-to-json" | "json-to-xml">("xml-to-json");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [preserveAttributes, setPreserveAttributes] = useState(true);
  const [explicitArray, setExplicitArray] = useState(false);
  const { toast } = useToast();

  const xmlToJson = (xmlText: string) => {
    return new Promise((resolve, reject) => {
      const options = {
        explicitArray: explicitArray,
        mergeAttrs: !preserveAttributes,
        explicitRoot: false,
        trim: true,
        normalize: true,
        normalizeTags: false,
        attrkey: preserveAttributes ? '@' : undefined,
        charkey: preserveAttributes ? '#text' : undefined
      };

      parseString(xmlText, options, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };

  const jsonToXml = (jsonText: string) => {
    try {
      const jsonObj = JSON.parse(jsonText);
      const builder = new Builder({
        xmldec: { version: '1.0', encoding: 'UTF-8' },
        renderOpts: { pretty: true, indent: '  ', newline: '\n' },
        attrkey: '@',
        charkey: '#text'
      });
      
      return builder.buildObject(jsonObj);
    } catch (error) {
      throw new Error("Invalid JSON format");
    }
  };

  const convert = async () => {
    if (!input.trim()) {
      setOutput("");
      setIsValid(null);
      setError("");
      return;
    }

    try {
      if (mode === "xml-to-json") {
        const result = await xmlToJson(input);
        const jsonOutput = JSON.stringify(result, null, 2);
        setOutput(jsonOutput);
        setIsValid(true);
        setError("");
      } else {
        const xmlOutput = jsonToXml(input);
        setOutput(xmlOutput);
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
    
    const extension = mode === "xml-to-json" ? "json" : "xml";
    const mimeType = mode === "xml-to-json" ? "application/json" : "application/xml";
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
    setMode(mode === "xml-to-json" ? "json-to-xml" : "xml-to-json");
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
          <CardTitle>Conversion Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {mode === "xml-to-json" ? "XML → JSON" : "JSON → XML"}
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

          {mode === "xml-to-json" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="preserve-attributes"
                  checked={preserveAttributes}
                  onCheckedChange={setPreserveAttributes}
                />
                <Label htmlFor="preserve-attributes" className="text-sm">
                  Preserve XML attributes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="explicit-array"
                  checked={explicitArray}
                  onCheckedChange={setExplicitArray}
                />
                <Label htmlFor="explicit-array" className="text-sm">
                  Force arrays for single elements
                </Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {mode === "xml-to-json" ? "XML Input" : "JSON Input"}
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
              placeholder={mode === "xml-to-json" 
                ? "Paste your XML here...\n\nExample:\n<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<person>\n  <name>John Doe</name>\n  <age>30</age>\n  <address city=\"New York\">\n    <street>123 Main St</street>\n    <zip>10001</zip>\n  </address>\n  <hobbies>\n    <hobby>reading</hobby>\n    <hobby>swimming</hobby>\n  </hobbies>\n</person>" 
                : "Paste your JSON here...\n\nExample:\n{\n  \"person\": {\n    \"name\": \"John Doe\",\n    \"age\": 30,\n    \"address\": {\n      \"@city\": \"New York\",\n      \"street\": \"123 Main St\",\n      \"zip\": 10001\n    },\n    \"hobbies\": {\n      \"hobby\": [\"reading\", \"swimming\"]\n    }\n  }\n}"}
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
              {mode === "xml-to-json" ? "JSON Output" : "XML Output"}
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