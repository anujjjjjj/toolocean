import { Button } from "@/components/ui/button";
import { getToolIcon } from "@/lib/toolIcons";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { CATEGORY_BADGE_COLOR } from "@/lib/categoryBadgeColor";

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
    <div className="group relative rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-elegant">
      <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: CATEGORY_BADGE_COLOR.dev }}>
        <Icon className="h-[18px] w-[18px] text-white" />
      </div>
      <h3 className="text-[15px] font-bold leading-tight">
        <Link to={href} className="after:absolute after:inset-0 after:content-['']">
          {tool.name}
        </Link>
      </h3>
      {tool.featured && (
        <span className="mt-1 inline-block rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
          Featured
        </span>
      )}
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground line-clamp-2">{tool.description}</p>

      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10.5px] font-bold text-primary">
          <ShieldCheck className="h-2.5 w-2.5" />
          In browser
        </span>
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
      </div>

      {/* Keywords for search (hidden) */}
      <div className="hidden">
        {tool.keywords.join(" ")}
      </div>
    </div>
  );
}
