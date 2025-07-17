
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Workflow, Zap, Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const navigate = useNavigate();

  // Handle Cmd+K / Ctrl+K
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  const handleOpenCommandPalette = () => {
    setCommandPaletteOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header 
        onSearch={setSearchQuery} 
        searchQuery={searchQuery}
        onOpenCommandPalette={handleOpenCommandPalette}
      />
      
      <CommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
      />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              ToolOcean
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your ultimate collection of developer tools. Format, convert, analyze, and chain tools together into powerful workflows.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Zap className="h-4 w-4 mr-2" />
                31 Tools Available
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Workflow className="h-4 w-4 mr-2" />
                Workflow Builder
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Search className="h-4 w-4 mr-2" />
                Instant Search
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Dark Mode
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:bg-gradient-ocean text-lg px-8"
                onClick={() => document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Tools
              </Button>
                <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8"
                onClick={() => navigate('/workflow-builder')}
              >
                Create Workflow
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Tools */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Featured Tools</h2>
            <p className="text-muted-foreground">Most popular and powerful tools in our collection</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-white">
                    📄
                  </div>
                  JSON Formatter
                </CardTitle>
                <CardDescription>
                  Format, validate, and beautify JSON data with syntax highlighting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-gradient-primary hover:bg-gradient-ocean"
                  onClick={() => navigate('/tools/json-formatter')}
                >
                  Try Now
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-white">
                    🔤
                  </div>
                  Case Converter
                </CardTitle>
                <CardDescription>
                  Convert text between camelCase, snake_case, PascalCase, and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-gradient-primary hover:bg-gradient-ocean"
                  onClick={() => navigate('/tools/case-converter')}
                >
                  Try Now
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center text-white">
                    🔗
                  </div>
                  Workflow Builder
                </CardTitle>
                <CardDescription>
                  Chain multiple tools together to create powerful automated workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-gradient-primary hover:bg-gradient-ocean"
                  onClick={() => navigate('/workflow-builder')}
                >
                  Build Workflow
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* All Tools */}
        <section id="tools-section" className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">All Tools</h2>
            <p className="text-muted-foreground">Browse our complete collection of developer tools</p>
          </div>
          
          <ToolGrid searchQuery={searchQuery} />
        </section>
      </main>
    </div>
  );
};

export default Index;
