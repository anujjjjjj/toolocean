import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { getToolIcon } from "@/lib/toolIcons";
import { toolPath, type CatalogTool } from "@/data/toolCatalog";
import { prefetchTool, usePrefetchOnView } from "@/lib/prefetchTool";

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
  const ref = usePrefetchOnView<HTMLAnchorElement>(tool.id);

  return (
    <Link
      ref={ref}
      to={toolPath(tool)}
      onMouseEnter={() => prefetchTool(tool.id, "hover")}
      onFocus={() => prefetchTool(tool.id, "hover")}
      className="paper-tool"
    >
      <span className="paper-ico">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <h3 className="text-[15px] font-medium leading-tight">{tool.name}</h3>
      <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2">{tool.description}</p>
      <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
        <ShieldCheck className="h-3 w-3" />
        In browser
      </span>
    </Link>
  );
}
