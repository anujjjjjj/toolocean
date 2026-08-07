import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
