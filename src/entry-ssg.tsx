import { Writable } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { AppRoutes } from "./AppRoutes";
import { CATEGORY_INDEXES, LANDING_ROUTES, PRERENDER_ROUTES, headForRoute } from "./lib/prerenderRoutes";
import { provideToolContent } from "./lib/toolContentTransport";
import { TOOL_CONTENT_OVERRIDES, KNOWN_BROKEN } from "./data/toolContent";
import { SHARED_CONTENT_STRINGS } from "./data/toolContent/shared";
import { toolSeoData, SHARED_STRINGS } from "./data/toolSeo";
import { TOOL_CATALOG } from "./data/toolCatalog";
import { resolveToolContent } from "./lib/toolContentResolver";
import {
  LANDING_ROUTE_MODULE,
  STATIC_ROUTE_MODULES,
  TOOL_ROUTE_MODULE,
} from "./lib/routeModules";

/**
 * Build-time render entry. Consumed by scripts/prerender.mjs, never by the browser.
 *
 * Uses renderToPipeableStream rather than renderToString specifically so route
 * components can stay behind React.lazy. renderToString has no way to await a
 * suspended boundary. It serialises the fallback. Which would have forced every
 * route to be imported eagerly and collapsed the whole app back into one 1.1 MB
 * entry chunk. Waiting for onAllReady resolves every boundary first, so the HTML
 * is complete *and* the client keeps its per-route code splitting.
 *
 * The interactive tool is still absent by design: ToolWorkbench renders its
 * placeholder until mounted, keeping this pass free of the browser APIs the tools
 * need (Canvas, FileReader, Web Audio).
 */
export function renderRoute(
  url: string,
): Promise<{ html: string; head: string; toolContent: string | null }> {
  /*
   * Hand the route's content to ToolRoutePage before rendering. It cannot import
   * the resolver itself without dragging every tool's copy into the client
   * bundle; see lib/toolContentTransport.
   */
  const slug = url.replace(/^\//, "");
  const toolContent = slug ? (resolveToolContent(slug) ?? null) : null;
  provideToolContent(toolContent);

  return new Promise((resolve, reject) => {
    let html = "";
    let settled = false;

    const sink = new Writable({
      write(chunk, _encoding, callback) {
        html += chunk.toString();
        callback();
      },
    });

    sink.on("finish", () => {
      if (settled) return;
      settled = true;
      resolve({
        html,
        head: headForRoute(url),
        toolContent: toolContent ? JSON.stringify(toolContent) : null,
      });
    });

    const { pipe, abort } = renderToPipeableStream(
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>,
      {
        // onAllReady (not onShellReady) is the whole point: it fires once every
        // Suspense boundary has resolved, so no fallback markup is emitted.
        onAllReady() {
          pipe(sink);
        },
        onError(error) {
          if (settled) return;
          settled = true;
          abort();
          reject(error);
        },
      },
    );
  });
}

/*
 * routeModules is re-exported here rather than read from source by the
 * prerender script: this bundle is already compiled JavaScript, so Node can
 * import it directly and the map cannot drift from what the app actually uses.
 */
export {
  resolveToolContent,
  TOOL_CONTENT_OVERRIDES,
  KNOWN_BROKEN,
  toolSeoData,
  SHARED_STRINGS,
  SHARED_CONTENT_STRINGS,
  TOOL_CATALOG,
  PRERENDER_ROUTES,
  CATEGORY_INDEXES,
  LANDING_ROUTES,
  STATIC_ROUTE_MODULES,
  TOOL_ROUTE_MODULE,
  LANDING_ROUTE_MODULE,
};
