import {
  CATEGORY_INDEX,
  CATEGORY_LABEL,
  TOOL_CATALOG,
  findToolBySlug,
  legacyPathsFor,
  toolPath,
  type CatalogTool,
} from "@/data/toolCatalog";
import { CATEGORY_PROFILES } from "@/data/toolCategoryProfiles";
import { getToolSeo } from "@/data/toolSeo";
import { TOOL_CONTENT_OVERRIDES } from "@/data/toolContent";
import type { RelatedToolLink, ToolFaqEntry, ToolPageContent } from "@/types/toolContent";

/**
 * Produces a complete, non-thin ToolPageContent for any tool in the catalog.
 *
 * Three layers, most specific winning:
 *   1. Hand-authored override  (src/data/toolContent/*) — examples, use cases,
 *      bespoke FAQs and hero copy for tools worth the writing time.
 *   2. Existing per-tool SEO   (src/data/toolSeo.ts) — already covers all 116
 *      tools with a real title, description, keywords and 2–4 genuine FAQs.
 *   3. Category profile        (toolCategoryProfiles.ts) — the privacy/offline
 *      facts and the paste→run→copy flow, which really are identical per category.
 *
 * Sections with nothing truthful to say render nothing at all. That is a
 * deliberate choice: an absent "Examples" section costs less than a fabricated
 * one, both for the reader and under Google's scaled-content guidance.
 */

/** How strongly two tools are related, used to pick internal links. */
function relatednessScore(tool: CatalogTool, candidate: CatalogTool): number {
  if (candidate.id === tool.id) return -1;

  let score = 0;
  if (candidate.category === tool.category) score += 2;

  const keywords = new Set(tool.keywords.map((k) => k.toLowerCase()));
  for (const keyword of candidate.keywords) {
    if (keywords.has(keyword.toLowerCase())) score += 3;
  }

  // Name-token overlap catches pairs the keyword lists miss, e.g. "JSON Minifier"
  // against "JSON Formatter" when only one of them tagged "minify".
  const nameTokens = new Set(
    tool.name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2),
  );
  for (const token of candidate.name.toLowerCase().split(/[^a-z0-9]+/)) {
    if (token.length > 2 && nameTokens.has(token)) score += 1;
  }

  return score;
}

function deriveRelated(tool: CatalogTool, limit = 6): RelatedToolLink[] {
  return TOOL_CATALOG.map((candidate) => ({ candidate, score: relatednessScore(tool, candidate) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name))
    .slice(0, limit)
    .map(({ candidate }) => ({
      name: candidate.name,
      path: toolPath(candidate),
      description: candidate.description,
    }));
}

/**
 * Category-level FAQs appended after the tool's own.
 *
 * These are real questions with real answers that happen to have the same answer
 * for every tool in the category, so writing 116 variations of them would add
 * words without adding information.
 */
function categoryFaqs(tool: CatalogTool): ToolFaqEntry[] {
  const profile = CATEGORY_PROFILES[tool.category];
  const isFile = profile.ioMode === "file";

  return [
    {
      question: `Is my ${profile.subject} uploaded to a server?`,
      answer: `No. ${tool.name} is a static page with no backend. Your ${profile.subject} is read and processed by JavaScript running in this tab, and it is never transmitted. You can confirm this by opening your browser's network panel while you use the tool — there are no outbound requests.`,
    },
    {
      question: isFile ? "Is there a file size limit?" : "How much data can I paste in?",
      answer: isFile
        ? "There is no limit imposed by us, because there is no server tier to enforce one. The real constraint is your device's available memory, since the whole file is held in RAM while it is processed. Very large files are slower on phones than on a laptop."
        : "There is no server-side cap. Very large inputs are limited only by your device's memory and will make the page feel slower, since the work happens on the main thread. In practice a few megabytes of text is comfortable.",
    },
    {
      question: "Does it work offline?",
      answer: "Yes, once the page has loaded. The code that does the work is already in your browser at that point, so you can disconnect and keep using it. Reloading the page while offline needs the browser cache to still hold it.",
    },
    {
      question: "Do I need to create an account?",
      answer: "No. There is no sign-up, no email, and no usage tracking tied to an identity. The tool works the first time you open it.",
    },
  ];
}

/** Reuses the already-authored SEO title as a natural H1 by dropping the modifier clause. */
function deriveH1(seoTitle: string | undefined, fallback: string): string {
  if (!seoTitle) return fallback;
  const [head] = seoTitle.split(/\s+[—–|]\s+/);
  return head?.trim() || fallback;
}

export function resolveToolContent(slug: string): ToolPageContent | null {
  const tool = findToolBySlug(slug);
  if (!tool) return null;

  const category = tool.category;
  const profile = CATEGORY_PROFILES[category];
  // toolSeo.ts keys dev tools bare and may scope others as "<prefix>/<id>".
  const routePrefix = category === "dev" ? undefined : CATEGORY_INDEX[category].replace(/^\//, "");
  const seo = getToolSeo(tool.id, routePrefix);
  const override = TOOL_CONTENT_OVERRIDES[tool.id];

  // An override's SEO fields win over the toolSeo.ts baseline, which is itself a
  // fallback for the catalog entry.
  const title = override?.seo?.title ?? seo.title ?? `${tool.name} — Free Online Tool`;
  const description = override?.seo?.description ?? seo.description ?? tool.description;
  const keywords = override?.seo?.keywords ?? seo.keywords ?? tool.keywords;
  const h1 = override?.hero?.h1 ?? deriveH1(title, tool.name);

  // Tool-specific FAQs first — they are the ones a visitor came for. Category
  // FAQs backfill, deduplicated so an authored privacy answer wins over the
  // generic one.
  const authoredFaqs = override?.faqs ?? seo.faqs ?? [];
  const seenQuestions = new Set(authoredFaqs.map((faq) => faq.question.toLowerCase()));
  const faqs = [
    ...authoredFaqs,
    ...categoryFaqs(tool).filter((faq) => !seenQuestions.has(faq.question.toLowerCase())),
  ];

  return {
    slug: tool.id,
    path: toolPath(tool),
    legacyPaths: legacyPathsFor(tool),
    category: { name: CATEGORY_LABEL[category], path: CATEGORY_INDEX[category] },
    seo: {
      title,
      description,
      keywords,
      ogImage: override?.seo?.ogImage,
      datePublished: override?.seo?.datePublished,
      dateModified: override?.seo?.dateModified,
    },
    hero: {
      h1,
      subtitle: override?.hero?.subtitle ?? description,
      badges: override?.hero?.badges ?? profile.badges,
      primaryCta:
        override?.hero?.primaryCta ??
        (profile.ioMode === "file"
          ? { label: `Choose a ${profile.subject}`, action: "upload" }
          : { label: "Start with your own data", action: "scroll" }),
      secondaryCta:
        override?.hero?.secondaryCta ??
        (profile.ioMode === "file" ? undefined : { label: "Open a file", action: "upload" }),
    },
    intro: override?.intro,
    features: override?.features ?? profile.features,
    howItWorks: override?.howItWorks ?? profile.howItWorks,
    // Never invented — an unauthored tool simply has no Examples section.
    examples: override?.examples ?? [],
    useCases: override?.useCases ?? [],
    faqs,
    related: override?.related ?? deriveRelated(tool),
    headings: override?.headings,
  };
}
