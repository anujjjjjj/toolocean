/**
 * The single content contract behind every ToolOcean tool page.
 *
 * A new tool page should only ever require an object of this shape plus the
 * interactive component itself. Layout, schema.org output, breadcrumbs,
 * internal linking, and heading hierarchy are all derived from here, so pages
 * stay consistent across dev / PDF / image / video / audio / AI categories.
 *
 * Authoring rules that keep these pages on the right side of Google's helpful
 * content guidance:
 *   - Every string is read by a human first. Write prose, not keyword filler.
 *   - `answer` and `body` fields should say something a competitor page does
 *     not already say. If a sentence is true of any tool, cut it.
 *   - Never invent ratings, review counts, download counts, or author credits.
 */

/** Trust signals rendered as pills in the hero. Keys map to icon + copy in ToolHero. */
export type ToolBadgeKey =
  | "browser-first"
  | "no-uploads"
  | "offline"
  | "free"
  | "no-signup"
  | "open-source";

export interface ToolCategoryRef {
  /** Human label used in the breadcrumb, e.g. "Developer Tools". */
  name: string;
  /** Route to the category listing page, e.g. "/dev-tools". */
  path: string;
}

export interface ToolSeo {
  /** <title> without the "| ToolOcean" suffix, useSEO appends it. Aim ≤ 60 chars total. */
  title: string;
  /** Meta description. Aim 140–160 characters. Must read as a sentence, not a keyword list. */
  description: string;
  /**
   * Phrases the page is genuinely written to answer. Emitted as meta keywords
   * (harmless, ignored by Google) but their real job is to keep authors honest
   * about what the copy actually covers.
   */
  keywords: string[];
  /** Absolute or root-relative OG image. Falls back to the generated per-tool card. */
  ogImage?: string;
  /** ISO date. Drives schema.org datePublished. */
  datePublished?: string;
  /** ISO date. Drives schema.org dateModified, bump when the copy materially changes. */
  dateModified?: string;
}

export interface ToolCta {
  label: string;
  /**
   * `scroll` moves focus to the workbench and focuses its primary input.
   * `upload` additionally asks the tool to open its file picker.
   */
  action: "scroll" | "upload";
}

export interface ToolHeroContent {
  /** The one H1 on the page. Should contain the primary keyword and read naturally. */
  h1: string;
  /** 1–2 sentences stating exactly what the tool does and what it does not do. */
  subtitle: string;
  badges: ToolBadgeKey[];
  primaryCta: ToolCta;
  secondaryCta?: ToolCta;
}

export interface ToolFeature {
  /** Lucide icon name, resolved in ToolFeatures. */
  icon: string;
  title: string;
  body: string;
}

export interface ToolStep {
  title: string;
  body: string;
}

/**
 * A worked example.
 *
 * Text tools can show real input and real output. File tools cannot, there is
 * no string to print for "compress this 4 MB scan", so they describe a fixture
 * instead. The original shape assumed every tool was a text tool, which left the
 * 52 file tools unable to have an Examples section at all.
 *
 * `kind` is optional on the code variant so existing content keeps compiling;
 * TypeScript still narrows correctly, because only the file variant sets it.
 */
export interface ToolCodeExample {
  kind?: "code";
  title: string;
  /** Why a reader should care about this specific example. */
  description: string;
  /** Must be byte-identical to what the tool actually produces. */
  input: string;
  output: string;
  /** Syntax label shown on the code block, e.g. "json". */
  language: string;
  /** What changed between input and output, and why it matters. */
  explanation: string;
  /** Set false to suppress the "Try this example" button. */
  loadable?: boolean;
}

export interface ToolFileExample {
  kind: "file";
  title: string;
  description: string;
  /** The fixture as it goes in, e.g. "12-page scan, 300 dpi, 4.1 MB". */
  before: { label: string; detail: string };
  /** The result, e.g. "1.6 MB, text layer intact". */
  after: { label: string; detail: string };
  /** Settings used, if they matter to the result. */
  settings?: string;
  explanation: string;
}

export type ToolExample = ToolCodeExample | ToolFileExample;

export interface ToolUseCase {
  icon: string;
  /** Who this is for, e.g. "API debugging". */
  audience: string;
  body: string;
}

/**
 * Subjects the generated category FAQs cover.
 *
 * Tagging them lets an authored answer on the same subject suppress the generic
 * one. Deduplicating by question string does not work: an authored "Is my
 * contract really private?" does not match the generated "Is my PDF uploaded to
 * a server?", so both rendered side by side, inside FAQPage structured data,
 * saying the same thing twice in different words.
 */
export type FaqTopic = "privacy" | "size" | "offline" | "account";

export interface ToolFaqEntry {
  question: string;
  answer: string;
  /** Set on generated entries, and on an authored answer that replaces one. */
  topic?: FaqTopic;
}

export interface RelatedToolLink {
  name: string;
  path: string;
  /** Short reason to click through. This is what makes internal links useful rather than spammy. */
  description: string;
}

