import { Writable } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { AppRoutes } from "./AppRoutes";
import { CATEGORY_INDEXES, PRERENDER_ROUTES, headForRoute } from "./lib/prerenderRoutes";

/**
 * Build-time render entry. Consumed by scripts/prerender.mjs, never by the browser.
 *
 * Uses renderToPipeableStream rather than renderToString specifically so route
 * components can stay behind React.lazy. renderToString has no way to await a
 * suspended boundary — it serialises the fallback — which would have forced every
 * route to be imported eagerly and collapsed the whole app back into one 1.1 MB
 * entry chunk. Waiting for onAllReady resolves every boundary first, so the HTML
 * is complete *and* the client keeps its per-route code splitting.
 *
 * The interactive tool is still absent by design: ToolWorkbench renders its
 * placeholder until mounted, keeping this pass free of the browser APIs the tools
 * need (Canvas, FileReader, Web Audio).
 */
export function renderRoute(url: string): Promise<{ html: string; head: string }> {
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
      resolve({ html, head: headForRoute(url) });
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

export { PRERENDER_ROUTES, CATEGORY_INDEXES };
