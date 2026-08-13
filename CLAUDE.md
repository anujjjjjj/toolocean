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

Each tool category follows a consistent two-route pattern in `src/App.tsx`:
- `/{category}-tools` → category listing page (e.g. `PdfToolsPage`)
- `/{category}-tools/:toolId` → individual tool page (e.g. `PdfToolPage`)

The exception is **Developer Tools** which uses `/tools/:toolId` and `/dev-tools`.

### Registry Pattern

Every tool category has a corresponding registry file in `src/lib/`:

| Registry | Route Prefix | Purpose |
|---|---|---|
| `toolRegistry.ts` | `/tools/` | Dev tools — contains both `toolRegistry` (workflow execution logic) and `componentRegistry` (React components) |
| `pdfToolRegistry.ts` | `/pdf-tools/` | Component registry only |
| `csvToolRegistry.ts` | `/csv-tools/` | Component registry only |
| `audioToolRegistry.ts` | `/audio-tools/` | Component registry only |
| `imageToolRegistry.ts` | `/image-tools/` | Component registry only |
| `videoToolRegistry.ts` | `/video-tools/` | Component registry only |
| `spreadsheetToolRegistry.ts` | `/spreadsheet-tools/` | Component registry only |
| `compressionToolRegistry.ts` | `/compression-tools/` | Component registry only |
| `archiveToolRegistry.ts` | `/archive-tools/` | Component registry only |
| `converterToolRegistry.ts` | `/converter-tools/` | Component registry only |

Each registry maps a tool ID string to its React component. Individual tool pages (`*ToolPage.tsx`) look up the component from the registry by `toolId` from the URL params.

### Adding a New Tool

1. Create the component in `src/components/tools/implementations/{category}/`
2. Register it in the appropriate `src/lib/*ToolRegistry.ts`
3. Add it to `src/lib/allToolsForPalette.ts` so it appears in the command palette (Cmd+K)
4. For dev tools, also add a `run` function to `toolRegistry` in `src/lib/toolRegistry.ts` for workflow support

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
