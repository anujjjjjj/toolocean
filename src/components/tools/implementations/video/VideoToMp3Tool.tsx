import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, AlertTriangle, Check, Download, Film, Loader2, ShieldCheck, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/targetSize/parseSize";
import { markToolSuccess } from "@/lib/toolResult";
import { cn } from "@/lib/utils";
import {
  BITRATE_OPTIONS,
  DEFAULT_BITRATE,
  NO_AUDIO_ERROR,
  TRIMMER_PATH,
  VIDEO_ACCEPT,
  classifyError,
  conversionWarnings,
  estimateOutputBytes,
  formatDuration,
  lacksAudio,
  outputFileName,
  pickSampleRate,
  type Mp3Bitrate,
  type OutputFormat,
  type ToolError,
} from "@/lib/videoToMp3";
import {
  NamedError,
  decodeAudio,
  inspectVideo,
  startEncode,
  type EncodeJob,
  type VideoFacts,
} from "@/lib/videoToMp3Client";

type Phase = "empty" | "inspecting" | "ready" | "working" | "done" | "error";
type Stage = "reading" | "decoding" | "encoding";

interface Output {
  blob: Blob;
  url: string;
  name: string;
  seconds: number;
  sampleRate: number;
  channels: number;
  format: OutputFormat;
  bitrate: number;
}

const TRUST_CHIPS = ["No upload", "MP4, MOV, WebM, MKV", "Works offline once loaded", "Free"];

/** Where each stage sits on the bar. Encoding takes the most time, and it is the only stage with a real percentage. */
const STAGE_START: Record<Stage, number> = { reading: 2, decoding: 8, encoding: 20 };

const LABEL_KIND = { mov: "MOV", mp4: "MP4", webm: "WebM", mkv: "MKV" } as const;

function isSafariBrowser() {
  return /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
}

