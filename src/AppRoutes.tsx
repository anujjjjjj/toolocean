import { Suspense, lazy, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPaletteProvider, useCommandPalette } from "@/contexts/CommandPaletteContext";
import { LegacyToolRedirect } from "@/components/routing/LegacyToolRedirect";
import { CATEGORY_ROUTE } from "@/data/toolCatalog";
import { LANDING_PAGES } from "@/data/landingPages";
import { SLUG_REDIRECTS } from "@/data/slugRedirects";
import Index from "./pages/Index";
// Eager: ToolRoutePage and LegacyToolRedirect import it statically anyway.
import NotFound from "./pages/NotFound";

/**
 * Everything inside the router, shared by the browser entry (main.tsx) and the
 * build-time prerender entry (entry-ssg.tsx).
 *
 * Routes are lazy so a visitor landing on one tool page does not download the ten
 * category listings and the workflow builder as well. The prerender still emits
 * complete HTML because entry-ssg.tsx renders with renderToPipeableStream and
 * waits for onAllReady, which resolves every Suspense boundary before serialising
 *, renderToString cannot do this and would have emitted the empty fallback.
 *
 * On the client, hydrateRoot keeps the server markup on screen while a lazy chunk
 * is still in flight, so the split costs nothing visually.
 */
const ToolRoutePage = lazy(() => import("./pages/ToolRoutePage"));
const LandingRoutePage = lazy(() => import("./pages/LandingRoutePage"));
const DevToolsPage = lazy(() => import("./pages/DevToolsPage"));
const WorkflowBuilderPage = lazy(() => import("./pages/WorkflowBuilderPage"));
const PdfToolsPage = lazy(() => import("./pages/PdfToolsPage"));
const CsvToolsPage = lazy(() => import("./pages/CsvToolsPage"));
const AudioToolsPage = lazy(() => import("./pages/AudioToolsPage"));
const ImageToolsPage = lazy(() => import("./pages/ImageToolsPage"));
const VideoToolsPage = lazy(() => import("./pages/VideoToolsPage"));
const SpreadsheetToolsPage = lazy(() => import("./pages/SpreadsheetToolsPage"));
const CompressionToolsPage = lazy(() => import("./pages/CompressionToolsPage"));
const ArchiveToolsPage = lazy(() => import("./pages/ArchiveToolsPage"));
const ConverterToolsPage = lazy(() => import("./pages/ConverterToolsPage"));
const AllToolsPage = lazy(() => import("./pages/AllToolsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));

const CATEGORY_LISTINGS = [
  { path: "/pdf-tools", element: <PdfToolsPage /> },
  { path: "/csv-tools", element: <CsvToolsPage /> },
  { path: "/audio-tools", element: <AudioToolsPage /> },
  { path: "/image-tools", element: <ImageToolsPage /> },
  { path: "/video-tools", element: <VideoToolsPage /> },
  { path: "/spreadsheet-tools", element: <SpreadsheetToolsPage /> },
  { path: "/compression-tools", element: <CompressionToolsPage /> },
  { path: "/archive-tools", element: <ArchiveToolsPage /> },
  { path: "/converter-tools", element: <ConverterToolsPage /> },
];

function GlobalKeyboardHandler() {
  const { openPalette } = useCommandPalette();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        openPalette();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openPalette]);

  return null;
}

/*
 * The palette and the toaster are loaded on first use, not on first paint.
 *
 * Rendering CommandPalette unconditionally pulled cmdk, all of src/data/tools.json
 * and the 78 statically imported lucide icons in toolIcons.ts into the entry
 * chunk, on all 136 pages, for a dialog that only appears when someone presses
 * Cmd+K. The toaster is used by a handful of tools and paid the same tax.
 *
 * `hasOpened` latches so the chunk is fetched once and the dialog keeps its
 * mounted state across subsequent opens.
 */
const CommandPalette = lazy(() =>
  import("@/components/layout/CommandPalette").then((m) => ({ default: m.CommandPalette })),
);
const Toaster = lazy(() => import("@/components/ui/toaster").then((m) => ({ default: m.Toaster })));

function GlobalCommandPalette() {
  const { isOpen, closePalette } = useCommandPalette();
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  if (!hasOpened) return null;

  return (
    <Suspense fallback={null}>
      <CommandPalette open={isOpen} onOpenChange={closePalette} />
    </Suspense>
  );
}

/** Mounted only after hydration, so it never reaches the prerendered HTML. */
function DeferredToaster() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <Toaster />
    </Suspense>
  );
}

export function AppRoutes() {
  return (
    <TooltipProvider>
      <CommandPaletteProvider>
        <GlobalKeyboardHandler />
        <GlobalCommandPalette />
        <DeferredToaster />
        {/*
          Renders null until after mount, so it stays out of the prerendered HTML
          and cannot cause a hydration mismatch. Page views are not tracked here,
          useSEO owns that; see the comment there for why.
        */}
        <div className="contents" data-app-shell>
          <div className="app-scroll">
        {/*
          fallback={null} is never shown on a prerendered page: the build resolves
          every boundary before serialising, and on the client React keeps the
          server markup in place while the chunk loads.
        */}
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Category listings */}
            <Route path="/dev-tools" element={<DevToolsPage />} />
            {CATEGORY_LISTINGS.map((listing) => (
              <Route key={listing.path} path={listing.path} element={listing.element} />
            ))}

            <Route path="/workflow-builder" element={<WorkflowBuilderPage />} />

            {/* About/Privacy/Terms. Static segments outrank /:slug regardless of order. */}
            <Route path="/all-tools" element={<AllToolsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/*
              Pre-flattening tool URLs. Real 301s live in public/_redirects and
              vercel.json; this is the in-app fallback for hosts that read neither.
            */}
            {Object.values(CATEGORY_ROUTE).map((prefix) => (
              <Route key={prefix} path={`${prefix}/:slug`} element={<LegacyToolRedirect />} />
            ))}

            {/*
              Modifier and comparison landing pages, also at the root. Registered
              as explicit static paths rather than a second dynamic route so they
              outrank /:slug and cannot be shadowed by it.
            */}
            {LANDING_PAGES.map((page) => (
              <Route key={page.slug} path={`/${page.slug}`} element={<LandingRoutePage />} />
            ))}

            {Object.entries(SLUG_REDIRECTS).map(([from, to]) => (
              <Route key={from} path={`/${from}`} element={<Navigate to={to} replace />} />
            ))}

            {/*
              Every tool, at the site root. React Router ranks static segments
              above dynamic ones, so this cannot shadow the listings regardless of
              declaration order.
            */}
            <Route path="/:slug" element={<ToolRoutePage />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
          </div>
          <ConsentBanner />
        </div>
      </CommandPaletteProvider>
    </TooltipProvider>
  );
}
