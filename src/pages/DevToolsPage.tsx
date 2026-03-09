import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Shield, Zap, ArrowLeft } from "lucide-react";

const DevToolsPage = () => {
    const navigate = useNavigate();

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

                {/* Page Header */}
                <section className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-lg bg-primary/10">
                        <Code className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-heading font-bold mb-4 text-foreground">
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
        </div>
    );
};

export default DevToolsPage;
