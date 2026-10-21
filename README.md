# ToolOcean

**118 file and developer tools that run entirely in your browser.** No upload, no
account, no server. [toolocean.co](https://toolocean.co)

Most online file tools work by uploading your document to a server, processing it
there, and handing back a download link. That is an unnecessary risk for the files
people actually convert: signed contracts, payslips, customer exports, screenshots
of internal dashboards. None of it needs to leave your machine.

ToolOcean does the work in the tab you already have open. There is no backend to
send anything to.

> The practical test: open any tool, disconnect from the network, and keep using it.

---

## What's in it

| Category | Tools |
|---|---|
| [Developer](https://toolocean.co/dev-tools) | JSON, YAML, XML, TOML, CSV, regex, hashing, encoding, JWT, timestamps, colour, text transforms |
| [PDF](https://toolocean.co/pdf-tools) | Merge, split, compress, rotate, reorder, watermark, sign (visual only), encrypt, unlock, metadata, form fill, PDF ↔ images |
| [Image](https://toolocean.co/image-tools) | Resize, compress, crop, convert, rotate, watermark, filters, colour picker, favicons |
| [Spreadsheet](https://toolocean.co/spreadsheet-tools) | Excel ↔ CSV, JSON → Excel, workbook reader, column extractor |
| [Video / Audio](https://toolocean.co/video-tools) | Trim, thumbnail, metadata, GIF, audio cut and merge |
| [Archive / Compression](https://toolocean.co/archive-tools) | ZIP create, extract, preview, gzip, LZ-String |
| [Converters](https://toolocean.co/converter-tools) | Markdown, HTML, DOCX, SVG → PNG, URL parsing |

Press <kbd>⌘</kbd><kbd>K</kbd> anywhere to jump to any of them.

## What it does not do

Stated up front, because these are the cases where a hosted service is genuinely the
better answer:

- **No OCR, no in-place text editing, no redaction, and no high-fidelity PDF → Word.**
  Those need real server compute. Smallpdf and iLovePDF do them properly.
- **No certified or qualified e-signature.** [Sign PDF](https://toolocean.co/pdf-sign)
  places a visual mark (drawn, typed, or an image) and says so on the page. It does
  not write a certificate.
- **Three tools do use the network**, and say so on their own pages: DNS Lookup
  (dns.google), IP Address Lookup (ipapi.co, ipify.org), and HTTP Request Composer
  (whatever URL you point it at). Everything else is fully local.
- **Memory is the ceiling.** Processing happens on your device, so a very large file
  is bounded by available RAM rather than by a server with 64 GB of it.
- **Work runs on the main thread.** Multi-megabyte inputs can make the page feel
  briefly unresponsive. Moving the heavy tools to Web Workers is the main open
  improvement.

## How it works

React + TypeScript + Vite, deployed as static files. The interesting parts:

**Every route is prerendered.** `entry-ssg.tsx` renders with
`renderToPipeableStream` and waits for `onAllReady`, which resolves every Suspense
boundary before serialising. That is what allows the routes to stay behind
`React.lazy` while still emitting complete HTML — `renderToString` cannot await a
suspended boundary and would have forced every route to be imported eagerly,
collapsing the app back into one large entry chunk.

**One tool per chunk.** `src/lib/lazyToolRegistry.ts` maps each slug to its own
lazy import, so a visitor downloads the page shell plus exactly one tool rather
than all 118 plus pdf-lib, pdfjs, xlsx and docx.

**The tools render only after mount.** The prerender runs in Node, where Canvas,
FileReader and Web Audio do not exist. `ToolWorkbench` renders a correctly-sized
placeholder until mounted, which keeps the server output and the first client
render identical, so hydration is clean and there is no layout shift.

**Content is derived, not duplicated.** `toolContentResolver.ts` layers
hand-authored copy over per-tool SEO over category defaults, so every page gets real
titles, FAQs and internal links without a copy of the wiring for every tool.

## Running it

```bash
npm install
npm run dev        # Vite dev server
npm run build      # catalog check → sitemap → client → SSR bundle → prerender
npm run lint
npx tsc --noEmit -p tsconfig.app.json   # typecheck (not part of build)
```

## Analytics

Cookieless page views use [Umami Cloud](https://cloud.umami.is). The website id
is the `UMAMI_WEBSITE_ID` constant in `src/lib/umami.ts`. `index.html` (the shell
for every prerendered page) includes `https://cloud.umami.is/script.js` with
`defer`, `data-website-id`, `data-domains="toolocean.co"`, and
`data-do-not-track="true"`. The tag sits after the app module, so the tool
bundle runs first. Umami sends data only when the hostname is toolocean.co.
Localhost and preview deploys do not appear in the report. The script sets no
cookie.

The home page, and only the home page, reads a public visitor total after idle.
The share page is `UMAMI_SHARE_URL` in `src/lib/umami.ts`. `VITE_UMAMI_SHARE_URL`
overrides it. The tracker script does not serve this number. The page makes two
GETs to `https://gateway-us.umami.is/api`: `/share/<slug>` for a short-lived
token, then `/websites/<websiteId>/stats?startAt=0&endAt=<now>` with
`x-umami-share-token` and `x-umami-share-context: 1`. A failure or a total of
zero renders nothing, so the line does not reserve space.

| Variable | Effect |
|---|---|
| `VITE_UMAMI_SHARE_URL` | Optional public share page, such as `https://cloud.umami.is/share/<slug>`. Unset uses the committed share URL. |

## Adding a tool

1. Create the component in `src/components/tools/implementations/{category}/`
2. Register the slug in `src/lib/lazyToolRegistry.ts`
3. Add the catalog entry in `src/data/toolCatalog.ts` (dev tools live in
   `src/data/tools.json`)
4. Add SEO copy in `src/data/toolSeo.ts`
5. For workflow support, add a `run(input: string): Promise<string>` entry to
   `src/lib/toolRegistry.ts`

`npm run check:catalog` fails the build if a slug exists in one place and not the
others, so a half-registered tool cannot ship.

You do not need to touch analytics. Page views are fired by `useSEO`, and tool
interactions are delegated from the workbench `<section>`, so one listener covers
every tool. Never pass tool input to `trackEvent` — only slugs and static labels.

## Contributing

Issues and pull requests welcome, particularly:

- Moving heavy tools onto Web Workers
- A shared tool shell, so Clear and drag-and-drop exist everywhere rather than on a
  handful of tools
- Accessible names for the icon-only buttons and placeholder-only form controls

If you find a tool that produces a wrong result, that is the highest-priority kind
of bug here. Please include the exact input.

## Licence

MIT
