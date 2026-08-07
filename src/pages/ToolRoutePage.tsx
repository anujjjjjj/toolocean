import { useParams } from "react-router-dom";
import { ToolPageLayout } from "@/components/tool-page/ToolPageLayout";
import { getLazyTool } from "@/lib/lazyToolRegistry";
import { resolveToolContent } from "@/lib/toolContentResolver";
import NotFound from "./NotFound";

/**
 * The single route behind all 114 tool pages.
 *
 * Every tool is served from a flat slug at the site root, so one route and one
 * layout cover the whole catalogue. Previously each of the eleven categories had
 * its own page component with its own copy of the SEO wiring, which is how they
 * drifted apart.
 */
const ToolRoutePage = () => {
  const { slug } = useParams<{ slug: string }>();

  const content = slug ? resolveToolContent(slug) : null;
  const Tool = slug ? getLazyTool(slug) : undefined;

  // A slug in the catalogue with no component (or the reverse) is a build error
  // rather than a user error, but rendering the 404 is still the right behaviour.
  // scripts/check-catalog.mjs exists to make this unreachable.
  if (!content || !Tool) return <NotFound />;

  return <ToolPageLayout content={content} tool={Tool} />;
};

export default ToolRoutePage;
