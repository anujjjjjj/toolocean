import { Suspense, useEffect, useState, type ComponentType } from "react";
import { WORKBENCH_ID } from "@/lib/toolActions";
import { cn } from "@/lib/utils";

/**
 * Height the placeholder reserves while the tool chunk loads.
 *
 * This is what lets the page prerender without a CLS penalty: the box is roughly
 * the right size from first paint, so swapping the real editor in shifts little.
 *
 * Responsive because the two-pane tools stack below md, which roughly doubles
 * their height — a single fixed value is wrong on one breakpoint or the other.
 * These are averages across the catalogue, so a given tool may still shift a
 * little; a per-tool `reservedHeight` on ToolPageContent would remove the rest.
 */
const RESERVED_HEIGHT = "min-h-[780px] md:min-h-[660px]";

function WorkbenchSkeleton({ label }: { label: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl border border-border/70 bg-card",
        RESERVED_HEIGHT,
      )}
    >
      {/*
        aria-live so assistive tech announces the tool becoming ready, but the
        visual treatment stays quiet — a spinner here would compete with the
        hero for attention on a page most people reach from search.
      */}
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        {label}
      </p>
    </div>
  );
}

interface ToolWorkbenchProps {
  /** Lazily-imported tool component. Kept out of the prerendered output entirely. */
  component: ComponentType;
  /** Accessible name for the region, e.g. "JSON formatter". */
  label: string;
}

/**
 * Wraps the interactive part of a tool page.
 *
 * The tool renders only after mount. That is deliberate on three counts:
 *   - the prerender pass runs in Node, where the tools' browser APIs do not exist
 *   - server output and first client render are identical, so hydration is clean
 *   - the 4 MB of tool code stays off the critical path for a search visitor who
 *     is still reading the hero
 */
export function ToolWorkbench({ component: Tool, label }: ToolWorkbenchProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <section
      id={WORKBENCH_ID}
      aria-label={label}
      // scroll-mt keeps the sticky header from covering the workbench when the
      // hero CTA jumps here.
      className="scroll-mt-20 border-b border-border/60 bg-muted/20 py-8 sm:py-10"
    >
      <div className="container mx-auto max-w-6xl px-4">
        {mounted ? (
          <Suspense fallback={<WorkbenchSkeleton label={`Loading ${label}…`} />}>
            <Tool />
          </Suspense>
        ) : (
          <WorkbenchSkeleton label={`Loading ${label}…`} />
        )}
      </div>
    </section>
  );
}
