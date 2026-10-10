import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TipJar } from "@/components/layout/TipJar";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { prefetchTool, usePrefetchOnView } from "@/lib/prefetchTool";
import { WORKBENCH_ID } from "@/lib/toolActions";
import type { ToolPageContent, ToolSectionHeadings } from "@/types/toolContent";
import { BADGES } from "./ToolHero";
import { ToolWorkbench } from "./ToolWorkbench";
import { ToolFeatures } from "./ToolFeatures";
import { ToolExamples } from "./ToolExamples";
import { ToolUseCases } from "./ToolUseCases";
import { ToolSpecs } from "./ToolSpecs";
import { ToolMeasurements } from "./ToolMeasurements";
import { ToolLimitations } from "./ToolLimitations";
import { ToolComparison } from "./ToolComparison";
import { ToolScenarios } from "./ToolScenarios";

const DEFAULT_HEADINGS: Required<ToolSectionHeadings> = {
  features: { heading: "Why use this tool", lede: "What you get here that a server-side alternative cannot offer." },
  howItWorks: { heading: "How it works" },
  examples: { heading: "Worked examples", lede: "Real input, real output, and what changed in between." },
  useCases: { heading: "Who uses it" },
  faq: { heading: "Frequently asked questions" },
  related: { heading: "Related tools", lede: "Other browser-first tools that pair well with this one." },
  specs: { heading: "What happens to your data", lede: "The same questions a security review would ask, answered plainly." },
  measurements: { heading: "Measured results", lede: "Real files, real numbers, and the machine they were run on." },
  limitations: { heading: "Good to know", lede: "The honest edges, and where to go instead when you hit one." },
  comparison: { heading: "How this compares" },
  scenarios: { heading: "Common situations" },
};

function FaqAnswer({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(/\[([^\]]+)\]\((\/[^)\s]+)\)/g)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(text.slice(cursor, index));
    nodes.push(
      <Link key={`${match[2]}-${index}`} to={match[2]} className="font-medium text-foreground underline decoration-[var(--line-strong)] underline-offset-2">
        {match[1]}
      </Link>,
    );
    cursor = index + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}

