import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Share, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  featured?: boolean;
}

interface ToolRunnerProps {
  tool: Tool;
  children: React.ReactNode; // Tool-specific component
  onAddToWorkflow?: (toolId: string, output: string) => void;
  showWorkflowButtons?: boolean;
  className?: string;
}

export function ToolRunner({ 
  tool, 
  children, 
  onAddToWorkflow, 
  showWorkflowButtons = false,
  className = "" 
}: ToolRunnerProps) {
  const { toast } = useToast();
  const [output, setOutput] = useState("");

  // Get the icon component dynamically
  const IconComponent = (Icons as any)[tool.icon] as LucideIcon;
  const Icon = IconComponent || Icons.Wrench;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Output has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadAsFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "File downloaded",
      description: `${filename} has been downloaded`,
    });
  };

  const shareOutput = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tool.name} Output`,
          text: text,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      copyToClipboard(text);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      text: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
      formatting: "bg-green-500/10 text-green-700 dark:text-green-300",
      development: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
      security: "bg-red-500/10 text-red-700 dark:text-red-300",
    };
    return colors[category] || "bg-gray-500/10 text-gray-700 dark:text-gray-300";
  };

  return (
    <div className={`max-w-6xl mx-auto space-y-6 ${className}`}>
      {/* Tool Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white shadow-glow">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">{tool.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="outline" 
                    className={`capitalize ${getCategoryColor(tool.category)}`}
                  >
                    {tool.category}
                  </Badge>
                  {tool.featured && (
                    <Badge className="bg-gradient-primary">
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {showWorkflowButtons && onAddToWorkflow && output && (
              <Button
                onClick={() => onAddToWorkflow(tool.id, output)}
                className="bg-gradient-primary hover:bg-gradient-ocean"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Workflow
              </Button>
            )}
          </div>
          <p className="text-muted-foreground mt-2">{tool.description}</p>
        </CardHeader>
      </Card>

      {/* Tool Interface */}
      <div className="min-h-[400px]">
        {children}
      </div>

      {/* Output Actions */}
      {output && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Output Actions</h3>
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
                  onClick={() => downloadAsFile(output, `${tool.id}-output.txt`)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOutput(output)}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ToolRunner;