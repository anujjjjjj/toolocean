import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Download, GripVertical, Loader2, ShieldCheck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { markToolSuccess } from "@/lib/toolResult";
import { DEFAULT_JPG_QUALITY, HEIC_SNIFF_BYTES, heicFileError } from "@/lib/image/heic";
import {
  assembleImagesPdf,
  heicToPdfOutcome,
  heicToPdfOutputName,
  type PdfOrientation,
  type PdfPageSize,
} from "@/lib/image/heicToPdf";
import type { HeicDecoder } from "@/lib/image/heicDecoder";

type Status = "waiting" | "converting" | "done" | "error";

interface Output {
  key: string;
  name: string;
  url: string;
  thumbUrl: string | null;
  blob: Blob;
  width: number;
  height: number;
  note: string | null;
}

interface Item {
  id: number;
  file: File;
  status: Status;
  error: string | null;
  output: Output | null;
}

const ACCEPT = ".heic,.heif,image/heic,image/heif";
const OUTPUT_KEY = "jpg-0.92";
const PAGE_SIZES: { value: PdfPageSize; label: string }[] = [
  { value: "fit", label: "Fit image" },
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
];
const ORIENTATIONS: { value: PdfOrientation; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

function release(output: Output | null) {
  if (!output) return;
  URL.revokeObjectURL(output.url);
  if (output.thumbUrl) URL.revokeObjectURL(output.thumbUrl);
}

function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function decodeMessage(error: unknown): string {
  const reason = (error as { reason?: string }).reason;
  if (reason === "encode") return `${(error as Error).message} Try it on a desktop browser.`;
  if (reason === "init") return "The decoder could not start in this browser. Reload the page and try again.";
  return "This photo could not be decoded. The file may be damaged, or use a HEIF variant this decoder does not support.";
}

export function HeicToPdfTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<PdfPageSize>("fit");
  const [orientation, setOrientation] = useState<PdfOrientation>("auto");
  const [margin, setMargin] = useState(0);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  const decoderRef = useRef<HeicDecoder | null>(null);
  const running = useRef(false);
  const nextId = useRef(1);
  const mounted = useRef(true);

  const update = useCallback((next: (current: Item[]) => Item[]) => {
    itemsRef.current = next(itemsRef.current);
    setItems(itemsRef.current);
  }, []);

  const patch = useCallback(
    (id: number, change: Partial<Item>) => update((list) => list.map((item) => (item.id === id ? { ...item, ...change } : item))),
    [update],
  );

  const pump = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      for (;;) {
        if (!mounted.current) return;
        const item = itemsRef.current.find((entry) => entry.status !== "error" && entry.output?.key !== OUTPUT_KEY);
        if (!item) break;
        patch(item.id, { status: "converting" });

        try {
          const { HeicDecoder, encodeDecoded } = await import("@/lib/image/heicDecoder");
          decoderRef.current ??= new HeicDecoder();
          const decoded = await decoderRef.current.decode(await item.file.arrayBuffer());
          const { blob, thumb } = await encodeDecoded(decoded, "jpg", DEFAULT_JPG_QUALITY);
          const current = itemsRef.current.find((entry) => entry.id === item.id);
          if (!current || !mounted.current) continue;
          release(current.output);
          const output: Output = {
            key: OUTPUT_KEY,
            name: item.file.name,
            url: URL.createObjectURL(blob),
            thumbUrl: thumb ? URL.createObjectURL(thumb) : null,
            blob,
            width: decoded.width,
            height: decoded.height,
            note: decoded.images > 1 ? `This file holds ${decoded.images} images. The main still, already upright, will go on the page.` : null,
          };
          patch(item.id, { status: "done", output, error: null });
        } catch (error) {
          if (itemsRef.current.some((entry) => entry.id === item.id)) {
            const current = itemsRef.current.find((entry) => entry.id === item.id);
            release(current?.output ?? null);
            patch(item.id, { status: "error", error: decodeMessage(error), output: null });
          }
        }
      }
    } finally {
      running.current = false;
    }
  }, [patch]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      decoderRef.current?.dispose();
      for (const item of itemsRef.current) release(item.output);
    };
  }, []);

  const addFiles = async (files: File[]) => {
    setBuildError(null);
    const added: Item[] = [];
    for (const file of files) {
      const head = new Uint8Array(await file.slice(0, HEIC_SNIFF_BYTES).arrayBuffer());
      const error = heicFileError(file, head);
      added.push({ id: nextId.current++, file, status: error ? "error" : "waiting", error, output: null });
    }
    update((list) => [...list, ...added]);
    void pump();
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    if (inputRef.current) inputRef.current.value = "";
    if (files.length) void addFiles(files);
  };

  const remove = (id: number) => {
    const item = itemsRef.current.find((entry) => entry.id === id);
    release(item?.output ?? null);
    update((list) => list.filter((entry) => entry.id !== id));
    setBuildError(null);
  };

  const clear = () => {
    for (const item of itemsRef.current) release(item.output);
    update(() => []);
    setBuildError(null);
  };

  const move = (id: number, direction: -1 | 1) => {
    update((list) => {
      const index = list.findIndex((entry) => entry.id === id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= list.length) return list;
      const copy = [...list];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  };

  const onItemDragOver = (event: React.DragEvent, targetId: number) => {
    event.preventDefault();
    if (draggedId === null || draggedId === targetId) return;
    update((list) => {
      const from = list.findIndex((entry) => entry.id === draggedId);
      const to = list.findIndex((entry) => entry.id === targetId);
      if (from < 0 || to < 0 || from === to) return list;
      const copy = [...list];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const done = items.filter((item) => item.status === "done" && item.output);
  const pending = items.filter((item) => item.status === "waiting" || item.status === "converting");
  const busy = pending.length > 0;
  const failed = items.filter((item) => item.status === "error");
  const settled = done.length + failed.length;
  const convertingIndex = items.findIndex((item) => item.status === "converting");

  const createPdf = async () => {
    const ready = itemsRef.current.filter((item) => item.status === "done" && item.output);
    const outcome = heicToPdfOutcome(ready.length);
    if (!outcome.deliver) {
      setBuildError("No decoded photo is ready, so nothing was downloaded.");
      return;
    }
    setBuilding(true);
    setBuildError(null);
    try {
      const images = await Promise.all(
        ready.map(async (item) => ({
          name: item.file.name,
          bytes: new Uint8Array(await item.output!.blob.arrayBuffer()),
          format: "jpeg" as const,
        })),
      );
      const pdfBytes = await assembleImagesPdf(images, { pageSize, orientation, margin });
      if (!mounted.current) return;
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      save(blob, heicToPdfOutputName(ready.map((item) => item.file.name)));
      markToolSuccess(blob);
    } catch {
      if (mounted.current) {
        setBuildError("The PDF could not be assembled from the decoded photos. Nothing was downloaded.");
      }
    } finally {
      if (mounted.current) setBuilding(false);
    }
  };

  const progressText = (() => {
    if (building) return "Building PDF…";
    if (!items.length) return null;
    if (busy) {
      const current = convertingIndex >= 0 ? convertingIndex + 1 : settled + 1;
      return `Decoding ${Math.min(current, items.length)} of ${items.length}…`;
    }
    const parts = [`${done.length} ready`];
    if (failed.length) parts.push(`${failed.length} could not be used`);
    return `${parts.join(", ")}.`;
  })();

  return (
    <div className="mt-6 space-y-6">
      <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={onChange} />

      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <div className="space-y-2">
          <Label id="heic-pdf-page-size-label">Page size</Label>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="heic-pdf-page-size-label" data-heic-pdf-page-size={pageSize}>
            {PAGE_SIZES.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={pageSize === option.value ? "default" : "outline"}
                aria-pressed={pageSize === option.value}
                data-heic-pdf-page-size={option.value}
                onClick={() => setPageSize(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label id="heic-pdf-orientation-label">Orientation</Label>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="heic-pdf-orientation-label" data-heic-pdf-orientation={orientation}>
            {ORIENTATIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={orientation === option.value ? "default" : "outline"}
                aria-pressed={orientation === option.value}
                data-heic-pdf-orientation={option.value}
                onClick={() => setOrientation(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="w-full space-y-3 sm:max-w-xs sm:flex-1">
          <Label htmlFor="heic-pdf-margin" className="flex items-baseline gap-x-2">
            <span>Margin</span>
            <span className="font-mono text-muted-foreground whitespace-nowrap">{margin} pt</span>
          </Label>
          <Slider
            id="heic-pdf-margin"
            aria-label="Page margin in points"
            data-heic-pdf-margin={margin}
            value={[margin]}
            onValueChange={([value]) => setMargin(value)}
            min={0}
            max={72}
            step={6}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Fit image keeps each page the size of the photo. A4 and Letter scale the picture uniformly to sit inside the
        sheet. Auto orientation follows the photo; margin shrinks the picture, not the page.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" data-analytics-label="heic-to-pdf-add" onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Add HEIC photos
        </Button>
        <p className="text-sm text-muted-foreground">HEIC or HEIF, including a batch. Reorder the list to set the page order.</p>
      </div>

      {items.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border" aria-label="Photos for the PDF">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center gap-2 p-3 sm:gap-3"
              onDragOver={(event) => onItemDragOver(event, item.id)}
              onDrop={(event) => event.preventDefault()}
            >
              <button
                type="button"
                className="hidden h-8 w-6 flex-none cursor-grab touch-none items-center justify-center text-muted-foreground sm:flex"
                aria-label={`Drag to reorder ${item.file.name}`}
                data-heic-pdf-grip
                draggable
                onDragStart={() => setDraggedId(item.id)}
                onDragEnd={() => setDraggedId(null)}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              {item.output?.thumbUrl ? (
                <img src={item.output.thumbUrl} alt="" width={56} height={56} className="h-14 w-14 rounded object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                  {item.status === "converting" || item.status === "waiting" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.file.name}</p>
                {item.status === "done" && item.output && (
                  <p className="text-xs text-muted-foreground">
                    {item.output.width} × {item.output.height}
                    {item.output.note ? ` · ${item.output.note}` : ""}
                  </p>
                )}
                {item.status === "converting" && <p className="text-xs text-muted-foreground">Decoding in this tab…</p>}
                {item.status === "waiting" && <p className="text-xs text-muted-foreground">Waiting to decode…</p>}
                {item.error && (
                  <p className="text-xs text-destructive" data-heic-pdf-error>
                    {item.error}
                  </p>
                )}
              </div>
              <div className="flex flex-none items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`Move ${item.file.name} up`}
                  data-heic-pdf-move-up
                  disabled={index === 0}
                  onClick={() => move(item.id, -1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`Move ${item.file.name} down`}
                  data-heic-pdf-move-down
                  disabled={index === items.length - 1}
                  onClick={() => move(item.id, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={`Remove ${item.file.name}`} onClick={() => remove(item.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div role="status" aria-live="polite" className="space-y-2 text-sm" data-heic-pdf-status>
        {items.length > 0 && (busy || building) && (
          <div
            className="h-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={building ? 1 : items.length}
            aria-valuenow={building ? 0 : settled}
            aria-label={building ? "Building PDF" : "Decoding photos"}
          >
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: building ? "70%" : `${Math.min(100, (settled / Math.max(items.length, 1)) * 100)}%` }}
            />
          </div>
        )}
        {progressText && (
          <p className={failed.length && !busy && !building ? "text-destructive" : "text-muted-foreground"} data-heic-pdf-progress>
            {progressText}
          </p>
        )}
        {buildError && <p className="text-destructive">{buildError}</p>}
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={!done.length || busy || building}
              data-analytics-label="heic-to-pdf-create"
              onClick={() => void createPdf()}
            >
              {building || (busy && !done.length) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {done.length > 1 ? `Create PDF (${done.length} photos)` : "Create PDF"}
            </Button>
            <Button type="button" variant="ghost" size="sm" data-analytics-label="heic-to-pdf-clear" onClick={clear}>
              Clear list
            </Button>
          </div>
          <p className="paper-trust mt-0">
            <ShieldCheck aria-hidden="true" />
            Converted on this device. Nothing is uploaded.
          </p>
        </div>
      )}

      <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground" aria-label="How this converter works">
        <li className="rounded-full border px-3 py-1">No account</li>
        <li className="rounded-full border px-3 py-1">Nothing uploaded</li>
        <li className="rounded-full border px-3 py-1">Works in Chrome, Firefox and Edge</li>
        <li className="rounded-full border px-3 py-1 font-mono">50 MB per file</li>
      </ul>
    </div>
  );
}
