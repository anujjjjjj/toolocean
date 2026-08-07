import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ToolCategoryRef } from "@/types/toolContent";

export function ToolFooterCta({ category }: { category: ToolCategoryRef }) {
  return (
    <section aria-labelledby="footer-cta-heading" className="py-16 sm:py-20">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <h2 id="footer-cta-heading" className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Explore more browser-first tools
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Every tool on ToolOcean runs the same way this one does — the work happens in your tab, and
          your files stay on your machine.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 gap-2 px-6">
            <Link to={category.path}>
              Browse {category.name}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 px-6">
            <Link to="/">See all categories</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
