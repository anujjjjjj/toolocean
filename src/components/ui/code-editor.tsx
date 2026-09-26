import { forwardRef, useCallback, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type UIEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * A plain-textarea code editor with a synced line-number gutter.
 *
 * Chosen over CodeMirror/Monaco on purpose: those add 300 kB–2 MB to a page
 * whose entire pitch is speed, and neither is needed to paste, format, and copy
 * text. The tradeoff is no syntax highlighting inside the editable area, which
 * is why the gutter carries the error affordance instead.
 *
 * The gutter renders every number into a single text node rather than one
 * element per line, so a 50,000-line document costs one node, not 50,000.
 */

/** Locked so the gutter and textarea stay aligned. Both use these exact values. */
const LINE_HEIGHT_PX = 21;
const FONT_SIZE_PX = 13;

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  /** 1-based line to highlight in the gutter, e.g. the line a parse error points at. */
  errorLine?: number | null;
  /** Accessible name. Required. This is a form control. */
  label: string;
  /** id of an element describing the field (error text, hints). */
  describedBy?: string;
  className?: string;
  spellCheck?: boolean;
}

export const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(function CodeEditor(
  { value, onChange, placeholder, readOnly, errorLine, label, describedBy, className, spellCheck = false },
  ref,
) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const lineCount = useMemo(() => {
    // A trailing newline should not add a phantom numbered line.
    if (value.length === 0) return 1;
    let count = 1;
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) === 10) count++;
    }
    return count;
  }, [value]);

  const gutterText = useMemo(() => {
    const numbers = new Array<string>(lineCount);
    for (let i = 0; i < lineCount; i++) numbers[i] = String(i + 1);
    return numbers.join("\n");
  }, [lineCount]);

  const handleScroll = useCallback((event: UIEvent<HTMLTextAreaElement>) => {
    const next = event.currentTarget.scrollTop;
    setScrollTop(next);
    // Written directly rather than through state so the gutter cannot lag the
    // textarea by a frame during fast scrolling.
    if (gutterRef.current) gutterRef.current.scrollTop = next;
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Tab" || readOnly || !onChange) return;
      // Trapping Tab in a textarea is normally an accessibility failure because
      // it breaks keyboard escape from the control. Shift+Tab is left alone so
      // there is always a way out without reaching for the mouse.
      if (event.shiftKey) return;

      event.preventDefault();
      const target = event.currentTarget;
      const { selectionStart, selectionEnd } = target;
      const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
      onChange(next);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = selectionStart + 2;
      });
    },
    [onChange, readOnly, value],
  );

  return (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-lg border border-border/70 bg-card focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30",
        className,
      )}
    >
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="relative w-12 shrink-0 select-none overflow-hidden border-r border-border/60 bg-muted/40 py-3 text-right font-mono text-muted-foreground/60"
        style={{ fontSize: FONT_SIZE_PX, lineHeight: `${LINE_HEIGHT_PX}px` }}
      >
        {errorLine != null && errorLine >= 1 && errorLine <= lineCount && (
          <span
            className="pointer-events-none absolute inset-x-0 bg-destructive/15"
            style={{ height: LINE_HEIGHT_PX, top: 12 + (errorLine - 1) * LINE_HEIGHT_PX - scrollTop }}
          />
        )}
        <pre className="relative whitespace-pre pr-2 font-mono">{gutterText}</pre>
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange?.(event.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        readOnly={readOnly}
        aria-label={label}
        aria-describedby={describedBy}
        aria-invalid={errorLine != null || undefined}
        spellCheck={spellCheck}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        // wrap="off" gives a horizontal scrollbar instead of soft-wrapping, which
        // is what keeps the gutter numbers pointing at the right physical rows.
        wrap="off"
        className="flex-1 resize-none bg-transparent px-3 py-3 font-mono text-foreground outline-none placeholder:text-muted-foreground/50"
        style={{ fontSize: FONT_SIZE_PX, lineHeight: `${LINE_HEIGHT_PX}px` }}
      />
    </div>
  );
});
