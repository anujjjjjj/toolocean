import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Wrench, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function JsonFixerTool() {
  const [brokenJson, setBrokenJson] = useState("");
  const [fixedJson, setFixedJson] = useState("");
  const [changes, setChanges] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const fixJson = () => {
    if (!brokenJson.trim()) {
      setFixedJson("");
      setChanges([]);
      setIsValid(null);
      setError("");
      return;
    }

    try {
      // First, try to parse as-is
      JSON.parse(brokenJson);
      setFixedJson(brokenJson);
      setChanges(["JSON is already valid - no changes needed"]);
      setIsValid(true);
      setError("");
      return;
    } catch (initialError) {
      // JSON is broken, let's try to fix it
      const { fixed, changesList } = attemptJsonFix(brokenJson);
      
      try {
        // Validate the fixed JSON
        const parsed = JSON.parse(fixed);
        const prettified = JSON.stringify(parsed, null, 2);
        
        setFixedJson(prettified);
        setChanges(changesList);
        setIsValid(true);
        setError("");
      } catch (fixError) {
        setError("Could not automatically fix this JSON. Manual correction required.");
        setFixedJson("");
        setChanges([]);
        setIsValid(false);
      }
    }
  };

  const attemptJsonFix = (json: string) => {
    let fixed = json;
    const changes: string[] = [];

    // Remove comments (// and /* */)
    const originalLength = fixed.length;
    fixed = fixed.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    if (fixed.length !== originalLength) {
      changes.push("Removed comments");
    }

    // Fix unquoted keys
    const unquotedKeyRegex = /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g;
    if (unquotedKeyRegex.test(fixed)) {
      fixed = fixed.replace(unquotedKeyRegex, '$1"$2":');
      changes.push("Added quotes around unquoted keys");
    }

    // Fix single quotes to double quotes
    if (fixed.includes("'")) {
      // Be careful not to replace single quotes inside double-quoted strings
      fixed = fixed.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');
      changes.push("Changed single quotes to double quotes");
    }

    // Fix trailing commas
    if (fixed.includes(',}') || fixed.includes(',]')) {
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
      changes.push("Removed trailing commas");
    }

    // Fix missing commas between array/object elements
    const missingCommaRegex = /([}\]])\s*([{\["'])/g;
    if (missingCommaRegex.test(fixed)) {
      fixed = fixed.replace(missingCommaRegex, '$1,$2');
      changes.push("Added missing commas between elements");
    }

    // Fix missing quotes around string values
    const unquotedStringRegex = /:(\s*)([a-zA-Z_$][a-zA-Z0-9_$\s]*[a-zA-Z0-9_$])(\s*[,}\]])/g;
    if (unquotedStringRegex.test(fixed)) {
      fixed = fixed.replace(unquotedStringRegex, ': "$2"$3');
      changes.push("Added quotes around unquoted string values");
    }

    // Fix undefined/null/true/false capitalization
    fixed = fixed.replace(/\bundefined\b/g, 'null');
    fixed = fixed.replace(/\bTrue\b/g, 'true');
    fixed = fixed.replace(/\bFalse\b/g, 'false');
    fixed = fixed.replace(/\bNull\b/g, 'null');
    if (fixed !== json) {
      changes.push("Fixed boolean/null value capitalization");
    }

    // Fix missing opening/closing brackets
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/]/g) || []).length;

    if (openBraces > closeBraces) {
      fixed += '}';
      changes.push("Added missing closing brace");
    } else if (closeBraces > openBraces) {
      fixed = '{' + fixed;
      changes.push("Added missing opening brace");
    }

    if (openBrackets > closeBrackets) {
      fixed += ']';
      changes.push("Added missing closing bracket");
    } else if (closeBrackets > openBrackets) {
      fixed = '[' + fixed;
      changes.push("Added missing opening bracket");
    }

    // Remove extra commas at the beginning
    fixed = fixed.replace(/^,+/, '');
    
    // Clean up whitespace
    fixed = fixed.trim();

    return { fixed, changesList: changes };
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fixedJson);
      toast({
        title: "Copied to clipboard",
        description: "Fixed JSON has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const loadExample = () => {
    const brokenExample = `{
  name: 'John Doe', // This is a comment
  age: 30,
  isActive: True,
  address: {
    street: "123 Main St",
    city: 'New York',
    zipCode: undefined,
  },
  hobbies: ['reading', 'swimming',],
  metadata: {
    created: '2023-01-01'
    updated: '2023-12-01'
  }
`;
    setBrokenJson(brokenExample);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Broken JSON
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadExample}>
              Load Example
            </Button>
          </div>
          
          <Textarea
            placeholder="Paste your broken JSON here..."
            value={brokenJson}
            onChange={(e) => setBrokenJson(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
          
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-2">
              {brokenJson && (
                <>
                  <Badge variant="outline">{brokenJson.length} characters</Badge>
                  <Badge variant="outline">{brokenJson.split('\n').length} lines</Badge>
                </>
              )}
            </div>
            
            <Button onClick={fixJson}>
              <Wrench className="h-4 w-4 mr-2" />
              Fix JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isValid === true && <CheckCircle className="h-5 w-5 text-green-500" />}
              {isValid === false && <XCircle className="h-5 w-5 text-red-500" />}
              Fixed JSON
            </div>
            {fixedJson && (
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
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
            value={fixedJson}
            readOnly
            placeholder="Fixed JSON will appear here..."
            className="min-h-[400px] font-mono text-sm bg-muted/50"
          />
          
          {changes.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Changes Made:</h4>
              <div className="space-y-1">
                {changes.map((change, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {fixedJson && (
            <div className="flex gap-2">
              <Badge variant="outline">{fixedJson.length} characters</Badge>
              <Badge variant="outline">{fixedJson.split('\n').length} lines</Badge>
              {isValid && (
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  Valid JSON
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}