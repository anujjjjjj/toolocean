import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Code, FileText, FileSpreadsheet, Music, Workflow, Shield, ShieldCheck,
  Zap, Globe, Lock, Image, Video, Archive, ArrowUpDown,
} from "lucide-react";
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
  findToolBySlug,
  toolPath,
  toolsInCategory,
} from "@/data/toolCatalog";
import { CATEGORY_BADGE_COLOR } from "@/lib/categoryBadgeColor";

const CATEGORY_PILLS: { path: string; label: string }[] = [
  { path: "/all-tools", label: "All" },
  { path: "/pdf-tools", label: "PDF" },
  { path: "/image-tools", label: "Image" },
  { path: "/csv-tools", label: "CSV" },
  { path: "/spreadsheet-tools", label: "Spreadsheet" },
  { path: "/video-tools", label: "Video" },
  { path: "/audio-tools", label: "Audio" },
  { path: "/archive-tools", label: "Archive" },
  { path: "/compression-tools", label: "Compression" },
  { path: "/converter-tools", label: "Converter" },
  { path: "/dev-tools", label: "Dev" },
];

/**
 * Category cards, in the order they appear. Labels and counts come from the
 * catalog; only the icon and the one-line blurb are editorial.
 */
const CATEGORY_CARDS: { key: CategoryKey; icon: typeof Code; blurb: string }[] = [
  { key: "dev", icon: Code, blurb: "JSON formatters, encoders, converters, and more utilities for developers." },
  { key: "pdf", icon: FileText, blurb: "Merge, split, compress, sign, encrypt, unlock, and fill PDF forms." },
  { key: "image", icon: Image, blurb: "Resize, crop, compress, and convert images without losing the originals." },
  { key: "csv", icon: FileSpreadsheet, blurb: "Convert, validate, and merge CSV files with full control over delimiters." },
  { key: "spreadsheet", icon: FileSpreadsheet, blurb: "Read Excel files, extract columns, and convert sheets to CSV or JSON." },
  { key: "video", icon: Video, blurb: "Trim clips, pull thumbnails, read metadata, and make GIFs." },
  { key: "audio", icon: Music, blurb: "Cut and join audio files with sample-accurate boundaries." },
  { key: "archive", icon: Archive, blurb: "Open, inspect, and build ZIP archives without extracting to disk." },
  { key: "compression", icon: ArrowUpDown, blurb: "Gzip and LZ-String compression for payloads, URLs, and stored blobs." },
  { key: "converter", icon: ArrowUpDown, blurb: "Convert between formats: Markdown↔DOCX, JSON↔TOML↔YAML↔XML, colors, timestamps." },
];

/**
 * Tools that get a direct link from the homepage.
 *
 * Curated rather than derived: the catalog has no popularity signal, and the
 * point of this block is to cut the click depth for the specific jobs people
 * arrive already intending to do.
 */
const POPULAR_TOOL_SLUGS = [
  "pdf-merge", "pdf-compress", "pdf-split", "pdf-to-images",
  "image-compressor", "image-resizer", "image-format-converter", "image-crop",
  "zip-extractor", "zip-creator", "video-trimmer", "video-to-gif",
  "audio-cutter", "json-formatter", "base64-tool", "jwt-decoder",
  "hash-generator", "url-encoder", "regex-tester", "case-converter",
  "uuid-generator", "timestamp-converter", "text-diff", "qr-code-generator",
];

