import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchVisitorLabel, umamiShareUrl, umamiWebsiteId } from "@/lib/umami";

/**
 * One quiet line of the public visitor count, home page only.
 *
 * The first render is always empty, on the server and on the client, so
 * hydration does not move the page. The request runs after idle. A failure or
 * a count under 100 leaves the line unmounted, so there is no reserved gap
 * and nothing above the fold shifts.
 */
export function VisitorCount() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const websiteId = umamiWebsiteId();
    const shareUrl = umamiShareUrl();
    if (!websiteId || !shareUrl) return;

    let cancelled = false;
    const run = () => {
      fetchVisitorLabel(shareUrl).then((next) => {
        if (!cancelled) setLabel(next);
      });
    };

    const requestIdle = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    ).requestIdleCallback;
    if (typeof requestIdle === "function") {
      const id = requestIdle(run, { timeout: 4000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }

    const timer = window.setTimeout(run, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (!label) return null;

  return (
    <p className="mb-8 flex items-center gap-1.5 font-mono text-[12px] leading-none text-[var(--muted-ink)]">
      <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
    </p>
  );
}
