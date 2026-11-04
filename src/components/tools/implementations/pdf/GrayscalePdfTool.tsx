import { useEffect, useRef, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button, buttonVariants } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AlertTriangle, ArrowRight, Download, FileText, Info, Lock, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { loadPdfJs } from "@/lib/pdf/lazyPdf";
import {
    DEFAULT_DPI,
    DEFAULT_THRESHOLD,
    DPI_OPTIONS,
    compareSizes,
    formatBytes,
    grayscaleFileName,
    luminanceFromRgba,
    thresholdGray,
    type Dpi,
    type GrayMode,
} from "@/lib/pdf/grayscalePdf";
import { looksLikePdf } from "@/lib/pdfToText";
import { markToolSuccess } from "@/lib/toolResult";
import { cn } from "@/lib/utils";

type State = "empty" | "ready" | "working" | "done" | "error" | "locked";
type Failure = "not-pdf" | "unreadable" | "no-pages" | "convert";

interface Preview {
    width: number;
    height: number;
    rgba: Uint8ClampedArray;
    gray: Uint8Array;
}

interface Result {
    blob: Blob;
    dpi: Dpi;
    mode: GrayMode;
}

const TRUST_CHIPS = ["No upload", "Works offline once loaded", "Free"];
/** Preview thumbnails are 120 CSS px wide, drawn at 2x. */
const PREVIEW_PX = 240;

const MODES: ReadonlyArray<readonly [GrayMode, string, string]> = [
    ["gray", "Grayscale", "Every shade of gray, photos keep their detail"],
    ["bw", "Black & white", "Pure black or white, smallest and crispest for text"],
];

