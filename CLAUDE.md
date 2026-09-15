# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (Vite)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test suite is configured.

## Architecture

ToolOcean is a **100% client-side** browser tool collection built with React + TypeScript + Vite. All processing happens in the browser — no backend, no API calls for tool logic.

### Routing Pattern

Every tool is served from a **flat slug at the site root** — `/json-formatter`,
`/pdf-merge` — through a single route and a single layout:

- `src/AppRoutes.tsx` declares `<Route path="/:slug" element={<ToolRoutePage />} />`
- `ToolRoutePage` resolves the slug to content + component and renders `ToolPageLayout`

The pre-flattening paths (`/tools/:slug`, `/pdf-tools/:slug`, …) are 301s. Real
redirects live in `public/_redirects` and `vercel.json`; `LegacyToolRedirect` is the
in-app fallback for hosts that read neither.

Category **listing** pages keep their own routes (`/pdf-tools`, `/dev-tools`, …).
Modifier and comparison landing pages are registered as explicit static routes from
`src/data/landingPages.ts` so they outrank the `/:slug` catch-all.

### Registry Pattern

One registry: **`src/lib/lazyToolRegistry.ts`**, mapping slug → `React.lazy` import.
Each entry becomes its own Vite chunk, so a visitor downloads the page shell plus
exactly one tool. Import specifiers must stay literal strings or Vite cannot split
them.

`src/lib/toolRegistry.ts` is separate and unrelated to rendering: it holds the
`run(input: string): Promise<string>` functions that let dev tools participate in
the workflow builder. Do not import tool components into it — that would pull them
into the workflow bundle and undo the code splitting.

The nine eager per-category registries and `ToolRunner.tsx` were deleted; nothing
imported them.

### Adding a New Tool

1. Create the component in `src/components/tools/implementations/{category}/`
2. Register the slug in `src/lib/lazyToolRegistry.ts`
3. Add the catalog entry in `src/data/toolCatalog.ts` (dev tools: `src/data/tools.json`)
4. Add SEO copy in `src/data/toolSeo.ts`
5. For workflow support, add a `run` entry to `src/lib/toolRegistry.ts`

`npm run check:catalog` runs first in `npm run build` and fails if these fall out of
sync. The command palette derives from the catalog, so there is nothing to update
there.

**Prerendering:** any new *page* must be added to `PRERENDER_ROUTES` in
`src/lib/prerenderRoutes.ts`. `_redirects` ends with `/* /404.html 404`, so a route
that is not prerendered returns a real 404 to anyone who hard-refreshes or crawls
it, even though in-app navigation to it works fine. Anything added to the sitemap
without a matching prerendered file is a live SEO bug.

**Hero CTAs:** `ToolWorkbench` handles the `focus` and `upload` intents generically
by finding the first input and the first `input[type=file]` in its own subtree, so
new tools get working hero buttons for free. A tool only needs
`subscribeToToolActions` if it wants to handle `load` ("Try this example") or
override the default.

**Error boundaries:** the workbench is wrapped in `ToolErrorBoundary`. A tool that
throws during render degrades to a message in place of the tool rather than blanking
the page.

### Developer Tools Data Source

Dev tools metadata (name, description, keywords, category, icon) lives in `src/data/tools.json`. The `getAllToolsForPalette()` function in `src/lib/allToolsForPalette.ts` reads this JSON and merges it with hardcoded entries for all other tool categories to power the command palette.

### Workflow Builder

`/workflow-builder` allows chaining dev tools sequentially. Only tools with a `run: (input: string) => Promise<string>` entry in `toolRegistry` (in `src/lib/toolRegistry.ts`) can participate in workflows. File-based tools (PDF, image, etc.) are registered with stub `run` functions that throw errors explaining they require file input.

### Key Utilities

- `src/contexts/CommandPaletteContext.tsx` — global Cmd+K command palette state
- `src/hooks/useHistory.ts` — persists tool usage history to `localStorage` under key `toolOcean.history`
- `src/lib/audioUtils.ts` — shared Web Audio API utilities for audio tools
- `src/lib/analytics.ts` — GA4 via Consent Mode v2, lazily injected on idle. Disabled entirely unless `VITE_GA_MEASUREMENT_ID` is set, so `npm run dev` never reports

### Analytics

Adding a tool requires **no** analytics work — both tracking points are central:

- **Page views** are fired by `useSEO` (`src/hooks/useSEO.ts`), which every page calls. It owns this rather than a router listener because it is the only place that runs on every route *and* knows the resolved title; a listener fires before a lazy route has rendered and would report the previous page's title.
- **Interactions** are delegated from the workbench `<section>` by `useWorkbenchAnalytics`, so one listener covers all 114 tools. Emits `tool_engage` (first real interaction, once per route) and `tool_action` (button/download label).

Never pass tool input to `trackEvent` — only slugs and static control labels. If a button's visible text is dynamic, give it `data-analytics-label` to pin a stable name.

### UI

All UI primitives are shadcn/ui components in `src/components/ui/` (Radix UI + Tailwind). Use these exclusively — do not add other component libraries. Icons come from `lucide-react`.

Path alias `@/` maps to `src/`.
