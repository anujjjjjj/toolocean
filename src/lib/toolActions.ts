/**
 * A tiny event bridge between the generic page chrome (hero CTAs) and whatever
 * interactive tool is mounted in the workbench.
 *
 * The layout must not know that the JSON formatter has a file input, so instead
 * of prop-drilling refs through six presentational components, the hero fires an
 * intent and the mounted tool decides how to honour it. Any future tool opts in
 * by calling onToolAction() — tools that ignore an intent simply do nothing.
 */

export type ToolAction =
  | { type: "focus" }
  | { type: "upload" }
  /** "Try this example" — hands sample text from the page copy to the live tool. */
  | { type: "load"; payload: string };

export type ToolActionType = ToolAction["type"];

const EVENT_NAME = "toolocean:tool-action";

/** Anchor id of the workbench section — used for scroll + skip-link targets. */
export const WORKBENCH_ID = "tool-workbench";

export function emitToolAction(action: ToolAction) {
  if (typeof window === "undefined") return;

  // Scrolling is the layout's job and is identical for every tool, so it happens
  // here rather than in each tool's handler.
  const workbench = document.getElementById(WORKBENCH_ID);
  if (workbench) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    workbench.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  window.dispatchEvent(new CustomEvent<ToolAction>(EVENT_NAME, { detail: action }));
}

/** Subscribe to page-level intents. Returns an unsubscribe function. */
export function subscribeToToolActions(handler: (action: ToolAction) => void) {
  if (typeof window === "undefined") return () => {};

  const listener = (event: Event) => handler((event as CustomEvent<ToolAction>).detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
