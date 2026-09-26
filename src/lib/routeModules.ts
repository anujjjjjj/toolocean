/**
 * Route path -> the source module that renders it.
 *
 * scripts/prerender.mjs uses this to look each route up in Vite's manifest and
 * emit preload hints for the chunks that route actually needs. It is an explicit
 * map rather than something parsed out of AppRoutes.tsx: a regex over JSX would
 * fail silently the first time the routing changed shape, and a silent failure
 * here just restores the old waterfall with nothing to show for it.
 *
 * Keys are matched exactly, except DYNAMIC_ROUTE_MODULES, which covers the two
 * families served from a single component.
 */

export const STATIC_ROUTE_MODULES: Record<string, string> = {
  "/": "src/pages/Index.tsx",
  "/dev-tools": "src/pages/DevToolsPage.tsx",
  "/pdf-tools": "src/pages/PdfToolsPage.tsx",
  "/csv-tools": "src/pages/CsvToolsPage.tsx",
  "/audio-tools": "src/pages/AudioToolsPage.tsx",
  "/image-tools": "src/pages/ImageToolsPage.tsx",
  "/video-tools": "src/pages/VideoToolsPage.tsx",
  "/spreadsheet-tools": "src/pages/SpreadsheetToolsPage.tsx",
  "/compression-tools": "src/pages/CompressionToolsPage.tsx",
  "/archive-tools": "src/pages/ArchiveToolsPage.tsx",
  "/converter-tools": "src/pages/ConverterToolsPage.tsx",
  "/workflow-builder": "src/pages/WorkflowBuilderPage.tsx",
  "/all-tools": "src/pages/AllToolsPage.tsx",
  "/about": "src/pages/AboutPage.tsx",
  "/privacy": "src/pages/PrivacyPage.tsx",
  "/terms": "src/pages/TermsPage.tsx",
};

/** Modules serving a whole family of routes. */
export const TOOL_ROUTE_MODULE = "src/pages/ToolRoutePage.tsx";
export const LANDING_ROUTE_MODULE = "src/pages/LandingRoutePage.tsx";
