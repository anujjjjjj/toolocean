import { Link } from "react-router-dom";
import { Waves } from "lucide-react";
import { CATEGORY_INDEX, CATEGORY_LABEL, type CategoryKey } from "@/data/toolCatalog";
import { LANDING_PAGES } from "@/data/landingPages";

/**
 * Site footer.
 *
 * Added with the About/Privacy/Terms pages, which otherwise would have had no
 * route into them from anywhere on the site. An orphaned page is one a crawler
 * only reaches via the sitemap, and Google treats sitemap-only discovery as a
 * much weaker signal than an internal link.
 *
 * The category list doubles as site-wide internal linking. Every one of the 125
 * pages now links to all ten listing pages, which is the cheapest way to spread
 * crawl equity across the catalogue.
 *
 * Derived from CATEGORY_INDEX rather than hand-listed, so a new category appears
 * here automatically instead of being silently omitted.
 */

const CATEGORY_ORDER: CategoryKey[] = [
  "dev",
  "pdf",
  "image",
  "csv",
  "spreadsheet",
  "converter",
  "audio",
  "video",
  "compression",
  "archive",
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-muted/20">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 text-foreground">
              <Waves className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="font-heading text-lg font-semibold">ToolOcean</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              114 free browser tools for developers, documents, images, audio and data. Every
              one runs entirely on your device. Nothing is uploaded, and there is no account.
            </p>
          </div>

          <nav aria-labelledby="footer-tools-heading">
            <h2
              id="footer-tools-heading"
              className="text-sm font-semibold uppercase tracking-wide text-foreground"
            >
              Tools
            </h2>
            <ul className="mt-4 space-y-2">
              {CATEGORY_ORDER.map((key) => (
                <li key={key}>
                  <Link
                    to={CATEGORY_INDEX[key]}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {CATEGORY_LABEL[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-site-heading">
            <h2
              id="footer-site-heading"
              className="text-sm font-semibold uppercase tracking-wide text-foreground"
            >
              Site
            </h2>
            <ul className="mt-4 space-y-2">
              {[
                { to: "/about", label: "About" },
                { to: "/privacy", label: "Privacy" },
                { to: "/terms", label: "Terms of Use" },
                { to: "/all-tools", label: "All Tools" },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/*
            The landing pages need an internal link from somewhere, or they are
            orphans that Google only ever reaches through the sitemap, which is a
            far weaker discovery signal than a link, and a much weaker ranking one.
            Being in the footer puts them one hop from all 135 pages.
          */}
          <nav aria-labelledby="footer-guides-heading">
            <h2
              id="footer-guides-heading"
              className="text-sm font-semibold uppercase tracking-wide text-foreground"
            >
              Without uploading
            </h2>
            <ul className="mt-4 space-y-2">
              {LANDING_PAGES.map((page) => (
                <li key={page.slug}>
                  <Link
                    to={`/${page.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {page.footerLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-10 border-t border-border/60 pt-6 text-sm text-muted-foreground">
          Built and maintained by Anuj Kabra. Free to use, no sign-up.
        </p>
      </div>
    </footer>
  );
}
