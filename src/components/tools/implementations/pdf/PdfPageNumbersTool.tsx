import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { PDFDocument } from "pdf-lib";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Download, FileText, Loader2 } from "lucide-react";
import { downloadPdf, pdfDownloadName } from "@/lib/pdf/downloadPdf";
import { markToolSuccess } from "@/lib/toolResult";
import { loadPdfJs, loadPdfLib } from "@/lib/pdf/lazyPdf";
import {
    DEFAULT_OPTIONS,
    LIMITS,
    NUMBER_FORMATS,
    NUMBER_POSITIONS,
    PdfOpenError,
    clampInt,
    formatPageLabel,
    numberPdf,
    openPdf,
    parsePageRange,
    planNumbering,
    previewPdf,
    type NumberFormat,
    type NumberPosition,
    type OpenFailure,
    type PageNumberOptions,
} from "@/lib/pdf/pageNumbers";
import { cn } from "@/lib/utils";

const FORMAT_LABEL: Record<NumberFormat, string> = {
    n: "1",
    "page-n": "Page 1",
    "n-of-total": "1 of N",
    "page-n-of-total": "Page 1 of N",
};

const POSITION_LABEL: Record<NumberPosition, string> = {
    "top-left": "Top left",
    "top-center": "Top center",
    "top-right": "Top right",
    "bottom-left": "Bottom left",
    "bottom-center": "Bottom center",
    "bottom-right": "Bottom right",
};

const PREVIEW_DEBOUNCE_MS = 200;

