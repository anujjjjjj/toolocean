const EVENT = "toolocean-result";

export interface ToolSuccessDetail {
  /**
   * Optional identity for the result. Two signals with the same key are one
   * run: a convert followed by a download of that same output, say. It stays
   * in the page and is never sent anywhere.
   */
  runKey?: unknown;
}

/**
 * Tools call this once a result exists: a file was written or output produced.
 * Never call it from a failure path, on mount, or for a page view. The tip jar
 * and the `tool-run` analytics event (src/lib/toolRunEvent.ts) listen.
 */
export function markToolSuccess(runKey?: unknown) {
  if (typeof window === "undefined") return;
  const detail: ToolSuccessDetail = { runKey };
  window.dispatchEvent(new CustomEvent<ToolSuccessDetail>(EVENT, { detail }));
}

export function subscribeToolSuccess(listener: (runKey: unknown) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => listener((event as CustomEvent<ToolSuccessDetail>).detail?.runKey);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
