/**
 * When to send the `tool-run` analytics event.
 *
 * The signal is markToolSuccess() in src/lib/toolResult.ts, the success path
 * the tip jar already used. Tools call it once a result exists, so a page view,
 * a picked file that fails to decode, or a wrong password never reaches here.
 * The workbench (tool pages) and the landing-page embed each subscribe with
 * the tool id and the route slug they render under.
 *
 * At most one event per run:
 *   - a signal with a run key is dropped if it repeats the previous key
 *   - a signal without one is dropped within DEDUPE_WINDOW_MS of the last event,
 *     which absorbs a tool that signals from a re-render or twice in one handler
 *
 * No imports, so scripts/traffic-week1.test.mjs can load it under node --test.
 */

export const DEDUPE_WINDOW_MS = 1000;

export type ToolRunSender = (event: string, data: Record<string, string>) => void;

export interface ToolRunReporterOptions {
  tool: string;
  slug: string;
  send: ToolRunSender;
  eventName?: string;
  now?: () => number;
}

const NO_KEY = Symbol("no-run-key");

export function createToolRunReporter({
  tool,
  slug,
  send,
  eventName = "tool-run",
  now = Date.now,
}: ToolRunReporterOptions): (runKey?: unknown) => boolean {
  let lastKey: unknown = NO_KEY;
  let lastAt = Number.NEGATIVE_INFINITY;

  return (runKey?: unknown) => {
    const at = now();
    if (runKey !== undefined && runKey !== null) {
      if (runKey === lastKey) return false;
    } else if (at - lastAt < DEDUPE_WINDOW_MS) {
      return false;
    }
    lastKey = runKey ?? NO_KEY;
    lastAt = at;
    send(eventName, { tool, slug });
    return true;
  };
}
