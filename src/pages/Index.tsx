import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Waves, Code, FileText, FileSpreadsheet, Music, Workflow, Shield, Zap, Globe, Lock, Image, Video, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { openPalette } = useCommandPalette();

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
            <Button
              size="lg"
              onClick={() => navigate('/workflow-builder')}
            >
              <Workflow className="h-4 w-4 mr-2" />
              Start Building
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/dev-tools')}
            >
              <Code className="h-4 w-4 mr-2" />
              Dev Tools
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/pdf-tools')}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF Tools
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

        {/* Category Cards Section */}
        <section className="py-20">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">Explore Tools</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Workflow Builder - Featured */}
            <Card
              className="group cursor-pointer transition-all hover:opacity-90 hover:shadow-elegant md:col-span-2 lg:col-span-1 order-first"
              onClick={() => navigate('/workflow-builder')}
            >
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
            </Card>

            <Card
              className="group cursor-pointer transition-all hover:opacity-90 hover:shadow-elegant"
              onClick={() => navigate('/dev-tools')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Developer Tools</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  JSON formatters, encoders, converters, and more utilities for developers.
                </CardDescription>
                <p className="text-primary font-medium text-sm">31 Tools →</p>
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer transition-all hover:opacity-90 hover:shadow-elegant"
              onClick={() => navigate('/pdf-tools')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">PDF Tools</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  Merge, split, compress, rotate, watermark, and convert PDF files.
                </CardDescription>
                <p className="text-primary font-medium text-sm">8 Tools →</p>
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer transition-all hover:opacity-90 hover:shadow-elegant"
              onClick={() => navigate('/csv-tools')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">CSV Tools</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  Convert, validate, and merge CSV files with customizable delimiters.
                </CardDescription>
                <p className="text-primary font-medium text-sm">3 Tools →</p>
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer transition-all hover:opacity-90 hover:shadow-elegant"
              onClick={() => navigate('/audio-tools')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Audio Tools</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  Cut and merge audio files. Output as WAV, all in your browser.
                </CardDescription>
                <p className="text-primary font-medium text-sm">2 Tools →</p>
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer transition-all hover:opacity-90 hover:shadow-elegant"
              onClick={() => navigate('/image-tools')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Image className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Image Tools</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  Resize, compress, convert, and transform images. Canvas API only.
                </CardDescription>
                <p className="text-primary font-medium text-sm">7 Tools →</p>
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer transition-all hover:opacity-90 hover:shadow-elegant"
              onClick={() => navigate('/video-tools')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Video Tools</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  Trim, extract thumbnails, convert to GIF. All in your browser.
                </CardDescription>
                <p className="text-primary font-medium text-sm">4 Tools →</p>
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer transition-all hover:opacity-90 hover:shadow-elegant"
              onClick={() => navigate('/spreadsheet-tools')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Spreadsheet Tools</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  Read Excel, convert CSV to Excel, export. SheetJS powered.
                </CardDescription>
                <p className="text-primary font-medium text-sm">4 Tools →</p>
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer transition-all hover:opacity-90 hover:shadow-elegant"
              onClick={() => navigate('/compression-tools')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Archive className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Compression Tools</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  Gzip compress/decompress, LZ-String. All client-side.
                </CardDescription>
                <p className="text-primary font-medium text-sm">3 Tools →</p>
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer transition-all hover:opacity-90 hover:shadow-elegant"
              onClick={() => navigate('/archive-tools')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Archive className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Archive Tools</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  Extract, create, and preview ZIP files. JSZip in browser.
                </CardDescription>
                <p className="text-primary font-medium text-sm">3 Tools →</p>
              </CardContent>
            </Card>

          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 text-center text-muted-foreground border-t border-border/60">
          <p className="text-sm">
            Built for developers who value privacy.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
