import { Suspense, useEffect, useState, type ComponentType } from "react";
import { useWorkbenchAnalytics } from "@/hooks/useWorkbenchAnalytics";
import { WORKBENCH_ID, subscribeToToolActions } from "@/lib/toolActions";
import { ToolErrorBoundary } from "./ToolErrorBoundary";
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

  /*
   * Delegated from this section, so it covers the controls the mounted tool
   * renders later without any of the 114 tools knowing analytics exists.
   */
  const analyticsRef = useWorkbenchAnalytics();

  useEffect(() => setMounted(true), []);

  /*
   * Generic handling for the hero CTAs.
   *
   * The toolActions bus was designed as opt-in, and exactly one of the 114 tools
   * ever opted in — so on 113 pages "Start with your own data" and "Open a file"
   * scrolled here and then did nothing, and "Choose a PDF" looked like a file
   * picker that never opened. Rather than adding the same effect to 114 files (and
   * needing it again for every tool added later), the workbench honours the two
   * structural intents itself: every tool has a first input, and every file tool
   * has a file input.
   *
   * A tool that subscribes directly still wins — this runs a tick later and backs
   * off if the tool already moved focus into itself.
   */
  useEffect(() => {
    if (!mounted) return;

    return subscribeToToolActions((action) => {
      if (action.type !== "focus" && action.type !== "upload") return;

      window.setTimeout(() => {
        const root = document.getElementById(WORKBENCH_ID);
        if (!root) return;

        if (action.type === "upload") {
          const picker = root.querySelector<HTMLInputElement>('input[type="file"]');
          // Falls through to focus when the tool has no file input, which is the
          // right behaviour for "Open a file" on a paste-only tool.
          if (picker) {
            picker.click();
            return;
          }
        }

        // The tool handled it already; leave its choice of target alone.
        if (root.contains(document.activeElement) && document.activeElement !== document.body) return;

        const field = root.querySelector<HTMLTextAreaElement | HTMLInputElement>(
          'textarea:not([readonly]):not([disabled]), input[type="text"]:not([readonly]):not([disabled]), input[type="url"]:not([readonly]), input[type="number"]:not([readonly]), input:not([type]):not([readonly])',
        );
        field?.focus();
      }, 0);
    });
  }, [mounted]);

  return (
    <section
      ref={analyticsRef}
      id={WORKBENCH_ID}
      aria-label={label}
      // scroll-mt keeps the sticky header from covering the workbench when the
      // hero CTA jumps here.
      className="scroll-mt-20 border-b border-border/60 bg-muted/20 py-8 sm:py-10"
    >
      <div className="container mx-auto max-w-6xl px-4">
        {mounted ? (
          <ToolErrorBoundary label={label}>
            <Suspense fallback={<WorkbenchSkeleton label={`Loading ${label}…`} />}>
              <Tool />
            </Suspense>
          </ToolErrorBoundary>
        ) : (
          <WorkbenchSkeleton label={`Loading ${label}…`} />
        )}
      </div>
    </section>
  );
}
