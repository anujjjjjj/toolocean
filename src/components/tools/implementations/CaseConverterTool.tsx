import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CaseConverterTool() {
  const [input, setInput] = useState("");
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const convertText = (text: string) => {
    if (!text.trim()) {
      setOutputs({});
      return;
    }

    const conversions = {
      uppercase: text.toUpperCase(),
      lowercase: text.toLowerCase(),
      titleCase: text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      sentenceCase: text
        .toLowerCase()
        .replace(/(^\w|\.\s+\w)/g, letter => letter.toUpperCase()),
      camelCase: text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase()),
      pascalCase: text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
        .replace(/^./, chr => chr.toUpperCase()),
      snakeCase: text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_|_$/g, ''),
      kebabCase: text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      constantCase: text
        .toUpperCase()
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_|_$/g, ''),
      dotCase: text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+/g, '.')
        .replace(/^\.|\.$/g, ''),
      pathCase: text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+/g, '/')
        .replace(/^\/|\/$/g, ''),
      alternatingCase: text
        .split('')
        .map((char, index) => 
          index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
        )
        .join(''),
      inverseCase: text
        .split('')
        .map(char => 
          char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
        )
        .join(''),
      firstLetterCaps: text
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    };

    setOutputs(conversions);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    convertText(value);
  };

  const copyToClipboard = async (text: string, caseName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${caseName} text has been copied to your clipboard`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadText = (text: string, caseName: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Text downloaded",
      description: `${caseName} text has been downloaded`,
    });
  };

  const caseDefinitions = [
    { key: 'uppercase', name: 'UPPERCASE', description: 'All letters in uppercase' },
    { key: 'lowercase', name: 'lowercase', description: 'All letters in lowercase' },
    { key: 'titleCase', name: 'Title Case', description: 'First letter of each word capitalized' },
    { key: 'sentenceCase', name: 'Sentence case', description: 'First letter of each sentence capitalized' },
    { key: 'camelCase', name: 'camelCase', description: 'First word lowercase, subsequent words capitalized' },
    { key: 'pascalCase', name: 'PascalCase', description: 'Every word capitalized, no spaces' },
    { key: 'snakeCase', name: 'snake_case', description: 'Lowercase words separated by underscores' },
    { key: 'kebabCase', name: 'kebab-case', description: 'Lowercase words separated by hyphens' },
    { key: 'constantCase', name: 'CONSTANT_CASE', description: 'Uppercase words separated by underscores' },
    { key: 'dotCase', name: 'dot.case', description: 'Lowercase words separated by dots' },
    { key: 'pathCase', name: 'path/case', description: 'Lowercase words separated by slashes' },
    { key: 'alternatingCase', name: 'aLtErNaTiNg CaSe', description: 'Alternating uppercase and lowercase letters' },
    { key: 'inverseCase', name: 'iNVERSE cASE', description: 'Invert the case of each letter' },
    { key: 'firstLetterCaps', name: 'First Letter Caps', description: 'First letter of each word uppercase, rest lowercase' }
  ];

  return (
    <div className="space-y-6">
      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Text Input</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter text to convert between different cases..."
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            className="min-h-[120px]"
          />
          {input && (
            <div className="mt-4 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Characters: {input.length.toLocaleString()}</span>
                <span>Words: {input.trim().split(/\s+/).length}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Panels */}
      {Object.keys(outputs).length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {caseDefinitions.map(({ key, name, description }) => {
            const output = outputs[key];
            if (!output) return null;

            return (
              <Card key={key} className="relative">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    {name}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(output, name)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadText(output, name)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="p-3 bg-muted/50 rounded-md">
                    <div className="text-sm font-mono break-words">
                      {output}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No Input State */}
      {!input && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Enter some text above to see it converted to different cases</p>
        </div>
      )}
    </div>
  );
}