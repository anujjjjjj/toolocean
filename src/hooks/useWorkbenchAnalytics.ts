import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

/**
 * Interaction tracking for the tool workbench.
 *
 * There is no shared "a tool ran" callback to hook: 73 tool components call
 * navigator.clipboard directly and 49 build their own object URLs, so an explicit
 * per-tool instrumentation pass would mean touching over a hundred files and
 * would rot the moment someone adds the 115th tool. ToolWorkbench is the one
 * component every tool page renders, so a delegated listener on its section
 * covers the whole catalogue from a single place.
 *
 * ToolWorkbench mounting is *not* usable as an engagement signal, it mounts from
 * an effect on every page load, so it would be a duplicate of the page_view.
 * Real interaction is what is measured here:
 *
 *   tool_engage, first genuine interaction inside the workbench, once per route.
 *                 The gap between page_view and tool_engage is the honest answer
 *                 to "do search visitors actually use the tool, or just bounce?"
 *   tool_action. A button or download link was activated, labelled with the
 *                 control's text so the report distinguishes Format from Clear.
 *
 * Only the slug and a static control label are ever sent. Tool input is not
 * touched. That is the one promise this site makes.
 */

/** Keeps a stray long label (a filename in a button, say) out of the report. */
const MAX_LABEL_LENGTH = 40;

const CONTROL_SELECTOR = "button, a[download], [role='button']";

/**
 * Reduce a control to a stable label.
 *
 * `data-analytics-label` wins, so a tool whose button text is dynamic can pin a
 * fixed name without changing what it displays.
 */
function describeControl(control: Element): string | null {
  const explicit = control.getAttribute("data-analytics-label");
  const ariaLabel = control.getAttribute("aria-label");
  const raw = explicit ?? ariaLabel ?? control.textContent ?? "";

  const label = raw.replace(/\s+/g, " ").trim();
  if (!label) return null;

  return label.length > MAX_LABEL_LENGTH ? `${label.slice(0, MAX_LABEL_LENGTH)}…` : label;
}

/**
 * Returns a ref to attach to the workbench container. Listeners are delegated
 * from that node, so they cover controls the mounted tool renders later.
 */
export function useWorkbenchAnalytics() {
  const containerRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // Flat slugs at the site root mean the path *is* the tool id.
  const tool = pathname.replace(/^\//, "") || "home";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let engaged = false;

    const markEngaged = () => {
      if (engaged) return;
      engaged = true;
      trackEvent("tool_engage", { tool });
    };

    const handleClick = (event: Event) => {
      markEngaged();

      const target = event.target;
      if (!(target instanceof Element)) return;

      const control = target.closest(CONTROL_SELECTOR);
      if (!control || !container.contains(control)) return;

      const action = describeControl(control);
      if (!action) return;

      trackEvent("tool_action", { tool, action });
    };

    /*
     * Capture phase throughout: several tools stop propagation on their own
     * handlers, which would hide the event from a bubble-phase listener. passive
     * where the listener never calls preventDefault, so scrolling and typing stay
     * off the main thread's critical path.
     */
    container.addEventListener("pointerdown", markEngaged, { capture: true, passive: true });
    container.addEventListener("input", markEngaged, { capture: true, passive: true });
    container.addEventListener("keydown", markEngaged, { capture: true, passive: true });
    container.addEventListener("change", markEngaged, { capture: true });
    container.addEventListener("click", handleClick, { capture: true });

    return () => {
      container.removeEventListener("pointerdown", markEngaged, { capture: true });
      container.removeEventListener("input", markEngaged, { capture: true });
      container.removeEventListener("keydown", markEngaged, { capture: true });
      container.removeEventListener("change", markEngaged, { capture: true });
      container.removeEventListener("click", handleClick, { capture: true });
    };
  }, [tool]);

  return containerRef;
}
