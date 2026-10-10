import { lazy, Suspense, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { NativeFaq } from "@/components/tool-page/NativeFaq";
import { ToolLinkCard } from "@/components/tools/ToolLinkCard";
import { useStashedFileRoot } from "@/hooks/useStashedFileInput";
import { useSEO } from "@/hooks/useSEO";
import { findLandingPage, type LandingPage } from "@/data/landingPages";
import { findToolBySlug } from "@/data/toolCatalog";
import { buildLandingPageGraph } from "@/lib/landingPageSchema";
import { shellDropzoneCopy } from "@/lib/leanShell";
import { prefetchPdfJs, prefetchPdfLib, schedulePdfEnginePrefetch } from "@/lib/pdf/lazyPdf";
import { prefetchTool } from "@/lib/prefetchTool";
import measurements from "@/data/targetSizeMeasurements.json";
import { formatBytes } from "@/lib/targetSize/parseSize";
import NotFound from "./NotFound";

const ImageCompressorTool = lazy(() =>
  import("@/components/tools/implementations/image/ImageCompressorTool").then((m) => ({ default: m.ImageCompressorTool })),
);
const PdfCompressTool = lazy(() =>
  import("@/components/tools/implementations/pdf/PdfCompressTool").then((m) => ({ default: m.PdfCompressTool })),
);

type FixtureRow = {
  fixture: string;
  outputBytes: number;
  targetBytes: number;
  withinTarget: boolean;
  mode?: string;
  textSelectable?: boolean;
  quality?: number;
  scale?: number;
  width?: number;
  height?: number;
  padded?: boolean;
  paddingBytes?: number;
};

const FIXTURES: Record<string, FixtureRow> = {
  ...(measurements.images as Record<string, FixtureRow>),
  ...(measurements.pdfs as Record<string, FixtureRow>),
};

function ToolLinks({ page }: { page: LandingPage }) {
  const tools = page.tools.map((slug) => findToolBySlug(slug)).filter((tool) => tool != null);
  if (!tools.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tools.map((tool) => (
        <ToolLinkCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}

function ComparisonTable({ comparison }: { comparison: NonNullable<LandingPage["comparison"]> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-foreground">
            <th scope="col" className="px-4 py-3 font-medium">Capability</th>
            <th scope="col" className="px-4 py-3 font-medium">{comparison.competitor}</th>
            <th scope="col" className="px-4 py-3 font-medium">This site</th>
          </tr>
        </thead>
        <tbody>
          {comparison.rows.map((row) => (
            <tr key={row.capability} className="border-t border-border/60">
              <th scope="row" className="px-4 py-3 font-normal">{row.capability}</th>
              <td className="px-4 py-3">{row.them}</td>
              <td className="px-4 py-3">{row.us}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmbeddedTool({ tool, targetBytes }: { tool: "image-compressor" | "pdf-compress"; targetBytes: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useStashedFileRoot(ref, true);
  useEffect(() => schedulePdfEnginePrefetch(tool), [tool]);
  const drop = shellDropzoneCopy(tool);
  const warm = () => {
    prefetchTool(tool, "hover");
    if (tool === "pdf-compress") {
      prefetchPdfLib();
      prefetchPdfJs();
    }
  };
  return (
    <div ref={ref} data-lean-embed={tool} className="mb-8">
      {drop && (
        <FileDropzone
          accept={drop.accept}
          multiple={drop.multiple}
          title={drop.title}
          hint={drop.hint}
          buttonLabel={tool === "pdf-compress" ? "Choose a PDF" : "Choose an image"}
          onIntent={warm}
        />
      )}
      <Suspense fallback={null}>
        {tool === "image-compressor" ? (
          <ImageCompressorTool preset={{ targetBytes }} />
        ) : (
          <PdfCompressTool preset={{ targetBytes }} />
        )}
      </Suspense>
    </div>
  );
}

const LandingRoutePage = () => {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, "").replace(/\/$/, "");
  const page = findLandingPage(slug);

  useSEO({
    title: page?.seo.title ?? "Page Not Found",
    description: page?.seo.description ?? "",
    path: page ? `/${page.slug}` : `/${slug ?? ""}`,
    keywords: page?.seo.keywords,
    noindex: !page,
    jsonLd: page ? [buildLandingPageGraph(page)] : undefined,
  });

  if (!page) return <NotFound />;

  const steps = page.howTo?.steps ?? [];
  const visibleSteps = steps.slice(0, 3);
  const extraSteps = steps.slice(3);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 md:px-8">
        <div className="flex flex-col md:contents">
        <div className="max-md:hidden">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: page.h1, path: `/${page.slug}` }]} />
        </div>
        <h1 className="order-1 max-w-[28ch] pt-2 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground md:pt-0 md:text-[34px]">
          {page.h1}
        </h1>
        <p className="order-3 mt-2 max-w-[62ch] text-muted-foreground md:order-none md:mb-6">{page.lede}</p>

        <section id="tools" aria-labelledby="tools-heading" className="order-2 flex flex-col pb-10 md:order-none">
          <div className="order-2 mt-8 md:order-none md:mt-0">
            <h2 id="tools-heading" className="mb-2 text-xl font-semibold tracking-[-0.015em]">Start here</h2>
            <p className="mb-4 text-sm text-muted-foreground">Every one of these runs entirely in your browser.</p>
          </div>
          {page.embed && (
            <div className="order-1 md:order-none">
              <EmbeddedTool tool={page.embed.tool} targetBytes={page.embed.targetBytes} />
              {page.measurementKey && FIXTURES[page.measurementKey] && (
                <FixtureNote row={FIXTURES[page.measurementKey]} />
              )}
            </div>
          )}
          <div className="order-3 md:order-none">
            <ToolLinks page={page} />
          </div>
        </section>
        </div>

        {page.howTo && visibleSteps.length > 0 && (
          <section id="how-it-works" aria-labelledby="how-it-works-heading" className="pb-10">
            <h2 id="how-it-works-heading" className="mb-4 text-xl font-semibold tracking-[-0.015em]">
              {page.howTo.name}
            </h2>
            <ol className="paper-steps">
              {visibleSteps.map((step, index) => (
                <li key={step.title}>
                  <span className="paper-step-n" aria-hidden="true">{index + 1}</span>
                  <div>
                    <b className="block text-[15px] font-medium">{step.title}</b>
                    <span className="text-sm text-muted-foreground">{step.body}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="paper-acc">
          <details>
            <summary><h2>About this page</h2></summary>
            <div className="acc-body">
              {extraSteps.length > 0 && (
                <ol>
                  {extraSteps.map((step) => (
                    <li key={step.title}><strong>{step.title}. </strong>{step.body}</li>
                  ))}
                </ol>
              )}
              {page.sections.map((section) => (
                <div key={section.heading}>
                  <h3>{section.heading}</h3>
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              ))}
              {page.comparison && (
                <div>
                  <h3>{page.comparison.heading}</h3>
                  <ComparisonTable comparison={page.comparison} />
                  <p>
                    Compiled from {page.comparison.competitor}'s own published documentation. Their product
                    changes; if something here is out of date, it is an error rather than a claim.
                  </p>
                </div>
              )}
            </div>
          </details>
        </div>
        <NativeFaq faqs={page.faqs} heading="Frequently asked questions" />
      </main>
      <Footer />
    </div>
  );
};

function FixtureNote({ row }: { row: FixtureRow }) {
  const detail = [
    `Fixture: ${row.fixture}.`,
    `Target ${formatBytes(row.targetBytes)} (${row.targetBytes} bytes).`,
    `Output ${formatBytes(row.outputBytes)} (${row.outputBytes} bytes).`,
    row.withinTarget ? "The output was within the target." : "The output was still over the target.",
    row.mode ? `PDF path: ${row.mode}.` : "",
    row.textSelectable === true ? "Text stayed selectable." : "",
    row.textSelectable === false ? "Text is not selectable in that copy." : "",
    row.width ? `Pixels ${row.width}×${row.height}, scale ${row.scale}, JPEG quality ${row.quality}.` : "",
    row.padded ? `Padding ${row.paddingBytes} bytes.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <p className="mb-6 text-sm text-muted-foreground">{detail} 1 KB = 1024 bytes. These figures are the stored fixture run, not a prediction for a different file.</p>;
}

export default LandingRoutePage;
