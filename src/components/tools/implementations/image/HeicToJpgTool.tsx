import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatBytes } from "@/lib/targetSize/parseSize";
import { markToolSuccess } from "@/lib/toolResult";
import {
  DEFAULT_JPG_QUALITY,
  HEIC_SNIFF_BYTES,
  heicFileError,
  heicOutputName,
  uniqueNames,
  type HeicOutputFormat,
} from "@/lib/image/heic";
import type { HeicDecoder } from "@/lib/image/heicDecoder";

type Status = "waiting" | "converting" | "done" | "error";

interface Output {
  key: string;
  name: string;
  url: string;
  thumbUrl: string | null;
  size: number;
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

function settingsKey(format: HeicOutputFormat, quality: number) {
  return format === "png" ? "png" : `jpg-${quality.toFixed(2)}`;
}

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

export interface HeicPreset {
  /** Output selected when the tool opens. /heic-to-png sets "png". */
  format?: HeicOutputFormat;
}

export function HeicToJpgTool({ preset }: { preset?: HeicPreset } = {}) {
  const [items, setItems] = useState<Item[]>([]);
  const [format, setFormat] = useState<HeicOutputFormat>(preset?.format ?? "jpg");
  const [quality, setQuality] = useState(DEFAULT_JPG_QUALITY);
  /* The slider moves freely; conversion uses the value it was released at. */
  const [committedQuality, setCommittedQuality] = useState(DEFAULT_JPG_QUALITY);
  const [zipping, setZipping] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  const keyRef = useRef(settingsKey(format, committedQuality));
  const settingsRef = useRef({ format, quality: committedQuality });
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

  /*
   * One file at a time through one worker. Anything whose output was made with
   * other settings is redone, so switching JPG and PNG needs no extra button.
   * Errors are final: a file that will not decode as JPG will not decode as PNG.
   */
  const pump = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    /* One success signal per pass, however many photos it converted. */
    let converted = 0;
    try {
      for (;;) {
        if (!mounted.current) return;
        const key = keyRef.current;
        const item = itemsRef.current.find((entry) => entry.status !== "error" && entry.output?.key !== key);
        if (!item) break;
        const { format: outFormat, quality: outQuality } = settingsRef.current;
        patch(item.id, { status: "converting" });

        try {
          const { HeicDecoder, encodeDecoded } = await import("@/lib/image/heicDecoder");
          decoderRef.current ??= new HeicDecoder();
          const decoded = await decoderRef.current.decode(await item.file.arrayBuffer());
          const { blob, thumb } = await encodeDecoded(decoded, outFormat, outQuality);
          const current = itemsRef.current.find((entry) => entry.id === item.id);
          if (!current || !mounted.current) continue; // removed while converting
          release(current.output);
          const output: Output = {
            key,
            name: heicOutputName(item.file.name, outFormat),
            url: URL.createObjectURL(blob),
            thumbUrl: thumb ? URL.createObjectURL(thumb) : null,
            size: blob.size,
            blob,
            width: decoded.width,
            height: decoded.height,
            note: decoded.images > 1 ? `This file holds ${decoded.images} images. The main photo was converted.` : null,
          };
          patch(item.id, { status: key === keyRef.current ? "done" : "waiting", output, error: null });
          converted += 1;
        } catch (error) {
          const reason = (error as { reason?: string }).reason;
          const message =
            reason === "encode"
              ? `${(error as Error).message} Try it on a desktop browser.`
              : reason === "init"
                ? "The decoder could not start in this browser. Reload the page and try again."
                : "This photo could not be decoded. The file may be damaged, or use a HEIF variant this decoder does not support.";
          if (itemsRef.current.some((entry) => entry.id === item.id)) {
            const current = itemsRef.current.find((entry) => entry.id === item.id);
            release(current?.output ?? null);
            patch(item.id, { status: "error", error: message, output: null });
          }
        }
      }
    } finally {
      running.current = false;
    }
    if (converted > 0 && mounted.current) markToolSuccess();
  }, [patch]);

  useEffect(() => {
    keyRef.current = settingsKey(format, committedQuality);
    settingsRef.current = { format, quality: committedQuality };
    update((list) => list.map((item) => (item.status === "done" && item.output?.key !== keyRef.current ? { ...item, status: "waiting" } : item)));
    void pump();
  }, [format, committedQuality, pump, update]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      decoderRef.current?.dispose();
      for (const item of itemsRef.current) release(item.output);
    };
  }, []);

  const addFiles = async (files: File[]) => {
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
  };

  const clear = () => {
    for (const item of itemsRef.current) release(item.output);
    update(() => []);
  };

  const done = items.filter((item) => item.status === "done" && item.output);
  const busy = items.some((item) => item.status === "waiting" || item.status === "converting");

  const downloadAll = async () => {
    if (!done.length) return;
    if (done.length === 1) {
      const output = done[0].output!;
      save(output.blob, output.name);
      return;
    }
    setZipping(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const names = uniqueNames(done.map((item) => item.output!.name));
      done.forEach((item, index) => zip.file(names[index], item.output!.blob));
      /*
       * STORE, unlike the ZIP creator. JPEG and PNG are already compressed, so
       * DEFLATE spends seconds on a batch of photos to save almost nothing.
       */
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      save(blob, format === "jpg" ? "heic-to-jpg.zip" : "heic-to-png.zip");
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={onChange} />

      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <div className="space-y-2">
          <Label id="heic-format-label">Save as</Label>
          <div className="flex gap-2" role="group" aria-labelledby="heic-format-label">
            <Button
              type="button"
              size="sm"
              variant={format === "jpg" ? "default" : "outline"}
              aria-pressed={format === "jpg"}
              data-analytics-label="heic-format-jpg"
              onClick={() => setFormat("jpg")}
            >
              JPG
            </Button>
            <Button
              type="button"
              size="sm"
              variant={format === "png" ? "default" : "outline"}
              aria-pressed={format === "png"}
              data-analytics-label="heic-format-png"
              onClick={() => setFormat("png")}
            >
              PNG
            </Button>
          </div>
        </div>
        {format === "jpg" ? (
          <div className="w-full max-w-xs flex-1 space-y-3">
            <Label htmlFor="heic-quality">
              Quality <span className="font-mono text-muted-foreground">{Math.round(quality * 100)}%</span>
            </Label>
            <Slider
              id="heic-quality"
              aria-label="JPG quality"
              value={[quality]}
              onValueChange={([value]) => setQuality(value)}
              onValueCommit={([value]) => setCommittedQuality(value)}
              min={0.5}
              max={1}
              step={0.01}
            />
          </div>
        ) : (
          <p className="max-w-xs text-sm text-muted-foreground">PNG keeps every pixel, so files are several times larger than JPG.</p>
        )}
      </div>

      {items.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border" aria-label="Converted photos">
          {items.map((item) => {
            const output = item.output;
            return (
              <li key={item.id} className="flex items-center gap-3 p-3 sm:gap-4">
                <div className="grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-md border bg-muted">
                  {output?.thumbUrl ? (
                    <img src={output.thumbUrl} alt="" className="h-full w-full object-cover" />
                  ) : item.status === "converting" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatBytes(item.file.size)}
                    {output && item.status !== "error" ? ` → ${formatBytes(output.size)} · ${output.width} × ${output.height}` : ""}
                  </p>
                  <p
                    className={item.status === "error" ? "text-sm text-destructive" : "text-xs text-muted-foreground"}
                    role={item.status === "error" ? "alert" : undefined}
                  >
                    {item.status === "error"
                      ? item.error
                      : item.status === "converting"
                        ? "Converting…"
                        : item.status === "waiting"
                          ? "Waiting"
                          : (output?.note ?? `Ready as ${output?.name}`)}
                  </p>
                </div>
                {output && item.status === "done" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-analytics-label="heic-download-one"
                    aria-label={`Download ${output.name}`}
                    onClick={() => save(output.blob, output.name)}
                  >
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="max-sm:sr-only">Download</span>
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 flex-none"
                  data-analytics-label="heic-remove"
                  aria-label={`Remove ${item.file.name}`}
                  onClick={() => remove(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={!done.length || zipping}
              data-analytics-label={done.length > 1 ? "heic-download-zip" : "heic-download"}
              onClick={downloadAll}
            >
              {zipping || (busy && !done.length) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {done.length > 1 ? `Download all as ZIP (${done.length})` : `Download ${format.toUpperCase()}`}
            </Button>
            <Button type="button" variant="ghost" size="sm" data-analytics-label="heic-clear" onClick={clear}>
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
        <li className="rounded-full border px-3 py-1">Works offline once loaded</li>
        <li className="rounded-full border px-3 py-1 font-mono">50 MB per file</li>
      </ul>
    </div>
  );
}
