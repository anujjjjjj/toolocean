import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Download, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function JsonFlattenerTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"flatten" | "unflatten">("flatten");
  const [separator, setSeparator] = useState(".");
  const { toast } = useToast();

  const flattenObject = (obj: any, prefix = '', separator = '.'): any => {
    const result: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}${separator}${key}` : key;
        
        if (obj[key] === null || obj[key] === undefined) {
          result[newKey] = obj[key];
        } else if (Array.isArray(obj[key])) {
          obj[key].forEach((item: any, index: number) => {
            const arrayKey = `${newKey}[${index}]`;
            if (typeof item === 'object' && item !== null) {
              Object.assign(result, flattenObject(item, arrayKey, separator));
            } else {
              result[arrayKey] = item;
            }
          });
        } else if (typeof obj[key] === 'object') {
          Object.assign(result, flattenObject(obj[key], newKey, separator));
        } else {
          result[newKey] = obj[key];
        }
      }
    }
    
    return result;
  };

  const unflattenObject = (obj: any, separator = '.'): any => {
    const result: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const keys = key.split(separator);
        let current = result;
        
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          const isLast = i === keys.length - 1;
          
          // Check if this is an array notation like "key[0]"
          const arrayMatch = k.match(/^(.+)\[(\d+)\]$/);
          
          if (arrayMatch) {
            const [, arrayKey, index] = arrayMatch;
            const idx = parseInt(index, 10);
            
            if (!current[arrayKey]) {
              current[arrayKey] = [];
            }
            
            if (isLast) {
              current[arrayKey][idx] = obj[key];
            } else {
              if (!current[arrayKey][idx]) {
                // Look ahead to see if next key suggests an object or array
                const nextKey = keys[i + 1];
                const nextIsArray = nextKey.includes('[');
                current[arrayKey][idx] = nextIsArray ? [] : {};
              }
              current = current[arrayKey][idx];
            }
          } else {
            if (isLast) {
              current[k] = obj[key];
            } else {
              if (!current[k]) {
                // Look ahead to see if next key suggests an array
                const nextKey = keys[i + 1];
                const nextIsArray = nextKey.includes('[');
                current[k] = nextIsArray ? [] : {};
              }
              current = current[k];
            }
          }
        }
      }
    }
    
    return result;
  };

  const processJson = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const parsed = JSON.parse(input);
      
      let result;
      if (mode === "flatten") {
        result = flattenObject(parsed, '', separator);
      } else {
        result = unflattenObject(parsed, separator);
      }
      
      const formatted = JSON.stringify(result, null, 2);
      setOutput(formatted);
      
      toast({
        title: `${mode === "flatten" ? "Flatten" : "Unflatten"} successful`,
        description: `JSON has been ${mode === "flatten" ? "flattened" : "unflattened"} successfully`,
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Invalid JSON format",
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
        description: "JSON has been copied to your clipboard",
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
    
    const filename = mode === "flatten" ? "flattened.json" : "unflattened.json";
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "JSON downloaded",
      description: `${filename} has been downloaded`,
    });
  };

  const swapMode = () => {
    setMode(mode === "flatten" ? "unflatten" : "flatten");
    setInput("");
    setOutput("");
  };

  const loadSample = () => {
    if (mode === "flatten") {
      const sample = {
        name: "John Doe",
        age: 30,
        address: {
          street: "123 Main St",
          city: "New York",
          coordinates: {
            lat: 40.7128,
            lng: -74.0060
          }
        },
        hobbies: ["reading", "swimming", "coding"],
        contacts: [
          { type: "email", value: "john@example.com" },
          { type: "phone", value: "+1-555-123-4567" }
        ]
      };
      setInput(JSON.stringify(sample, null, 2));
    } else {
      const sample = {
        "name": "John Doe",
        "age": 30,
        "address.street": "123 Main St",
        "address.city": "New York",
        "address.coordinates.lat": 40.7128,
        "address.coordinates.lng": -74.0060,
        "hobbies[0]": "reading",
        "hobbies[1]": "swimming",
        "hobbies[2]": "coding",
        "contacts[0].type": "email",
        "contacts[0].value": "john@example.com",
        "contacts[1].type": "phone",
        "contacts[1].value": "+1-555-123-4567"
      };
      setInput(JSON.stringify(sample, null, 2));
    }
    setOutput("");
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Flattener Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {mode === "flatten" ? "Flatten JSON" : "Unflatten JSON"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={swapMode}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Switch Mode
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Key Separator</Label>
              <Input
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                placeholder="."
                className="w-20"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={processJson} className="flex-1">
              {mode === "flatten" ? "Flatten JSON" : "Unflatten JSON"}
            </Button>
            <Button onClick={loadSample} variant="outline">
              Load Sample
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "flatten" ? "Nested JSON Input" : "Flattened JSON Input"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={mode === "flatten" 
                ? "Paste your nested JSON object here...\n\nExample:\n{\n  \"user\": {\n    \"name\": \"John\",\n    \"address\": {\n      \"city\": \"New York\"\n    },\n    \"hobbies\": [\"reading\", \"coding\"]\n  }\n}" 
                : "Paste your flattened JSON object here...\n\nExample:\n{\n  \"user.name\": \"John\",\n  \"user.address.city\": \"New York\",\n  \"user.hobbies[0]\": \"reading\",\n  \"user.hobbies[1]\": \"coding\"\n}"}
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
              {mode === "flatten" ? "Flattened JSON Output" : "Nested JSON Output"}
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
                    onClick={downloadJson}
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
              placeholder="Processed JSON will appear here..."
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