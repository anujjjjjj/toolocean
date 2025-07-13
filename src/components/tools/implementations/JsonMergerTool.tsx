import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type MergeStrategy = "overwrite" | "keep-first" | "merge-arrays" | "throw-error";

export function JsonMergerTool() {
  const [json1, setJson1] = useState("");
  const [json2, setJson2] = useState("");
  const [output, setOutput] = useState("");
  const [mergeStrategy, setMergeStrategy] = useState<MergeStrategy>("overwrite");
  const { toast } = useToast();

  const deepMerge = (obj1: any, obj2: any, strategy: MergeStrategy): any => {
    const result = { ...obj1 };
    
    for (const key in obj2) {
      if (obj2.hasOwnProperty(key)) {
        if (key in result) {
          // Handle conflicts based on strategy
          switch (strategy) {
            case "overwrite":
              if (typeof result[key] === 'object' && typeof obj2[key] === 'object' && 
                  !Array.isArray(result[key]) && !Array.isArray(obj2[key]) &&
                  result[key] !== null && obj2[key] !== null) {
                result[key] = deepMerge(result[key], obj2[key], strategy);
              } else {
                result[key] = obj2[key];
              }
              break;
            case "keep-first":
              // Keep the value from the first object
              if (typeof result[key] === 'object' && typeof obj2[key] === 'object' && 
                  !Array.isArray(result[key]) && !Array.isArray(obj2[key]) &&
                  result[key] !== null && obj2[key] !== null) {
                result[key] = deepMerge(result[key], obj2[key], strategy);
              }
              // Otherwise keep result[key] as is
              break;
            case "merge-arrays":
              if (Array.isArray(result[key]) && Array.isArray(obj2[key])) {
                result[key] = [...result[key], ...obj2[key]];
              } else if (typeof result[key] === 'object' && typeof obj2[key] === 'object' && 
                         result[key] !== null && obj2[key] !== null) {
                result[key] = deepMerge(result[key], obj2[key], strategy);
              } else {
                result[key] = obj2[key];
              }
              break;
            case "throw-error":
              throw new Error(`Conflict found at key "${key}"`);
          }
        } else {
          result[key] = obj2[key];
        }
      }
    }
    
    return result;
  };

  const mergeJson = () => {
    if (!json1.trim() || !json2.trim()) {
      toast({
        title: "Missing input",
        description: "Please provide both JSON objects to merge",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsed1 = JSON.parse(json1);
      const parsed2 = JSON.parse(json2);
      
      if (typeof parsed1 !== 'object' || typeof parsed2 !== 'object' || 
          parsed1 === null || parsed2 === null || 
          Array.isArray(parsed1) || Array.isArray(parsed2)) {
        throw new Error("Both inputs must be JSON objects (not arrays or primitives)");
      }

      const merged = deepMerge(parsed1, parsed2, mergeStrategy);
      const result = JSON.stringify(merged, null, 2);
      
      setOutput(result);
      toast({
        title: "Merge successful",
        description: "JSON objects have been merged successfully",
      });
    } catch (error) {
      toast({
        title: "Merge failed",
        description: error instanceof Error ? error.message : "Failed to merge JSON objects",
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
        description: "Merged JSON has been copied to your clipboard",
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
    a.download = 'merged.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "JSON downloaded",
      description: "merged.json has been downloaded",
    });
  };

  const loadSample = () => {
    const sample1 = {
      name: "John Doe",
      age: 30,
      address: {
        street: "123 Main St",
        city: "New York"
      },
      hobbies: ["reading", "swimming"],
      preferences: {
        theme: "dark",
        notifications: true
      }
    };

    const sample2 = {
      age: 31,
      email: "john@example.com",
      address: {
        zipCode: "10001",
        country: "USA"
      },
      hobbies: ["coding", "gaming"],
      preferences: {
        language: "en",
        notifications: false
      }
    };

    setJson1(JSON.stringify(sample1, null, 2));
    setJson2(JSON.stringify(sample2, null, 2));
    setOutput("");
  };

  const clearAll = () => {
    setJson1("");
    setJson2("");
    setOutput("");
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Merge Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Conflict Resolution Strategy</Label>
              <Select value={mergeStrategy} onValueChange={(value) => setMergeStrategy(value as MergeStrategy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overwrite">Overwrite (use second object's values)</SelectItem>
                  <SelectItem value="keep-first">Keep First (use first object's values)</SelectItem>
                  <SelectItem value="merge-arrays">Merge Arrays (concatenate arrays)</SelectItem>
                  <SelectItem value="throw-error">Throw Error (fail on conflicts)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={mergeJson} className="flex-1">
              Merge JSON Objects
            </Button>
            <Button onClick={loadSample} variant="outline">
              Load Sample
            </Button>
            <Button onClick={clearAll} variant="outline">
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* First JSON Input */}
        <Card>
          <CardHeader>
            <CardTitle>First JSON Object</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste your first JSON object here..."
              value={json1}
              onChange={(e) => setJson1(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Second JSON Input */}
        <Card>
          <CardHeader>
            <CardTitle>Second JSON Object</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste your second JSON object here..."
              value={json2}
              onChange={(e) => setJson2(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Merged Result
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
              placeholder="Merged JSON will appear here..."
              className="min-h-[300px] font-mono text-sm bg-muted/50"
            />
            
            {output && (
              <div className="mt-4 text-sm text-muted-foreground">
                Characters: {output.length.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
