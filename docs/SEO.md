# ToolOcean SEO architecture & audit

How tool pages are built, what was wrong before, what is still open, and the
JSON topical cluster.

---

## 1. Architecture

### One template, 114 tools

Every tool page renders through `ToolPageLayout`, driven by a single
`ToolPageContent` object (`src/types/toolContent.ts`). Nothing about layout,
heading order, structured data, or internal linking is written per page.

Content resolves in three layers, most specific winning
(`src/lib/toolContentResolver.ts`):

| Layer | Source | Covers |
|---|---|---|
| 1. Authored | `src/data/toolContent/*` | Examples, use cases, bespoke FAQs, hero copy |
| 2. Per-tool SEO | `src/data/toolSeo.ts` | Title, description, keywords, 2–4 real FAQs, **all 114 tools** |
| 3. Category profile | `src/data/toolCategoryProfiles.ts` | Privacy/offline facts, paste→run→copy flow |

Sections with nothing truthful to say **render nothing**. `/pdf-merge` has no
Examples section because none has been written; it does not get a fabricated one.
That is deliberate. An absent section costs less than an invented one, both for
the reader and under Google's scaled-content guidance.

### Adding a tool

1. Add the entry to `src/data/toolCatalog.ts` (or `tools.json` for dev tools).
2. Add the component to `src/lib/lazyToolRegistry.ts`.
3. Add an entry to `src/data/toolSeo.ts`.

`npm run build` fails if a slug collides or a tool has no SEO entry
(`scripts/check-catalog.mjs`). Routing, sitemap, palette, and breadcrumbs derive
automatically.

### Build pipeline

```
check:catalog → sitemap → build:client → build:ssg → prerender
```

`scripts/prerender.mjs` emits 125 static HTML files, each with a complete `<head>`
and fully rendered body. `main.tsx` calls `hydrateRoot` to adopt that markup.

---

## 2. What was actually broken

These were the ranking blockers, in order of severity. All are fixed.

| # | Problem | Evidence | Fix |
|---|---|---|---|
| 1 | **Zero crawlable HTML.** SPA shipped `<div id="root"></div>`. Every title, meta, canonical and JSON-LD was written by JS after hydration. | `dist/index.html` had no content | SSG via `renderToPipeableStream` + `onAllReady` |
| 2 | **4.0 MB JS bundle on every route**, including the homepage, all 114 tools plus pdf-lib, pdfjs, xlsx, docx, recharts | `dist/assets/index-*.js` = 4.0 MB | Per-tool `React.lazy` + per-route splitting |
| 3 | **Entire lucide icon set in the entry chunk.** `import * as Icons from "lucide-react"` is not tree-shakeable | 1,547 icon refs for 75 icons actually used | Generated `src/lib/toolIcons.ts` |
| 4 | **og:image was an SVG.** Facebook, X, LinkedIn and Slack all reject SVG. Every shared link had no preview | `DEFAULT_OG_IMAGE = /favicon.svg` | `public/og-default.png` (1200×630) |
| 5 | **Duplicate content.** `color-converter` and `timestamp-converter` served the same component at two URLs each | Same import in two registries | One canonical slug + 301s |
| 6 | **Prerender/client title divergence.** Listing pages set titles differing from the served HTML | Homepage: 2 different titles | `src/data/staticPageSeo.ts`, single source |
| 7 | **Two dead scaffold deps**. A `QueryClientProvider` with no queries, and `sonner` mounted but never called | ~60 kB | Removed |
| 8 | **Soft 404s.** SPA fallback returned 200 for any URL |, | Real `404.html` + host config |

### Measured result

| Metric | Before | After |
|---|---:|---:|
| Entry JS (raw) | 4,000 kB | 426 kB |
| Entry JS (gzip) | ~1,000 kB | 130 kB |
| Crawlable HTML pages | 0 | 125 |
| Critical path, `/json-formatter` (gzip) | ~1 MB, no content | **218 kB, full content** |

Verified in headless Chrome: correct H1, tool mounts, React hydrates,
**zero console messages** (no hydration mismatch) on `/`, `/json-formatter`,
`/pdf-merge`.

---

## 3. Audit, `/json-formatter`

Scored as a search quality engineer would, on the page as it now stands.

