import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SlugConverterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [lowercase, setLowercase] = useState(true);
  const [removeSpecialChars, setRemoveSpecialChars] = useState(true);
  const { toast } = useToast();

  const convertToSlug = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    let result = input.trim();

    // Convert to lowercase if enabled
    if (lowercase) {
      result = result.toLowerCase();
    }

    // Replace spaces and underscores with hyphens
    result = result.replace(/[\s_]+/g, '-');

    // Remove special characters if enabled
    if (removeSpecialChars) {
      result = result.replace(/[^\w\-]/g, '');
    }

    // Remove multiple consecutive hyphens
    result = result.replace(/-+/g, '-');

    // Remove leading and trailing hyphens
    result = result.replace(/^-+|-+$/g, '');

    setOutput(result);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied to clipboard",
        description: "Slug has been copied to your clipboard",
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
    a.download = 'slug.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Real-time conversion
  React.useEffect(() => {
    convertToSlug();
  }, [input, lowercase, removeSpecialChars]);

  const exampleUrl = output ? `https://example.com/${output}` : '';

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Text Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter text to convert to slug..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="lowercase"
                checked={lowercase}
                onCheckedChange={setLowercase}
              />
              <Label htmlFor="lowercase">Convert to lowercase</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="remove-special"
                checked={removeSpecialChars}
                onCheckedChange={setRemoveSpecialChars}
              />
              <Label htmlFor="remove-special">Remove special characters</Label>
            </div>
          </div>

          {input && (
            <div className="text-sm text-muted-foreground">
              <Badge variant="outline">{input.length} characters</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            URL Slug
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
        <CardContent className="space-y-4">
          <Textarea
            value={output}
            readOnly
            placeholder="URL slug will appear here..."
            className="min-h-[200px] font-mono text-sm bg-muted/50"
          />
          
          {output && (
            <>
              <div className="text-sm text-muted-foreground">
                <Badge variant="outline">{output.length} characters</Badge>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm font-medium">Example URL:</Label>
                <p className="font-mono text-sm text-primary break-all mt-1">
                  {exampleUrl}
                </p>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p>✓ URL-friendly format</p>
                <p>✓ SEO optimized</p>
                <p>✓ Ready for web use</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}