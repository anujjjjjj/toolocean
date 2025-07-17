import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Wand2, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RegexGeneratorTool() {
  const [description, setDescription] = useState("");
  const [generatedRegex, setGeneratedRegex] = useState("");
  const [testString, setTestString] = useState("");
  const [matches, setMatches] = useState<RegExpMatchArray[]>([]);
  const [explanation, setExplanation] = useState("");
  const { toast } = useToast();

  const commonPatterns = [
    {
      name: "Email Address",
      description: "Match email addresses",
      regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      explanation: "Matches standard email format with username@domain.extension"
    },
    {
      name: "Phone Number (US)",
      description: "Match US phone numbers",
      regex: "^\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$",
      explanation: "Matches US phone numbers in various formats: (123) 456-7890, 123-456-7890, 123.456.7890"
    },
    {
      name: "URL",
      description: "Match HTTP/HTTPS URLs",
      regex: "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$",
      explanation: "Matches HTTP and HTTPS URLs with optional www prefix"
    },
    {
      name: "IPv4 Address",
      description: "Match IPv4 addresses",
      regex: "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
      explanation: "Matches valid IPv4 addresses (0.0.0.0 to 255.255.255.255)"
    },
    {
      name: "Strong Password",
      description: "Match strong passwords",
      regex: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
      explanation: "Requires at least 8 characters with uppercase, lowercase, digit, and special character"
    },
    {
      name: "Date (YYYY-MM-DD)",
      description: "Match dates in YYYY-MM-DD format",
      regex: "^\\d{4}-\\d{2}-\\d{2}$",
      explanation: "Matches dates in ISO format: YYYY-MM-DD"
    },
    {
      name: "Credit Card",
      description: "Match credit card numbers",
      regex: "^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$",
      explanation: "Matches Visa, MasterCard, American Express, Discover, and Diners Club card numbers"
    },
    {
      name: "HTML Tags",
      description: "Match HTML tags",
      regex: "<\\/?[a-zA-Z][a-zA-Z0-9]*(?:\\s[^>]*)?>",
      explanation: "Matches opening and closing HTML tags with optional attributes"
    },
    {
      name: "Hexadecimal Color",
      description: "Match hex color codes",
      regex: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
      explanation: "Matches hex color codes in 3 or 6 digit format: #RGB or #RRGGBB"
    },
    {
      name: "Social Security Number",
      description: "Match US SSN format",
      regex: "^\\d{3}-\\d{2}-\\d{4}$",
      explanation: "Matches US Social Security Numbers in XXX-XX-XXXX format"
    }
  ];

  const generateFromDescription = () => {
    const desc = description.toLowerCase();
    let regex = "";
    let explanation = "";

    if (desc.includes("email")) {
      regex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
      explanation = "Matches email addresses with username@domain.extension format";
    } else if (desc.includes("phone") || desc.includes("number")) {
      regex = "^\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$";
      explanation = "Matches phone numbers in various formats";
    } else if (desc.includes("url") || desc.includes("website")) {
      regex = "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$";
      explanation = "Matches HTTP/HTTPS URLs";
    } else if (desc.includes("password")) {
      regex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
      explanation = "Matches strong passwords with mixed case, numbers, and special characters";
    } else if (desc.includes("date")) {
      regex = "^\\d{4}-\\d{2}-\\d{2}$";
      explanation = "Matches dates in YYYY-MM-DD format";
    } else if (desc.includes("ip") || desc.includes("address")) {
      regex = "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$";
      explanation = "Matches IPv4 addresses";
    } else if (desc.includes("color") || desc.includes("hex")) {
      regex = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$";
      explanation = "Matches hexadecimal color codes";
    } else if (desc.includes("number") || desc.includes("digit")) {
      regex = "^\\d+$";
      explanation = "Matches one or more digits";
    } else if (desc.includes("letter") || desc.includes("alphabet")) {
      regex = "^[a-zA-Z]+$";
      explanation = "Matches one or more letters";
    } else {
      regex = ".*";
      explanation = "Generic pattern - please be more specific in your description";
    }

    setGeneratedRegex(regex);
    setExplanation(explanation);
  };

  const applyPattern = (pattern: typeof commonPatterns[0]) => {
    setGeneratedRegex(pattern.regex);
    setExplanation(pattern.explanation);
    setDescription(pattern.description);
  };

  const testRegex = () => {
    if (!generatedRegex || !testString) {
      setMatches([]);
      return;
    }

    try {
      const regex = new RegExp(generatedRegex, 'g');
      const found = Array.from(testString.matchAll(regex));
      setMatches(found);
    } catch (error) {
      setMatches([]);
      toast({
        title: "Invalid Regex",
        description: "The generated regex pattern is invalid",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedRegex);
      toast({
        title: "Copied to clipboard",
        description: "Regex pattern has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Common Patterns */}
      <Card>
        <CardHeader>
          <CardTitle>Common Regex Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {commonPatterns.map((pattern, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => applyPattern(pattern)}
                className="justify-start h-auto p-3"
              >
                <div className="text-left">
                  <div className="font-medium text-sm">{pattern.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {pattern.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              AI Regex Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Describe what you want to match:</label>
              <Textarea
                placeholder="e.g., 'email addresses', 'phone numbers', 'dates in MM/DD/YYYY format'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-20"
              />
            </div>

            <Button onClick={generateFromDescription} className="w-full">
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Regex
            </Button>

            {generatedRegex && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Generated Pattern:</label>
                  <div className="flex gap-2">
                    <Input
                      value={generatedRegex}
                      onChange={(e) => setGeneratedRegex(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Explanation:</label>
                  <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
                    {explanation}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tester */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Your Regex
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test String:</label>
              <Textarea
                placeholder="Enter text to test against your regex pattern..."
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                className="h-32"
              />
            </div>

            <Button onClick={testRegex} className="w-full" disabled={!generatedRegex}>
              <TestTube className="h-4 w-4 mr-2" />
              Test Pattern
            </Button>

            {matches.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Matches Found:</label>
                <div className="space-y-2">
                  {matches.map((match, index) => (
                    <div key={index} className="p-2 bg-green-100 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                      <div className="font-mono text-sm">{match[0]}</div>
                      {match.index !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          Position: {match.index}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Badge variant="outline" className="mt-2">
                  {matches.length} match{matches.length !== 1 ? 'es' : ''} found
                </Badge>
              </div>
            )}

            {testString && generatedRegex && matches.length === 0 && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  No matches found. The pattern might not match your test string.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}