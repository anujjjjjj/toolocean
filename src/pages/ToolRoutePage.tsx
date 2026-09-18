import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ToolPageLayout } from "@/components/tool-page/ToolPageLayout";
import { getLazyTool } from "@/lib/lazyToolRegistry";
import { loadToolContent, readSyncToolContent } from "@/lib/toolContentTransport";
import type { ToolPageContent } from "@/types/toolContent";
import NotFound from "./NotFound";

/**
 * The single route behind all 114 tool pages.
 *
 * Every tool is served from a flat slug at the site root, so one route and one
 * layout cover the whole catalogue. Previously each of the eleven categories had
 * its own page component with its own copy of the SEO wiring, which is how they
 * drifted apart.
 *
 * Content is not imported here, see toolContentTransport for why. On a
 * prerendered page it is read synchronously from the inlined payload, so
 * hydration matches the server markup; only a client-side navigation to a
 * different tool has to fetch the resolver.
 */
const ToolRoutePage = () => {
  const { slug } = useParams<{ slug: string }>();

  /*
   * Whether the slug is a real tool is decided synchronously, from the registry.
   *
   * This has to happen before any async path: /:slug is a catch-all, so an
   * unknown slug lands here too, including the prerender's own /__not_found__
   * route. Waiting on a fetch for those would render an empty body on the server
   * and then mismatch on hydration, which is exactly how 404.html lost its <h1>.
   */
  const Tool = slug ? getLazyTool(slug) : undefined;
  const isKnownTool = Boolean(slug && Tool);

  // Resolved in render, not an effect: hydration needs it in the first tick.
  const sync = slug && isKnownTool ? readSyncToolContent(slug) : null;

  const [loaded, setLoaded] = useState<{ slug: string; content: ToolPageContent | null } | null>(
    sync && slug ? { slug, content: sync } : null,
  );

  useEffect(() => {
    if (!slug || !isKnownTool || sync || loaded?.slug === slug) return;

    let cancelled = false;
    void loadToolContent(slug).then((content) => {
      if (!cancelled) setLoaded({ slug, content });
    });
    return () => {
      cancelled = true;
    };
  }, [slug, isKnownTool, sync, loaded?.slug]);

  // Unknown slug: answer immediately and identically on server and client.
  if (!slug || !Tool) return <NotFound />;

  const content = sync ?? (loaded?.slug === slug ? loaded.content : null);

  // Still fetching the resolver after a client-side navigation. There is no
  // server markup to preserve on this path, so rendering nothing briefly is
  // correct. The alternative is a skeleton that would itself shift layout.
  if (!content && loaded?.slug !== slug) return null;

  // A slug in the registry with no content is a build error rather than a user
  // error; scripts/check-catalog.mjs exists to make this unreachable.
  if (!content) return <NotFound />;

  return <ToolPageLayout content={content} tool={Tool} />;
};

export default ToolRoutePage;