| Dimension | Score | Notes |
|---|---:|---|
| Crawlability & indexation | 19/20 | Static HTML, correct canonical, clean sitemap, real 404. −1: 301s depend on host config being applied |
| Content quality | 21/25 | 15 authored FAQs, 3 verified examples, 6 use cases. Genuinely covers things competitors miss (integer precision loss, duplicate-key behaviour, integer-like key ordering). −4: no original research, no visual/video asset |
| Structured data | 10/10 | Connected `@graph`, 6 node types, cross-referenced `@id`s, no fabricated ratings |
| Core Web Vitals | 16/20 | 218 kB critical path, text LCP, reserved workbench height so no CLS. −4: 130 kB entry JS, third-party font origin |
| Accessibility | 8/10 | Skip link, labelled regions, correct heading order, live status region, `aria-hidden` gutter. −2: contrast and full SR traversal unverified |
| Internal linking | 8/10 | Descriptive related-tool links from keyword-overlap scoring, breadcrumbs. −2: no in-content contextual links, no JSON hub page |
| E-E-A-T | 3/5 | Clear what the site is and how it works. −2: no named author, no About page, no external citations |

### **Total: 85/100**

For calibration, the same page before this work scored roughly **35/100**, the
empty-shell HTML alone caps everything else.

### Why not 95+

The remaining 15 points are honestly **not reachable by code changes alone**, and
I would rather say so than inflate the number:

| Gap | Points | Who closes it |
|---|---:|---|
| Author identity + About page + real organisation detail | 2 | You, needs a real person's name and credentials |
| Off-page authority (this page has no backlinks) | ~4 | Outreach, not code. The single biggest real-world ranking factor left |
| Deep authoring for the other 113 tools | 4 | ~2–4 hours per flagship tool of genuine writing |
| Field CWV data (CrUX) confirming lab numbers | 2 | Needs real traffic |
| Original research / unique assets (benchmarks, diagrams) | 3 | Content investment |

**What I would do next, in order:**

1. **Self-host the two fonts** (removes a third-party origin from the critical
   path; worth ~2 CWV points). Add `size-adjust` descriptors to the fallback face
   to eliminate swap reflow.
2. **Author the next 5 tools** by search demand, `json-minifier`,
   `base64-tool`, `jwt-decoder`, `regex-tester`, `uuid-generator`.
3. **Build a `/json-tools` hub** linking the whole cluster with real context.
4. **Add an About page** with a named maintainer and a plain explanation of the
   no-backend architecture. This is the cheapest E-E-A-T win available.
5. **Per-tool OG images** (`scripts/generate-og-image.mjs` is already
   parameterisable), meaningful for CTR wherever links get shared.

### Deliberately not done

- **No `aggregateRating`/`reviewCount`.** We have no reviews. Fabricating them is
  a structured-data spam violation and risks a manual action. This is the most
  common bad advice in "tool page SEO" guides.
- **No `HowTo` schema.** Google retired HowTo rich results in 2023. The steps are
  already an ordered list in the visible HTML.
- **`FAQPage` is emitted but will not produce rich results.** Google restricted
  FAQ rich results to recognised government and health sites in August 2023. It
  is kept as a clean machine-readable statement of the Q&A for answer engines and
  non-Google consumers, not because it will win a SERP enhancement.

---

## 4. Cross-cutting improvements

**Core Web Vitals**
- Text LCP (the H1) is prerendered. No image or JS dependency.
- Workbench reserves its height before the tool loads, so the swap causes no CLS.
- Tool code is a separate chunk; a reader who never touches the editor never
  downloads it.
- Open: self-host fonts; consider serialising resolved content into the HTML to
  drop `toolSeo.ts` (~54 kB gzip) from the client.

**Accessibility**
- Skip link to the workbench, search visitors want the tool, not the nav.
- `Section` wires every `<section>` to its heading via `aria-labelledby`.
- Radix's `Accordion.Header` supplies the FAQ `<h3>`; adding our own would nest a
  heading inside a `<button>` (invalid, `button` takes phrasing content only).
- Editor gutter is `aria-hidden`; status bar is a polite live region.
- `Tab` inserts spaces but `Shift+Tab` still escapes the textarea, so keyboard
  users are never trapped.

**Structured data**
- One `@graph` with cross-referenced `@id`s rather than disconnected scripts, so
  a parser resolves the page to one entity.
