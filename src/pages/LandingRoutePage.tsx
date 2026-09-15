import { useLocation, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Section } from "@/components/tool-page/Section";
import { ToolFaq } from "@/components/tool-page/ToolFaq";
import { useSEO } from "@/hooks/useSEO";
import { findLandingPage, type LandingPage } from "@/data/landingPages";
import { findToolBySlug } from "@/data/toolCatalog";
import { buildLandingPageGraph } from "@/lib/landingPageSchema";
import NotFound from "./NotFound";

/**
 * The one route behind every modifier and comparison landing page.
 *
 * These sit at the site root alongside the tools rather than under a /guides/
 * prefix, because the URL is part of what ranks: /merge-pdf-without-uploading
 * matches the query it targets, and burying it a level down adds nothing for a
 * reader and dilutes the match.
 */
function ToolLinks({ page }: { page: LandingPage }) {
  const tools = page.tools.map((slug) => findToolBySlug(slug)).filter(Boolean);
  if (!tools.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tools.map((tool) => (
        <Link
          key={tool!.id}
          to={`/${tool!.id}`}
          className="group flex items-start justify-between gap-4 rounded-lg border border-border/70 bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          <div>
            <h3 className="font-heading text-base font-medium">{tool!.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{tool!.description}</p>
          </div>
          <ArrowRight
            className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </Link>
      ))}
    </div>
  );
}

function ComparisonTable({ comparison }: { comparison: NonNullable<LandingPage["comparison"]> }) {
  return (
    // Scrolls inside its own box rather than pushing the page sideways on a phone.
    <div className="overflow-x-auto rounded-lg border border-border/70">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Capability
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              {comparison.competitor}
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              This site
            </th>
          </tr>
        </thead>
        <tbody>
          {comparison.rows.map((row) => (
            <tr key={row.capability} className="border-t border-border/60">
              <th scope="row" className="px-4 py-3 font-normal">
                {row.capability}
              </th>
              <td className="px-4 py-3 text-muted-foreground">{row.them}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.us}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LandingRoutePage = () => {
  /*
   * These are registered as explicit static paths (so they outrank the /:slug tool
   * route), which means there is no route param to read — useParams() returns {}
   * here. The slug has to come from the pathname.
   */
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, "").replace(/\/$/, "");
  const page = findLandingPage(slug);

  // Hooks must run unconditionally, so the 404 branch comes after useSEO.
  useSEO({
    title: page?.seo.title ?? "Page Not Found",
    description: page?.seo.description ?? "",
    path: page ? `/${page.slug}` : `/${slug ?? ""}`,
    keywords: page?.seo.keywords,
    noindex: !page,
    jsonLd: page ? [buildLandingPageGraph(page)] : undefined,
  });

  if (!page) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <div className="container mx-auto max-w-5xl px-4 pt-6">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: page.h1, path: `/${page.slug}` },
            ]}
          />
        </div>

        <div className="border-b border-border/60 py-10 sm:py-14">
          <div className="container mx-auto max-w-5xl px-4">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{page.h1}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{page.lede}</p>
          </div>
        </div>

        {/*
          Tools first. Someone arriving on "merge pdf without uploading" wants the
          merger, not an essay; the prose below is for the people who want to know
          why it is safe, and for the crawler.
        */}
        <Section id="tools" heading="Start here" lede="Every one of these runs entirely in your browser.">
          <ToolLinks page={page} />
        </Section>

        {page.sections.map((section, index) => (
          <Section
            key={section.heading}
            id={`section-${index}`}
            heading={section.heading}
            muted={index % 2 === 0}
          >
            <div className="max-w-3xl space-y-4">
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </Section>
        ))}

        {page.comparison && (
          <Section id="comparison" heading={page.comparison.heading} muted>
            <ComparisonTable comparison={page.comparison} />
            <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
              Compiled from {page.comparison.competitor}'s own published documentation. Their product
              changes; if something here is out of date, it is an error rather than a claim.
            </p>
          </Section>
        )}

        <ToolFaq faqs={page.faqs} heading="Frequently asked questions" />
      </main>

      <Footer />
    </div>
  );
};

export default LandingRoutePage;
