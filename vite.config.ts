import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    /*
     * The manifest maps each source module to its built chunk and that chunk's
     * static-import closure. scripts/prerender.mjs reads it to emit a
     * <link rel="modulepreload"> per route.
     *
     * Without it every prerendered page shipped only the entry script, so the
     * browser could not discover the route chunk until the entry had downloaded,
     * parsed and executed — a four-request serial waterfall before the page
     * could mount: HTML -> entry -> route -> tool -> the tool's dependencies.
     */
    manifest: true,
    target: "es2020",
  },
}));
