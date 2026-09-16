import { Button } from "@/components/ui/button";
import { getToolIcon } from "@/lib/toolIcons";
import { Link } from "react-router-dom";

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
  // Get the icon component dynamically
  const Icon = getToolIcon(tool.icon);

  /*
   * Tools live at a flat root slug. This used to navigate to /tools/<id>, which
   * is a legacy prefix that 301s, so every card click cost a redirect and no
   * anchor existed for a crawler to follow in the first place.
   */
  const href = `/${tool.id}`;

  return (
    <div className="group relative flex flex-col gap-2.5 rounded-lg border border-border/60 bg-card p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elegant">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 transition-colors group-hover:bg-primary">
          <Icon className="h-4 w-4 text-primary transition-colors group-hover:text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-tight">
            <Link to={href} className="after:absolute after:inset-0 after:content-['']">
              {tool.name}
            </Link>
          </h3>
          {tool.featured && (
            <span className="mt-1 inline-block rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              Featured
            </span>
          )}
        </div>
      </div>

      <p className="text-xs leading-snug text-muted-foreground line-clamp-2">{tool.description}</p>

      {showWorkflowButton && onAddToWorkflow && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddToWorkflow(tool.id)}
          className="relative z-10 h-7 w-fit text-xs"
        >
          + Workflow
        </Button>
      )}

      {/* Keywords for search (hidden) */}
      <div className="hidden">
        {tool.keywords.join(" ")}
      </div>
    </div>
  );
}