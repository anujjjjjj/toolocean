import { Link } from "react-router-dom";
import { getToolIcon } from "@/lib/toolIcons";
import { toolPath, type CatalogTool } from "@/data/toolCatalog";

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
 * Deliberately built from a bare div/link rather than the Card primitive:
 * Card's default header+content padding (24px each) is what made a grid of
 * these read as mostly whitespace with a name floating in it.
 */
export function ToolLinkCard({ tool }: { tool: CatalogTool }) {
  const Icon = getToolIcon(tool.icon);

  return (
    <Link
      to={toolPath(tool)}
      className="group flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 transition-colors group-hover:bg-primary">
        <Icon className="h-4 w-4 text-primary transition-colors group-hover:text-primary-foreground" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold leading-tight">{tool.name}</h3>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2">
          {tool.description}
        </p>
      </div>
    </Link>
  );
}
