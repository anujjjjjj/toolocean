import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
 */
export function ToolLinkCard({ tool }: { tool: CatalogTool }) {
  const Icon = getToolIcon(tool.icon);

  return (
    <Card className="group transition-all hover:opacity-90 hover:shadow-elegant">
      <Link
        to={toolPath(tool)}
        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardHeader className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg group-hover:text-primary transition-colors">
            {tool.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center pt-0">
          <CardDescription className="text-sm">{tool.description}</CardDescription>
        </CardContent>
      </Link>
    </Card>
  );
}
