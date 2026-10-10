import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Image,
  Maximize2,
  Shrink,
  Repeat,
  Crop,
  Pipette,
  ImagePlus,
  FileImage,
  ArrowLeft,
  RotateCw,
  Stamp,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { CATEGORY_PAGE_SEO } from "@/data/staticPageSeo";
import { buildCategoryGraph } from "@/lib/sitePageSchema";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ToolLinkCard } from "@/components/tools/ToolLinkCard";
import { toolsInCategory } from "@/data/toolCatalog";
import { HubGuide } from "@/components/category/HubGuide";
import { HubHeader } from "@/components/category/HubHeader";

const BREADCRUMB_ITEMS = [
  { name: "Home", path: "/" },
  { name: "Image Tools", path: "/image-tools" },
];

/*
 * Derived from the catalog rather than restated here. This list used to be a
 * hardcoded copy, which is the drift src/data/toolCatalog.ts exists to remove.
 */
const imageTools = toolsInCategory("image");

const ImageToolsPage = () => {
  const navigate = useNavigate();

  useSEO({
    ...CATEGORY_PAGE_SEO["/image-tools"],
    path: "/image-tools",
    jsonLd: [buildCategoryGraph("/image-tools")].filter(Boolean),
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-4 space-y-5 md:py-6">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Tools
        </Button>

        <Breadcrumbs items={BREADCRUMB_ITEMS} className="mb-0" />

        <HubHeader
          category="image"
          title="Image Tools"
          icon={Image}
          description="Resize, compress, convert, and transform images. All processing in your browser."
        />

        <section className="space-y-3">
          <div className="text-center">
            <h2 className="mb-1 text-2xl font-semibold">Available Tools</h2>
            <p className="text-muted-foreground">Select a tool to get started</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {imageTools.map((tool) => (
              <ToolLinkCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        <HubGuide path="/image-tools" />

      </main>

      <Footer />
    </div>
  );
};

export default ImageToolsPage;
