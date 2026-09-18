import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDownWideNarrow,
  Braces,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Minimize2,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/ui/code-editor";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/hooks/use-toast";
import { subscribeToToolActions } from "@/lib/toolActions";
import {
  computeStats,
  formatBytes,
  indentToken,
  parseJson,
  sortKeysDeep,
  type IndentStyle,
  type JsonParseFailure,
  type JsonStats,
} from "@/lib/jsonUtils";
import { cn } from "@/lib/utils";

/**
 * Above this size, format-as-you-type is suspended. Re-serialising a multi-megabyte
 * document on every keystroke janks the main thread badly enough to drop input
 * events, so the user gets an explicit "press Format" affordance instead.
 */
const AUTO_FORMAT_MAX_BYTES = 512 * 1024;

/** Debounce for auto-format. Long enough to not fire mid-token, short enough to feel live. */
const AUTO_FORMAT_DELAY_MS = 350;

const SHORTCUTS = [
  { keys: "⌘ ⏎", label: "Format" },
  { keys: "⌘ ⇧ M", label: "Minify" },
  { keys: "⌘ ⇧ C", label: "Copy output" },
  { keys: "⌘ S", label: "Download" },
];

type Status =
  | { kind: "empty" }
  | { kind: "valid"; stats: JsonStats }
  | { kind: "invalid"; error: JsonParseFailure };

