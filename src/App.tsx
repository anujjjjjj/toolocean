import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CommandPaletteProvider, useCommandPalette } from "@/contexts/CommandPaletteContext";
import { CommandPalette } from "@/components/layout/CommandPalette";
import Index from "./pages/Index";
import ToolPage from "./pages/ToolPage";
import WorkflowPage from "./pages/WorkflowPage";
import WorkflowBuilderPage from "./pages/WorkflowBuilderPage";
import PdfToolsPage from "./pages/PdfToolsPage";
import PdfToolPage from "./pages/PdfToolPage";
import CsvToolsPage from "./pages/CsvToolsPage";
import CsvToolPage from "./pages/CsvToolPage";
import AudioToolsPage from "./pages/AudioToolsPage";
import AudioToolPage from "./pages/AudioToolPage";
import ImageToolsPage from "./pages/ImageToolsPage";
import ImageToolPage from "./pages/ImageToolPage";
import VideoToolsPage from "./pages/VideoToolsPage";
import VideoToolPage from "./pages/VideoToolPage";
import SpreadsheetToolsPage from "./pages/SpreadsheetToolsPage";
import SpreadsheetToolPage from "./pages/SpreadsheetToolPage";
import CompressionToolsPage from "./pages/CompressionToolsPage";
import CompressionToolPage from "./pages/CompressionToolPage";
import ArchiveToolsPage from "./pages/ArchiveToolsPage";
import ArchiveToolPage from "./pages/ArchiveToolPage";
import DevToolsPage from "./pages/DevToolsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle global keyboard shortcuts
function GlobalKeyboardHandler() {
  const { openPalette } = useCommandPalette();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openPalette]);

  return null;
}

// Component to render CommandPalette globally
function GlobalCommandPalette() {
  const { isOpen, closePalette } = useCommandPalette();
  return <CommandPalette open={isOpen} onOpenChange={closePalette} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <CommandPaletteProvider>
          <GlobalKeyboardHandler />
          <GlobalCommandPalette />
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tools/:toolId" element={<ToolPage />} />
            <Route path="/workflows" element={<WorkflowPage />} />
            <Route path="/workflow-builder" element={<WorkflowBuilderPage />} />
            <Route path="/pdf-tools" element={<PdfToolsPage />} />
            <Route path="/pdf-tools/:toolId" element={<PdfToolPage />} />
            <Route path="/csv-tools" element={<CsvToolsPage />} />
            <Route path="/csv-tools/:toolId" element={<CsvToolPage />} />
            <Route path="/audio-tools" element={<AudioToolsPage />} />
            <Route path="/audio-tools/:toolId" element={<AudioToolPage />} />
            <Route path="/image-tools" element={<ImageToolsPage />} />
            <Route path="/image-tools/:toolId" element={<ImageToolPage />} />
            <Route path="/video-tools" element={<VideoToolsPage />} />
            <Route path="/video-tools/:toolId" element={<VideoToolPage />} />
            <Route path="/spreadsheet-tools" element={<SpreadsheetToolsPage />} />
            <Route path="/spreadsheet-tools/:toolId" element={<SpreadsheetToolPage />} />
            <Route path="/compression-tools" element={<CompressionToolsPage />} />
            <Route path="/compression-tools/:toolId" element={<CompressionToolPage />} />
            <Route path="/archive-tools" element={<ArchiveToolsPage />} />
            <Route path="/archive-tools/:toolId" element={<ArchiveToolPage />} />
            <Route path="/dev-tools" element={<DevToolsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CommandPaletteProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