const POPULAR_TOOLS = POPULAR_TOOL_SLUGS.map(findToolBySlug).filter(
  (tool): tool is NonNullable<typeof tool> => Boolean(tool),
);

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { openPalette } = useCommandPalette();

  useSEO({
    ...HOME_SEO,
    path: "/",
    jsonLd: [buildHomeGraph()],
  });

  const handleSearchFocus = () => {
    openPalette();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section - Centered, with the soft ilovepdf-style corner gradient */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_82%_0%,hsl(var(--primary)/0.10),transparent_70%)]"
          />
          <div className="container relative mx-auto flex min-h-[62vh] flex-col items-center justify-center px-4 py-20 text-center">
          {/* Logo */}
          <div className="mb-8">
            <Logo className="mx-auto h-14 w-14" />
          </div>

          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
            <ShieldCheck className="h-4 w-4" />
            No uploads. No accounts. 100% on your device.
          </span>

          {/* Title */}
          <h1 className="text-6xl md:text-7xl font-heading font-bold mb-6 text-foreground">
            ToolOcean
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl">
            Every tool you need, right in your browser.
          </p>

          {/* Search Bar - Centered & Prominent */}
          <div className="w-full max-w-2xl mb-10">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search all tools... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                className="pl-12 pr-4 text-base"
              />
            </div>
          </div>

          {/* Quick Action Buttons - Reduced */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" asChild>
              <Link to="/workflow-builder">
                <Workflow className="h-4 w-4 mr-2" />
                Start Building
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/dev-tools">
                <Code className="h-4 w-4 mr-2" />
                Dev Tools
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pdf-tools">
                <FileText className="h-4 w-4 mr-2" />
                PDF Tools
              </Link>
            </Button>
          </div>
          </div>
        </section>

        {/* Category filter pills, all real links rather than a JS-driven filter */}
        <nav aria-label="Browse by category" className="container mx-auto px-4">
          <ul className="flex flex-wrap justify-center gap-2 pb-16">
            {CATEGORY_PILLS.map((pill) => (
              <li key={pill.path}>
                <Button
                  variant={pill.path === "/all-tools" ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  asChild
                >
                  <Link to={pill.path}>{pill.label}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Features Section - Refined */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex items-start gap-6 pb-8 border-b border-border/60">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">100% Private</h3>
                <p className="text-muted-foreground">
                  All processing happens in your browser. Your files never leave your device.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6 pb-8 border-b border-border/60">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Instant Results</h3>
                <p className="text-muted-foreground">
                  No upload delays. No server queues. Get results instantly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Works Offline</h3>
                <p className="text-muted-foreground">
                  Once loaded, tools work without an internet connection. No accounts, no tracking, no ads.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/*
          Category cards and the popular-tools grid.

          Both are real <Link> anchors rather than onClick handlers. The previous
          version navigated with useNavigate, which meant the prerendered homepage
          contained no href to any tool or category, a crawler following links
          from / could not reach a single one of the 114 tools, and 9 of them were
          reachable only from sitemap.xml.

          Counts are derived from the catalog. They were hardcoded and had drifted
          badly: "31 Tools" for a category holding 66.
        */}
        <section className="container mx-auto px-4 py-16" aria-labelledby="explore-heading">
          <h2 id="explore-heading" className="mb-8 text-center font-heading text-3xl font-bold">
            Explore Tools
          </h2>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Link
              to="/workflow-builder"
              className="group order-first rounded-2xl border border-border/60 bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-elegant sm:col-span-2 lg:col-span-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "hsl(var(--primary))" }}>
                <Workflow className="h-[18px] w-[18px] text-white" />
              </div>
              <h3 className="text-[15px] font-bold">Workflow Builder</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                Chain tools together into an automated pipeline.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">Create workflow →</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10.5px] font-bold text-primary">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  In browser
                </span>
              </div>
            </Link>

            {CATEGORY_CARDS.map(({ key, icon: Icon, blurb }) => {
              const count = toolsInCategory(key).length;
              return (
                <Link
                  key={key}
                  to={CATEGORY_INDEX[key]}
                  className="group rounded-2xl border border-border/60 bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-elegant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: CATEGORY_BADGE_COLOR[key] }}>
                    <Icon className="h-[18px] w-[18px] text-white" />
                  </div>
                  <h3 className="text-[15px] font-bold">{CATEGORY_LABEL[key]}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{blurb}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">
                      {count} {count === 1 ? "tool" : "tools"} →
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10.5px] font-bold text-primary">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      In browser
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/*
          Direct links to the most-wanted tools. The category cards above put every
          tool within two clicks, but the tools people actually arrive looking for
          should not need the intermediate hop.
        */}
        <section className="container mx-auto px-4 pb-20" aria-labelledby="popular-heading">
          <div className="max-w-5xl mx-auto">
            <h2 id="popular-heading" className="text-3xl font-heading font-bold text-center mb-4">
              Popular tools
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              Every one of these runs entirely in your browser. Nothing is uploaded.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {POPULAR_TOOLS.map((tool) => (
                <li key={tool.id}>
                  <Link
                    to={toolPath(tool)}
                    className="block rounded-lg border border-border/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <span className="font-medium">{tool.name}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{tool.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-center">
              <Link to="/all-tools" className="text-sm font-medium text-primary hover:underline">
                Browse all {TOOL_CATALOG.length} tools →
              </Link>
            </p>
          </div>
        </section>


      </main>

      {/* Replaces an inline stub footer that sat inside <main> and linked nowhere. */}
      <Footer />
    </div>
  );
};

export default Index;
