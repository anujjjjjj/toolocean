import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Check, Copy, Download, FileText, Lock, ScanLine, X } from "lucide-react";
import { loadPdfJs } from "@/lib/pdf/lazyPdf";
import {
    assembleText,
    countCharacters,
    countWords,
    extractPage,
    looksLikePdf,
    parsePageRange,
    scanMessage,
    scannedPages,
    textFileName,
    type ExtractedPage,
    type PdfTextItem,
} from "@/lib/pdfToText";
import { markToolSuccess } from "@/lib/toolResult";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 200_000;

type State = "empty" | "working" | "done" | "error" | "locked";
type Mode = "all" | "range";
type Failure = "not-pdf" | "unreadable" | "no-pages";

interface OpenDocument {
    file: File;
    pages: ExtractedPage[];
}

const TRUST_CHIPS = ["No upload", "Works offline once loaded", "Free"];
const COPIED_MS = 2000;

function formatBytes(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

const plural = (count: number, noun: string) => `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;

/** Lets the browser paint and handle input between pages, so a long file never freezes the tab. */
function yieldToBrowser(): Promise<void> {
    const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    if (scheduler?.yield) return scheduler.yield();
    return new Promise((resolve) => setTimeout(resolve, 0));
}

function LockedNotice() {
    return (
        <div role="alert" className="rounded-[14px] border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                    <p className="text-[15px] font-medium text-foreground">This PDF is locked, so its text cannot be read yet.</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        It needs a password to open. Remove it with the password you already have, then bring the
                        unlocked copy back here.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 max-sm:flex-col">
                        <Link
                            to="/remove-password-from-bank-statement-pdf"
                            className={buttonVariants({ className: "h-11 no-underline" })}
                        >
                            Remove the password first
                        </Link>
                        <Link
                            to="/pdf-unlock"
                            className={buttonVariants({ variant: "outline", className: "h-11 no-underline" })}
                        >
                            Open Unlock PDF
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

const FAILURE_COPY: Record<Failure, { title: string; body: string }> = {
    "not-pdf": {
        title: "This file is not a PDF.",
        body: "It does not start the way a PDF does, so there is no text layer to read. Pick a .pdf file, or save the document as PDF first.",
    },
    unreadable: {
        title: "This PDF could not be read.",
        body: "It may be damaged or cut short. Open it in a PDF viewer, save a fresh copy, and try that one.",
    },
    "no-pages": {
        title: "This PDF has no pages.",
        body: "There is nothing in it to copy.",
    },
};

function ErrorPanel({ kind, onRetry }: { kind: Failure; onRetry: () => void }) {
    const copy = FAILURE_COPY[kind];
    return (
        <div data-p2t-error role="alert" className="rounded-[14px] border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--delete)]" aria-hidden="true" />
                <div className="min-w-0">
                    <p className="text-[15px] font-medium text-foreground">{copy.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
                    <Button type="button" variant="outline" className="mt-3 h-11 max-sm:w-full" onClick={onRetry}>
                        Choose another file
                    </Button>
                </div>
            </div>
        </div>
    );
}

interface ToggleRowProps {
    id: string;
    label: string;
    hint: string;
    checked: boolean;
    onChange: (next: boolean) => void;
    data: Record<string, string>;
}

/* The whole row is the target, so the 24px switch still gets a 44px tap area. */
function ToggleRow({ id, label, hint, checked, onChange, data }: ToggleRowProps) {
    return (
        <div className="flex min-h-11 items-center justify-between gap-4">
            <Label htmlFor={id} className="min-w-0 flex-1 cursor-pointer py-1.5 font-normal">
                <span className="block text-sm font-medium text-foreground">{label}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{hint}</span>
            </Label>
            <Switch id={id} checked={checked} onCheckedChange={onChange} {...data} />
        </div>
    );
}

export function PdfToTextTool() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const rangeRef = useRef<HTMLInputElement>(null);
    const runToken = useRef(0);
    const stopRun = useRef<(() => void) | null>(null);
    const copiedTimer = useRef<number | undefined>(undefined);

    const [state, setState] = useState<State>("empty");
    const [failure, setFailure] = useState<Failure>("unreadable");
    const [stoppedNote, setStoppedNote] = useState(false);
    const [reading, setReading] = useState<{ name: string; done: number; total: number } | null>(null);
    const [doc, setDoc] = useState<OpenDocument | null>(null);

    const [mode, setMode] = useState<Mode>("all");
    const [rangeText, setRangeText] = useState("");
    const [rangeError, setRangeError] = useState<string | null>(null);
    const [rangePages, setRangePages] = useState<number[] | null>(null);
    const [pageBreaks, setPageBreaks] = useState(true);
    const [trim, setTrim] = useState(true);
    const [copied, setCopied] = useState(false);

    const pageCount = doc?.pages.length ?? 0;

    const stopCurrent = () => {
        runToken.current += 1;
        stopRun.current?.();
        stopRun.current = null;
    };

    /*
     * Each page is fetched, read and released before the next, with a yield in
     * between. The text is kept per page, so options re-assemble it without going
     * back to the PDF, and the pdf.js document is destroyed as soon as reading ends.
     */
    const read = useCallback(async (file: File) => {
        stopRun.current?.();
        const token = ++runToken.current;
        const alive = () => token === runToken.current;
        let destroy: (() => void) | null = null;

        setState("working");
        setStoppedNote(false);
        setReading({ name: file.name, done: 0, total: 0 });
        setCopied(false);

        try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            if (!alive()) return;
            if (!looksLikePdf(bytes)) {
                setDoc(null);
                setFailure("not-pdf");
                setState("error");
                return;
            }

            const pdfjs = await loadPdfJs();
            if (!alive()) return;
            const loading = pdfjs.getDocument({ data: bytes });
            destroy = () => void loading.destroy();
            stopRun.current = destroy;
            const pdf = await loading.promise;
            if (!alive()) return;

            const total = pdf.numPages;
            if (total === 0) {
                setDoc(null);
                setFailure("no-pages");
                setState("error");
                return;
            }
            setReading({ name: file.name, done: 0, total });

            const pages: ExtractedPage[] = [];
            for (let number = 1; number <= total; number++) {
                const page = await pdf.getPage(number);
                if (!alive()) return;
                const content = await page.getTextContent();
                page.cleanup();
                if (!alive()) return;
                const items = content.items.filter((item) => "str" in item) as unknown as PdfTextItem[];
                pages.push(extractPage(number, items));
                setReading({ name: file.name, done: number, total });
                await yieldToBrowser();
                if (!alive()) return;
            }

            setDoc({ file, pages });
            setMode("all");
            setRangeText("");
            setRangeError(null);
            setRangePages(null);
            setState("done");
        } catch (error) {
            if (!alive()) return;
            setDoc(null);
            if ((error as { name?: string } | null)?.name === "PasswordException") {
                setState("locked");
                return;
            }
            setFailure("unreadable");
            setState("error");
        } finally {
            destroy?.();
            if (alive()) {
                stopRun.current = null;
                setReading(null);
            }
        }
    }, []);

    useEffect(
        () => () => {
            runToken.current += 1;
            stopRun.current?.();
            window.clearTimeout(copiedTimer.current);
        },
        [],
    );

    const cancel = () => {
        stopCurrent();
        setReading(null);
        setDoc(null);
        setStoppedNote(true);
        setState("empty");
    };

    const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.files?.[0];
        event.target.value = "";
        if (next) void read(next);
    };

    const onDrop = (event: DragEvent<HTMLDivElement>) => {
        const next = event.dataTransfer.files?.[0];
        if (!next) return;
        event.preventDefault();
        void read(next);
    };

    const pickAnother = () => fileInputRef.current?.click();

    const onRange = (text: string) => {
        setRangeText(text);
        setMode("range");
        setCopied(false);
        const parsed = parsePageRange(text, pageCount);
        if (parsed.error !== undefined) {
            setRangeError(text.trim() === "" ? null : parsed.error);
            return;
        }
        setRangeError(null);
        setRangePages(parsed.pages);
    };

    const chooseMode = (next: Mode) => {
        setMode(next);
        setCopied(false);
        if (next === "range") window.setTimeout(() => rangeRef.current?.focus(), 0);
    };

    const chosen = useMemo(() => {
        if (!doc) return [];
        if (mode === "all" || !rangePages) return doc.pages;
        return rangePages.map((page) => doc.pages[page - 1]).filter(Boolean);
    }, [doc, mode, rangePages]);

    const text = useMemo(() => assembleText(chosen, { pageBreaks, trim }), [chosen, pageBreaks, trim]);
    const chars = useMemo(() => countCharacters(text), [text]);
    const words = useMemo(() => countWords(text), [text]);
    const scanned = useMemo(() => scannedPages(chosen), [chosen]);
    const wholeDocument = mode === "all" || !rangePages;
    const scanNote = scanMessage(scanned, chosen.length, wholeDocument);
    // A multi-megabyte <pre> takes a long frame to lay out, so the preview stops early.
    // Copy and Download always use the full text.
    const preview = useMemo(() => {
        if (text.length <= PREVIEW_LIMIT) return text;
        const cut = text.lastIndexOf("\n", PREVIEW_LIMIT);
        return text.slice(0, cut > 0 ? cut : PREVIEW_LIMIT);
    }, [text]);
    const previewCut = preview.length < text.length;
    const hasText = chosen.some((page) => !page.scanned && page.text.trim() !== "");
    const outName = doc ? textFileName(doc.file.name) : "";

    const flashCopied = () => {
        setCopied(true);
        window.clearTimeout(copiedTimer.current);
        copiedTimer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
    };

    const copy = async () => {
        if (!hasText) return;
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // Older browsers and some embedded views refuse the async API.
            const area = document.createElement("textarea");
            area.value = text;
            area.setAttribute("readonly", "");
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            const ok = document.execCommand("copy");
            area.remove();
            if (!ok) return;
        }
        flashCopied();
        markToolSuccess(text);
    };

    const download = () => {
        if (!hasText || !doc) return;
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = outName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        markToolSuccess(text);
    };

    const percent = reading && reading.total > 0 ? Math.round((reading.done / reading.total) * 100) : 0;
    const rangeHint = rangeError
        ? `${rangeError} ${rangePages ? "The text below still shows your last valid pages." : "The text below still shows every page."}`
        : mode === "range" && !rangePages
          ? "Type pages like 1-3, 5, 8-. Until then every page is shown."
          : null;

    return (
        <div
            data-p2t-state={state}
            className="mt-4 space-y-4"
            onDragOver={(event) => (state === "done" || state === "working") && event.preventDefault()}
            onDrop={state === "done" || state === "working" ? onDrop : undefined}
        >
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onPick} />

            {state === "empty" && (
                <div className="flex flex-col items-center gap-3 text-center">
                    {stoppedNote && (
                        <p className="text-sm text-muted-foreground" role="status">
                            Reading stopped. Nothing was kept, so choose the PDF again to start over.
                        </p>
                    )}
                    <p className="text-sm font-medium text-foreground">Your PDF never leaves your browser</p>
                    <ul className="flex flex-wrap justify-center gap-2">
                        {TRUST_CHIPS.map((chip) => (
                            <li key={chip} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                                {chip}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {state === "locked" && <LockedNotice />}

            {state === "error" && <ErrorPanel kind={failure} onRetry={pickAnother} />}

            {state === "working" && reading && (
                <div className="rounded-[14px] border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <p className="min-w-0 flex-1 truncate text-[15px] font-medium">{reading.name}</p>
                    </div>
                    <div
                        data-p2t-progress={reading.done}
                        role="progressbar"
                        aria-label="Reading the PDF"
                        aria-valuemin={0}
                        aria-valuemax={reading.total || 1}
                        aria-valuenow={reading.done}
                        className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]"
                    >
                        <div
                            className="h-full rounded-full bg-[var(--ochre)] transition-[width] duration-150 motion-reduce:transition-none"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <p className="font-mono text-xs text-muted-foreground" role="status" aria-live="polite">
                            {reading.total === 0
                                ? "Opening the PDF…"
                                : `Reading page ${Math.min(reading.done + 1, reading.total)} of ${reading.total}`}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 max-sm:w-full"
                            onClick={cancel}
                            data-p2t-cancel
                            data-analytics-label="cancel-extract"
                        >
                            <X aria-hidden="true" />
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {state === "done" && doc && (
                <div className="space-y-4">
                    <div className="rounded-[14px] border border-border bg-card shadow-[var(--shadow-soft)]">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[15px] font-medium">{doc.file.name}</p>
                                <p className="truncate font-mono text-xs text-muted-foreground">
                                    {plural(pageCount, "page")} · {formatBytes(doc.file.size)}
                                </p>
                            </div>
                            <Button variant="outline" className="h-11" onClick={pickAnother}>
                                Choose another
                            </Button>
                        </div>

                        <div className="grid gap-x-6 gap-y-4 border-t border-border px-4 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                            <fieldset className="min-w-0 space-y-2">
                                <legend className="mb-2 text-sm font-medium">Pages</legend>
                                <div className="flex flex-wrap gap-2">
                                    <div
                                        role="radiogroup"
                                        aria-label="Pages to copy"
                                        className="grid grid-cols-2 gap-1 rounded-[10px] border border-border bg-background p-1 max-sm:w-full"
                                    >
                                        {(
                                            [
                                                ["all", "Whole document"],
                                                ["range", "Page range"],
                                            ] as const
                                        ).map(([value, label]) => (
                                            <button
                                                key={value}
                                                type="button"
                                                role="radio"
                                                aria-checked={mode === value}
                                                data-p2t-mode={value}
                                                data-analytics-label={`mode-${value}`}
                                                onClick={() => chooseMode(value)}
                                                className={cn(
                                                    "h-11 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                    mode === value
                                                        ? "bg-foreground text-background"
                                                        : "text-muted-foreground hover:text-foreground",
                                                )}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <Label htmlFor="p2t-range" className="sr-only">
                                        Pages to copy
                                    </Label>
                                    <Input
                                        ref={rangeRef}
                                        id="p2t-range"
                                        data-p2t-range
                                        placeholder={pageCount > 1 ? `1-${Math.min(3, pageCount)}, ${pageCount}` : "1"}
                                        value={rangeText}
                                        onChange={(event) => onRange(event.target.value)}
                                        aria-invalid={Boolean(rangeError)}
                                        aria-describedby={rangeHint ? "p2t-range-hint" : undefined}
                                        className={cn(
                                            "h-11 min-w-[140px] flex-1 font-mono",
                                            mode === "all" && "text-muted-foreground",
                                        )}
                                        autoComplete="off"
                                        inputMode="text"
                                    />
                                </div>
                                {rangeHint && (
                                    <p
                                        id="p2t-range-hint"
                                        className={cn("text-xs leading-relaxed", rangeError ? "text-destructive" : "text-muted-foreground")}
                                        role={rangeError ? "alert" : undefined}
                                    >
                                        {rangeHint}
                                    </p>
                                )}
                            </fieldset>

                            <div className="min-w-0 space-y-1">
                                <ToggleRow
                                    id="p2t-breaks"
                                    label="Mark page breaks"
                                    hint="A --- Page N --- line before each page"
                                    checked={pageBreaks}
                                    onChange={(next) => {
                                        setPageBreaks(next);
                                        setCopied(false);
                                    }}
                                    data={{ "data-p2t-breaks": "" }}
                                />
                                <ToggleRow
                                    id="p2t-trim"
                                    label="Tidy whitespace"
                                    hint="Collapse extra spaces and blank lines"
                                    checked={trim}
                                    onChange={(next) => {
                                        setTrim(next);
                                        setCopied(false);
                                    }}
                                    data={{ "data-p2t-trim": "" }}
                                />
                            </div>
                        </div>
                    </div>

                    {scanNote && (
                        <div
                            data-p2t-scan
                            role="status"
                            className="flex items-start gap-3 rounded-[12px] border border-[color:var(--line-strong)] bg-[var(--drop-over)] px-4 py-3 text-sm leading-relaxed text-foreground"
                        >
                            <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ochre-ink)]" aria-hidden="true" />
                            <p className="min-w-0">{scanNote}</p>
                        </div>
                    )}

                    <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[var(--shadow-soft)]">
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-3">
                            <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
                                <span data-p2t-chars={chars} className="text-foreground">
                                    {chars.toLocaleString()}
                                </span>{" "}
                                character{chars === 1 ? "" : "s"} ·{" "}
                                <span data-p2t-words={words} className="text-foreground">
                                    {words.toLocaleString()}
                                </span>{" "}
                                word{words === 1 ? "" : "s"}
                            </p>
                            <div className="grid grid-cols-2 gap-2 max-sm:w-full sm:flex">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11"
                                    onClick={copy}
                                    disabled={!hasText}
                                    data-p2t-copy
                                    data-analytics-label="copy-text"
                                >
                                    {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                                    {copied ? "Copied" : "Copy text"}
                                </Button>
                                <Button
                                    type="button"
                                    className="h-11"
                                    onClick={download}
                                    disabled={!hasText}
                                    data-p2t-download
                                    data-analytics-label="download-txt"
                                >
                                    <Download aria-hidden="true" />
                                    Download .txt
                                </Button>
                            </div>
                        </div>
                        <pre
                            data-p2t-output
                            tabIndex={0}
                            aria-label="Extracted text"
                            className="max-h-[420px] min-h-[160px] overflow-auto whitespace-pre-wrap border-l-2 border-[color:var(--ring-soft)] bg-[var(--surface)] px-4 py-3 font-mono text-[13px] leading-[1.65] text-foreground [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        >
                            {preview}
                        </pre>
                        {previewCut && (
                            <p data-p2t-preview-cut className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                                The preview stops at {countCharacters(preview).toLocaleString("en-US")} characters. Copy and
                                Download include all {chars.toLocaleString("en-US")}.
                            </p>
                        )}
                        <p className="border-t border-border px-4 py-2 font-mono text-xs text-muted-foreground">
                            {hasText ? `Saves as ${outName}` : "No text to copy from the pages shown."}
                        </p>
                        <p data-p2t-columns className="border-t border-border px-4 py-2 text-xs leading-relaxed text-muted-foreground">
                            Pages laid out in two or more columns can come out row by row, with a line from each
                            column joined together. Check those parts before you paste them.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
