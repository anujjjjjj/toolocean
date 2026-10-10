import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import { initAnalytics } from "./lib/analytics";
import { initUmami } from "./lib/umami";
import { registerAssetCache } from "./lib/registerAssetCache";
import "./index.css";

/*
 * Before hydration, so the Consent Mode defaults are queued ahead of the first
 * page_view. Which useSEO fires from an effect during hydration. This only
 * populates dataLayer and schedules the tag for an idle moment; no network
 * request happens on the critical path.
 */
initAnalytics();
initUmami();
registerAssetCache();

const container = document.getElementById("root")!;

/**
 * Adopt the prerendered markup when it is there, otherwise mount fresh.
 *
 * Every route is prerendered (see scripts/prerender.mjs), so hydrateRoot is the
 * normal path: React reuses the existing DOM instead of discarding and rebuilding
 * it, which is what keeps the static HTML from flashing away on load.
 *
 * createRoot remains the fallback for `vite dev`, where no prerender has run.
 */
if (container.hasChildNodes()) {
  hydrateRoot(container, <App />);
} else {
  createRoot(container).render(<App />);
}
