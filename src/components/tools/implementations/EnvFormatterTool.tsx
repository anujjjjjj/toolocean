import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface EnvFormatterToolProps {
  onOutputChange?: (output: string) => void;
}

export const EnvFormatterTool = ({ onOutputChange }: EnvFormatterToolProps) => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState("format");
  const { toast } = useToast();

  const formatEnvFile = (envContent: string): string => {
    const lines = envContent.split('\n');
    const formattedLines: string[] = [];
    let currentSection = '';

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments for processing
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        formattedLines.push(line);
        return;
      }

      // Check for key=value pattern
      const match = trimmedLine.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        
        // Detect section changes
        const keyPrefix = key.split('_')[0];
        if (keyPrefix !== currentSection && currentSection !== '') {
          formattedLines.push(''); // Add empty line between sections
        }
        currentSection = keyPrefix;

        // Format the line
        let formattedValue = value;
        
        // Quote values that contain spaces or special characters
        if (value && !value.startsWith('"') && !value.startsWith("'")) {
          if (value.includes(' ') || value.includes('$') || value.includes('&') || value.includes('|')) {
            formattedValue = `"${value}"`;
          }
        }

        formattedLines.push(`${key}=${formattedValue}`);
      } else {
        formattedLines.push(line);
      }
    });

    return formattedLines.join('\n');
  };

  const validateEnvFile = (envContent: string): { isValid: boolean; errors: string[] } => {
    const lines = envContent.split('\n');
    const errors: string[] = [];
    const keys = new Set<string>();

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }

      // Check for valid key=value pattern
      const match = trimmedLine.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!match) {
        errors.push(`Line ${lineNumber}: Invalid format. Expected KEY=value`);
        return;
      }

      const [, key, value] = match;

      // Check for duplicate keys
      if (keys.has(key)) {
        errors.push(`Line ${lineNumber}: Duplicate key "${key}"`);
      } else {
        keys.add(key);
      }

      // Check key naming convention
      if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
        errors.push(`Line ${lineNumber}: Key "${key}" should use UPPER_SNAKE_CASE`);
      }

      // Warn about potentially unsafe values
      if (value && !value.startsWith('"') && !value.startsWith("'")) {
        if (value.includes(' ')) {
          errors.push(`Line ${lineNumber}: Value contains spaces but is not quoted`);
        }
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  const generateTemplate = (): string => {
    return `# Application Configuration
APP_NAME=MyApplication
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:3000

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=myapp
DB_USERNAME=root
DB_PASSWORD=

# Cache Configuration
CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

# Mail Configuration
MAIL_DRIVER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=tls

# Third-party Services
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=base64:...`;
  };

  const handleProcess = () => {
    if (mode === "template") {
      const template = generateTemplate();
      setOutput(template);
      onOutputChange?.(template);
      toast({
        title: "Success",
        description: "Environment template generated",
      });
      return;
    }

    if (!input.trim()) {
      toast({
        title: "Error",
        description: "Please enter environment file content",
        variant: "destructive",
      });
      return;
    }

    try {
      if (mode === "format") {
        const formatted = formatEnvFile(input);
        setOutput(formatted);
        onOutputChange?.(formatted);
        toast({
          title: "Success",
          description: "Environment file formatted successfully",
        });
      } else if (mode === "validate") {
        const validation = validateEnvFile(input);
        const result = validation.isValid 
          ? "✅ Environment file is valid!" 
          : `❌ Validation failed:\n\n${validation.errors.join('\n')}`;
        
        setOutput(result);
        onOutputChange?.(result);
        
        toast({
          title: validation.isValid ? "Success" : "Validation Failed",
          description: validation.isValid 
            ? "Environment file is valid" 
            : `Found ${validation.errors.length} issue${validation.errors.length > 1 ? 's' : ''}`,
          variant: validation.isValid ? "default" : "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process environment file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>.env File Formatter</CardTitle>
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
                <SelectItem value="format">Format</SelectItem>
                <SelectItem value="validate">Validate</SelectItem>
                <SelectItem value="template">Generate Template</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode !== "template" && (
            <div>
              <label htmlFor="env-input" className="block text-sm font-medium mb-2">
                Environment File Content
              </label>
              <Textarea
                id="env-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="APP_NAME=MyApp&#10;APP_ENV=development&#10;DB_HOST=localhost"
                className="h-40 font-mono"
              />
            </div>
          )}

          <Button onClick={handleProcess} className="w-full">
            {mode === "format" ? "Format .env File" : 
             mode === "validate" ? "Validate .env File" : 
             "Generate Template"}
          </Button>

          {output && (
            <div>
              <label htmlFor="env-output" className="block text-sm font-medium mb-2">
                {mode === "format" ? "Formatted .env File" : 
                 mode === "validate" ? "Validation Results" : 
                 "Environment Template"}
              </label>
              <Textarea
                id="env-output"
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