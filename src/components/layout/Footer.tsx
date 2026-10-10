import { Link } from "react-router-dom";
import { CATEGORY_INDEX, CATEGORY_LABEL, TOOL_CATALOG, type CategoryKey } from "@/data/toolCatalog";
import { LANDING_PAGES } from "@/data/landingPages";

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

const SITE_LINKS = [
  { to: "/about", label: "About" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms of Use" },
  { to: "/all-tools", label: "All Tools" },
  { to: "/workflow-builder", label: "Workflow Builder" },
];

/**
 * Quiet bar, same destinations as before. Category listings, the legal pages,
 * and every landing page stay linked from every page so nothing becomes an orphan.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-border py-6 text-[13px] text-muted-foreground">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-5 md:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span>© {new Date().getFullYear()} ToolOcean</span>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
            <span className="text-foreground">Tools</span>
            {CATEGORY_ORDER.map((key) => (
              <Link key={key} to={CATEGORY_INDEX[key]} className="hover:text-foreground">
                {CATEGORY_LABEL[key]}
              </Link>
            ))}
            <span className="text-foreground">Site</span>
            {SITE_LINKS.map((item) => (
              <Link key={item.to} to={item.to} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
            <span className="text-foreground">Without uploading</span>
            {LANDING_PAGES.map((page) => (
              <Link key={page.slug} to={`/${page.slug}`} className="hover:text-foreground">
                {page.footerLabel}
              </Link>
            ))}
          </nav>
          <span className="font-mono md:ml-auto">Set in Instrument Sans</span>
        </div>
        <p className="max-w-3xl">
          {TOOL_CATALOG.length} free browser tools for developers, documents, images, audio and data. Every one
          runs entirely on your device. Nothing is uploaded, and there is no account. Built and maintained by Anuj
          Kabra. Free to use, no sign-up.
        </p>
      </div>
    </footer>
  );
}
