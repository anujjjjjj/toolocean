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
  /** <title> without the "| ToolOcean" suffix — useSEO appends it. Aim ≤ 60 chars total. */
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
  /** ISO date. Drives schema.org dateModified — bump when the copy materially changes. */
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

export interface ToolExample {
  title: string;
  /** Why a reader should care about this specific example. */
  description: string;
  input: string;
  output: string;
  /** Syntax label shown on the code block, e.g. "json". */
  language: string;
  /** What changed between input and output, and why it matters. */
  explanation: string;
}

export interface ToolUseCase {
  icon: string;
  /** Who this is for, e.g. "API debugging". */
  audience: string;
  body: string;
}

export interface ToolFaqEntry {
  question: string;
  answer: string;
}

export interface RelatedToolLink {
  name: string;
  path: string;
  /** Short reason to click through — this is what makes internal links useful rather than spammy. */
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
}

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
   * genuinely useful background a search visitor wants — not an SEO paragraph.
   */
  intro?: { heading: string; paragraphs: string[] };
  features: ToolFeature[];
  howItWorks: ToolStep[];
  examples: ToolExample[];
  useCases: ToolUseCase[];
  faqs: ToolFaqEntry[];
  related: RelatedToolLink[];
  headings?: ToolSectionHeadings;
}
