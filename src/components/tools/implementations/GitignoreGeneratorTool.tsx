import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GitignoreGeneratorTool = () => {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [customLines, setCustomLines] = useState("");
  const [output, setOutput] = useState("");
  const { toast } = useToast();

  const templates = {
    "Node.js": [
      "# Dependencies",
      "node_modules/",
      "npm-debug.log*",
      "yarn-debug.log*",
      "yarn-error.log*",
      "",
      "# Runtime data",
      "pids",
      "*.pid",
      "*.seed",
      "*.pid.lock",
      "",
      "# Coverage directory used by tools like istanbul",
      "coverage/",
      "*.lcov",
      "",
      "# Build outputs",
      "dist/",
      "build/",
      "",
      "# Environment variables",
      ".env",
      ".env.local",
      ".env.development.local",
      ".env.test.local",
      ".env.production.local"
    ],
    "React": [
      "# Dependencies",
      "node_modules/",
      "",
      "# Production build",
      "/build",
      "/dist",
      "",
      "# Environment variables",
      ".env.local",
      ".env.development.local",
      ".env.test.local",
      ".env.production.local",
      "",
      "# Logs",
      "npm-debug.log*",
      "yarn-debug.log*",
      "yarn-error.log*",
      "",
      "# Runtime data",
      "*.tsbuildinfo"
    ],
    "Python": [
      "# Byte-compiled / optimized / DLL files",
      "__pycache__/",
      "*.py[cod]",
      "*$py.class",
      "",
      "# C extensions",
      "*.so",
      "",
      "# Distribution / packaging",
      ".Python",
      "build/",
      "develop-eggs/",
      "dist/",
      "downloads/",
      "eggs/",
      ".eggs/",
      "lib/",
      "lib64/",
      "parts/",
      "sdist/",
      "var/",
      "wheels/",
      "*.egg-info/",
      ".installed.cfg",
      "*.egg",
      "",
      "# Virtual environments",
      "venv/",
      "env/",
      "ENV/",
      ".venv/",
      "",
      "# IDE",
      ".vscode/",
      ".idea/",
      "",
      "# Jupyter Notebook",
      ".ipynb_checkpoints"
    ],
    "Java": [
      "# Compiled class file",
      "*.class",
      "",
      "# Log file",
      "*.log",
      "",
      "# Package Files",
      "*.jar",
      "*.war",
      "*.nar",
      "*.ear",
      "*.zip",
      "*.tar.gz",
      "*.rar",
      "",
      "# Maven",
      "target/",
      "",
      "# Gradle",
      ".gradle",
      "build/",
      "",
      "# IDE",
      ".idea/",
      "*.iml",
      ".eclipse/",
      ".vscode/"
    ],
    "C++": [
      "# Compiled Object files",
      "*.slo",
      "*.lo",
      "*.o",
      "*.obj",
      "",
      "# Precompiled Headers",
      "*.gch",
      "*.pch",
      "",
      "# Compiled Dynamic libraries",
      "*.so",
      "*.dylib",
      "*.dll",
      "",
      "# Fortran module files",
      "*.mod",
      "*.smod",
      "",
      "# Compiled Static libraries",
      "*.lai",
      "*.la",
      "*.a",
      "*.lib",
      "",
      "# Executables",
      "*.exe",
      "*.out",
      "*.app"
    ],
    "macOS": [
      "# General",
      ".DS_Store",
      ".AppleDouble",
      ".LSOverride",
      "",
      "# Icon must end with two \\r",
      "Icon",
      "",
      "# Thumbnails",
      "._*",
      "",
      "# Files that might appear in the root of a volume",
      ".DocumentRevisions-V100",
      ".fseventsd",
      ".Spotlight-V100",
      ".TemporaryItems",
      ".Trashes",
      ".VolumeIcon.icns",
      ".com.apple.timemachine.donotpresent"
    ],
    "Windows": [
      "# Windows thumbnail cache files",
      "Thumbs.db",
      "Thumbs.db:encryptable",
      "ehthumbs.db",
      "ehthumbs_vista.db",
      "",
      "# Dump file",
      "*.stackdump",
      "",
      "# Folder config file",
      "[Dd]esktop.ini",
      "",
      "# Recycle Bin used on file shares",
      "$RECYCLE.BIN/",
      "",
      "# Windows Installer files",
      "*.cab",
      "*.msi",
      "*.msix",
      "*.msm",
      "*.msp",
      "",
      "# Windows shortcuts",
      "*.lnk"
    ],
    "Linux": [
      "*~",
      "",
      "# temporary files which can be created if a process still has a handle open of a deleted file",
      ".fuse_hidden*",
      "",
      "# KDE directory preferences",
      ".directory",
      "",
      "# Linux trash folder which might appear on any partition or disk",
      ".Trash-*",
      "",
      "# .nfs files are created when an open file is removed but is still being accessed",
      ".nfs*"
    ],
    "VS Code": [
      ".vscode/*",
      "!.vscode/settings.json",
      "!.vscode/tasks.json",
      "!.vscode/launch.json",
      "!.vscode/extensions.json",
      "*.code-workspace"
    ],
    "JetBrains IDEs": [
      "# Covers JetBrains IDEs: IntelliJ, RubyMine, PhpStorm, AppCode, PyCharm, CLion, Android Studio, WebStorm and Rider",
      ".idea/",
      "",
      "# CMake",
      "cmake-build-*/",
      "",
      "# File-based project format",
      "*.iws",
      "",
      "# IntelliJ",
      "out/",
      "",
      "# JIRA plugin",
      "atlassian-ide-plugin.xml"
    ]
  };

  const generateGitignore = () => {
    const lines: string[] = [];
    
    if (selectedTemplates.length > 0) {
      selectedTemplates.forEach((template, index) => {
        if (index > 0) lines.push("");
        lines.push(`# ${template}`);
        lines.push(...templates[template as keyof typeof templates]);
      });
    }
    
    if (customLines.trim()) {
      if (lines.length > 0) lines.push("");
      lines.push("# Custom rules");
      lines.push(...customLines.split('\n').filter(line => line.trim()));
    }
    
    setOutput(lines.join('\n'));
  };

  const toggleTemplate = (template: string) => {
    setSelectedTemplates(prev => 
      prev.includes(template) 
        ? prev.filter(t => t !== template)
        : [...prev, template]
    );
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  const downloadFile = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.gitignore';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded .gitignore file!" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>.gitignore Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Select Templates</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.keys(templates).map((template) => (
                <label key={template} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={selectedTemplates.includes(template)}
                    onCheckedChange={() => toggleTemplate(template)}
                  />
                  <span className="text-sm">{template}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Custom Rules</label>
            <Textarea
              placeholder="Add custom files/patterns to ignore (one per line)"
              value={customLines}
              onChange={(e) => setCustomLines(e.target.value)}
              className="h-24"
            />
          </div>

          <Button onClick={generateGitignore} className="w-full">
            Generate .gitignore
          </Button>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated .gitignore</CardTitle>
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={downloadFile} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={output}
              readOnly
              className="h-96 font-mono text-xs"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GitignoreGeneratorTool;