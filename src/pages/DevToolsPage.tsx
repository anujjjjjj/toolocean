import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Shield, Zap, ArrowLeft } from "lucide-react";
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

            <main className="container mx-auto px-4 py-8 space-y-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to All Tools
                </Button>

                <Breadcrumbs items={BREADCRUMB_ITEMS} />

                {/* Page Header */}
                <section className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-lg bg-primary/10">
                        <Code className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="mb-4 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground md:text-[34px]">
                        Developer Tools
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                        Format, convert, encode, and transform your data with powerful developer utilities
                    </p>
                </section>

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
