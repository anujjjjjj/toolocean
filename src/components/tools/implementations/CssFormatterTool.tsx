import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CssFormatterToolProps {
  onOutputChange?: (output: string) => void;
}

export const CssFormatterTool = ({ onOutputChange }: CssFormatterToolProps) => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState("beautify");
  const { toast } = useToast();

  const beautifyCSS = (css: string): string => {
    // Basic CSS beautification
    return css
      .replace(/\s*{\s*/g, ' {\n  ')
      .replace(/;\s*/g, ';\n  ')
      .replace(/\s*}\s*/g, '\n}\n')
      .replace(/,\s*/g, ',\n')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  };

  const minifyCSS = (css: string): string => {
    // Basic CSS minification
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/;\s*}/g, '}') // Remove last semicolon before closing brace
      .replace(/\s*{\s*/g, '{')
      .replace(/;\s*/g, ';')
      .replace(/\s*}\s*/g, '}')
      .replace(/,\s*/g, ',')
      .replace(/:\s*/g, ':')
      .trim();
  };

  const handleProcess = () => {
    if (!input.trim()) {
      toast({
        title: "Error",
        description: "Please enter some CSS to process",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = mode === "beautify" ? beautifyCSS(input) : minifyCSS(input);
      setOutput(result);
      onOutputChange?.(result);
      
      toast({
        title: "Success",
        description: `CSS ${mode === "beautify" ? "beautified" : "minified"} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process CSS",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CSS Formatter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="mode-select" className="block text-sm font-medium mb-2">
              Mode
            </label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beautify">Beautify</SelectItem>
                <SelectItem value="minify">Minify</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="css-input" className="block text-sm font-medium mb-2">
              CSS Input
            </label>
            <Textarea
              id="css-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter CSS code here..."
              className="h-40 font-mono"
            />
          </div>

          <Button onClick={handleProcess} className="w-full">
            {mode === "beautify" ? "Beautify CSS" : "Minify CSS"}
          </Button>

          {output && (
            <div>
              <label htmlFor="css-output" className="block text-sm font-medium mb-2">
                Formatted CSS
              </label>
              <Textarea
                id="css-output"
                value={output}
                readOnly
                className="h-40 font-mono"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};