/**
 * Infers a finished run from what the person does with the result.
 *
 * 33 tools call markToolSuccess() themselves. The other ~90 (word counter,
 * case converter, UUID generator, every text and dev tool) never did, so they
 * could not send `tool-run` at all. Their results all leave the page the same
 * two ways: navigator.clipboard.writeText (71 files) or an <a download> click
 * (52 files). This watches those two exits, and only right after an
 * interaction inside a tool root, so a copy button in the header or a site-wide
 * download link does not count.
 *
 * Producing output is not a run here (a text tool recomputes on every key
 * press); taking it is. The signal is deferred a moment so a tool that does
 * report itself, usually right after the same click, is seen first and the
 * reporter ignores the captured one (src/lib/toolRunEvent.ts).
 *
 * Nothing about the copied text or the file is read or kept.
 * No imports beyond toolResult, so node --test can load it with fake globals.
 */
import { markCapturedToolSuccess } from "./toolResult.ts";

export const TOOL_ROOT_SELECTOR = "#tool-workbench, [data-lean-embed]";
/** A conversion that takes a while (a ZIP, a long PDF) still counts. */
export const INTERACTION_TTL_MS = 60_000;
export const CAPTURE_DEFER_MS = 250;

type Closest = { closest?: (selector: string) => unknown };
type ClipboardLike = { writeText: (text: string) => Promise<void> };
type AnchorLike = { hasAttribute(name: string): boolean };

export interface CaptureEnv {
  document: EventTarget;
  clipboard?: ClipboardLike | null;
  anchorPrototype?: { click: () => void } | null;
  now?: () => number;
  schedule?: (run: () => void, ms: number) => void;
  signal?: () => void;
}

function browserEnv(): CaptureEnv | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  return {
    document,
    clipboard: typeof navigator !== "undefined" ? (navigator.clipboard as ClipboardLike | undefined) : null,
    anchorPrototype: typeof HTMLAnchorElement !== "undefined" ? HTMLAnchorElement.prototype : null,
  };
}

function insideTool(target: unknown): boolean {
  const el = target as Closest | null;
  return typeof el?.closest === "function" && Boolean(el.closest(TOOL_ROOT_SELECTOR));
}

let installs = 0;
let uninstall: (() => void) | null = null;

/**
 * Reference counted: the workbench and a landing embed each call it from an
 * effect, and route changes unmount one before mounting the next. Returns the
 * cleanup for this caller.
 */
export function installToolRunCapture(env: CaptureEnv | null = browserEnv()): () => void {
  if (!env) return () => {};
  installs += 1;
  if (installs === 1) uninstall = patch(env);
  let done = false;
  return () => {
    if (done) return;
    done = true;
    installs -= 1;
    if (installs === 0) {
      uninstall?.();
      uninstall = null;
    }
  };
}

function patch(env: CaptureEnv): () => void {
  const now = env.now ?? Date.now;
  const schedule = env.schedule ?? ((run, ms) => void setTimeout(run, ms));
  const signal = env.signal ?? markCapturedToolSuccess;
  let lastToolInteraction = Number.NEGATIVE_INFINITY;

  const recent = () => now() - lastToolInteraction <= INTERACTION_TTL_MS;
  const report = () => schedule(signal, CAPTURE_DEFER_MS);

  const onInteraction = (event: Event) => {
    lastToolInteraction = insideTool(event.target) ? now() : Number.NEGATIVE_INFINITY;
  };
  const onClick = (event: Event) => {
    onInteraction(event);
    // A real click on a download link the tool rendered.
    if (!event.isTrusted) return;
    const link = (event.target as Closest | null)?.closest?.("a[download]");
    if (link && insideTool(link)) report();
  };
  const doc = env.document;
  doc.addEventListener("pointerdown", onInteraction, { capture: true, passive: true });
  doc.addEventListener("keydown", onInteraction, { capture: true, passive: true });
  doc.addEventListener("click", onClick, { capture: true });

  const restores: Array<() => void> = [];

  const clipboard = env.clipboard;
  if (clipboard && typeof clipboard.writeText === "function") {
    const hadOwn = Object.prototype.hasOwnProperty.call(clipboard, "writeText");
    const original = clipboard.writeText;
    clipboard.writeText = function writeText(this: ClipboardLike, text: string) {
      const fromTool = recent();
      const result = original.call(this, text);
      if (fromTool) Promise.resolve(result).then(report, () => {});
      return result;
    };
    restores.push(() => {
      if (hadOwn) clipboard.writeText = original;
      else delete (clipboard as Partial<ClipboardLike>).writeText;
    });
  }

  const proto = env.anchorPrototype;
  if (proto && typeof proto.click === "function") {
    const original = proto.click;
    // Tools build a detached <a download>, click it and revoke the URL.
    proto.click = function click(this: AnchorLike) {
      if (typeof this.hasAttribute === "function" && this.hasAttribute("download") && recent()) report();
      return original.call(this);
    };
    restores.push(() => {
      proto.click = original;
    });
  }

  return () => {
    doc.removeEventListener("pointerdown", onInteraction, { capture: true });
    doc.removeEventListener("keydown", onInteraction, { capture: true });
    doc.removeEventListener("click", onClick, { capture: true });
    for (const restore of restores.reverse()) restore();
  };
}