const plural = (count: number, noun: string) => `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;

function LockedNotice() {
    return (
        <div role="alert" className="rounded-[14px] border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                    <p className="text-[15px] font-medium text-foreground">This PDF is locked, so its pages cannot be converted yet.</p>
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
        body: "It does not start the way a PDF does, so there are no pages to convert. Pick a .pdf file, or save the document as PDF first.",
    },
    unreadable: {
        title: "This PDF could not be read.",
        body: "It may be damaged or cut short. Open it in a PDF viewer, save a fresh copy, and try that one.",
    },
    "no-pages": {
        title: "This PDF has no pages.",
        body: "There is nothing in it to convert.",
    },
    convert: {
        title: "The conversion stopped part way.",
        body: "A page could not be drawn, often because the device ran short of memory. Try again at 150 DPI, or split the file and convert it in parts.",
    },
};

function ErrorPanel({ kind, onRetry }: { kind: Failure; onRetry: () => void }) {
    const copy = FAILURE_COPY[kind];
    return (
        <div data-gs-error={kind} role="alert" className="rounded-[14px] border border-border bg-card p-4 sm:p-5">
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

interface SegmentedProps<T extends string | number> {
    label: string;
    value: T;
    options: ReadonlyArray<readonly [T, string]>;
    onChange: (next: T) => void;
    data: (value: T) => Record<string, string>;
}

function Segmented<T extends string | number>({ label, value, options, onChange, data }: SegmentedProps<T>) {
    return (
        <div
            role="group"
            aria-label={label}
            className="grid grid-cols-2 gap-1 rounded-[10px] border border-border bg-background p-1 md:max-w-[380px]"
        >
            {options.map(([option, text]) => (
                <button
                    key={String(option)}
                    type="button"
                    aria-pressed={value === option}
                    onClick={() => onChange(option)}
                    {...data(option)}
                    className={cn(
                        "h-11 min-w-0 truncate rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        value === option ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                    )}
                >
                    {text}
                </button>
            ))}
        </div>
    );
}

/** Page 1 before and after, drawn from the same small render. */
function BeforeAfter({ preview, mode, threshold }: { preview: Preview | null; mode: GrayMode; threshold: number }) {
    const beforeRef = useRef<HTMLCanvasElement>(null);
    const afterRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = beforeRef.current;
        if (!canvas || !preview) return;
        canvas.width = preview.width;
        canvas.height = preview.height;
        canvas.getContext("2d")?.putImageData(new ImageData(new Uint8ClampedArray(preview.rgba), preview.width, preview.height), 0, 0);
    }, [preview]);

    useEffect(() => {
        const canvas = afterRef.current;
        if (!canvas || !preview) return;
        canvas.width = preview.width;
        canvas.height = preview.height;
        const shades = mode === "bw" ? thresholdGray(preview.gray, threshold) : preview.gray;
        const image = new ImageData(preview.width, preview.height);
        for (let i = 0, p = 0; i < shades.length; i++, p += 4) {
            image.data[p] = image.data[p + 1] = image.data[p + 2] = shades[i];
            image.data[p + 3] = 255;
        }
        canvas.getContext("2d")?.putImageData(image, 0, 0);
    }, [preview, mode, threshold]);

    const ratio = preview ? `${preview.width} / ${preview.height}` : "17 / 22";
    const frame = "block w-full rounded-[6px] border border-border bg-white shadow-[var(--shadow-soft)]";

    return (
        <figure data-gs-preview className="m-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <div className="min-w-0">
                    <canvas ref={beforeRef} className={frame} style={{ aspectRatio: ratio }} aria-hidden="true" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                    <canvas ref={afterRef} className={frame} style={{ aspectRatio: ratio }} aria-hidden="true" />
                </div>
            </div>
            <figcaption className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 font-mono text-[11px] text-muted-foreground">
                <span className="text-center">Page 1 now</span>
                <span className="w-4" aria-hidden="true" />
                <span className="text-center">{mode === "bw" ? `Black & white at ${threshold}` : "Grayscale"}</span>
            </figcaption>
        </figure>
    );
}

export function GrayscalePdfTool() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const runToken = useRef(0);
    const docRef = useRef<{ pdf: PDFDocumentProxy | null; destroy: () => void } | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const [state, setState] = useState<State>("empty");
    const [failure, setFailure] = useState<Failure>("unreadable");
    const [opening, setOpening] = useState(false);
    const [stoppedNote, setStoppedNote] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [dpi, setDpi] = useState<Dpi>(DEFAULT_DPI);
    const [mode, setMode] = useState<GrayMode>("gray");
    const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [result, setResult] = useState<Result | null>(null);

    const closeDoc = () => {
        docRef.current?.destroy();
        docRef.current = null;
    };

    const stopAll = () => {
        runToken.current += 1;
        abortRef.current?.abort();
        abortRef.current = null;
        closeDoc();
    };

    /** Opens `file` with pdf.js and keeps the document for the conversion. */
    const openDocument = async (source: File, alive: () => boolean): Promise<PDFDocumentProxy | null> => {
        const pdfjs = await loadPdfJs();
        if (!alive()) return null;
        const bytes = new Uint8Array(await source.arrayBuffer());
        if (!alive()) return null;
        const loading = pdfjs.getDocument({ data: bytes });
        const handle = { pdf: null as PDFDocumentProxy | null, destroy: () => void loading.destroy() };
        docRef.current = handle;
        const pdf = await loading.promise;
        if (!alive()) return null;
        handle.pdf = pdf;
        return pdf;
    };

    const renderPreview = async (pdf: PDFDocumentProxy, alive: () => boolean) => {
        const page = await pdf.getPage(1);
        if (!alive()) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: PREVIEW_PX / base.width });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        try {
            const context = canvas.getContext("2d", { willReadFrequently: true });
            if (!context) return;
            await page.render({ canvas, canvasContext: context, viewport }).promise;
            if (!alive()) return;
            const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
            const gray = luminanceFromRgba(rgba, canvas.width * canvas.height);
            setPreview({ width: canvas.width, height: canvas.height, rgba, gray });
        } finally {
            canvas.width = 0;
            canvas.height = 0;
            page.cleanup();
        }
    };

    const open = async (next: File) => {
        stopAll();
        const token = runToken.current;
        const alive = () => token === runToken.current;

        setOpening(true);
        setStoppedNote(false);
        setResult(null);
        setPreview(null);
        setFile(null);
        setState("empty");

        try {
            const head = new Uint8Array(await next.slice(0, 1024).arrayBuffer());
            if (!alive()) return;
            if (!looksLikePdf(head)) {
                setFailure("not-pdf");
                setState("error");
                return;
            }
            const pdf = await openDocument(next, alive);
            if (!pdf) return;
            if (pdf.numPages === 0) {
                closeDoc();
                setFailure("no-pages");
                setState("error");
                return;
            }
            setFile(next);
            setPageCount(pdf.numPages);
            setState("ready");
            // The preview is a nicety: a page that will not draw small still gets converted.
            renderPreview(pdf, alive).catch(() => undefined);
        } catch (error) {
            if (!alive()) return;
            closeDoc();
            if ((error as { name?: string } | null)?.name === "PasswordException") {
                setState("locked");
                return;
            }
            setFailure("unreadable");
            setState("error");
        } finally {
            if (alive()) setOpening(false);
        }
    };

    useEffect(
        () => () => {
            runToken.current += 1;
            abortRef.current?.abort();
            docRef.current?.destroy();
        },
        [],
    );

    const convert = async () => {
        if (!file) return;
        abortRef.current?.abort();
        const token = ++runToken.current;
        const alive = () => token === runToken.current;
        const controller = new AbortController();
        abortRef.current = controller;

        setStoppedNote(false);
        setResult(null);
        setProgress({ done: 0, total: pageCount });
        setState("working");

        try {
            // Cancel and a finished run both close the document, so a second run reopens it.
            const pdf = docRef.current?.pdf ?? (await openDocument(file, alive));
            if (!pdf || !alive()) return;
            const { convertToGrayscale } = await import("@/lib/pdf/grayscaleClient");
            if (!alive()) return;
            const blob = await convertToGrayscale(pdf, {
                dpi,
                encode: { mode, threshold },
                signal: controller.signal,
                onProgress: (done, total) => {
                    if (alive()) setProgress({ done, total });
                },
            });
            if (!alive()) return;
            closeDoc();
            setResult({ blob, dpi, mode });
            setState("done");
        } catch (error) {
            if (!alive() || controller.signal.aborted) return;
            closeDoc();
            if ((error as { name?: string } | null)?.name === "PasswordException") {
                setState("locked");
                return;
            }
            setFailure("convert");
            setState("error");
        } finally {
            if (abortRef.current === controller) abortRef.current = null;
        }
    };

    const cancel = () => {
        stopAll();
        setProgress({ done: 0, total: 0 });
        setStoppedNote(true);
        setState("ready");
    };

    const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.files?.[0];
        event.target.value = "";
        if (next) void open(next);
    };

    const onDrop = (event: DragEvent<HTMLDivElement>) => {
        const next = event.dataTransfer.files?.[0];
        if (!next) return;
        event.preventDefault();
        void open(next);
    };

    const pickAnother = () => fileInputRef.current?.click();

    const reset = () => {
        stopAll();
        setResult(null);
        setPreview(null);
        setFile(null);
        setPageCount(0);
        setStoppedNote(false);
        setState("empty");
        pickAnother();
    };

    const adjust = () => {
        setResult(null);
        setState("ready");
    };

    const download = () => {
        if (!result || !file) return;
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = grayscaleFileName(file.name);
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        // Keyed by the blob: a second download of this result is the same run.
        markToolSuccess(result.blob);
    };

    const fileCard = file && (
        <div className="flex items-center gap-3 px-4 py-3">
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{file.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                    <span data-gs-pages={pageCount}>{plural(pageCount, "page")}</span> · {formatBytes(file.size)}
                </p>
            </div>
            {state === "ready" && (
                <Button variant="outline" className="h-11 shrink-0" onClick={pickAnother}>
                    Choose another
                </Button>
            )}
        </div>
    );

    const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    const comparison = result && file ? compareSizes(file.size, result.blob.size) : null;
    const dropEnabled = state === "ready" || state === "done";

    return (
        <div
            data-gs-state={state}
            className="mt-4 space-y-4"
            onDragOver={(event) => dropEnabled && event.preventDefault()}
            onDrop={dropEnabled ? onDrop : undefined}
        >
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onPick} />

            {state === "empty" && (
                <div className="flex flex-col items-center gap-3 text-center" aria-busy={opening}>
                    {opening ? (
                        <p className="font-mono text-xs text-muted-foreground" role="status">
                            Opening the PDF…
                        </p>
                    ) : (
                        <>
                            <p className="text-sm font-medium text-foreground">Your PDF never leaves your browser</p>
                            <ul className="flex flex-wrap justify-center gap-2">
                                {TRUST_CHIPS.map((chip) => (
                                    <li key={chip} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                                        {chip}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            )}

            {state === "locked" && <LockedNotice />}

            {state === "error" && <ErrorPanel kind={failure} onRetry={pickAnother} />}

            {state === "ready" && file && (
                <div className="space-y-4">
                    {stoppedNote && (
                        <p className="text-sm text-muted-foreground" role="status">
                            Stopped. Nothing was saved; your settings are still here.
                        </p>
                    )}
                    <div className="rounded-[14px] border border-border bg-card shadow-[var(--shadow-soft)]">
                        {fileCard}

                        <div className="grid gap-x-8 gap-y-5 border-t border-border px-4 py-4 md:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="min-w-0 space-y-5">
                                <fieldset className="min-w-0">
                                    <legend className="mb-2 text-sm font-medium">Quality</legend>
                                    <Segmented<Dpi>
                                        label="Quality"
                                        value={dpi}
                                        options={DPI_OPTIONS.map((value) => [value, `${value} DPI`] as const)}
                                        onChange={setDpi}
                                        data={(value) => ({ "data-gs-dpi": String(value), "data-analytics-label": `dpi-${value}` })}
                                    />
                                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                        {dpi === 150
                                            ? "Sharp on paper for everyday documents, and a smaller file."
                                            : "For fine print and small type. Pages hold four times the pixels, so files grow."}
                                    </p>
                                </fieldset>

                                <fieldset className="min-w-0">
                                    <legend className="mb-2 text-sm font-medium">Mode</legend>
                                    <Segmented<GrayMode>
                                        label="Mode"
                                        value={mode}
                                        options={MODES.map(([value, text]) => [value, text] as const)}
                                        onChange={setMode}
                                        data={(value) => ({ "data-gs-mode": value, "data-analytics-label": `mode-${value}` })}
                                    />
                                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                        {MODES.find(([value]) => value === mode)?.[2]}.
                                    </p>
                                </fieldset>

                                {mode === "bw" && (
                                    <div className="min-w-0">
                                        <div className="mb-1 flex items-baseline justify-between gap-3">
                                            <span id="gs-threshold-label" className="text-sm font-medium">
                                                Threshold
                                            </span>
                                            <span className="font-mono text-xs tabular-nums text-foreground" aria-live="polite">
                                                {threshold}
                                            </span>
                                        </div>
                                        <Slider
                                            data-gs-threshold={threshold}
                                            aria-labelledby="gs-threshold-label"
                                            min={0}
                                            max={255}
                                            step={1}
                                            value={[threshold]}
                                            onValueChange={([next]) => setThreshold(next)}
                                            className="h-11"
                                        />
                                        <p className="text-xs leading-relaxed text-muted-foreground">
                                            Shades lighter than this turn white. Raise it if faint text drops out; lower it if
                                            backgrounds turn black.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 max-md:mx-auto max-md:w-full max-md:max-w-[300px]">
                                <BeforeAfter preview={preview} mode={mode} threshold={threshold} />
                            </div>
                        </div>
                    </div>

                    <div
                        data-gs-text-warning
                        className="flex items-start gap-3 rounded-[12px] border border-[color:var(--line-strong)] bg-[var(--drop-over)] px-4 py-3 text-sm leading-relaxed text-foreground"
                    >
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ochre-ink)]" aria-hidden="true" />
                        <p className="min-w-0">
                            Each page becomes a picture, so text can no longer be selected or searched, and links and form
                            fields will not carry over. Need to copy anything first?{" "}
                            <Link to="/pdf-to-text" className="font-medium text-foreground underline underline-offset-2">
                                Take the text out with PDF to Text
                            </Link>
                            .
                        </p>
                    </div>

                    <Button
                        type="button"
                        className="h-12 w-full text-[15px]"
                        onClick={convert}
                        data-gs-convert
                        data-analytics-label="convert-grayscale"
                    >
                        {mode === "bw" ? "Convert to black & white" : "Convert to grayscale"}
                    </Button>
                </div>
            )}

            {state === "working" && file && (
                <div className="rounded-[14px] border border-border bg-card shadow-[var(--shadow-soft)]">
                    {fileCard}
                    <div className="border-t border-border px-4 py-4">
                        <div
                            data-gs-progress
                            data-gs-current={progress.done}
                            data-gs-total={progress.total}
                            role="progressbar"
                            aria-label="Converting the PDF"
                            aria-valuemin={0}
                            aria-valuemax={progress.total || 1}
                            aria-valuenow={progress.done}
                            className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]"
                        >
                            <div
                                className="h-full rounded-full bg-[var(--ochre)] transition-[width] duration-150 motion-reduce:transition-none"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                            <p className="font-mono text-xs text-muted-foreground" role="status" aria-live="polite">
                                {progress.done >= progress.total && progress.total > 0
                                    ? "Writing the PDF…"
                                    : `Converting page ${Math.min(progress.done + 1, progress.total)} of ${progress.total}`}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 max-sm:w-full"
                                onClick={cancel}
                                data-gs-cancel
                                data-analytics-label="cancel-grayscale"
                            >
                                <X aria-hidden="true" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {state === "done" && file && result && comparison && (
                <div className="space-y-4">
                    <div className="rounded-[14px] border border-border bg-card shadow-[var(--shadow-soft)]">
                        <div className="grid gap-x-8 gap-y-5 px-4 py-4 md:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="min-w-0">
                                <p className="text-[15px] font-medium text-foreground">
                                    {result.mode === "bw" ? "Black & white PDF ready" : "Grayscale PDF ready"}
                                </p>
                                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                                    {grayscaleFileName(file.name)}
                                </p>
                                <p className="mt-4 font-mono text-sm tabular-nums text-foreground" aria-live="polite">
                                    <span data-gs-insize={file.size}>{formatBytes(file.size)}</span>
                                    {" → "}
                                    <span data-gs-outsize={result.blob.size}>{formatBytes(result.blob.size)}</span>
                                </p>
                                <p
                                    data-gs-change={comparison.change}
                                    className={cn(
                                        "mt-1 text-sm",
                                        comparison.change === "larger" ? "text-[color:var(--ochre-ink)]" : "text-muted-foreground",
                                    )}
                                >
                                    {comparison.delta} · {plural(pageCount, "page")} at {result.dpi} DPI
                                </p>
                                <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
                                    <Button
                                        type="button"
                                        className="h-11"
                                        onClick={download}
                                        data-gs-download
                                        data-analytics-label="download-grayscale"
                                    >
                                        <Download aria-hidden="true" />
                                        Download PDF
                                    </Button>
                                    <Button type="button" variant="outline" className="h-11" onClick={adjust} data-gs-adjust>
                                        <SlidersHorizontal aria-hidden="true" />
                                        Change settings
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-11"
                                        onClick={reset}
                                        data-gs-reset
                                        data-analytics-label="convert-another"
                                    >
                                        <RotateCcw aria-hidden="true" />
                                        Convert another
                                    </Button>
                                </div>
                            </div>
                            <div className="min-w-0 max-md:mx-auto max-md:w-full max-md:max-w-[300px]">
                                <BeforeAfter preview={preview} mode={result.mode} threshold={threshold} />
                            </div>
                        </div>
                    </div>

                    {comparison.change === "larger" && (
                        <div
                            data-gs-larger
                            role="status"
                            className="flex items-start gap-3 rounded-[12px] border border-[color:var(--line-strong)] bg-[var(--drop-over)] px-4 py-3 text-sm leading-relaxed text-foreground"
                        >
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ochre-ink)]" aria-hidden="true" />
                            <div className="min-w-0 space-y-1.5">
                                <p className="font-medium">This copy is larger than the original.</p>
                                <p className="text-muted-foreground">
                                    A PDF made of text stores words as a few bytes each; here every page is now a picture of
                                    those words.{" "}
                                    {result.dpi === 300 && result.mode === "gray"
                                        ? "Try 150 DPI or Black & white, which keeps one bit per pixel."
                                        : result.dpi === 300
                                          ? "Try 150 DPI for a quarter of the pixels."
                                          : result.mode === "gray"
                                            ? "Black & white keeps one bit per pixel and is usually far smaller."
                                            : "This is close to the smallest a picture of each page gets."}{" "}
                                    If you only need a gray printout, the Grayscale option in your print dialog keeps the
                                    original file as it is. To fit an upload limit, try{" "}
                                    <Link to="/pdf-compress" className="font-medium text-foreground underline underline-offset-2">
                                        PDF Compress
                                    </Link>
                                    .
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
