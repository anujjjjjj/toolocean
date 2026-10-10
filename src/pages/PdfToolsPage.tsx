import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { NativeFaq } from "@/components/tool-page/NativeFaq";
import { PDF_HUB_FAQS } from "@/data/pdfHubContent";
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
          <div className="relative max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-lg bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
              <Shield className="h-3.5 w-3.5" />
              No uploads. Runs entirely in your browser.
            </span>
            <h1 className="mb-6 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground md:text-[34px]">
              PDF Tools
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Thirteen PDF tools that run in the tab. Merge and split, compress a scan, protect a file with AES-256, unlock one you already know the password for, read or strip metadata, fill an AcroForm, or place a visual signature. Nothing is uploaded.
            </p>
          </div>
        </section>

        {/* PDF Tools Grid */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Available Tools</h2>
            <p className="text-muted-foreground">Select a tool to get started</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {pdfTools.map((tool) => (
              <ToolLinkCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        <div className="paper-acc">
          <details>
            <summary><h2>About these PDF tools</h2></summary>
            <div className="acc-body">
              <h3>What this collection is for</h3>
              <p>
                These pages are for the PDF jobs that do not need a server: joining a packet, pulling pages out, turning a scan around, stamping a watermark, or sending a smaller copy of a photograph-of-paper. The newer ones cover the next questions people ask after that. A form that is already an AcroForm can be filled and, if you want the answers locked in, flattened. A file can be given an open password. A file you can already open can have that password taken off again. The Info dictionary and the XMP packet can be read, edited, or stripped.
              </p>
              <p>
                The signature tool is the one to read carefully. It puts ink on a page, from a drawing, a typed name, or an image, and the page says it is not a certified or qualified electronic signature. If a process asks for a certificate, this hub will not produce one.
              </p>
              <p>
                Two ceilings are preselected: <Link to="/compress-pdf-to-100kb" className="text-primary underline">compress a PDF to 100 KB</Link> and <Link to="/compress-pdf-to-200kb" className="text-primary underline">to 200 KB</Link>. 1 KB is 1024 bytes. Lossless is tried first. If the file still does not fit, the pages become pictures and the text is no longer selectable.
              </p>
              <p>
                OCR, editing text in place, redaction, and converting a PDF into an editable Word document are not here. Hosted suites still do those, and they upload the file to do it. The trade is written out on the{" "}
                <Link to="/smallpdf-alternative" className="font-medium text-primary hover:underline">Smallpdf alternative</Link>
                {" "}and{" "}
                <Link to="/ilovepdf-alternative" className="font-medium text-primary hover:underline">iLovePDF alternative</Link>
                {" "}pages. If the only job is combining documents without an upload, start at{" "}
                <Link to="/merge-pdf-without-uploading" className="font-medium text-primary hover:underline">merge PDFs without uploading</Link>.
              </p>
              <h3>100% Secure</h3>
              <p>All processing happens in your browser. Your files are never uploaded to any server.</p>
              <h3>Lightning Fast</h3>
              <p>No upload/download wait times. Process PDFs instantly with modern browser APIs.</p>
              <h3>Completely Free</h3>
              <p>No limits, no watermarks, no sign-up required. Use as much as you need.</p>
            </div>
          </details>
        </div>
        <NativeFaq
          faqs={PDF_HUB_FAQS}
          heading="Questions about the PDF tools"
          lede="What runs locally, what a signature is, and what this hub still does not do."
        />
      </main>

      <Footer />
    </div>
  );
};

export default PdfToolsPage;
