import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { getToolIcon } from "@/lib/toolIcons";
import { toolPath, type CatalogTool } from "@/data/toolCatalog";
import { CATEGORY_BADGE_COLOR } from "@/lib/categoryBadgeColor";

/**
 * A tool as a real anchor.
 *
 * Replaces the `<Card onClick={() => navigate(...)}>` pattern the listing pages
 * used to share. That worked for a person with a mouse and was invisible to
 * everything else: no href for a crawler to follow, no middle-click, no
 * open-in-new-tab, no status-bar preview, and nothing for a keyboard user to
 * tab to.
 *
 * The link wraps both the name and the description so the anchor carries
 * context rather than being a bare card-shaped click target, and it resolves
 * through toolPath() so it points at the flat canonical slug instead of a
 * legacy /<category>-tools/<id> URL that would answer with a redirect.
 *
 * Icon badge is colored per category (ilovepdf.com's pattern) rather than a
 * single uniform tint, and carries a small "in browser" tag: the one claim an
 * upload-based competitor can't make, so it goes on every card, not just the
 * hero.
 */
export function ToolLinkCard({ tool }: { tool: CatalogTool }) {
  const Icon = getToolIcon(tool.icon);
  const badgeColor = CATEGORY_BADGE_COLOR[tool.category];

  return (
    <Link
      to={toolPath(tool)}
      className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: badgeColor }}>
        <Icon className="h-[18px] w-[18px] text-white" />
      </div>
      <h3 className="text-[15px] font-bold leading-tight">{tool.name}</h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground line-clamp-2">
        {tool.description}
      </p>
      <div className="mt-auto pt-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10.5px] font-bold text-primary">
          <ShieldCheck className="h-2.5 w-2.5" />
          In browser
        </span>
      </div>
    </Link>
  );
}