function formatBytes(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function OpenError({ kind }: { kind: OpenFailure }) {
    return (
        <div role="alert" className="rounded-[14px] border border-border bg-card px-4 py-3 text-sm leading-relaxed">
            {kind === "encrypted" ? (
                <>
                    <p className="font-medium text-foreground">This PDF is password-protected or restricted.</p>
                    <p className="mt-1 text-muted-foreground">
                        Numbers cannot be added to a locked file without breaking it. If you know the password, remove it
                        with{" "}
                        <Link to="/pdf-unlock" className="font-medium text-foreground underline underline-offset-2">
                            Unlock PDF
                        </Link>
                        , then open the unlocked copy here.
                    </p>
                </>
            ) : kind === "empty" ? (
                <p className="font-medium text-foreground">This PDF has no pages to number.</p>
            ) : (
                <>
                    <p className="font-medium text-foreground">This file could not be read as a PDF.</p>
                    <p className="mt-1 text-muted-foreground">
                        It may be damaged, or not a PDF at all. If it is password-protected, try{" "}
                        <Link to="/pdf-unlock" className="font-medium text-foreground underline underline-offset-2">
                            Unlock PDF
                        </Link>{" "}
                        first.
                    </p>
                </>
            )}
        </div>
    );
}

export function PdfPageNumbersTool() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sourceRef = useRef<PDFDocument | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [bytes, setBytes] = useState<Uint8Array | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [openError, setOpenError] = useState<OpenFailure | null>(null);
    const [opening, setOpening] = useState(false);
    const [options, setOptions] = useState<PageNumberOptions>(DEFAULT_OPTIONS);
    const [startText, setStartText] = useState(String(DEFAULT_OPTIONS.startAt));
    const [previewSlot, setPreviewSlot] = useState(0);
    const [previewState, setPreviewState] = useState<"idle" | "drawing" | "ready" | "failed">("idle");
    const [busy, setBusy] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [result, setResult] = useState<{ pages: number; ms: number; size: number } | null>(null);

    const set = <K extends keyof PageNumberOptions>(key: K, value: PageNumberOptions[K]) => {
        setOptions((prev) => ({ ...prev, [key]: value }));
        setResult(null);
    };

    const parsed = useMemo(
        () => (pageCount ? parsePageRange(options.range, pageCount) : null),
        [options.range, pageCount],
    );
    const plan = useMemo(
        () => (parsed?.ok ? planNumbering(parsed.range, options.startAt, options.format) : null),
        [parsed, options.startAt, options.format],
    );
    const slot = plan ? Math.min(previewSlot, plan.labels.length - 1) : 0;
    const previewEntry = plan?.labels[slot];
    const skipFirst = parsed?.ok ? parsed.range.first === 2 : false;

    const onPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.files?.[0];
        event.target.value = "";
        if (!next) return;
        setOpening(true);
        setOpenError(null);
        setSaveError(null);
        setResult(null);
        try {
            const data = new Uint8Array(await next.arrayBuffer());
            const lib = await loadPdfLib();
            const doc = await openPdf(lib, data);
            sourceRef.current = doc;
            setFile(next);
            setBytes(data);
            setPageCount(doc.getPageCount());
            setPreviewSlot(0);
        } catch (error) {
            sourceRef.current = null;
            setFile(next);
            setBytes(null);
            setPageCount(0);
            setOpenError(error instanceof PdfOpenError ? error.kind : "invalid");
        } finally {
            setOpening(false);
        }
    };

    // Preview: a copy of one page, numbered by the same code as the download, rendered by pdf.js.
    useEffect(() => {
        const source = sourceRef.current;
        const canvas = canvasRef.current;
        if (!source || !canvas || !previewEntry) return;
        let cancelled = false;
        setPreviewState("drawing");
        const timer = window.setTimeout(async () => {
            try {
                const lib = await loadPdfLib();
                const data = await previewPdf(lib, source, options, previewEntry.pageIndex);
                const pdfjs = await loadPdfJs();
                const pdf = await pdfjs.getDocument({ data }).promise;
                try {
                    const page = await pdf.getPage(1);
                    const base = page.getViewport({ scale: 1 });
                    const box = canvas.parentElement?.clientWidth || 320;
                    const fit = Math.min(box / base.width, 420 / base.height);
                    const ratio = Math.min(2, window.devicePixelRatio || 1);
                    const viewport = page.getViewport({ scale: fit * ratio });
                    if (cancelled) return;
                    const scratch = document.createElement("canvas");
                    scratch.width = Math.floor(viewport.width);
                    scratch.height = Math.floor(viewport.height);
                    const context = scratch.getContext("2d");
                    if (!context) throw new Error("No canvas");
                    await page.render({ canvasContext: context, viewport, canvas: scratch }).promise;
                    if (cancelled) return;
                    // Swap in one step so a slow render never shows half a page.
                    canvas.width = scratch.width;
                    canvas.height = scratch.height;
                    canvas.style.width = `${Math.round(viewport.width / ratio)}px`;
                    canvas.getContext("2d")?.drawImage(scratch, 0, 0);
                    setPreviewState("ready");
                } finally {
                    await pdf.destroy();
                }
            } catch {
                if (!cancelled) setPreviewState("failed");
            }
        }, PREVIEW_DEBOUNCE_MS);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [options, previewEntry, bytes]);

    const save = async () => {
        if (!file || !bytes || !plan) return;
        setBusy(true);
        setSaveError(null);
        try {
            const started = performance.now();
            const lib = await loadPdfLib();
            const out = await numberPdf(lib, bytes, options);
            const ms = Math.round(performance.now() - started);
            downloadPdf(out.bytes, pdfDownloadName(file.name, "numbered"));
            markToolSuccess(out.bytes);
            setResult({ pages: out.plan.labels.length, ms, size: out.bytes.length });
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : "The numbered copy could not be written.");
        } finally {
            setBusy(false);
        }
    };

    const onStart = (text: string) => {
        setStartText(text);
        if (text.trim() === "") return;
        set("startAt", clampInt(Number(text), LIMITS.startAt.min, LIMITS.startAt.max));
    };

    const onSkipFirst = (checked: boolean) => {
        if (!parsed?.ok) {
            set("range", checked ? "2-" : "");
            return;
        }
        const tail = parsed.range.last < pageCount ? String(parsed.range.last) : "";
        set("range", checked ? `2-${tail}` : tail ? `1-${tail}` : "");
    };

    const total = plan?.total ?? 0;
    const example = plan ? formatPageLabel(options.format, plan.labels[0].number, total) : "";

    return (
        <div className="mt-6 space-y-4">
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onPdf} />

            {opening && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                    <Loader2 className="h-4 w-4 animate-spin" /> Reading the PDF…
                </p>
            )}

            {file && (
                <div className="flex items-center gap-3 rounded-[14px] border border-border bg-card px-4 py-3">
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{file.name}</p>
                        {pageCount > 0 && (
                            <p className="font-mono text-xs text-muted-foreground">
                                {pageCount} page{pageCount === 1 ? "" : "s"} · {formatBytes(file.size)}
                            </p>
                        )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        Choose another
                    </Button>
                </div>
            )}

            {openError && <OpenError kind={openError} />}

            {file && pageCount > 0 && (
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
                    <div className="space-y-5 rounded-[14px] border border-border bg-card p-4 sm:p-5">
                        <fieldset>
                            <legend className="mb-2 text-sm font-medium">Position</legend>
                            <div
                                role="radiogroup"
                                aria-label="Position"
                                className="grid w-full max-w-[264px] grid-cols-3 gap-1.5 rounded-[10px] border border-border bg-background p-1.5"
                            >
                                {NUMBER_POSITIONS.map((position) => {
                                    const active = options.position === position;
                                    const [vertical, horizontal] = position.split("-");
                                    return (
                                        <button
                                            key={position}
                                            type="button"
                                            role="radio"
                                            aria-checked={active}
                                            aria-label={POSITION_LABEL[position]}
                                            title={POSITION_LABEL[position]}
                                            data-analytics-label={`position-${position}`}
                                            onClick={() => set("position", position)}
                                            className={cn(
                                                "flex h-11 rounded-md border px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                vertical === "top" ? "items-start" : "items-end",
                                                horizontal === "left" ? "justify-start" : horizontal === "right" ? "justify-end" : "justify-center",
                                                active
                                                    ? "border-foreground bg-foreground text-background"
                                                    : "border-border bg-card text-muted-foreground hover:border-[var(--line-strong)] hover:text-foreground",
                                            )}
                                        >
                                            <span className="font-mono text-[11px] leading-none">1</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="pn-format">Format</Label>
                                <Select value={options.format} onValueChange={(value) => set("format", value as NumberFormat)}>
                                    <SelectTrigger id="pn-format">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {NUMBER_FORMATS.map((format) => (
                                            <SelectItem key={format} value={format}>
                                                {FORMAT_LABEL[format]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pn-start">Start at</Label>
                                <Input
                                    id="pn-start"
                                    type="number"
                                    inputMode="numeric"
                                    min={LIMITS.startAt.min}
                                    max={LIMITS.startAt.max}
                                    value={startText}
                                    onChange={(event) => onStart(event.target.value)}
                                    onBlur={() => setStartText(String(options.startAt))}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="pn-skip" className="font-normal">
                                    Leave the first page unnumbered
                                </Label>
                                <Switch id="pn-skip" checked={skipFirst} onCheckedChange={onSkipFirst} disabled={pageCount < 2} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pn-range">Pages to number</Label>
                                <Input
                                    id="pn-range"
                                    placeholder={`All (1-${pageCount})`}
                                    value={options.range}
                                    onChange={(event) => set("range", event.target.value)}
                                    aria-invalid={parsed?.ok === false}
                                    aria-describedby="pn-range-hint"
                                    className="font-mono"
                                />
                                <p id="pn-range-hint" className={cn("text-xs", parsed?.ok === false ? "text-destructive" : "text-muted-foreground")}>
                                    {parsed?.ok === false
                                        ? parsed.error
                                        : plan
                                          ? `Pages ${parsed?.ok ? `${parsed.range.first}–${parsed.range.last}` : ""} get ${plan.labels[0].number}–${total}. N is the last number shown, ${total}.`
                                          : null}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label>Font size</Label>
                                    <span className="font-mono text-xs text-muted-foreground">{options.fontSize} pt</span>
                                </div>
                                <Slider
                                    aria-label="Font size"
                                    value={[options.fontSize]}
                                    onValueChange={([value]) => set("fontSize", value)}
                                    min={LIMITS.fontSize.min}
                                    max={LIMITS.fontSize.max}
                                    step={1}
                                />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label>Margin</Label>
                                    <span className="font-mono text-xs text-muted-foreground">{options.margin} pt</span>
                                </div>
                                <Slider
                                    aria-label="Margin"
                                    value={[options.margin]}
                                    onValueChange={([value]) => set("margin", value)}
                                    min={LIMITS.margin.min}
                                    max={LIMITS.margin.max}
                                    step={2}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 border-t border-border pt-4">
                            <Button
                                type="button"
                                onClick={save}
                                disabled={busy || !plan}
                                className="h-11 w-full"
                                data-analytics-label="download-numbered-pdf"
                            >
                                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                {plan ? `Number ${plan.labels.length} page${plan.labels.length === 1 ? "" : "s"} and download` : "Download numbered PDF"}
                            </Button>
                            {result && (
                                <p className="font-mono text-xs text-muted-foreground" role="status">
                                    Numbered {result.pages} page{result.pages === 1 ? "" : "s"} in {result.ms} ms ·{" "}
                                    {formatBytes(result.size)} · {pdfDownloadName(file.name, "numbered")}
                                </p>
                            )}
                            {saveError && (
                                <p className="text-xs text-destructive" role="alert">
                                    {saveError}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="order-first space-y-3 rounded-[14px] border border-border bg-card p-4 md:order-none">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">Preview</p>
                            {plan && plan.labels.length > 1 && (
                                <div className="flex items-center gap-1">
                                    {/* Plain buttons: Button's double-click guard would drop quick paging. */}
                                    <button
                                        type="button"
                                        className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}
                                        aria-label="Previous numbered page"
                                        disabled={slot === 0}
                                        onClick={() => setPreviewSlot((current) => Math.max(0, Math.min(current, plan.labels.length - 1) - 1))}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="min-w-[4.5rem] text-center font-mono text-xs text-muted-foreground">
                                        p. {previewEntry ? previewEntry.pageIndex + 1 : "–"} / {pageCount}
                                    </span>
                                    <button
                                        type="button"
                                        className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}
                                        aria-label="Next numbered page"
                                        disabled={slot >= plan.labels.length - 1}
                                        onClick={() => setPreviewSlot((current) => Math.min(plan.labels.length - 1, current + 1))}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="relative mx-auto flex max-w-[260px] justify-center md:max-w-none">
                            <canvas
                                ref={canvasRef}
                                className={cn(
                                    "block h-auto max-h-[420px] w-auto max-w-full border border-border bg-white shadow-[var(--shadow-soft)]",
                                    previewState !== "ready" && "min-h-[160px] min-w-[120px]",
                                )}
                                aria-label={previewEntry ? `Page ${previewEntry.pageIndex + 1} with “${previewEntry.label}” drawn on it` : "Preview"}
                                role="img"
                            />
                            {previewState === "drawing" && (
                                <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
                            )}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            {previewState === "failed"
                                ? "This page could not be drawn here. The download is not affected."
                                : previewEntry
                                  ? `Shows “${previewEntry.label}” as this page will print it, rotation and crop included. First label: ${example}.`
                                  : "Pick a valid range to see a preview."}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
