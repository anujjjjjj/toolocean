const EVENT = "toolocean-result";

export interface ToolSuccessDetail {
  /**
   * Optional identity for the result. Two signals with the same key are one
   * run: a convert followed by a download of that same output, say. It stays
   * in the page and is never sent anywhere.
   */
  runKey?: unknown;
  /**
   * Set by src/lib/toolRunCapture.ts when the result was inferred from a copy or
   * a download inside the tool, not reported by the tool itself. Only the
   * `tool-run` reporter asks for these; the tip jar keeps to explicit signals.
   */
  captured?: boolean;
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

/**
 * A tool that does not call markToolSuccess still produces a result when the
 * person copies or downloads it. toolRunCapture.ts reports that with this.
 */
export function markCapturedToolSuccess() {
  if (typeof window === "undefined") return;
  const detail: ToolSuccessDetail = { captured: true };
  window.dispatchEvent(new CustomEvent<ToolSuccessDetail>(EVENT, { detail }));
}

export function subscribeToolSuccess(
  listener: (runKey: unknown, captured: boolean) => void,
  { includeCaptured = false }: { includeCaptured?: boolean } = {},
) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ToolSuccessDetail>).detail;
    const captured = detail?.captured === true;
    if (captured && !includeCaptured) return;
    listener(detail?.runKey, captured);
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
