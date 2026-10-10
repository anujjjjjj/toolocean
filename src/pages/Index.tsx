import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { VisitorCount } from "@/components/home/VisitorCount";
import { Link } from "react-router-dom";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import { useSEO } from "@/hooks/useSEO";
import { HOME_SEO } from "@/data/staticPageSeo";
import { buildHomeGraph } from "@/lib/sitePageSchema";
import type { CategoryKey } from "@/data/toolCatalog";
import {
  CATEGORY_INDEX,
  CATEGORY_LABEL,
  TOOL_CATALOG,
  toolPath,
  toolsInCategory,
} from "@/data/toolCatalog";
import { getToolIcon } from "@/lib/toolIcons";
import { prefetchTool, usePrefetchOnView } from "@/lib/prefetchTool";

const CATEGORY_ORDER: CategoryKey[] = [
  "pdf",
  "image",
  "dev",
  "csv",
  "spreadsheet",
  "video",
  "audio",
  "archive",
  "compression",
  "converter",
];

function chipLabel(key: CategoryKey) {
  return CATEGORY_LABEL[key].replace(/ Tools$/, "");
}

function ToolCard({ tool }: { tool: (typeof TOOL_CATALOG)[number] }) {
  const Icon = getToolIcon(tool.icon);
  const ref = usePrefetchOnView<HTMLAnchorElement>(tool.id);
  return (
    <Link
      ref={ref}
      to={toolPath(tool)}
      className="paper-tool"
      onMouseEnter={() => prefetchTool(tool.id, "hover")}
      onFocus={() => prefetchTool(tool.id, "hover")}
    >
      <span className="paper-ico" aria-hidden="true">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span>
        <span className="block text-[15px] font-medium tracking-[-0.005em]">{tool.name}</span>
        <span className="paper-desc mt-1 block text-[13px] leading-snug text-muted-foreground">{tool.description}</span>
      </span>
    </Link>
  );
}

const Index = () => {
  const { openPalette } = useCommandPalette();
  const [filter, setFilter] = useState<CategoryKey | "all">("all");

  useSEO({
    ...HOME_SEO,
    path: "/",
    jsonLd: [buildHomeGraph()],
  });

  const tools = filter === "all" ? TOOL_CATALOG : toolsInCategory(filter);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-[1120px] px-5 md:px-8">
        <section className="pb-6 pt-9 md:pt-[72px]">
          <h1 className="max-w-[16ch] text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[44px]">
            Free tools that run in your browser.
          </h1>
          <p className="mt-3 max-w-[56ch] text-muted-foreground">
            PDFs, images, text and data tools. No sign-up, no uploads, nothing to install.
          </p>
        </section>

        <nav className="flex gap-2 overflow-x-auto pb-4 [scrollbar-width:none]" aria-label="Browse by category">
          <a
            href="/all-tools"
            className="paper-chip"
            aria-current={filter === "all" ? "true" : undefined}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
              event.preventDefault();
              setFilter("all");
            }}
          >
            All <b>{TOOL_CATALOG.length}</b>
          </a>
          {CATEGORY_ORDER.map((key) => {
            const count = toolsInCategory(key).length;
            return (
              <a
                key={key}
                href={CATEGORY_INDEX[key]}
                className="paper-chip"
                aria-current={filter === key ? "true" : undefined}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                  event.preventDefault();
                  setFilter(key);
                }}
              >
                {chipLabel(key)} <b>{count}</b>
              </a>
            );
          })}
        </nav>

        <button type="button" className="sr-only" onClick={openPalette}>
          Search all tools
        </button>

        <section className="grid grid-cols-2 gap-2 pb-12 min-[761px]:grid-cols-3 min-[1000px]:grid-cols-4 md:gap-3" aria-label="Tools">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </section>

        <div className="paper-acc mb-12">
        <details>
          <summary><h2>About ToolOcean</h2></summary>
          <div className="acc-body">
            <p>ToolOcean. Every tool you need, right in your browser.</p>
            <h3>100% Private</h3>
            <p>All processing happens in your browser. Your files never leave your device.</p>
            <h3>Instant Results</h3>
            <p>No upload delays. No server queues. Get results instantly.</p>
            <h3>Works Offline</h3>
            <p>Once loaded, tools work without an internet connection. No accounts, no tracking, no ads.</p>
            <h3>Explore Tools</h3>
            <p>Chain tools together into an automated pipeline. Start Building. Dev Tools. PDF Tools.</p>
            <p>JSON formatters, encoders, converters, and more utilities for developers.</p>
            <p>Merge, split, compress, sign, encrypt, unlock, and fill PDF forms.</p>
            <p>Resize, crop, compress, and convert images without losing the originals.</p>
            <p>Convert, validate, and merge CSV files with full control over delimiters.</p>
            <p>Read Excel files, extract columns, and convert sheets to CSV or JSON.</p>
            <p>Trim clips, pull thumbnails, read metadata, and make GIFs.</p>
            <p>Cut and join audio files with sample-accurate boundaries.</p>
            <p>Open, inspect, and build ZIP archives without extracting to disk.</p>
            <p>Gzip and LZ-String compression for payloads, URLs, and stored blobs.</p>
            <p>Convert between formats: Markdown↔DOCX, JSON↔TOML↔YAML↔XML, colors, timestamps.</p>
            <h3>Popular tools</h3>
            <p>Every one of these runs entirely in your browser. Nothing is uploaded.</p>
            <p>
              <Link to="/workflow-builder">Workflow Builder</Link>. Create workflow. In browser.
            </p>
            <p>
              <Link to="/all-tools">Browse all {TOOL_CATALOG.length} tools</Link>
            </p>
          </div>
        </details>
        </div>
        <VisitorCount />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