function RelatedChip({ name, path, description }: { name: string; path: string; description: string }) {
  const slug = path.replace(/^\//, "").split("/").pop();
  const ref = usePrefetchOnView<HTMLAnchorElement>(slug);
  return (
    <Link
      ref={ref}
      to={path}
      className="paper-chip"
      onMouseEnter={() => prefetchTool(slug, "hover")}
      onFocus={() => prefetchTool(slug, "hover")}
    >
      {name}
      <span className="sr-only">{description}</span>
    </Link>
  );
}

/**
 * Paper tool page. The dropzone, three steps, and limits stay visible.
 * Longer copy and the FAQ stay in closed native details so the prerender
 * still contains every sentence.
 */
export function LeanToolPage({
  content,
  tool,
  servedFrom,
}: {
  content: ToolPageContent;
  tool: ComponentType;
  servedFrom?: string;
}) {
  const section = <K extends keyof ToolSectionHeadings>(key: K) => content.headings?.[key] ?? DEFAULT_HEADINGS[key];
  const steps = content.howItWorks.slice(0, 3);
  const extraSteps = content.howItWorks.slice(3);
  const limits = content.limitations?.items ?? [];
  const howHeading = section("howItWorks").heading || "How it works";
  const limitHeading = content.limitations?.heading || section("limitations").heading || "Good to know";

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: content.category.name, path: content.category.path },
    { name: content.hero.h1, path: content.path },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href={`#${WORKBENCH_ID}`}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[10px] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to the tool
      </a>
      <Header />
      <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 md:px-8" data-lean-shell={content.slug}>
        <div className="max-md:hidden">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <header className="pb-6 pt-2 md:pt-0">
          <h1 className="max-w-[22ch] text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground md:text-[34px]">
            {content.hero.h1}
          </h1>
          <p className="mt-2 max-w-[62ch] text-muted-foreground">{content.hero.subtitle}</p>
        </header>

        <ToolWorkbench
          component={tool}
          label={content.hero.h1}
          lean
          slug={content.slug}
          buttonLabel={content.hero.primaryCta.label}
        />
        <p className="paper-trust">
          <ShieldCheck aria-hidden="true" />
          Runs in your browser. Nothing is uploaded.
        </p>
        <TipJar />

        <div className="grid gap-12 py-12 md:grid-cols-[1.2fr_1fr] md:gap-16">
          <section id="how-it-works" aria-labelledby="how-it-works-heading">
            <h2 id="how-it-works-heading" className="mb-4 text-xl font-semibold tracking-[-0.015em]">
              {howHeading}
            </h2>
            <ol className="paper-steps">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <span className="paper-step-n" aria-hidden="true">{index + 1}</span>
                  <div>
                    <b className="block text-[15px] font-medium">
                      <span className="sr-only">{`Step ${index + 1}: `}</span>
                      {step.title}
                    </b>
                    <span className="text-sm text-muted-foreground">{step.body}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          {limits.length > 0 && (
            <section aria-labelledby="limits-heading">
              <h2 id="limits-heading" className="mb-4 text-xl font-semibold tracking-[-0.015em]">
                {limitHeading}
              </h2>
              <ul className="paper-limits">
                {limits.map((item) => (
                  <li key={item.title}>{item.title}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="paper-acc">
          <details>
            <summary><h2>About this tool</h2></summary>
            <div className="acc-body lean-fold">
              {content.intro && <h3>{content.intro.heading}</h3>}
              {content.intro?.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
              <ul>
                {content.hero.badges.map((key) => {
                  const badge = BADGES[key];
                  if (!badge) return null;
                  return <li key={key}>{badge.label}. {badge.title}</li>;
                })}
              </ul>
              <p>
                {content.hero.primaryCta.label}
                {content.hero.secondaryCta ? `. ${content.hero.secondaryCta.label}` : ""}
              </p>
              {extraSteps.length > 0 && (
                <ol>
                  {extraSteps.map((step) => (
                    <li key={step.title}><strong>{step.title}. </strong>{step.body}</li>
                  ))}
                </ol>
              )}
              {content.specs && <ToolSpecs specs={content.specs} {...section("specs")} />}
              <ToolFeatures features={content.features} {...section("features")} />
              <ToolExamples examples={content.examples} {...section("examples")} />
              {content.measurements && <ToolMeasurements measurements={content.measurements} {...section("measurements")} />}
              {content.scenarios && <ToolScenarios scenarios={content.scenarios} {...section("scenarios")} />}
              <ToolUseCases useCases={content.useCases} {...section("useCases")} />
              {content.limitations && (
                <ToolLimitations limitations={content.limitations} {...section("limitations")} />
              )}
              {content.comparison && <ToolComparison comparison={content.comparison} {...section("comparison")} />}
            </div>
          </details>
          <details id="faq">
            <summary><h2>{section("faq").heading}</h2></summary>
            <div className="acc-body">
              {section("faq").lede && <p>{section("faq").lede}</p>}
              {content.faqs.map((faq) => (
                <div
                  key={faq.question}
                  {...(faq.topic && ["privacy", "size", "offline", "account"].includes(faq.topic)
                    ? { "data-seo-chrome": "true" }
                    : {})}
                >
                  <h3>{faq.question}</h3>
                  <p><FaqAnswer text={faq.answer} /></p>
                </div>
              ))}
            </div>
          </details>
        </div>

        <section id="related-tools" className="flex flex-wrap items-center gap-2 py-8" aria-label={section("related").heading}>
          <span className="mr-2 text-[13px] text-muted-foreground">{section("related").heading}</span>
          {content.related.map((toolLink) => (
            <RelatedChip key={toolLink.path} name={toolLink.name} path={toolLink.path} description={toolLink.description} />
          ))}
          {section("related").lede && <p className="sr-only">{section("related").lede}</p>}
        </section>
      </main>
      <Footer />
      {servedFrom && servedFrom !== content.path && <div hidden data-served-from={servedFrom} />}
    </div>
  );
}
