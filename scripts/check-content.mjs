/**
 * Build-time guard for per-tool page content.
 *
 * check-catalog.mjs regex-parses TypeScript and so can only assert that entries
 * exist. This runs after the SSR bundle is built and imports the real resolver,
 * so it can assert things about the content itself — which is what the authoring
 * programme actually needs, because the failure mode it has to prevent is not a
 * missing file but 114 pages of plausible-looking near-identical prose.
 *
 * Checks, in rough order of how much they matter:
 *   1. Authored word count against the tool's tier floor.
 *   2. Structural minimums once a tool has been authored.
 *   3. Cross-page duplication, by shingle. This is the real anti-boilerplate
 *      check — everything else can be satisfied by paraphrasing one template.
 *   4. Internal links that do not resolve.
 *   5. Measurements without provenance.
 *   6. A committed ratchet, so an authored page cannot quietly get thinner.
 *
 * Rules 1 and 2 only apply to a tool that declares a `tier`, so the build stays
 * green while the catalogue is still being written.
 *
 *   node scripts/check-content.mjs            # gate
 *   node scripts/check-content.mjs --report   # worst-first table
 *   node scripts/check-content.mjs --update-baseline
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_PATH = join(ROOT, "scripts", "content-baseline.json");
const FIXTURES_PATH = join(ROOT, "docs", "CONTENT_FIXTURES.md");

const report = process.argv.includes("--report");
const updateBaseline = process.argv.includes("--update-baseline");

const {
  resolveToolContent,
  TOOL_CONTENT_OVERRIDES,
  KNOWN_BROKEN,
  toolSeoData,
  SHARED_STRINGS,
  TOOL_CATALOG,
} = await import(pathToFileURL(join(ROOT, "dist-ssg", "entry-ssg.js")).href);

/** Authored word floors by tier. Well under the targets, so a terse tool still passes. */
const FLOORS = { A: 1400, B: 900, C: 600 };

/** Minimum shape once a tool declares a tier. */
const STRUCTURE = {
  introParagraphs: 2,
  authoredFeatures: 3,
  howItWorksSteps: 3,
  examples: 2,
  useCases: 4,
  authoredFaqs: 8,
  limitations: 2,
  related: 4,
};

const failures = [];
const fail = (message) => failures.push(message);

/** Every string reachable in a value, flattened. */
function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) strings(item, out);
  else if (value && typeof value === "object") for (const item of Object.values(value)) strings(item, out);
  return out;
}

const wordsIn = (text) => text.split(/\s+/).filter(Boolean).length;

/*
 * Authored text is whatever a human wrote for this specific tool: its override
 * module plus its toolSeo entry. Resolved content is the wrong thing to count —
 * it includes the shared feature cards, the generated specs table and the
 * generated category FAQs, which is exactly the boilerplate the floors exist to
 * stop standing in for real writing.
 */
function authoredStrings(slug) {
  const shared = new Set(SHARED_STRINGS);

  /*
   * A generated FAQ is shared in both halves, not just its answer. privacyFaq()
   * produces "Are my colour values uploaded to a server?" alongside the shared
   * answer, and flagging that question as duplicated between two colour tools
   * would be flagging the generator for doing its job.
   */
  const sharedFaqStrings = new Set();
  for (const source of [TOOL_CONTENT_OVERRIDES[slug], toolSeoData[slug]]) {
    for (const faq of source?.faqs ?? []) {
      if (shared.has(faq.answer)) {
        sharedFaqStrings.add(faq.answer);
        sharedFaqStrings.add(faq.question);
      }
    }
  }

  return [...strings(TOOL_CONTENT_OVERRIDES[slug] ?? {}), ...strings(toolSeoData[slug] ?? {})].filter(
    (text) => !shared.has(text) && !sharedFaqStrings.has(text),
  );
}

/** Overlapping 8-word windows, normalised, for cross-page duplicate detection. */
function shingles(text, size = 8) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const out = [];
  for (let i = 0; i + size <= words.length; i++) out.push(words.slice(i, i + size).join(" "));
  return out;
}

const fixtures = existsSync(FIXTURES_PATH) ? readFileSync(FIXTURES_PATH, "utf-8") : "";

const rows = [];
const shingleOwners = new Map();

