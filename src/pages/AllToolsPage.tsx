import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { buildInfoPageGraph } from "@/lib/sitePageSchema";
import { INFO_PAGE_SEO } from "@/data/staticPageSeo";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import {
  CATEGORY_INDEX,
  CATEGORY_LABEL,
  TOOL_CATALOG,
  toolPath,
  toolsInCategory,
  type CategoryKey,
} from "@/data/toolCatalog";

/**
 * The HTML sitemap.
 *
 * Every tool, grouped by category, as a real anchor with its description. This
 * exists because link discovery was the site's binding constraint: a crawl of
 * the prerendered HTML reached only 105 of 114 tools from the homepage, 9 were
 * reachable exclusively through sitemap.xml, and the deepest tool sat 11 clicks
 * from the front page.
 *
 * One page linking everything puts the whole catalogue at click depth two and
 * makes that failure mode structurally impossible to reintroduce, a new tool
 * appears here the moment it is added to the catalog, with no separate list to
 * remember to update.
 *
 * The path is /all-tools rather than /tools because /tools/* is a legacy
 * redirect prefix from before the slugs were flattened.
 */

const CATEGORY_ORDER: CategoryKey[] = [
  "dev",
  "pdf",
  "image",
  "converter",
  "spreadsheet",
  "csv",
  "video",
  "audio",
  "archive",
  "compression",
];

const AllToolsPage = () => {
  useSEO({
    ...INFO_PAGE_SEO["/all-tools"],
    path: "/all-tools",
    jsonLd: [buildInfoPageGraph("/all-tools")].filter(Boolean),
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <div className="container mx-auto max-w-5xl px-4 pt-6">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "All tools", path: "/all-tools" }]} />
        </div>

        <div className="container mx-auto max-w-5xl px-4 py-10">
          <h1 className="font-heading text-[2rem] font-bold leading-tight tracking-tight sm:text-4xl">
            All {TOOL_CATALOG.length} ToolOcean tools
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Every tool on the site, grouped by category. All of them run entirely in your browser,
            your files and text are never uploaded, and each one keeps working with the network off
            once the page has loaded.
          </p>

          <nav aria-label="Jump to category" className="mt-8 flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((key) => (
              <a
                key={key}
                href={`#${key}`}
                className="rounded-full border border-border/60 px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {CATEGORY_LABEL[key]}
              </a>
            ))}
          </nav>

          {CATEGORY_ORDER.map((key) => {
            const tools = toolsInCategory(key);
            if (tools.length === 0) return null;

            return (
              <section key={key} id={key} className="mt-14 scroll-mt-24" aria-labelledby={`${key}-heading`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-3">
                  <h2 id={`${key}-heading`} className="font-heading text-2xl font-semibold tracking-tight">
                    {CATEGORY_LABEL[key]}
                  </h2>
                  <Link to={CATEGORY_INDEX[key]} className="text-sm font-medium text-primary hover:underline">
                    {CATEGORY_LABEL[key]} overview →
                  </Link>
                </div>

                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {tools.map((tool) => (
                    <li key={tool.id}>
                      <Link
                        to={toolPath(tool)}
                        className="block rounded-lg border border-border/60 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                      >
                        <span className="font-medium">{tool.name}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">{tool.description}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AllToolsPage;
