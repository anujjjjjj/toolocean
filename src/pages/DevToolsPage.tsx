import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, ArrowLeft } from "lucide-react";
import { HubHeader } from "@/components/category/HubHeader";
import { useSEO } from "@/hooks/useSEO";
import { CATEGORY_PAGE_SEO } from "@/data/staticPageSeo";
import { buildCategoryGraph } from "@/lib/sitePageSchema";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

const BREADCRUMB_ITEMS = [
    { name: "Home", path: "/" },
    { name: "Developer Tools", path: "/dev-tools" },
];

const DevToolsPage = () => {
    const navigate = useNavigate();

    useSEO({
      ...CATEGORY_PAGE_SEO["/dev-tools"],
        path: "/dev-tools",
        jsonLd: [buildCategoryGraph("/dev-tools")].filter(Boolean),
    });

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-4 space-y-5 md:py-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to All Tools
                </Button>

                <Breadcrumbs items={BREADCRUMB_ITEMS} className="mb-0" />

                <HubHeader
                  category="dev"
                  title="Developer Tools"
                  icon={Code}
                  description="Format, convert, encode, and transform your data with powerful developer utilities"
                />

                {/* Tools Grid */}
                <section>
                    <ToolGrid searchQuery="" />
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default DevToolsPage;