- FAQ answers use `forceMount` and are therefore in the DOM even when collapsed.
  Without it Radix unmounts them and the JSON-LD would claim content the page
  does not contain.

**Internal linking**
- Related tools are scored by keyword and name-token overlap, not picked at
  random, and each link carries a real reason to click.

**Content**
- Every factual claim on the JSON page is verified: the example outputs are
  byte-identical to what the tool produces, and the error string
  `Expected double-quoted property name, line 4, column 1` was confirmed against
  the live tool in a browser.

---

## 5. JSON topical cluster, 20 pages

The site already has 16 JSON-adjacent tools. These 20 are **new**, chosen for real
search demand and for reinforcing `/json-formatter` as the cluster hub.

### Tools (high commercial intent)

| # | Page | Slug | Why |
|---|---|---|---|
| 1 | JSON Diff / Compare | `/json-diff` | Highest-demand JSON tool the site lacks. Structural diff, not text diff |
| 2 | JSON to TypeScript | `/json-to-typescript` | Very high developer demand; strong repeat use |
| 3 | JSONPath Tester | `/jsonpath-tester` | Evaluate expressions against a document live |
| 4 | JSON Schema Generator | `/json-schema-generator` | Infer a schema from a sample, pairs with the existing validator |
| 5 | JSON to Go Struct | `/json-to-go` | Well-established query with steady volume |
| 6 | JSON to C# / Java Class | `/json-to-class` | Enterprise long tail |
| 7 | JSON Escape / Unescape | `/json-escape` | Distinct intent from `json-stringify`, which already exists |
| 8 | JSON Lines (NDJSON) Converter | `/ndjson-converter` | Answers a real limitation called out in the formatter's FAQ |
| 9 | JSON to SQL INSERT | `/json-to-sql` | Common data-migration chore |
| 10 | Large JSON Viewer | `/json-viewer` | Tree explorer for files too big to read as text, plays directly to the browser-first pitch |
| 11 | JSON to Query String | `/json-to-query-string` | Small, fast, links well |
| 12 | JSON Mock Data Generator | `/json-mock-generator` | Generate fixtures from a schema |
| 13 | JSON to Markdown Table | `/json-to-markdown-table` | Docs/README workflow |
| 14 | JSON Size Analyser | `/json-size-analyzer` | Which keys dominate payload size, genuinely novel |
| 15 | JSON Sort Keys | `/json-sort-keys` | Exists as a formatter option; deserves its own page for the query |

### Articles (informational intent, these earn the links)

| # | Page | Slug | Angle |
|---|---|---|---|
| 16 | What is JSON? | `/guides/what-is-json` | Primer; top-of-funnel, links down to every tool |
| 17 | Common JSON syntax errors and how to fix them | `/guides/json-syntax-errors` | Maps each engine's error wording to a cause, reuses real research already in `jsonUtils.ts` |
| 18 | Why large integers break in JSON | `/guides/json-large-numbers` | Deep dive on IEEE-754 and snowflake IDs. Genuinely under-served and highly linkable |
| 19 | JSON vs YAML vs TOML | `/guides/json-vs-yaml-vs-toml` | Comparison intent; feeds the existing converters |
| 20 | JSON API design conventions | `/guides/json-api-conventions` | Naming, dates, nulls, big integers |

**Structure.** Build `/json-tools` as the hub. Every tool page links up to it;
the hub links down to all 35 JSON pages with real descriptions. Articles link
laterally into the tools they mention. Items 17 and 18 are the two most likely to
attract links naturally. The underlying research is already done and verified in
this codebase.

**Sequencing.** 1, 2, 10, 17, 18 first: highest demand, and each has a clear
reason to exist beyond capturing a keyword.

---

## 6. Analytics

GA4, integrated so that it does not undo section 2's work.

### Why the tag is not in `index.html`

That file is the template for all 125 prerendered pages, so the standard
`<script async src="googletagmanager.com/...">` would add a third-party origin to
the critical path of every page on the site, directly against the CWV work above.
Instead `src/lib/analytics.ts` injects it from JS on `requestIdleCallback`
(2s `setTimeout` fallback for Safari, 4s timeout cap). gtag.js therefore never
competes with the LCP, and `grep googletagmanager dist/**/index.html` returns
nothing.

