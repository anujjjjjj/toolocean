import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Tool name, used in the fallback copy. */
  label: string;
}

interface State {
  failed: boolean;
}

/**
 * Keeps a broken tool from taking the page down with it.
 *
 * Without this, a tool that throws during render unmounts the whole React tree:
 * header, hero, FAQ and every other prerendered word disappear and the visitor
 * gets a blank document. That is not hypothetical — a Node-only GIF encoder threw
 * at import time and `document.body.innerText.length` was 0 on /video-to-gif,
 * which also meant a crawler saw an empty page on an indexed URL.
 *
 * Scoped to the workbench specifically, so the failure stays the size of the tool.
 * Everything around it keeps rendering and the page stays indexable.
 */
export class ToolErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Left as console.error deliberately: there is no error-reporting backend to
    // send this to, and inventing one would break the no-server promise.
    console.error("Tool failed to render:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
      >
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <h3 className="font-heading text-lg font-semibold">This tool failed to load</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          {this.props.label} hit an error in your browser. Reloading the page usually clears it. If it
          keeps happening, the tool itself is broken and the rest of this page will still work.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-1 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Reload the page
        </button>
      </div>
    );
  }
}
