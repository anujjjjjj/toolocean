import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Scissors, Merge, ArrowLeft } from "lucide-react";
import { HubHeader } from "@/components/category/HubHeader";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { CATEGORY_PAGE_SEO } from "@/data/staticPageSeo";
import { buildCategoryGraph } from "@/lib/sitePageSchema";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { ToolLinkCard } from "@/components/tools/ToolLinkCard";
import { toolsInCategory } from "@/data/toolCatalog";
import { HubGuide } from "@/components/category/HubGuide";

const BREADCRUMB_ITEMS = [
  { name: "Home", path: "/" },
  { name: "Audio Tools", path: "/audio-tools" },
];

/*
 * Derived from the catalog rather than restated here. This list used to be a
 * hardcoded copy, which is the drift src/data/toolCatalog.ts exists to remove.
 */
const audioTools = toolsInCategory("audio");

const AudioToolsPage = () => {
  const navigate = useNavigate();

  useSEO({
    ...CATEGORY_PAGE_SEO["/audio-tools"],
    path: "/audio-tools",
    jsonLd: [buildCategoryGraph("/audio-tools")].filter(Boolean),
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
          category="audio"
          title="Audio Tools"
          icon={Music}
          description="Cut and merge audio files in your browser."
        />

        <section className="space-y-3">
          <div className="text-center">
            <h2 className="mb-1 text-2xl font-semibold">Available Tools</h2>
            <p className="text-muted-foreground">Select a tool to get started</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {audioTools.map((tool) => (
              <ToolLinkCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        <HubGuide path="/audio-tools" />

      </main>

      <Footer />
    </div>
  );
};

export default AudioToolsPage;
