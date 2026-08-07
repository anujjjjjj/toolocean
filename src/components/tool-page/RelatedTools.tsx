import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Section } from "./Section";
import type { RelatedToolLink } from "@/types/toolContent";

/**
 * Internal links carry a real one-line reason to click. Descriptive, varied
 * anchor context is what separates a useful hub from a footer link farm, and it
 * gives Google something to work with when deciding what the target page is about.
 */
export function RelatedTools({
  related,
  heading,
  lede,
}: {
  related: RelatedToolLink[];
  heading: string;
  lede?: string;
}) {
  if (related.length === 0) return null;

  return (
    <Section id="related-tools" heading={heading} lede={lede} muted>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((tool) => (
          <li key={tool.path}>
            <Link
              to={tool.path}
              className="group flex h-full flex-col rounded-xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-heading text-sm font-semibold text-foreground">{tool.name}</span>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tool.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
