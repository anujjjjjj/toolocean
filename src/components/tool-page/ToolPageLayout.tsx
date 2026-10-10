import type { ComponentType } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { useSEO } from "@/hooks/useSEO";
import { buildToolPageGraph } from "@/lib/toolPageSchema";
import { WORKBENCH_ID } from "@/lib/toolActions";
import type { ToolPageContent, ToolSectionHeadings } from "@/types/toolContent";
import { ToolHero } from "./ToolHero";
import { ToolWorkbench } from "./ToolWorkbench";
import { ToolFeatures } from "./ToolFeatures";
import { ToolHowItWorks } from "./ToolHowItWorks";
import { ToolExamples } from "./ToolExamples";
import { ToolUseCases } from "./ToolUseCases";
import { ToolFaq } from "./ToolFaq";
import { RelatedTools } from "./RelatedTools";
import { ToolFooterCta } from "./ToolFooterCta";
import { ToolSpecs } from "./ToolSpecs";
import { ToolMeasurements } from "./ToolMeasurements";
import { ToolLimitations } from "./ToolLimitations";
import { ToolComparison } from "./ToolComparison";
import { ToolScenarios } from "./ToolScenarios";
import { LeanToolPage } from "./LeanToolPage";
import { usesLeanShell } from "@/lib/leanShell";

interface ToolPageLayoutProps {
  content: ToolPageContent;
  /** The interactive tool. Lazily imported by the caller so it stays a separate chunk. */
  tool: ComponentType;
  /**
   * Set when the page is served from a legacy URL. The canonical still points at
   * `content.path`, which is how the old and new routes are consolidated into a
   * single indexable page instead of competing as duplicates.
   */
  servedFrom?: string;
}

/** Generic fallbacks, correct for any tool category, overridable per page. */
const DEFAULT_HEADINGS: Required<ToolSectionHeadings> = {
  features: {
    heading: "Why use this tool",
    lede: "What you get here that a server-side alternative cannot offer.",
  },
  howItWorks: { heading: "How it works" },
  examples: {
    heading: "Worked examples",
    lede: "Real input, real output, and what changed in between.",
  },
  useCases: { heading: "Who uses it" },
  faq: { heading: "Frequently asked questions" },
  related: {
    heading: "Related tools",
    lede: "Other browser-first tools that pair well with this one.",
  },
  specs: {
    heading: "What happens to your data",
    lede: "The same questions a security review would ask, answered plainly.",
  },
  measurements: {
    heading: "Measured results",
    lede: "Real files, real numbers, and the machine they were run on.",
  },
  limitations: {
    heading: "What this tool cannot do",
    lede: "The honest edges, and where to go instead when you hit one.",
  },
  comparison: { heading: "How this compares" },
  scenarios: { heading: "Common situations" },
};

/**
 * The one layout behind every ToolOcean tool page.
 *
 * A new page supplies a ToolPageContent object and a component. Heading order,
 * breadcrumbs, structured data, internal linking, and section semantics are all
 * derived here, so they cannot drift per-page.
 */
export function ToolPageLayout({ content, tool, servedFrom }: ToolPageLayoutProps) {
  const section = <K extends keyof ToolSectionHeadings>(key: K) =>
    content.headings?.[key] ?? DEFAULT_HEADINGS[key];

  useSEO({
    title: content.seo.title,
    description: content.seo.description,
    // Always the canonical path, even when rendered from a legacy URL.
    path: content.path,
    keywords: content.seo.keywords,
    image: content.seo.ogImage,
    jsonLd: [buildToolPageGraph(content)],
  });

  if (usesLeanShell(content.slug)) {
    return <LeanToolPage content={content} tool={tool} servedFrom={servedFrom} />;
  }

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: content.category.name, path: content.category.path },
    { name: content.hero.h1, path: content.path },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Search visitors land mid-funnel and want the tool, not the nav. */}
      <a
        href={`#${WORKBENCH_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to the tool
      </a>

      <Header />

      <main>
        <div className="container mx-auto max-w-5xl px-4 pt-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <ToolHero hero={content.hero} />

        <ToolWorkbench component={tool} label={content.hero.h1} />

        {content.intro && (
          <section aria-labelledby="intro-heading" className="border-b border-border/60 py-14 sm:py-16">
            <div className="container mx-auto max-w-3xl px-4">
              <h2 id="intro-heading" className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                {content.intro.heading}
              </h2>
              <div className="mt-5 space-y-4">
                {content.intro.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )}

        {content.specs && <ToolSpecs specs={content.specs} {...section("specs")} />}

        <ToolFeatures features={content.features} {...section("features")} />

        <ToolHowItWorks steps={content.howItWorks} {...section("howItWorks")} />

        <ToolExamples examples={content.examples} {...section("examples")} />

        {content.measurements && (
          <ToolMeasurements measurements={content.measurements} {...section("measurements")} />
        )}

        {content.scenarios && <ToolScenarios scenarios={content.scenarios} {...section("scenarios")} />}

        <ToolUseCases useCases={content.useCases} {...section("useCases")} />

        {content.limitations && (
          <ToolLimitations limitations={content.limitations} {...section("limitations")} />
        )}

        {content.comparison && (
          <ToolComparison comparison={content.comparison} {...section("comparison")} />
        )}

        <ToolFaq faqs={content.faqs} {...section("faq")} />

        <RelatedTools related={content.related} {...section("related")} />

        <ToolFooterCta category={content.category} />
      </main>

      {/*
        Site footer on all 114 tool pages. Two reasons beyond the obvious: it is
        what stops /about, /privacy and /terms from being orphans reachable only
        via the sitemap, and it links every tool page to all ten category
        listings, which spreads crawl equity across the catalogue.
      */}
      <Footer />

      {servedFrom && servedFrom !== content.path && (
        // Not user-visible; a breadcrumb for anyone debugging why two URLs render
        // the same page. The canonical tag above is what search engines act on.
        <div hidden data-served-from={servedFrom} />
      )}
    </div>
  );
}
