import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, Loader2, Lock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadPdf } from "@/lib/pdf/downloadPdf";
import { loadPdfJs, loadPdfLib } from "@/lib/pdf/lazyPdf";
import {
    deletePages,
    editedFileName,
    evenPages,
    formatRange,
    keptPages,
    oddPages,
    parseRange,
} from "@/lib/pdf/deletePages";
import { PdfOpenError, openPdf, pageGeometry, visualSize } from "@/lib/pdf/pageNumbers";
import { createThumbnailQueue } from "@/lib/pdf/thumbnailQueue";
import { markToolSuccess } from "@/lib/toolResult";
import { cn } from "@/lib/utils";

/** CSS width a thumbnail is drawn for. The backing image is up to 1.5 times that. */
const THUMB_WIDTH = 160;
const THUMB_CONCURRENCY = 2;
const THUMB_QUALITY = 0.72;
/** Starts a page before it scrolls in, so a steady scroll rarely meets a blank card. */
const THUMB_MARGIN = "400px 0px";
/** Screen readers hear thumbnail progress in steps of this many pages. */
const ANNOUNCE_STEP = 25;

const TRUST_CHIPS = ["No upload", "Works offline once loaded", "Free"];

const STRIKE: CSSProperties = {
    backgroundImage:
        "linear-gradient(to top right, transparent calc(50% - 1px), var(--delete) calc(50% - 1px), var(--delete) calc(50% + 1px), transparent calc(50% + 1px))",
};

interface OpenDocument {
    file: File;
    /** Width over height of each page as displayed, clamped so one odd page cannot break the row. */
    ratios: number[];
}

