import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Merge, Split, Shrink, Image, RotateCw, Droplets, ArrowUpDown, ArrowLeft, Shield, Zap, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";

const pdfTools = [
  {
    id: "pdf-merge",
    name: "PDF Merge",
    description: "Combine multiple PDF files into one document",
    icon: Merge,
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "pdf-split",
    name: "PDF Split",
    description: "Extract specific pages from a PDF document",
    icon: Split,
    color: "from-orange-500 to-amber-500",
  },
  {
    id: "pdf-compress",
    name: "PDF Compress",
    description: "Reduce PDF file size while maintaining quality",
    icon: Shrink,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "pdf-to-images",
    name: "PDF to Images",
    description: "Convert PDF pages to PNG or JPG images",
    icon: Image,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "images-to-pdf",
    name: "Images to PDF",
    description: "Combine multiple images into a single PDF",
    icon: FileText,
    color: "from-purple-500 to-violet-500",
  },
  {
    id: "pdf-rotate",
    name: "PDF Rotate",
    description: "Rotate PDF pages by 90°, 180°, or 270°",
    icon: RotateCw,
    color: "from-teal-500 to-green-500",
  },
  {
    id: "pdf-watermark",
    name: "PDF Watermark",
    description: "Add text or image watermark to PDF pages",
    icon: Droplets,
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "pdf-reorder",
    name: "PDF Page Reorder",
    description: "Rearrange PDF pages with drag and drop",
    icon: ArrowUpDown,
    color: "from-pink-500 to-rose-500",
  },
];

const PdfToolsPage = () => {
  const navigate = useNavigate();

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
            {pdfTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card
                  key={tool.id}
                  className="group cursor-pointer transition-all hover:opacity-90 hover:shadow-elegant"
                  onClick={() => navigate(`/pdf-tools/${tool.id}`)}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <CardDescription className="text-sm">
                      {tool.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
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
    </div>
  );
};

export default PdfToolsPage;
