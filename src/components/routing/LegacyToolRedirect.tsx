import { Navigate, useParams } from "react-router-dom";
import { findToolBySlug, toolPath } from "@/data/toolCatalog";
import NotFound from "@/pages/NotFound";

/**
 * Sends a pre-flattening tool URL to its new canonical slug.
 *
 * Important limitation: this is a client-side redirect, so the server still
 * answers the old URL with 200 and React swaps the location afterwards. Google
 * treats that as a weaker signal than a real 301 and takes longer to consolidate
 * the two URLs.
 *
 * The actual 301s live in public/_redirects (Netlify/Cloudflare Pages) and
 * vercel.json. This component is the safety net for hosts where neither file is
 * read, without it, every previously indexed URL would hit the 404 page.
 */
export function LegacyToolRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const tool = slug ? findToolBySlug(slug) : undefined;

  if (!tool) return <NotFound />;

  return <Navigate to={toolPath(tool)} replace />;
}
