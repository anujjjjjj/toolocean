import { lazy, Suspense, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { NativeFaq } from "@/components/tool-page/NativeFaq";
import { ToolLinkCard } from "@/components/tools/ToolLinkCard";
import { useStashedFileRoot } from "@/hooks/useStashedFileInput";
import { useToolRunEvent } from "@/hooks/useWorkbenchAnalytics";
import { useSEO } from "@/hooks/useSEO";
import { findLandingPage, type LandingEmbed, type LandingPage } from "@/data/landingPages";
import { findToolBySlug } from "@/data/toolCatalog";
import { buildLandingPageGraph } from "@/lib/landingPageSchema";
import { shellDropzoneCopy } from "@/lib/leanShell";
import { scheduleOfflinePrefetch } from "@/lib/offlinePrefetch";
import { prefetchPdfJs, prefetchPdfLib } from "@/lib/pdf/lazyPdf";
import { prefetchTool } from "@/lib/prefetchTool";
import measurements from "@/data/targetSizeMeasurements.json";
import benchmarks from "@/data/landingBenchmarks.json";
import { formatBytes } from "@/lib/targetSize/parseSize";
import { FORMAT_ACCEPT, FORMAT_LABEL } from "@/lib/image/sniffImageFormat";
import NotFound from "./NotFound";

const ImageCompressorTool = lazy(() =>
  import("@/components/tools/implementations/image/ImageCompressorTool").then((m) => ({ default: m.ImageCompressorTool })),
);
const PdfCompressTool = lazy(() =>
  import("@/components/tools/implementations/pdf/PdfCompressTool").then((m) => ({ default: m.PdfCompressTool })),
);
const ImageFormatConverterTool = lazy(() =>
  import("@/components/tools/implementations/image/ImageFormatConverterTool").then((m) => ({
    default: m.ImageFormatConverterTool,
  })),
);
const HeicToJpgTool = lazy(() =>
  import("@/components/tools/implementations/image/HeicToJpgTool").then((m) => ({ default: m.HeicToJpgTool })),
);
const PdfUnlockTool = lazy(() =>
  import("@/components/tools/implementations/pdf/PdfUnlockTool").then((m) => ({ default: m.PdfUnlockTool })),
);
const ImagesToPdfTool = lazy(() =>
  import("@/components/tools/implementations/pdf/ImagesToPdfTool").then((m) => ({ default: m.ImagesToPdfTool })),
);
const PdfToImagesTool = lazy(() =>
  import("@/components/tools/implementations/pdf/PdfToImagesTool").then((m) => ({ default: m.PdfToImagesTool })),
);

type FixtureRow = {
  fixture: string;
  outputBytes: number;
  targetBytes: number;
  withinTarget: boolean;
  mode?: string;
  textSelectable?: boolean;
  quality?: number;
  scale?: number;
  width?: number;
  height?: number;
  padded?: boolean;
  paddingBytes?: number;
};

const FIXTURES: Record<string, FixtureRow> = {
  ...(measurements.images as Record<string, FixtureRow>),
  ...(measurements.pdfs as Record<string, FixtureRow>),
};

function ToolLinks({ page }: { page: LandingPage }) {
  const tools = page.tools.map((slug) => findToolBySlug(slug)).filter((tool) => tool != null);
  if (!tools.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tools.map((tool) => (
        <ToolLinkCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-06" -> "6 Nov 2026". Fixed format, so prerender and hydration agree. */
function formatCheckedOn(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

const bytes = (n: number) => `${(n / 1024).toLocaleString("en-US", { maximumFractionDigits: 2 })} KB (${n.toLocaleString("en-US")} bytes)`;

/**
 * A table from md up. Below that, paper-table turns each row into a card and
 * prints the column name from data-label, so nothing scrolls sideways at 375px.
 */
function ComparisonTable({ comparison }: { comparison: NonNullable<LandingPage["comparison"]> }) {
  return (
    <table className="paper-table">
      <caption className="sr-only">{comparison.heading}</caption>
      <thead>
        <tr>
          <th scope="col">Question</th>
          <th scope="col">{comparison.competitor}</th>
          <th scope="col">ToolOcean</th>
          <th scope="col">Source</th>
        </tr>
      </thead>
      <tbody>
        {comparison.rows.map((row) => (
          <tr key={row.capability}>
            <th scope="row">{row.capability}</th>
            <td data-label={comparison.competitor}>{row.them}</td>
            <td data-label="ToolOcean">{row.us}</td>
            <td data-label="Source" className="paper-cite">
              <a href={row.source.url} rel="noopener">{row.source.label}</a>
              {", checked "}
              <time dateTime={row.checkedOn}>{formatCheckedOn(row.checkedOn)}</time>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type CompressRun = (typeof benchmarks.compress)[number];

const OUTCOME_LABEL: Record<string, string> = {
  "fit-lossless": "Fit. Lossless rewrite",
  "fit-raster": "Fit. Pages saved as JPEG",
  "cannot-fit-over-target": "Cannot fit. Smallest copy downloaded, still over",
  "cannot-fit-refused": "Cannot fit. Nothing downloaded",
};

function fixtureLabel(file: string) {
  const fixture = benchmarks.fixtures.find((entry) => entry.file === file);
  return fixture ? `${file} (${bytes(fixture.bytes)}, ${fixture.pages} pp)` : file;
}

function timing(row: { runs: number; msMedian: number | null; msMin: number | null; msMax: number | null }) {
  if (row.msMedian == null || row.msMin == null || row.msMax == null) return "Not timed";
  const ms = (n: number) => n.toLocaleString("en-US");
  return `${ms(row.msMedian)} ms median (${ms(row.msMin)}–${ms(row.msMax)}), ${row.runs} runs`;
}

/** The tool's note gives the smallest raster attempt in its own KB format, e.g. "181.8 KB". */
const smallestAttempt = (note: string | null) => note?.match(/still ([\d.]+ KB)/)?.[1] ?? "not reported";

function outputCell(row: CompressRun) {
  if (row.outcome === "cannot-fit-refused") {
    return `None. The tool said re-encoding would make the file bigger and kept the original. Smallest raster attempt: ${smallestAttempt(row.note)}.`;
  }
  return row.outputBytes.map(bytes).join(" or ");
}

function textCell(row: CompressRun) {
  if (row.outcome === "cannot-fit-refused") return "Original kept; nothing changed";
  if (row.textSelectable) return "Selectable";
  return row.page1Ppi ? `Not selectable. Page image about ${row.page1Ppi} ppi` : "Not selectable";
}

function FixtureHashes({ files }: { files: string[] }) {
  return (
    <ul className="paper-hashes">
      {benchmarks.fixtures
        .filter((fixture) => files.includes(fixture.file))
        .map((fixture) => (
          <li key={fixture.file}>
            <span>{fixture.file}</span> <code>{fixture.sha256}</code>
          </li>
        ))}
    </ul>
  );
}

const env = benchmarks.environment;

function CompressBenchmark() {
  const bodyRequests = benchmarks.compress.reduce((sum, row) => sum + row.requestsWithBodyAfterChoosing, 0);
  return (
    <>
      <table className="paper-table">
        <caption className="sr-only">Measured runs of the PDF size tool</caption>
        <thead>
          <tr>
            <th scope="col">Test file</th>
            <th scope="col">Target</th>
            <th scope="col">Result</th>
            <th scope="col">Output</th>
            <th scope="col">Text</th>
            <th scope="col">Time</th>
          </tr>
        </thead>
        <tbody>
          {benchmarks.compress.map((row) => (
            <tr key={`${row.fixture}-${row.targetBytes}`}>
              <th scope="row">{fixtureLabel(row.fixture)}</th>
              <td data-label="Target">{bytes(row.targetBytes)}</td>
              <td data-label="Result">{OUTCOME_LABEL[row.outcome]}</td>
              <td data-label="Output">{outputCell(row)}</td>
              <td data-label="Text">{textCell(row)}</td>
              <td data-label="Time">{timing(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        {bodyRequests === 0
          ? "No request with a body left the page after the file was chosen, in any of these runs."
          : `${bodyRequests} request(s) with a body were seen after a file was chosen; see the data file.`}
      </p>
      <p>
        Same file at device scale 2:{" "}
        {benchmarks.pixelRatioCheck
          .map((check) =>
            check.outputBytes != null
              ? `${check.fixture} at ${bytes(check.targetBytes)} gave ${bytes(check.outputBytes)}`
              : `${check.fixture} at ${bytes(check.targetBytes)} still could not fit, smallest raster attempt ${smallestAttempt(check.note)}`,
          )
          .join("; ")}
        . Pages are drawn at a fixed scale rather than the screen's pixel ratio, but text rendering can still differ
        slightly, so treat byte counts as this run rather than a constant.
      </p>
      <p>
        Measured {formatCheckedOn(benchmarks.measuredOn)} ({benchmarks.timeZone}) in {env.browser} on {env.os}, {env.cpu},{" "}
        {env.ramGiB} GiB RAM, site built from commit {env.commit}, viewport {env.viewport} at device scale{" "}
        {env.deviceScaleFactor}. {benchmarks.method} 1 KB = {benchmarks.kb} bytes. One desktop machine; phones, Safari and
        real scans were not tested.
      </p>
      <p>
        The test files are generated, not collected: invented text and seeded noise from seed {benchmarks.fixtureRecipe.seed}{" "}
        ({benchmarks.fixtureRecipe.prng}), so they hold nothing personal and can be rebuilt byte for byte. SHA-256:
      </p>
      <FixtureHashes files={benchmarks.compress.map((row) => row.fixture)} />
    </>
  );
}

function MergeBenchmark() {
  const merge = benchmarks.merge;
  return (
    <>
      <table className="paper-table">
        <caption className="sr-only">Measured runs of Merge PDF</caption>
        <thead>
          <tr>
            <th scope="col">Files, in order</th>
            <th scope="col">Merged file</th>
            <th scope="col">Text</th>
            <th scope="col">Time</th>
            <th scope="col">Requests with a body after choosing files</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{merge.files.map(fixtureLabel).join(" + ")}</th>
            <td data-label="Merged file">
              {merge.outputBytes.map(bytes).join(" or ")}, {merge.pages} pages
            </td>
            <td data-label="Text">{merge.textSelectable ? "Selectable on page 1" : "Not selectable"}</td>
            <td data-label="Time">{timing(merge)}</td>
            <td data-label="Requests with a body after choosing files">
              {merge.requestsWithBodyAfterChoosing}. Analytics was blocked; the tool-run event it would have sent
              carried only tool "{merge.toolRunEvent?.tool}" and slug "{merge.toolRunEvent?.slug}"
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Offline repeat: after the files were chosen the browser was switched offline, and the merge still produced{" "}
        {bytes(merge.offline.outputBytes)} and {merge.offline.pages} pages.
      </p>
      <p>
        Setup for these runs: {env.browser}; {env.os}; {env.cpu}; {env.ramGiB} GiB RAM; commit {env.commit}; date{" "}
        {formatCheckedOn(benchmarks.measuredOn)}, {benchmarks.timeZone}. Every run opened the built Merge PDF page in a new
        browser context, handed all three files to its file input in one selection, and timed from pressing Merge &amp;
        Download until merged.pdf reached the download. Analytics hosts were blocked before the page loaded. No phone or
        Safari runs.
      </p>
      <p>
        All three inputs come from a seeded generator (seed {benchmarks.fixtureRecipe.seed}) and contain made-up words and
        pixel noise only. Their hashes, if you rebuild them:
      </p>
      <FixtureHashes files={merge.files} />
    </>
  );
}

function Benchmark({ benchmark }: { benchmark: NonNullable<LandingPage["benchmark"]> }) {
  return (
    <section id="measured" aria-labelledby="measured-heading" className="pb-10">
      <h2 id="measured-heading" className="mb-2 text-xl font-semibold tracking-[-0.015em]">{benchmark.heading}</h2>
      <p className="mb-4 max-w-[68ch] text-sm text-muted-foreground">{benchmark.intro}</p>
      <div className="paper-evidence">{benchmark.key === "compress-100kb" ? <CompressBenchmark /> : <MergeBenchmark />}</div>
    </section>
  );
}

function PresetTool({ embed }: { embed: LandingEmbed }) {
  switch (embed.tool) {
    case "image-compressor":
      return <ImageCompressorTool preset={{ targetBytes: embed.targetBytes }} />;
    case "pdf-compress":
      return <PdfCompressTool preset={{ targetBytes: embed.targetBytes }} />;
    case "image-format-converter":
      return <ImageFormatConverterTool preset={{ input: embed.input, output: embed.output }} />;
    case "heic-to-jpg":
      return <HeicToJpgTool preset={{ format: embed.format }} />;
    case "pdf-unlock":
      return <PdfUnlockTool />;
    case "images-to-pdf":
      return <ImagesToPdfTool preset={{ input: embed.input }} />;
    case "pdf-to-images":
      return <PdfToImagesTool preset={{ output: embed.output }} />;
    default:
      return assertNever(embed);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled landing embed: ${JSON.stringify(value)}`);
}

function pickerLabel(embed: LandingEmbed) {
  if (embed.tool === "images-to-pdf") return `Choose ${FORMAT_LABEL[embed.input]} images`;
  if (embed.tool === "image-format-converter") return `Choose ${FORMAT_LABEL[embed.input]}`;
  if (embed.tool.startsWith("pdf-")) return "Choose a PDF";
  if (embed.tool === "heic-to-jpg") return "Choose HEIC photos";
  return "Choose an image";
}

/** The shell dropzone for this embed. Single-format pages narrow the parent tool's copy. */
function embedDropzoneCopy(embed: LandingEmbed) {
  const base = shellDropzoneCopy(embed.tool);
  if (!base) return base;
  if (embed.tool === "image-format-converter") {
    const label = FORMAT_LABEL[embed.input];
    return {
      ...base,
      accept: FORMAT_ACCEPT[embed.input],
      multiple: false,
      title: `Drop a ${label} here`,
      hint: `or click to browse · ${label} only`,
    };
  }
  if (embed.tool !== "images-to-pdf") return base;
  const label = FORMAT_LABEL[embed.input];
  return {
    ...base,
    accept: FORMAT_ACCEPT[embed.input],
    multiple: true,
    title: `Drop ${label} images here`,
    hint: `or click to browse · ${label} only · multiple files`,
  };
}

function EmbeddedTool({ embed, slug }: { embed: LandingEmbed; slug: string }) {
  const { tool } = embed;
  const ref = useRef<HTMLDivElement>(null);
  useStashedFileRoot(ref, true);
  // tool-run reports the embedded tool's id under this page's own slug.
  useToolRunEvent(tool, slug);
  useEffect(() => scheduleOfflinePrefetch(tool), [tool]);
  const drop = embedDropzoneCopy(embed);
  const warm = () => {
    prefetchTool(tool, "hover");
    if (tool === "images-to-pdf") prefetchPdfLib();
    if (tool.startsWith("pdf-")) {
      prefetchPdfLib();
      prefetchPdfJs();
    }
  };
  return (
    <div ref={ref} data-lean-embed={tool} className="mb-8">
      {drop && (
        <FileDropzone
          accept={drop.accept}
          multiple={drop.multiple}
          title={drop.title}
          hint={drop.hint}
          buttonLabel={pickerLabel(embed)}
          onIntent={warm}
        />
      )}
      <Suspense fallback={null}>
        <PresetTool embed={embed} />
      </Suspense>
    </div>
  );
}

function RelatedPages({ links }: { links: NonNullable<LandingPage["related"]> }) {
  return (
    <nav aria-label="Related pages" className="mt-6">
      <h3 className="mb-2 text-[15px] font-medium">Related pages</h3>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {links.map((link) => (
          <li key={link.path}>
            <Link to={link.path} className="font-medium text-foreground underline decoration-border underline-offset-[3px] hover:decoration-foreground">
              {link.label}
            </Link>
            {". "}
            {link.note}
          </li>
        ))}
      </ul>
    </nav>
  );
}

const LandingRoutePage = () => {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, "").replace(/\/$/, "");
  const page = findLandingPage(slug);

  useSEO({
    title: page?.seo.title ?? "Page Not Found",
    description: page?.seo.description ?? "",
    path: page ? `/${page.slug}` : `/${slug ?? ""}`,
    keywords: page?.seo.keywords,
    noindex: !page,
    jsonLd: page ? [buildLandingPageGraph(page)] : undefined,
  });

  if (!page) return <NotFound />;

  const steps = page.howTo?.steps ?? [];
  const visibleSteps = steps.slice(0, 3);
  const extraSteps = steps.slice(3);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 md:px-8">
        <div className="flex flex-col md:contents">
        <div className="max-md:hidden">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: page.h1, path: `/${page.slug}` }]} />
        </div>
        <h1 className="order-1 max-w-[28ch] pt-2 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground md:pt-0 md:text-[34px]">
          {page.h1}
        </h1>
        <p className="order-3 mt-2 max-w-[62ch] text-muted-foreground md:order-none md:mb-6">{page.lede}</p>

        <section id="tools" aria-labelledby="tools-heading" className="order-2 flex flex-col pb-10 md:order-none">
          <div className="order-2 mt-8 md:order-none md:mt-0">
            <h2 id="tools-heading" className="mb-2 text-xl font-semibold tracking-[-0.015em]">Start here</h2>
            <p className="mb-4 text-sm text-muted-foreground">Every one of these runs entirely in your browser.</p>
          </div>
          {page.embed && (
            <div className="order-1 md:order-none">
              <EmbeddedTool embed={page.embed} slug={page.slug} />
              {page.measurementKey && FIXTURES[page.measurementKey] && (
                <FixtureNote row={FIXTURES[page.measurementKey]} />
              )}
            </div>
          )}
          <div className="order-3 md:order-none">
            <ToolLinks page={page} />
            {page.related && page.related.length > 0 && <RelatedPages links={page.related} />}
          </div>
        </section>
        </div>

        {page.howTo && visibleSteps.length > 0 && (
          <section id="how-it-works" aria-labelledby="how-it-works-heading" className="pb-10">
            <h2 id="how-it-works-heading" className="mb-4 text-xl font-semibold tracking-[-0.015em]">
              {page.howTo.name}
            </h2>
            <ol className="paper-steps">
              {visibleSteps.map((step, index) => (
                <li key={step.title}>
                  <span className="paper-step-n" aria-hidden="true">{index + 1}</span>
                  <div>
                    <b className="block text-[15px] font-medium">{step.title}</b>
                    <span className="text-sm text-muted-foreground">{step.body}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {page.steps && (
          <section id="steps" aria-labelledby="steps-heading" className="pb-10">
            <h2 id="steps-heading" className="mb-4 text-xl font-semibold tracking-[-0.015em]">{page.steps.heading}</h2>
            <ol className="paper-steps">
              {page.steps.items.map((step, index) => (
                <li key={step.title}>
                  <span className="paper-step-n" aria-hidden="true">{index + 1}</span>
                  <div>
                    <b className="block text-[15px] font-medium">{step.title}</b>
                    <span className="text-sm text-muted-foreground">{step.body}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {page.comparison && (
          <section id="comparison" aria-labelledby="comparison-heading" className="pb-10">
            <h2 id="comparison-heading" className="mb-2 text-xl font-semibold tracking-[-0.015em]">{page.comparison.heading}</h2>
            <p className="mb-4 max-w-[68ch] text-sm text-muted-foreground">{page.comparison.intro}</p>
            <ComparisonTable comparison={page.comparison} />
          </section>
        )}

        {page.benchmark && <Benchmark benchmark={page.benchmark} />}

        <div className="paper-acc">
          <details>
            <summary><h2>About this page</h2></summary>
            <div className="acc-body">
              {extraSteps.length > 0 && (
                <ol>
                  {extraSteps.map((step) => (
                    <li key={step.title}><strong>{step.title}. </strong>{step.body}</li>
                  ))}
                </ol>
              )}
              {page.sections.map((section) => (
                <div key={section.heading}>
                  <h3>{section.heading}</h3>
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              ))}
            </div>
          </details>
        </div>
        <NativeFaq faqs={page.faqs} heading="Frequently asked questions" />
      </main>
      <Footer />
    </div>
  );
};

function FixtureNote({ row }: { row: FixtureRow }) {
  const detail = [
    `Fixture: ${row.fixture}.`,
    `Target ${formatBytes(row.targetBytes)} (${row.targetBytes} bytes).`,
    `Output ${formatBytes(row.outputBytes)} (${row.outputBytes} bytes).`,
    row.withinTarget ? "The output was within the target." : "The output was still over the target.",
    row.mode ? `PDF path: ${row.mode}.` : "",
    row.textSelectable === true ? "Text stayed selectable." : "",
    row.textSelectable === false ? "Text is not selectable in that copy." : "",
    row.width ? `Pixels ${row.width}×${row.height}, scale ${row.scale}, JPEG quality ${row.quality}.` : "",
    row.padded ? `Padding ${row.paddingBytes} bytes.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return <p className="mb-6 text-sm text-muted-foreground">{detail} 1 KB = 1024 bytes. These figures are the stored fixture run, not a prediction for a different file.</p>;
}

export default LandingRoutePage;
