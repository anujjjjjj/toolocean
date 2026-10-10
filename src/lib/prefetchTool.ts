import { useEffect, useRef } from "react";
import { prefetchToolChunk } from "@/lib/lazyToolRegistry";

const seen = new Set<string>();
const queue: string[] = [];
let active = 0;

function pump() {
  if (active >= 1) return;
  const slug = queue.shift();
  if (!slug) return;
  if (seen.has(slug)) {
    pump();
    return;
  }
  seen.add(slug);
  active += 1;
  Promise.resolve(prefetchToolChunk(slug)).finally(() => {
    active -= 1;
    pump();
  });
}

/**
 * Hover/focus loads immediately. Viewport loads one chunk at a time so a grid
 * of every tool does not download the whole catalogue.
 */
export function prefetchTool(slug: string | undefined, priority: "hover" | "view" = "hover") {
  if (!slug || seen.has(slug)) return;
  if (priority === "hover") {
    seen.add(slug);
    void prefetchToolChunk(slug);
    return;
  }
  queue.push(slug);
  pump();
}

export function usePrefetchOnView<T extends HTMLElement>(slug: string | undefined) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !slug) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          prefetchTool(slug, "view");
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [slug]);

  return ref;
}
