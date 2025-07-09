import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  featured?: boolean;
  keywords: string[];
}

interface ToolCardProps {
  tool: Tool;
  onAddToWorkflow?: (toolId: string) => void;
  showWorkflowButton?: boolean;
}

export function ToolCard({ tool, onAddToWorkflow, showWorkflowButton = false }: ToolCardProps) {
  const navigate = useNavigate();
  
  // Get the icon component dynamically
  const IconComponent = (Icons as any)[tool.icon] as LucideIcon;
  const Icon = IconComponent || Icons.Wrench;

  const handleOpenTool = () => {
    navigate(`/tools/${tool.id}`);
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
    <Card className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
      {tool.featured && (
        <div className="absolute top-0 right-0 bg-gradient-primary text-white text-xs px-2 py-1 rounded-bl-lg font-medium">
          Featured
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-subtle flex items-center justify-center group-hover:bg-gradient-primary group-hover:text-white transition-all duration-300">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {tool.name}
            </CardTitle>
            <Badge 
              variant="outline" 
              className={`text-xs capitalize ${getCategoryColor(tool.category)}`}
            >
              {tool.category}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {tool.description}
        </CardDescription>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleOpenTool}
            className="flex-1 bg-gradient-primary hover:bg-gradient-ocean transition-all duration-300"
          >
            Open Tool
          </Button>
          
          {showWorkflowButton && onAddToWorkflow && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddToWorkflow(tool.id)}
              className="shrink-0"
            >
              + Workflow
            </Button>
          )}
        </div>
        
        {/* Keywords for search (hidden) */}
        <div className="hidden">
          {tool.keywords.join(" ")}
        </div>
      </CardContent>
    </Card>
  );
}