/**
 * Per-section heading overrides. Defaults are generic enough for most tools
 * ("Why use this tool"), but a page ranks better when its H2s use the language
 * its audience actually searches with, so every heading is overridable.
 */
export interface ToolSectionHeadings {
  features?: { heading: string; lede?: string };
  howItWorks?: { heading: string; lede?: string };
  examples?: { heading: string; lede?: string };
  useCases?: { heading: string; lede?: string };
  faq?: { heading: string; lede?: string };
  related?: { heading: string; lede?: string };
  specs?: { heading: string; lede?: string };
  measurements?: { heading: string; lede?: string };
  limitations?: { heading: string; lede?: string };
  comparison?: { heading: string; lede?: string };
  scenarios?: { heading: string; lede?: string };
}

/**
 * "What happens to your data", a short spec table.
 *
 * Deliberately near-identical between tools and deliberately short. It is a
 * spec, not prose, so it is excluded from the authored-word count and is not
 * expected to be rewritten per page. Its job is to make the architectural claim
 * checkable at a glance, and machine-readable. The three tools that genuinely
 * reach the network say so here rather than quietly matching the others.
 */
export interface ToolSpec {
  label: string;
  value: string;
}

/**
 * A real measurement from a real run.
 *
 * The least copyable thing on the site: an upload-based competitor cannot
 * publish "4.1 MB to 1.6 MB in 2.3 s" without disclosing their own numbers.
 * It also answers the questions people actually search, "how much can you
 * compress a PDF", "will compressing a PDF lose quality".
 *
 * Numbers must come from a fixture in docs/CONTENT_FIXTURES.md. Inventing them
 * would make the one genuinely unfakeable asset on the site fake.
 */
export interface ToolMeasurement {
  /** The fixture, e.g. "12-page scanned invoice, 300 dpi". */
  scenario: string;
  input: string;
  output: string;
  timing?: string;
  note?: string;
}

export interface ToolMeasurementTable {
  heading?: string;
  lede?: string;
  /** Provenance: device, browser, version, date. Required, see check-content.mjs. */
  method: string;
  rows: ToolMeasurement[];
}

/**
 * What the tool cannot do.
 *
 * Nobody in this market publishes these, which is exactly why they are worth
 * publishing. `alternative` may name a competitor where one honestly does the
 * job better; conceding that is what makes the rest of the page credible.
 */
export interface ToolLimitation {
  title: string;
  body: string;
  alternative?: string;
}

/**
 * A scoped comparison against one named incumbent.
 *
 * Only on the handful of pages where the comparison is the reader's actual
 * question. A table on all 114 would be the boilerplate this content model
 * exists to remove, and 114 pages naming competitors reads as parasitic.
 */
export interface ToolComparisonRow {
  capability: string;
  /** Must be verifiable from the competitor's own public documentation. */
  them: string;
  /** Must be true of this tool right now. */
  us: string;
}

export interface ToolComparison {
  heading?: string;
  competitor: string;
  rows: ToolComparisonRow[];
  /** Where the "them" column came from. Required. */
  sourceNote: string;
}

/**
 * A specific job someone arrives wanting to do.
 *
 * "Open a password-protected ZIP", "extract one subfolder without downloading
 * the whole archive". This is long-tail capture that is also genuinely useful,
 * which is the only kind worth writing.
 */
export interface ToolScenario {
  question: string;
  answer: string;
}

/**
 * Authoring depth, which sets the build-time word floor.
 *
 * A, head terms and the pages competing with a dedicated incumbent.
 * B, real demand, less contested.
 * C. The long tail, mostly developer tools.
 */
export type ToolTier = "A" | "B" | "C";

export interface ToolPageContent {
  /** Stable id, matches the tool registry key. */
  slug: string;
  /** Canonical route for this page, e.g. "/json-formatter". */
  path: string;
  /** Older routes that must keep working and point their canonical here. */
  legacyPaths?: string[];
  category: ToolCategoryRef;
  seo: ToolSeo;
  hero: ToolHeroContent;
  /**
   * Optional prose that sits directly under the workbench. Use it for the
   * genuinely useful background a search visitor wants, not an SEO paragraph.
   */
  intro?: { heading: string; paragraphs: string[] };
  features: ToolFeature[];
  howItWorks: ToolStep[];
  examples: ToolExample[];
  useCases: ToolUseCase[];
  faqs: ToolFaqEntry[];
  related: RelatedToolLink[];
  headings?: ToolSectionHeadings;
  specs?: ToolSpec[];
  measurements?: ToolMeasurementTable;
  limitations?: { heading?: string; lede?: string; items: ToolLimitation[] };
  comparison?: ToolComparison;
  scenarios?: { heading?: string; lede?: string; items: ToolScenario[] };
  /** Set once a tool has been authored. Drives the build-time content floors. */
  tier?: ToolTier;
  /**
   * Suppress the shared category feature cards. Only for a page whose own
   * authored features already make the architectural point better.
   */
  dropSharedFeatures?: boolean;
}
