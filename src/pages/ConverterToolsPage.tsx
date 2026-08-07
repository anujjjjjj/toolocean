import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowUpDown, Code, Palette, Clock, ArrowLeft, Shield, Zap, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { CATEGORY_PAGE_SEO } from "@/data/staticPageSeo";
import { buildBreadcrumbJsonLd } from "@/lib/jsonLd";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

const BREADCRUMB_ITEMS = [
  { name: "Home", path: "/" },
  { name: "Converter Tools", path: "/converter-tools" },
];

const converterTools = [
  {
    id: "md-to-docx",
    name: "Markdown → DOCX",
    description: "Convert Markdown files to Microsoft Word DOCX format",
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "markdown-html",
    name: "Markdown ↔ HTML",
    description: "Convert between Markdown and HTML formats bidirectionally",
    icon: ArrowUpDown,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "json-toml",
    name: "JSON ↔ TOML",
    description: "Convert between JSON and TOML configuration formats",
    icon: Code,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "json-yaml",
    name: "JSON ↔ YAML",
    description: "Convert between JSON and YAML data formats",
    icon: Code,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "json-xml",
    name: "JSON ↔ XML",
    description: "Convert between JSON and XML data formats",
    icon: Code,
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "json-csv",
    name: "JSON ↔ CSV",
    description: "Convert between JSON arrays and CSV format",
    icon: Code,
    color: "from-teal-500 to-cyan-500",
  },
  {
    id: "color-converter",
    name: "Color Converter",
    description: "Convert colors between HEX, RGB, HSL, and CMYK formats",
    icon: Palette,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "timestamp-converter",
    name: "Timestamp Converter",
    description: "Convert between Unix timestamps, ISO dates, and locale formats",
    icon: Clock,
    color: "from-amber-500 to-yellow-500",
  },
  {
    id: "html-markdown",
    name: "HTML → Markdown",
    description: "Convert HTML to clean Markdown format",
    icon: ArrowUpDown,
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "csv-markdown",
    name: "CSV → Markdown Table",
    description: "Convert CSV data into a formatted Markdown table",
    icon: ArrowUpDown,
    color: "from-lime-500 to-green-500",
  },
  {
    id: "svg-png",
    name: "SVG → PNG",
    description: "Render SVG to a high-resolution PNG image",
    icon: Zap,
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "url-parser",
    name: "URL Parser / Builder",
    description: "Parse, inspect, and build URLs with query parameters",
    icon: Code,
    color: "from-rose-500 to-pink-500",
  },
];

const ConverterToolsPage = () => {
  const navigate = useNavigate();

  useSEO({
    ...CATEGORY_PAGE_SEO["/converter-tools"],
    path: "/converter-tools",
    jsonLd: [buildBreadcrumbJsonLd(BREADCRUMB_ITEMS)],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-12">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Tools
        </Button>

        <Breadcrumbs items={BREADCRUMB_ITEMS} />

        <section className="text-center py-8">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-lg bg-primary/10">
              <ArrowUpDown className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-5xl font-heading font-bold mb-6 text-foreground">
              Converter Tools
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Convert between different file formats, data structures, and representations. All processing happens in your browser.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Available Tools</h2>
            <p className="text-muted-foreground">Select a tool to get started</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {converterTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card
                  key={tool.id}
                  className="group cursor-pointer transition-all hover:opacity-90 hover:shadow-elegant"
                  onClick={() => navigate(`/converter-tools/${tool.id}`)}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <CardDescription className="text-sm">{tool.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="py-12">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">100% Secure</h3>
              <p className="text-muted-foreground text-sm">All processing happens in your browser. Your data never leaves your device.</p>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Lightning Fast</h3>
              <p className="text-muted-foreground text-sm">No upload wait times. Convert formats instantly.</p>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Completely Free</h3>
              <p className="text-muted-foreground text-sm">No limits, no sign-up required.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ConverterToolsPage;
