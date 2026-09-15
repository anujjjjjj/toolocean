import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Waves, Code, FileText, FileSpreadsheet, Music, Workflow, Shield, Zap, Globe, Lock, Image, Video, Archive, ArrowUpDown } from "lucide-react";
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

/**
 * Category cards, in the order they appear. Labels and counts come from the
 * catalog; only the icon and the one-line blurb are editorial.
 */
const CATEGORY_CARDS: { key: CategoryKey; icon: typeof Code; blurb: string }[] = [
  { key: "dev", icon: Code, blurb: "JSON formatters, encoders, converters, and more utilities for developers." },
  { key: "pdf", icon: FileText, blurb: "Merge, split, compress, rotate, watermark, and convert PDF files." },
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

      <main className="container mx-auto px-4">
        {/* Hero Section - Centered */}
        <section className="flex flex-col items-center justify-center min-h-[65vh] py-20 text-center">
          {/* Logo Icon - Simplified */}
          <div className="mb-8">
            <Waves className="h-12 w-12 text-primary mx-auto" />
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-7xl font-heading font-bold mb-6 text-foreground">
            ToolOcean
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl">
            Your data never leaves your browser. <span className="text-primary">100% client-side processing.</span>
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
        </section>

        {/* Features Section - Refined */}
        <section className="py-20">
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
          contained no href to any tool or category — a crawler following links
          from / could not reach a single one of the 114 tools, and 9 of them were
          reachable only from sitemap.xml.

          Counts are derived from the catalog. They were hardcoded and had drifted
          badly: "31 Tools" for a category holding 66.
        */}
        <section className="py-20" aria-labelledby="explore-heading">
          <h2 id="explore-heading" className="text-3xl font-heading font-bold text-center mb-12">
            Explore Tools
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="group transition-all hover:opacity-90 hover:shadow-elegant md:col-span-2 lg:col-span-1 order-first">
              <Link to="/workflow-builder" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <Workflow className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Workflow Builder</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base mb-4">
                    Chain multiple tools together to create powerful automated workflows.
                  </CardDescription>
                  <p className="text-primary font-medium text-sm">Create Workflow →</p>
                </CardContent>
              </Link>
            </Card>

            {CATEGORY_CARDS.map(({ key, icon: Icon, blurb }) => {
              const count = toolsInCategory(key).length;
              return (
                <Card key={key} className="group transition-all hover:opacity-90 hover:shadow-elegant">
                  <Link
                    to={CATEGORY_INDEX[key]}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                  >
                    <CardHeader className="text-center pb-4">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{CATEGORY_LABEL[key]}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <CardDescription className="text-base mb-4">{blurb}</CardDescription>
                      <p className="text-primary font-medium text-sm">
                        {count} {count === 1 ? "Tool" : "Tools"} →
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        </section>

        {/*
          Direct links to the most-wanted tools. The category cards above put every
          tool within two clicks, but the tools people actually arrive looking for
          should not need the intermediate hop.
        */}
        <section className="pb-20" aria-labelledby="popular-heading">
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