function formatBytes(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

const plural = (count: number) => `${count} page${count === 1 ? "" : "s"}`;

function LockedNotice() {
    return (
        <div role="alert" className="rounded-[14px] border border-border bg-card p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0">
                    <p className="text-[15px] font-medium text-foreground">This PDF is locked, so its pages cannot be changed yet.</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        It has a password or editing restrictions. Remove them with the password you already have, then
                        bring the unlocked copy back here.
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

interface PageCardProps {
    page: number;
    ratio: number;
    thumb?: string;
    selected: boolean;
    onToggle: (page: number) => void;
}

/* A plain button: Button's double-click guard would drop quick marking. */
const PageCard = memo(function PageCard({ page, ratio, thumb, selected, onToggle }: PageCardProps) {
    return (
        <button
            type="button"
            data-page={page - 1}
            aria-pressed={selected}
            aria-label={`Delete page ${page}`}
            data-analytics-label="toggle-page"
            onClick={() => onToggle(page)}
            className="group flex flex-col gap-2 rounded-[10px] p-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
            <span
                style={{ aspectRatio: ratio }}
                className={cn(
                    "relative block w-full overflow-hidden rounded-[6px] border bg-white shadow-[0_1px_3px_rgba(28,25,21,0.12)] transition-[transform,border-color,box-shadow] duration-150 group-hover:-translate-y-0.5 group-hover:shadow-[0_4px_10px_rgba(28,25,21,0.14)] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0",
                    selected ? "border-[color:var(--delete)] ring-2 ring-[color:var(--delete)]" : "border-border",
                )}
            >
                {thumb ? (
                    <img
                        src={thumb}
                        alt=""
                        draggable={false}
                        className={cn(
                            "h-full w-full object-contain transition-opacity duration-150 motion-reduce:transition-none",
                            selected && "opacity-40",
                        )}
                    />
                ) : (
                    <span className="absolute inset-0 grid place-items-center font-mono text-sm text-neutral-400">{page}</span>
                )}
                {selected && (
                    <>
                        <span className="absolute inset-0 bg-[var(--delete-soft)]" style={STRIKE} aria-hidden="true" />
                        <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[var(--delete)] text-white shadow-sm" aria-hidden="true">
                            <X className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                    </>
                )}
            </span>
            <span
                className={cn(
                    "font-mono text-xs",
                    selected ? "text-[color:var(--delete)] line-through" : "text-muted-foreground",
                )}
            >
                Page {page}
            </span>
        </button>
    );
});

export function PdfDeletePagesTool() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<HTMLDivElement>(null);
    const openToken = useRef(0);
    const { toast, dismiss } = useToast();

    const [doc, setDoc] = useState<OpenDocument | null>(null);
    const [locked, setLocked] = useState(false);
    const [opening, setOpening] = useState(false);
    const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
    const [rangeText, setRangeText] = useState("");
    const [rangeError, setRangeError] = useState<string | null>(null);
    const [thumbs, setThumbs] = useState<Record<number, string>>({});
    const [settled, setSettled] = useState(0);
    const [rendering, setRendering] = useState(false);
    const [previewsFailed, setPreviewsFailed] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState<{ pages: number; size: number } | null>(null);

    // Read by onToggle, which stays stable so one tap does not re-render every card.
    const selectedRef = useRef(selected);
    selectedRef.current = selected;

    const pageCount = doc?.ratios.length ?? 0;
    const pages = useMemo(() => Array.from({ length: pageCount }, (_, i) => i + 1), [pageCount]);
    const keepCount = pageCount - selected.size;

    const openFile = useCallback(
        async (next: File) => {
            const token = ++openToken.current;
            setOpening(true);
            try {
                const lib = await loadPdfLib();
                const source = await openPdf(lib, new Uint8Array(await next.arrayBuffer()));
                const ratios = source.getPages().map((page) => {
                    const { box, rotation } = pageGeometry(page);
                    const { width, height } = visualSize(box, rotation);
                    return Math.min(2.2, Math.max(0.4, width / height));
                });
                if (token !== openToken.current) return;
                dismiss();
                setDoc({ file: next, ratios });
                setLocked(false);
                setSelected(new Set());
                setRangeText("");
                setRangeError(null);
                setSaved(null);
            } catch (error) {
                if (token !== openToken.current) return;
                if (error instanceof PdfOpenError && error.kind === "encrypted") {
                    setDoc(null);
                    setLocked(true);
                    return;
                }
                setLocked(false);
                toast({
                    title: error instanceof PdfOpenError && error.kind === "empty" ? "This PDF has no pages" : "This file could not be read as a PDF",
                    description: error instanceof PdfOpenError && error.kind === "empty" ? "There is nothing here to delete." : "It may be damaged, or not a PDF at all.",
                    variant: "destructive",
                });
            } finally {
                if (token === openToken.current) setOpening(false);
            }
        },
        [dismiss, toast],
    );

    const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.files?.[0];
        event.target.value = "";
        if (next) void openFile(next);
    };

    const onDrop = (event: DragEvent<HTMLDivElement>) => {
        const next = event.dataTransfer.files?.[0];
        if (!next) return;
        event.preventDefault();
        void openFile(next);
    };

    /*
     * Thumbnails. Each file gets its own pdf.js document, queue and observer, and all
     * three go when the file changes or the tool unmounts. The bytes are read again
     * here because pdf.js moves its buffer into the worker.
     */
    useEffect(() => {
        if (!doc) return;
        const urls: string[] = [];
        let alive = true;
        let destroyLoading: (() => void) | undefined;
        let stopQueue: (() => void) | undefined;
        const observer: { current?: IntersectionObserver } = {};

        setThumbs({});
        setSettled(0);
        setRendering(false);
        setPreviewsFailed(false);

        const start = async () => {
            const pdfjs = await loadPdfJs();
            const data = new Uint8Array(await doc.file.arrayBuffer());
            if (!alive) return;
            const loading = pdfjs.getDocument({ data });
            destroyLoading = () => void loading.destroy();
            const pdf = await loading.promise;
            if (!alive) return;

            const queue = createThumbnailQueue<string>({
                concurrency: THUMB_CONCURRENCY,
                render: async (index, signal) => {
                    const page = await pdf.getPage(index + 1);
                    const base = page.getViewport({ scale: 1 });
                    const ratio = Math.min(1.5, window.devicePixelRatio || 1);
                    const viewport = page.getViewport({ scale: (THUMB_WIDTH * ratio) / base.width });
                    const canvas = document.createElement("canvas");
                    canvas.width = Math.floor(viewport.width);
                    canvas.height = Math.floor(viewport.height);
                    const context = canvas.getContext("2d");
                    if (!context) throw new Error("No canvas");
                    const task = page.render({ canvasContext: context, viewport, canvas });
                    signal.addEventListener("abort", () => task.cancel(), { once: true });
                    await task.promise;
                    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", THUMB_QUALITY));
                    canvas.width = 0;
                    page.cleanup();
                    if (!blob || signal.aborted) throw new Error("No thumbnail");
                    const url = URL.createObjectURL(blob);
                    urls.push(url);
                    return url;
                },
                onDone: (index, url) => {
                    setThumbs((current) => ({ ...current, [index + 1]: url }));
                    setSettled((count) => count + 1);
                },
                onFail: () => setSettled((count) => count + 1),
                onBusy: setRendering,
            });
            stopQueue = queue.destroy;

            observer.current = new IntersectionObserver(
                (entries) => {
                    // Highest page first, because the queue draws the newest request first.
                    const ordered = [...entries].sort(
                        (a, b) => Number((b.target as HTMLElement).dataset.page) - Number((a.target as HTMLElement).dataset.page),
                    );
                    for (const entry of ordered) {
                        const index = Number((entry.target as HTMLElement).dataset.page);
                        if (entry.isIntersecting) queue.request(index);
                        else queue.drop(index);
                    }
                },
                { rootMargin: THUMB_MARGIN },
            );
            for (const card of gridRef.current?.querySelectorAll("[data-page]") ?? []) observer.current.observe(card);
        };

        start().catch((error: unknown) => {
            if (!alive) return;
            if ((error as { name?: string } | null)?.name === "PasswordException") {
                setDoc(null);
                setLocked(true);
                return;
            }
            setPreviewsFailed(true);
        });

        return () => {
            alive = false;
            observer.current?.disconnect();
            stopQueue?.();
            destroyLoading?.();
            for (const url of urls) URL.revokeObjectURL(url);
        };
    }, [doc]);

    /*
     * The whole toolbar is too tall to pin on a phone. Its height is measured so the
     * sticky offset can hide the controls and leave the count and download in view.
     */
    useEffect(() => {
        const toolbar = toolbarRef.current;
        const controls = controlsRef.current;
        if (!toolbar || !controls) return;
        const header = document.querySelector("header");
        const measure = () => {
            toolbar.style.setProperty("--pd-header", `${header?.getBoundingClientRect().height ?? 0}px`);
            toolbar.style.setProperty("--pd-controls", `${controls.getBoundingClientRect().height}px`);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(controls);
        if (header) observer.observe(header);
        return () => observer.disconnect();
    }, [pageCount]);

    const applySelection = useCallback((next: ReadonlySet<number>) => {
        setSelected(next);
        setRangeText(formatRange([...next]));
        setRangeError(null);
        setSaved(null);
    }, []);

    const onToggle = useCallback(
        (page: number) => {
            const next = new Set(selectedRef.current);
            if (!next.delete(page)) next.add(page);
            applySelection(next);
        },
        [applySelection],
    );

    const onRange = (text: string) => {
        setRangeText(text);
        const parsed = parseRange(text, pageCount);
        if (parsed.error) {
            setRangeError(parsed.error);
            return;
        }
        setRangeError(null);
        setSelected(new Set(parsed.pages));
        setSaved(null);
    };

    const onRangeBlur = () => {
        if (!rangeError) setRangeText(formatRange([...selected]));
    };

    const save = async () => {
        if (!doc || keepCount === 0 || selected.size === 0) return;
        setSaving(true);
        try {
            const lib = await loadPdfLib();
            const bytes = new Uint8Array(await doc.file.arrayBuffer());
            const out = await deletePages(lib, bytes, [...selected].map((page) => page - 1));
            downloadPdf(out, editedFileName(doc.file.name));
            markToolSuccess(out);
            setSaved({ pages: keptPages(pageCount, selected).length, size: out.length });
        } catch (error) {
            toast({
                title: "The edited copy could not be written",
                description: error instanceof Error ? error.message : "Try opening the file again.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const allMarked = pageCount > 0 && keepCount === 0;
    const announced = Math.floor(settled / ANNOUNCE_STEP) * ANNOUNCE_STEP;

    return (
        <div className="mt-4 space-y-4" onDragOver={(event) => doc && event.preventDefault()} onDrop={doc ? onDrop : undefined}>
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onPick} />

            {opening && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                    <Loader2 className="h-4 w-4 animate-spin" /> Reading the PDF…
                </p>
            )}

            {locked && <LockedNotice />}

            {!doc && !opening && (
                <div className="flex flex-col items-center gap-3 text-center">
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

            {doc && (
                <div data-pdf-open className="space-y-4">
                    <div
                        ref={toolbarRef}
                        className="sticky top-[calc(var(--pd-header,0px)-var(--pd-controls,0px))] z-20 rounded-[14px] border border-border bg-card shadow-[var(--shadow-soft)] md:top-[calc(var(--pd-header,0px)+8px)]"
                    >
                        <div ref={controlsRef} className="space-y-3 px-4 pt-3">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[15px] font-medium">{doc.file.name}</p>
                                    <p className="font-mono text-xs text-muted-foreground">
                                        {plural(pageCount)} · {formatBytes(doc.file.size)}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    Choose another
                                </Button>
                            </div>

                            <div className="flex flex-wrap items-start gap-x-4 gap-y-3 pb-3">
                                <div className="flex flex-wrap gap-2 md:pt-[26px]">
                                    <button
                                        type="button"
                                        className={buttonVariants({ variant: "outline" })}
                                        onClick={() => applySelection(new Set(oddPages(pageCount)))}
                                    >
                                        Select odd
                                    </button>
                                    <button
                                        type="button"
                                        className={buttonVariants({ variant: "outline" })}
                                        onClick={() => applySelection(new Set(evenPages(pageCount)))}
                                    >
                                        Select even
                                    </button>
                                    <button
                                        type="button"
                                        className={buttonVariants({ variant: "ghost" })}
                                        disabled={selected.size === 0 && !rangeText}
                                        onClick={() => applySelection(new Set())}
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="min-w-[200px] flex-1 space-y-1.5">
                                    <Label htmlFor="pd-range">Pages to delete</Label>
                                    <Input
                                        id="pd-range"
                                        placeholder="2-4, 9"
                                        value={rangeText}
                                        onChange={(event) => onRange(event.target.value)}
                                        onBlur={onRangeBlur}
                                        aria-invalid={Boolean(rangeError)}
                                        aria-describedby={rangeError ? "pd-range-hint" : undefined}
                                        className="font-mono"
                                        autoComplete="off"
                                    />
                                    {rangeError && (
                                        <p id="pd-range-hint" className="text-xs text-destructive">
                                            {rangeError} Your selection has not changed.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 border-t border-border px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                                <p className="text-[15px] font-medium" role="status" aria-live="polite">
                                    Keeping {keepCount} of {plural(pageCount)}
                                </p>
                                <Button
                                    type="button"
                                    onClick={save}
                                    disabled={saving || allMarked || selected.size === 0 || Boolean(rangeError)}
                                    className="h-11 max-sm:w-full"
                                    data-analytics-label="download-edited-pdf"
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : <Download />}
                                    Download PDF ({plural(keepCount)})
                                </Button>
                            </div>
                            {allMarked && (
                                <p className="rounded-[10px] border border-[color:var(--ochre)] bg-[var(--drop-over)] px-3 py-2 text-sm text-foreground" role="alert">
                                    Every page is marked. A PDF needs at least one page, so unmark one to download.
                                </p>
                            )}
                            {selected.size === 0 && <p className="text-xs text-muted-foreground">Tap the pages you want to remove.</p>}
                            {saved && (
                                <p className="font-mono text-xs text-muted-foreground" role="status">
                                    Saved {plural(saved.pages)} · {formatBytes(saved.size)} · {editedFileName(doc.file.name)}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="min-h-[1.25rem] text-xs text-muted-foreground">
                        <p aria-hidden="true">
                            {previewsFailed
                                ? "Previews could not be drawn for this file. You can still pick pages by number."
                                : settled >= pageCount
                                  ? null
                                  : rendering
                                    ? `Rendering thumbnails ${settled}/${pageCount}`
                                    : `Thumbnails ${settled}/${pageCount}. The rest appear as you scroll.`}
                        </p>
                        <p className="sr-only" role="status" aria-live="polite">
                            {previewsFailed ? "Previews could not be drawn." : `${announced} of ${plural(pageCount)} drawn.`}
                        </p>
                    </div>

                    <div ref={gridRef} role="group" aria-label="Pages" className="grid grid-cols-2 items-end gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {pages.map((page) => (
                            <PageCard
                                key={page}
                                page={page}
                                ratio={doc.ratios[page - 1]}
                                thumb={thumbs[page]}
                                selected={selected.has(page)}
                                onToggle={onToggle}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
