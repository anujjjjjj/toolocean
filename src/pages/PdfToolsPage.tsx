import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Merge, Split, Shrink, Image, RotateCw, Droplets, ArrowUpDown, ArrowLeft, Shield, Zap, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { CATEGORY_PAGE_SEO } from "@/data/staticPageSeo";
import { buildCategoryGraph } from "@/lib/sitePageSchema";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ToolLinkCard } from "@/components/tools/ToolLinkCard";
import { toolsInCategory } from "@/data/toolCatalog";

const BREADCRUMB_ITEMS = [
  { name: "Home", path: "/" },
  { name: "PDF Tools", path: "/pdf-tools" },
];

/*
 * Derived from the catalog rather than restated here. This list used to be a
 * hardcoded copy, which is the drift src/data/toolCatalog.ts exists to remove.
 */
const pdfTools = toolsInCategory("pdf");

const PdfToolsPage = () => {
  const navigate = useNavigate();

  useSEO({
    ...CATEGORY_PAGE_SEO["/pdf-tools"],
    path: "/pdf-tools",
    jsonLd: [buildCategoryGraph("/pdf-tools")].filter(Boolean),
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Tools
        </Button>

        <Breadcrumbs items={BREADCRUMB_ITEMS} />

        {/* Hero Section */}
        <section className="text-center py-8">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-lg bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-5xl font-heading font-bold mb-6 text-foreground">
              PDF Tools
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Powerful PDF manipulation tools that work entirely in your browser. No uploads, no servers – your files stay private.
            </p>
          </div>
        </section>

        {/* PDF Tools Grid */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Available Tools</h2>
            <p className="text-muted-foreground">Select a tool to get started</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pdfTools.map((tool) => (
              <ToolLinkCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12">
          <div className="grid md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-base">100% Secure</h3>
              <p className="text-muted-foreground text-sm">
                All processing happens in your browser. Your files are never uploaded to any server.
              </p>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-base">Lightning Fast</h3>
              <p className="text-muted-foreground text-sm">
                No upload/download wait times. Process PDFs instantly with modern browser APIs.
              </p>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-base">Completely Free</h3>
              <p className="text-muted-foreground text-sm">
                No limits, no watermarks, no sign-up required. Use as much as you need.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PdfToolsPage;
