import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Archive, FolderOpen, FolderPlus, List, ArrowLeft, Shield, Zap, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";

const archiveTools = [
  { id: "zip-extractor", name: "ZIP Extractor", description: "Extract and download files from ZIP", icon: FolderOpen, color: "from-orange-500 to-amber-500" },
  { id: "zip-creator", name: "ZIP Creator", description: "Create ZIP from multiple files", icon: FolderPlus, color: "from-green-500 to-emerald-500" },
  { id: "zip-preview", name: "ZIP Preview", description: "List contents without extracting", icon: List, color: "from-blue-500 to-cyan-500" },
];

const ArchiveToolsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredTools = archiveTools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={setSearchQuery} searchQuery={searchQuery} />

      <main className="container mx-auto px-4 py-8 space-y-12">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Tools
        </Button>

        <section className="text-center py-8">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-lg bg-primary/10">
              <Archive className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-5xl font-heading font-bold mb-6 text-foreground">
              Archive Tools
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Extract, create, and preview ZIP files. All in your browser.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Available Tools</h2>
            <p className="text-muted-foreground">Select a tool to get started</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card
                  key={tool.id}
                  className="group cursor-pointer transition-all hover:opacity-90 hover:shadow-elegant"
                  onClick={() => navigate(`/archive-tools/${tool.id}`)}
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
              <p className="text-muted-foreground text-sm">ZIP files never leave your device.</p>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Lightning Fast</h3>
              <p className="text-muted-foreground text-sm">Powered by JSZip in the browser.</p>
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

export default ArchiveToolsPage;