function save(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function TrimLink({ className }: { className?: string }) {
  return (
    <Link to={TRIMMER_PATH} className={cn("font-medium text-foreground underline underline-offset-2", className)}>
      Video Trimmer
    </Link>
  );
}

function ErrorPanel({ error, onChoose, onRetry }: { error: ToolError; onChoose: () => void; onRetry?: () => void }) {
  return (
    <div role="alert" data-v2m-error={error.kind} className="rounded-[14px] border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--delete)]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-foreground">{error.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{error.body}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">
            {error.fixes.map((fix) => (
              <li key={fix}>{fix}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2 max-sm:flex-col">
            {error.kind === "memory" && (
              <Link to={TRIMMER_PATH} className={buttonVariants({ size: "lg", className: "no-underline" })}>
                Open Video Trimmer
              </Link>
            )}
            {onRetry && (
              <Button type="button" variant="outline" className="h-11" onClick={onRetry} data-analytics-label="v2m-retry">
                Back to settings
              </Button>
            )}
            <Button type="button" variant="outline" className="h-11" onClick={onChoose} data-analytics-label="v2m-choose-another">
              Choose another file
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stages({ stage, percent, format }: { stage: Stage; percent: number; format: OutputFormat }) {
  const steps: { key: Stage; label: string }[] = [
    { key: "reading", label: "Reading file" },
    { key: "decoding", label: "Decoding audio" },
    { key: "encoding", label: format === "mp3" ? `Encoding MP3 ${percent}%` : "Writing WAV" },
  ];
  const current = steps.findIndex((step) => step.key === stage);
  return (
    <ol className="grid gap-2 sm:grid-cols-3" aria-hidden="true">
      {steps.map((step, index) => (
        <li
          key={step.key}
          className={cn("flex items-center gap-2 text-sm", index === current ? "font-medium text-foreground" : "text-muted-foreground")}
        >
          {index < current ? (
            <Check className="h-4 w-4 shrink-0 text-[color:var(--ok)]" />
          ) : index === current ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" />
          ) : (
            <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
          )}
          {step.label}
        </li>
      ))}
    </ol>
  );
}

export function VideoToMp3Tool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const jobToken = useRef(0);
  const encodeJob = useRef<EncodeJob | null>(null);
  const outputUrl = useRef<string | null>(null);

  const [phase, setPhase] = useState<Phase>("empty");
  const [file, setFile] = useState<File | null>(null);
  const [facts, setFacts] = useState<VideoFacts | null>(null);
  const [format, setFormat] = useState<OutputFormat>("mp3");
  const [bitrate, setBitrate] = useState<Mp3Bitrate>(DEFAULT_BITRATE);
  const [stage, setStage] = useState<Stage>("reading");
  const [percent, setPercent] = useState(0);
  const [output, setOutput] = useState<Output | null>(null);
  const [error, setError] = useState<ToolError | null>(null);

  const releaseOutput = useCallback(() => {
    if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
    outputUrl.current = null;
    setOutput(null);
  }, []);

  /* Anything still running belongs to a file or a choice the user has moved on from. */
  const stopWork = useCallback(() => {
    jobToken.current += 1;
    encodeJob.current?.cancel();
    encodeJob.current = null;
  }, []);

  useEffect(
    () => () => {
      stopWork();
      if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
    },
    [stopWork],
  );

  const openFile = useCallback(
    async (next: File) => {
      stopWork();
      const token = jobToken.current;
      releaseOutput();
      setFile(next);
      setFacts(null);
      setError(null);
      setPhase("inspecting");
      try {
        const inspected = await inspectVideo(next);
        if (token !== jobToken.current) return;
        setFacts(inspected);
        if (lacksAudio(inspected.probe, inspected.audioTrackCount)) {
          setError(NO_AUDIO_ERROR);
          setPhase("error");
          return;
        }
        setPhase("ready");
      } catch (caught) {
        if (token !== jobToken.current) return;
        setError(classifyError(caught, { fileSize: next.size }));
        setPhase("error");
      }
    },
    [releaseOutput, stopWork],
  );

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    event.target.value = "";
    if (next) void openFile(next);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    const next = event.dataTransfer.files?.[0];
    if (!next || phase === "empty") return;
    event.preventDefault();
    void openFile(next);
  };

  const reset = () => {
    stopWork();
    releaseOutput();
    setFile(null);
    setFacts(null);
    setError(null);
    setFormat("mp3");
    setBitrate(DEFAULT_BITRATE);
    setPhase("empty");
  };

  const run = async () => {
    if (!file || !facts) return;
    stopWork();
    const token = jobToken.current;
    const current = () => token === jobToken.current;
    setError(null);
    setStage("reading");
    setPercent(0);
    setPhase("working");
    try {
      const bytes = await file.arrayBuffer();
      if (!current()) return;
      setStage("decoding");
      const decoded = await decodeAudio(bytes, pickSampleRate(facts.probe.sampleRate));
      if (!current()) return;
      if (decoded.length === 0) throw new NamedError("NoAudioError");

      setStage("encoding");
      const job = startEncode(decoded, { format, bitrate }, (next) => {
        if (current()) setPercent(next);
      });
      encodeJob.current = job;
      const blob = await job.result;
      if (!current()) return;
      encodeJob.current = null;

      const url = URL.createObjectURL(blob);
      outputUrl.current = url;
      setOutput({
        blob,
        url,
        name: outputFileName(file.name, format),
        seconds: decoded.duration,
        sampleRate: decoded.sampleRate,
        channels: Math.min(2, decoded.numberOfChannels),
        format,
        bitrate,
      });
      setPhase("done");
    } catch (caught) {
      if (!current()) return;
      encodeJob.current = null;
      setError(
        classifyError(caught, {
          probe: facts.probe,
          container: facts.container,
          isSafari: isSafariBrowser(),
          fileSize: file.size,
          audioTrackCount: facts.audioTrackCount,
        }),
      );
      setPhase("error");
    }
  };

  const cancel = () => {
    stopWork();
    setPhase("ready");
  };

  const download = () => {
    if (!output) return;
    save(output.blob, output.name);
    markToolSuccess(output.blob);
  };

  const choose = () => inputRef.current?.click();

  const seconds = facts?.duration ?? null;
  const warnings = file && phase === "ready" ? conversionWarnings(file.size, seconds) : [];
  const estimate = seconds === null ? null : estimateOutputBytes({ format, bitrate, seconds });
  const overall = stage === "encoding" ? STAGE_START.encoding + (percent * (100 - STAGE_START.encoding)) / 100 : STAGE_START[stage];
  const canRetry = phase === "error" && facts !== null && error !== null && error.kind !== "no-audio";

  return (
    <div
      className="mt-4 space-y-4"
      data-v2m-state={phase === "inspecting" ? "working" : phase}
      onDragOver={(event) => phase !== "empty" && event.preventDefault()}
      onDrop={onDrop}
    >
      <input ref={inputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={onPick} />

      {file && (
        <div className="rounded-[14px] border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Film className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium" title={file.name}>
                {file.name}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {formatBytes(file.size)}
                {phase !== "inspecting" && facts && ` · ${formatDuration(seconds)} · ${LABEL_KIND[facts.container]}`}
              </p>
            </div>
            {phase !== "working" && phase !== "inspecting" && (
              <Button type="button" variant="outline" size="sm" className="max-sm:h-11" onClick={choose} data-analytics-label="v2m-choose-another">
                Choose another
              </Button>
            )}
          </div>
        </div>
      )}

      {phase === "inspecting" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Reading the file…
        </p>
      )}

      {warnings.map((warning) => (
        <div
          key={warning.kind}
          data-v2m-warning={warning.kind}
          className="flex items-start gap-2.5 rounded-[10px] border border-[color:var(--ochre)] bg-[var(--drop-over)] px-3 py-2.5 text-sm leading-relaxed text-foreground"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ochre-ink)]" aria-hidden="true" />
          <p className="min-w-0">
            {warning.message} You can still continue. If it stalls, trim it first with <TrimLink /> or close other tabs.
          </p>
        </div>
      ))}

      {phase === "ready" && (
        <div className="space-y-4 rounded-[14px] border border-border bg-card p-4">
          <div className="space-y-2">
            <Label id="v2m-format-label">Save as</Label>
            <div className="grid grid-cols-2 gap-2 sm:max-w-[264px]" role="group" aria-labelledby="v2m-format-label">
              {(["mp3", "wav"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={format === option}
                  data-v2m-format={option}
                  data-analytics-label={`v2m-format-${option}`}
                  onClick={() => setFormat(option)}
                  className={buttonVariants({ variant: format === option ? "default" : "outline", size: "lg" })}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {format === "mp3" ? (
            <div className="space-y-2">
              <Label id="v2m-bitrate-label">Quality</Label>
              <div className="grid grid-cols-3 gap-2 sm:max-w-[400px]" role="group" aria-labelledby="v2m-bitrate-label">
                {BITRATE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={bitrate === option}
                    data-v2m-bitrate={option}
                    data-analytics-label={`v2m-bitrate-${option}`}
                    onClick={() => setBitrate(option)}
                    className={cn(buttonVariants({ variant: bitrate === option ? "default" : "outline", size: "lg" }), "px-2 font-mono")}
                  >
                    {option} kbps
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">WAV keeps the decoded sound uncompressed, so the file is far larger than an MP3.</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-3">
            <p className="font-mono text-xs text-muted-foreground">
              {estimate === null ? "Size shown after converting" : `About ${formatBytes(estimate)}`}
            </p>
            <Button type="button" onClick={() => void run()} className="h-11 max-sm:w-full" data-v2m-convert data-analytics-label="v2m-convert">
              Convert to {format.toUpperCase()}
            </Button>
          </div>
        </div>
      )}

      {phase === "working" && (
        <div className="space-y-3 rounded-[14px] border border-border bg-card p-4">
          <Stages stage={stage} percent={percent} format={format} />
          <Progress value={overall} className="h-2" aria-label="Conversion progress" data-v2m-progress={Math.round(overall)} />
          <p className="sr-only" role="status" aria-live="polite">
            {stage === "reading" ? "Reading file" : stage === "decoding" ? "Decoding audio" : "Encoding"}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="text-xs text-muted-foreground">Long files take a few minutes. This tab stays responsive.</p>
            <Button type="button" variant="outline" className="h-11 max-sm:w-full" onClick={cancel} data-v2m-cancel data-analytics-label="v2m-cancel">
              <X /> Cancel
            </Button>
          </div>
        </div>
      )}

      {phase === "done" && output && (
        <div className="space-y-3 rounded-[14px] border border-border bg-card p-4">
          <audio controls preload="metadata" src={output.url} className="w-full" aria-label={`Preview of ${output.name}`} />
          <p className="font-mono text-xs text-muted-foreground" data-v2m-summary role="status">
            {formatBytes(output.blob.size)} · {formatDuration(output.seconds)} ·{" "}
            {output.format === "mp3" ? `${output.bitrate} kbps` : "32-bit WAV"} · {output.sampleRate / 1000} kHz{" "}
            {output.channels === 1 ? "mono" : "stereo"}
          </p>
          <div className="flex flex-wrap gap-2 max-sm:flex-col">
            <Button type="button" className="h-11 min-w-0 max-w-full" onClick={download} data-v2m-download data-analytics-label="v2m-download">
              <Download />
              <span className="truncate">Download {output.name}</span>
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={reset} data-analytics-label="v2m-convert-another">
              Convert another
            </Button>
          </div>
        </div>
      )}

      {phase === "error" && error && (
        <ErrorPanel
          error={error}
          onChoose={choose}
          onRetry={
            canRetry
              ? () => {
                  setError(null);
                  setPhase("ready");
                }
              : undefined
          }
        />
      )}

      <div className="flex flex-col items-center gap-3 text-center">
        <p className="paper-trust mt-0">
          <ShieldCheck aria-hidden="true" />
          Your video never leaves your browser
        </p>
        {phase === "empty" && (
          <ul className="flex flex-wrap justify-center gap-2">
            {TRUST_CHIPS.map((chip) => (
              <li key={chip} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                {chip}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