export function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState<IndentStyle>("2");
  const [sortKeys, setSortKeys] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [status, setStatus] = useState<Status>({ kind: "empty" });
  const [justCopied, setJustCopied] = useState(false);

  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const inputBytes = useMemo(() => new TextEncoder().encode(input).length, [input]);
  const autoFormatSuspended = inputBytes > AUTO_FORMAT_MAX_BYTES;

  /**
   * Single code path for every transform. `mode` only decides the indent, which
   * keeps beautify and minify from drifting apart in validation behaviour.
   */
  const run = useCallback(
    (mode: "beautify" | "minify" | "validate", source: string = input) => {
      if (!source.trim()) {
        setOutput("");
        setStatus({ kind: "empty" });
        return;
      }

      const result = parseJson(source);
      if (result.status === "error") {
        setStatus({ kind: "invalid", error: result.error });
        // The previous good output is cleared deliberately, leaving stale output
        // next to an error is how people copy the wrong thing.
        setOutput("");
        return;
      }

      const value = sortKeys ? sortKeysDeep(result.value) : result.value;
      const serialised =
        mode === "minify"
          ? JSON.stringify(value)
          : JSON.stringify(value, null, indentToken(indent));

      setStatus({ kind: "valid", stats: computeStats(serialised, value) });
      if (mode !== "validate") setOutput(serialised);
    },
    [indent, input, sortKeys],
  );

  // Auto-format. Skipped entirely for large documents; see AUTO_FORMAT_MAX_BYTES.
  useEffect(() => {
    if (!autoFormat || autoFormatSuspended) return;
    if (!input.trim()) {
      setOutput("");
      setStatus({ kind: "empty" });
      return;
    }

    const timer = window.setTimeout(() => run("beautify"), AUTO_FORMAT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoFormat, autoFormatSuspended, input, indent, sortKeys, run]);

  const loadText = useCallback((text: string) => {
    setInput(text);
    setOutput("");
    setStatus({ kind: "empty" });
    inputRef.current?.focus();
  }, []);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => loadText(String(event.target?.result ?? ""));
      reader.onerror = () =>
        toast({ title: "Could not read that file", description: "Try opening it and pasting the text instead.", variant: "destructive" });
      // readAsText keeps the file on the device. There is no upload here despite
      // the button being labelled "Upload".
      reader.readAsText(file);
    },
    [loadText, toast],
  );

  const copyOutput = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setJustCopied(true);
      window.setTimeout(() => setJustCopied(false), 1800);
    } catch {
      toast({ title: "Copy failed", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  }, [output, toast]);

  const download = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "formatted.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }, [output]);

  const clear = useCallback(() => {
    setInput("");
    setOutput("");
    setStatus({ kind: "empty" });
    inputRef.current?.focus();
  }, []);

  // Hero and example CTAs drive the tool through the action bus.
  useEffect(
    () =>
      subscribeToToolActions((action) => {
        if (action.type === "focus") inputRef.current?.focus();
        if (action.type === "upload") fileInputRef.current?.click();
        if (action.type === "load") loadText(action.payload);
      }),
    [loadText],
  );

  // Shortcuts are scoped to the workbench rather than the window so that ⌘S
  // still means "save page" everywhere else on the document.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      const key = event.key.toLowerCase();

      if (key === "enter") {
        event.preventDefault();
        run("beautify");
      } else if (event.shiftKey && key === "m") {
        event.preventDefault();
        run("minify");
      } else if (event.shiftKey && key === "c") {
        event.preventDefault();
        void copyOutput();
      } else if (key === "s") {
        event.preventDefault();
        download();
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [copyOutput, download, run]);

  const errorLine = status.kind === "invalid" ? status.error.line : null;

  return (
    <div ref={containerRef} className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-soft">
      {/* ---------------------------------------------------------------- toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/30 px-3 py-2.5">
        <Button size="sm" onClick={() => run("beautify")} className="gap-1.5">
          <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
          Beautify
        </Button>
        <Button size="sm" variant="outline" onClick={() => run("minify")} className="gap-1.5">
          <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
          Minify
        </Button>
        <Button size="sm" variant="outline" onClick={() => run("validate")} className="gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Validate
        </Button>

        <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

        <div className="flex items-center gap-1.5">
          <Label htmlFor="json-indent" className="text-xs text-muted-foreground">
            Indent
          </Label>
          <Select value={indent} onValueChange={(value) => setIndent(value as IndentStyle)}>
            <SelectTrigger id="json-indent" className="h-8 w-[104px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 spaces</SelectItem>
              <SelectItem value="3">3 spaces</SelectItem>
              <SelectItem value="4">4 spaces</SelectItem>
              <SelectItem value="tab">Tab</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Toggle
          size="sm"
          pressed={sortKeys}
          onPressedChange={setSortKeys}
          aria-label="Sort object keys alphabetically"
          className="h-8 gap-1.5 text-xs data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
        >
          <ArrowDownWideNarrow className="h-3.5 w-3.5" aria-hidden="true" />
          Sort keys
        </Toggle>

        <div className="ml-auto flex items-center gap-2">
          <Label htmlFor="auto-format" className="text-xs text-muted-foreground">
            Auto format
          </Label>
          <Switch
            id="auto-format"
            checked={autoFormat && !autoFormatSuspended}
            disabled={autoFormatSuspended}
            onCheckedChange={setAutoFormat}
          />
        </div>
      </div>

      {/*
        Panes go side by side from md up. Below that they stack, so the editors
        are deliberately much shorter: at the desktop height two stacked panes
        came to 1,120px of largely empty box on a phone, burying the rest of the
        page under it.
      */}
      <div className="grid gap-px bg-border/60 md:grid-cols-2">
        {/* input */}
        <div className="flex flex-col bg-card">
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</h3>
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.txt,application/json,text/plain"
                className="sr-only"
                onChange={(event) => {
                  handleFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                Open file
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 text-xs"
                onClick={clear}
                disabled={!input}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Clear
              </Button>
            </div>
          </div>

          <div
            className="px-3 pb-3"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFile(event.dataTransfer.files?.[0]);
            }}
          >
            <CodeEditor
              ref={inputRef}
              label="JSON input"
              value={input}
              onChange={setInput}
              errorLine={errorLine}
              describedBy="json-status"
              placeholder={'Paste JSON here, drop a file, or press "Open file".'}
              className="h-[280px] md:h-[520px]"
            />
          </div>
        </div>

        {/* output */}
        <div className="flex flex-col bg-card">
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</h3>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={copyOutput} disabled={!output}>
                {justCopied ? (
                  <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {justCopied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={download} disabled={!output}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download
              </Button>
            </div>
          </div>

          <div className="px-3 pb-3">
            <CodeEditor
              label="Formatted JSON output"
              value={output}
              readOnly
              placeholder="Formatted JSON appears here."
              className="h-[280px] bg-muted/20 md:h-[520px]"
            />
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------- statusbar */}
      <div
        id="json-status"
        role="status"
        aria-live="polite"
        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/60 bg-muted/30 px-3 py-2.5 text-xs"
      >
        {status.kind === "empty" && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Braces className="h-3.5 w-3.5" aria-hidden="true" />
            Waiting for input
          </span>
        )}

        {status.kind === "valid" && (
          <>
            <span className="flex items-center gap-1.5 font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Valid JSON
            </span>
            <span className="text-muted-foreground">{formatBytes(status.stats.bytes)}</span>
            <span className="text-muted-foreground">{status.stats.lines.toLocaleString()} lines</span>
            <span className="text-muted-foreground">{status.stats.keys.toLocaleString()} keys</span>
            <span className="text-muted-foreground">depth {status.stats.depth}</span>
          </>
        )}

        {status.kind === "invalid" && (
          <span className="flex items-start gap-1.5 font-medium text-destructive">
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {status.error.message}
              {status.error.line != null && (
                <span className="font-normal">
                  {", line "}
                  {status.error.line}
                  {status.error.column != null && `, column ${status.error.column}`}
                </span>
              )}
            </span>
          </span>
        )}

        {autoFormatSuspended && (
          <span className="text-muted-foreground">
            Auto format paused above {formatBytes(AUTO_FORMAT_MAX_BYTES)}, use Beautify.
          </span>
        )}

        <ul className="ml-auto hidden items-center gap-3 text-muted-foreground/70 xl:flex">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.label} className="flex items-center gap-1.5">
              <kbd className="rounded border border-border/70 bg-card px-1.5 py-0.5 font-mono text-[0.6875rem]">
                {shortcut.keys}
              </kbd>
              <span className={cn("text-[0.6875rem]")}>{shortcut.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
