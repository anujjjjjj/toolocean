import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LintIssue {
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
}

const DockerfileFormatterTool = () => {
  const [input, setInput] = useState("");
  const [formatted, setFormatted] = useState("");
  const [issues, setIssues] = useState<LintIssue[]>([]);
  const { toast } = useToast();

  const formatDockerfile = () => {
    if (!input.trim()) {
      toast({ title: "Error", description: "Please enter a Dockerfile", variant: "destructive" });
      return;
    }

    const lines = input.split('\n');
    const formattedLines: string[] = [];
    const foundIssues: LintIssue[] = [];
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        formattedLines.push(line);
        continue;
      }

      // Parse instruction
      const parts = trimmedLine.split(/\s+/);
      const instruction = parts[0].toUpperCase();
      const args = parts.slice(1).join(' ');

      // Format the instruction
      let formattedLine = `${instruction} ${args}`;

      // Apply formatting rules
      switch (instruction) {
        case 'FROM':
          // FROM should be first non-comment instruction
          if (formattedLines.some(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('FROM'))) {
            foundIssues.push({
              line: lineNumber,
              severity: 'warning',
              message: 'FROM should typically be the first instruction',
              rule: 'from-order'
            });
          }
          break;

        case 'RUN':
          // Check for apt-get without -y flag
          if (args.includes('apt-get') && !args.includes('-y')) {
            foundIssues.push({
              line: lineNumber,
              severity: 'warning',
              message: 'Consider adding -y flag to apt-get commands',
              rule: 'apt-get-no-recommends'
            });
          }
          // Check for missing clean up after apt-get
          if (args.includes('apt-get install') && !args.includes('rm -rf /var/lib/apt/lists/*')) {
            foundIssues.push({
              line: lineNumber,
              severity: 'info',
              message: 'Consider cleaning apt cache to reduce image size',
              rule: 'apt-cleanup'
            });
          }
          break;

        case 'COPY':
        case 'ADD':
          // Prefer COPY over ADD
          if (instruction === 'ADD' && !args.includes('http') && !args.includes('.tar')) {
            foundIssues.push({
              line: lineNumber,
              severity: 'info',
              message: 'Consider using COPY instead of ADD for local files',
              rule: 'prefer-copy'
            });
          }
          break;

        case 'WORKDIR':
          // Check for absolute paths
          if (!args.startsWith('/')) {
            foundIssues.push({
              line: lineNumber,
              severity: 'warning',
              message: 'WORKDIR should use absolute paths',
              rule: 'workdir-absolute'
            });
          }
          break;

        case 'USER':
          // Check for root user
          if (args === 'root' || args === '0') {
            foundIssues.push({
              line: lineNumber,
              severity: 'warning',
              message: 'Avoid running containers as root user',
              rule: 'no-root-user'
            });
          }
          break;

        case 'EXPOSE':
          // Check for valid port range
          const port = parseInt(args);
          if (isNaN(port) || port < 1 || port > 65535) {
            foundIssues.push({
              line: lineNumber,
              severity: 'error',
              message: 'EXPOSE should use valid port numbers (1-65535)',
              rule: 'valid-port'
            });
          }
          break;
      }

      // Check for valid instruction
      const validInstructions = [
        'FROM', 'RUN', 'CMD', 'LABEL', 'EXPOSE', 'ENV', 'ADD', 'COPY',
        'ENTRYPOINT', 'VOLUME', 'USER', 'WORKDIR', 'ARG', 'ONBUILD',
        'STOPSIGNAL', 'HEALTHCHECK', 'SHELL'
      ];

      if (!validInstructions.includes(instruction)) {
        foundIssues.push({
          line: lineNumber,
          severity: 'error',
          message: `Unknown instruction: ${instruction}`,
          rule: 'unknown-instruction'
        });
      }

      formattedLines.push(formattedLine);
    }

    setFormatted(formattedLines.join('\n'));
    setIssues(foundIssues);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatted);
    toast({ title: "Copied to clipboard!" });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <CheckCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dockerfile Formatter & Linter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Dockerfile Content</label>
            <Textarea
              placeholder="Paste your Dockerfile content here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-64 font-mono text-xs"
            />
          </div>

          <Button onClick={formatDockerfile} className="w-full">
            Format & Lint Dockerfile
          </Button>
        </CardContent>
      </Card>

      {issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Linting Issues ({issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {issues.map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded border">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(issue.severity)}
                    <Badge variant={getSeverityColor(issue.severity) as any}>
                      {issue.severity}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Line {issue.line}</span>
                      <Badge variant="outline" className="text-xs">
                        {issue.rule}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {formatted && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Formatted Dockerfile</CardTitle>
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formatted}
              readOnly
              className="h-64 font-mono text-xs"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DockerfileFormatterTool;