Events pushed before the tag lands are not lost: `dataLayer` queues them and
gtag.js drains the queue on load, so callers ignore load order entirely.

### Consent

Consent Mode v2, defaulting to **denied**. GA4 still receives cookieless pings in
that state and models the aggregate, so traffic reporting works before anyone
touches the banner, but nothing is stored until they opt in. `wait_for_update: 500`
stops a fast accept from being raced by the initial `page_view`.

`ad_storage`, `ad_user_data` and `ad_personalization` stay denied **even after
consent**. There are no ads and no remarketing, so granting them would claim a
purpose the site does not have. Only `analytics_storage` flips.

`ConsentBanner` renders `null` until after mount, the same pattern as
`ToolWorkbench` and for the same reason: the decision depends on `localStorage`,
which does not exist at build time. The side benefit is that no cookie-notice text
appears in the HTML a crawler reads.

### The two tracking points

Both are central, so adding the 115th tool needs no analytics work.

| Signal | Fired from | Why there |
|---|---|---|
| `page_view` | `useSEO` | The only place that runs on every route *and* knows the resolved title. A router listener in `AppRoutes` fires its effect before a lazily-loaded route has rendered, so it reports the **previous** page's `document.title`. Passing the title explicitly removes the race. Dedupes on consecutive identical paths, so StrictMode's double effect does not double-count while A → B → A still records two views of A. |
| `tool_engage`, `tool_action` | `useWorkbenchAnalytics`, delegated from the workbench `<section>` | There is no shared "a tool ran" callback to hook, 73 tools call `navigator.clipboard` directly and 49 build their own object URLs. Per-tool instrumentation would mean touching 100+ files and would rot on the next tool added. Listeners are capture-phase because several tools call `stopPropagation`. |

`ToolWorkbench` *mounting* is deliberately not used as an engagement signal: it
mounts from an effect on every page load, making it a duplicate of the
`page_view`. `tool_engage` requires a real interaction instead, so the
`page_view` → `tool_engage` gap is the honest answer to "do search visitors
actually use the tool, or just bounce?"

**No user content is ever sent**, only the tool slug and a static control label,
truncated to 40 chars. `data-analytics-label` overrides the label for buttons
whose visible text is dynamic.

### Verified in Chrome

Against the real prerendered build, with gtag.js stubbed so our own `dataLayer`
output is what gets inspected:

- **zero console messages**, hydration cleanliness from section 2 is not regressed
- consent default queued **before** the first `page_view`
- exactly one `page_view` on load, `page_title` matching `document.title`
- `tool_engage` once and `tool_action` with `{tool: "json-formatter", action: "Beautify"}`
- client-side nav emits a second `page_view` with the **new** title, confirming the
  title race is actually solved

### Operator setup

1. Create a GA4 property, copy the `G-XXXXXXXXXX` measurement ID.
2. Set `VITE_GA_MEASUREMENT_ID` in the host's environment. Vite inlines it **at
   build time**, so it must be present when the build runs, not just at runtime.
3. In GA4, register `tool` and `action` as **custom dimensions** (Admin → Custom
   definitions, scope: Event). Until you do, the events arrive but their parameters
   are not reportable.

## Changelog

### 2026-10-08 — Phase 1 foundations

- Search titles for sign, encrypt, unlock, metadata, and form fill name the query
  ("password protect PDF", "remove PDF password", "sign PDF online free", "edit PDF
  metadata", "fill PDF form online") and stay within 60 characters with the brand.
- `titleWithBrand` omits ` | ToolOcean` when adding it would pass 60 characters.
  `check:catalog` warns, and does not fail, when a title is still longer.
- Thin hubs (image first, then audio, video, CSV, spreadsheet, compression, archive,
  converters) replace the shared three-card block with a task table and FAQs.
- `toolocean.vercel.app` 301s to `https://toolocean.co` with the path preserved.
  Preview hosts are not included.
- CSV, YAML, and XML each have one page per direction. TOML is `/json-to-toml`.
  Old slugs 301. Saved workflow ids still resolve.
- pdf-lib, PDF.js, and `@cantoo/pdf-lib` load after a file is chosen or a run
  starts, not with the tool's first paint.
- `npm run indexnow` reads the committed public key file. It is not part of the build.
- `check:uniqueness` fails a new or changed page under 40% unique 6-word shingles
  unless that exact text is on the allowlist.