for (const tool of TOOL_CATALOG) {
  const slug = tool.id;
  const content = resolveToolContent(slug);
  if (!content) {
    fail(`${slug}: resolveToolContent returned nothing`);
    continue;
  }

  const override = TOOL_CONTENT_OVERRIDES[slug];
  const authored = authoredStrings(slug);
  const wordCount = authored.reduce((sum, text) => sum + wordsIn(text), 0);
  const tier = content.tier;

  rows.push({ slug, tier: tier ?? "-", words: wordCount, authored: Boolean(override) });

  // KNOWN_BROKEN: refuse content for a tool that does not do what a page would say.
  if (override && KNOWN_BROKEN.includes(slug)) {
    fail(`${slug}: has authored content but is listed in KNOWN_BROKEN — fix the tool or drop the claim first`);
  }

  if (tier) {
    const floor = FLOORS[tier];
    if (wordCount < floor) {
      fail(`${slug}: tier ${tier} needs ${floor} authored words, has ${wordCount}`);
    }

    const authoredFeatures = override?.features?.length ?? 0;
    const authoredFaqs = (override?.faqs ?? toolSeoData[slug]?.faqs ?? []).length;

    if ((override?.intro?.paragraphs?.length ?? 0) < STRUCTURE.introParagraphs)
      fail(`${slug}: needs an intro of at least ${STRUCTURE.introParagraphs} paragraphs`);
    if (authoredFeatures < STRUCTURE.authoredFeatures)
      fail(`${slug}: needs ${STRUCTURE.authoredFeatures} authored feature cards, has ${authoredFeatures}`);
    if ((override?.howItWorks?.length ?? 0) !== STRUCTURE.howItWorksSteps)
      fail(`${slug}: needs exactly ${STRUCTURE.howItWorksSteps} authored how-it-works steps (the layout grid is 3 wide)`);
    if ((content.examples?.length ?? 0) < STRUCTURE.examples)
      fail(`${slug}: needs ${STRUCTURE.examples} worked examples, has ${content.examples?.length ?? 0}`);
    if ((content.useCases?.length ?? 0) < STRUCTURE.useCases)
      fail(`${slug}: needs ${STRUCTURE.useCases} use cases, has ${content.useCases?.length ?? 0}`);
    if (authoredFaqs < STRUCTURE.authoredFaqs)
      fail(`${slug}: needs ${STRUCTURE.authoredFaqs} authored FAQs, has ${authoredFaqs}`);
    if ((content.limitations?.items?.length ?? 0) < STRUCTURE.limitations)
      fail(`${slug}: needs ${STRUCTURE.limitations} stated limitations — every tool has them`);
    if ((content.related?.length ?? 0) < STRUCTURE.related)
      fail(`${slug}: needs ${STRUCTURE.related} related links, has ${content.related?.length ?? 0}`);
  }

  // Internal links must resolve. RelatedTools renders these blindly, so a typo
  // ships a 404 from every page that links it.
  const slugs = new Set(TOOL_CATALOG.map((entry) => entry.id));
  for (const link of content.related ?? []) {
    const target = link.path?.replace(/^\//, "");
    if (target && !slugs.has(target)) fail(`${slug}: related link points at /${target}, which is not a tool`);
  }

  // Measurements must be reproducible, or they are marketing with decimal points.
  if (content.measurements) {
    if (!content.measurements.method?.trim())
      fail(`${slug}: measurements need a method line naming device, browser and date`);
    for (const row of content.measurements.rows ?? []) {
      if (!fixtures.includes(row.scenario))
        fail(`${slug}: measurement "${row.scenario}" is not recorded in docs/CONTENT_FIXTURES.md`);
    }
  }

  // Comparisons must cite where the competitor column came from.
  if (content.comparison && !content.comparison.sourceNote?.trim())
    fail(`${slug}: comparison against ${content.comparison.competitor} needs a sourceNote`);

  /*
   * Cross-page duplication, over authored text only.
   *
   * This is the check that actually enforces the content model. Word floors and
   * section counts can all be satisfied by one template with the nouns swapped;
   * an 8-word phrase appearing on two pages cannot. SHARED_STRINGS carries the
   * deliberate exceptions — statements about the architecture that are true in
   * the same way everywhere.
   */
  for (const text of authored) {
    for (const shingle of shingles(text)) {
      const owner = shingleOwners.get(shingle);
      if (owner && owner !== slug) {
        fail(`${slug}: shares an 8-word phrase with ${owner} — "${shingle}"`);
      } else if (!owner) {
        shingleOwners.set(shingle, slug);
      }
    }
  }
}

// Ratchet: an authored page must not get thinner.
const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, "utf-8")) : {};
if (updateBaseline) {
  const next = Object.fromEntries(rows.map((row) => [row.slug, row.words]));
  writeFileSync(BASELINE_PATH, JSON.stringify(next, null, 2) + "\n");
  console.log(`✓ content baseline updated for ${rows.length} tools`);
  process.exit(0);
}
for (const row of rows) {
  const previous = baseline[row.slug];
  if (previous !== undefined && row.words < previous) {
    fail(`${row.slug}: authored words dropped ${previous} → ${row.words}; run --update-baseline if intended`);
  }
}

if (report) {
  const sorted = [...rows].sort((a, b) => a.words - b.words);
  console.log("\nslug".padEnd(34) + "tier".padEnd(6) + "authored words");
  console.log("-".repeat(58));
  for (const row of sorted) {
    console.log(row.slug.padEnd(34) + String(row.tier).padEnd(6) + row.words);
  }
  const authoredCount = rows.filter((row) => row.authored).length;
  console.log(
    `\n${rows.length} tools, ${authoredCount} with an authored module, ` +
      `median ${sorted[Math.floor(sorted.length / 2)].words} authored words\n`,
  );
}

if (failures.length > 0) {
  console.error(`\n✗ content: ${failures.length} problem(s)\n${failures.map((f) => `  ${f}`).join("\n")}\n`);
  process.exit(1);
}

const tiered = rows.filter((row) => row.tier !== "-").length;
console.log(`✓ content: ${rows.length} tools, ${tiered} authored to a tier, no duplicate phrasing`);
