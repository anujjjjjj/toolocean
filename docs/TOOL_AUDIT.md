# ToolOcean tool audit

Every one of the 114 tools was loaded and driven in a real headless Chrome against the
**production build** (`npm run build`, served the way a static host serves it), not the dev
server. Text tools were given real input and their output asserted; file tools were fed
generated fixtures (5-page PDF, PNG/JPG, XLSX with two sheets, ZIP with nested entries,
WAV tones, a recorded WebM clip, SVG, gzip) through the actual file inputs.

Scope: 128 prerendered routes smoke-tested, 80 functional assertions on text tools,
36 on file tools, plus responsive (375px), accessibility and consistency sweeps.

---

## Verdict

The catalogue is in better shape than its size suggests — **127 of 128 routes render
cleanly with no console errors, and hydration is correct on every prerendered page**.
The problems are concentrated in a handful of older tools and in one systemic gap
(the hero CTAs).

Counts below are what the harness measured, not estimates.

---

## P0 — fix before anything else

### 1. The "Encryption Tool" does not encrypt

`src/components/tools/implementations/EncryptionTool.tsx:96`

Selecting **AES** or **DES** base64-encodes a JSON object that contains the plaintext,
the key and the IV in the clear. There is no cipher. Reproduced end-to-end:

```
input:      MY BANK PASSWORD hunter2
key:        my-secret-key
IV:         1234567890123456
ciphertext: eyJkYXRhIjoiTVkgQkFOSyBQQVNTV09SRCBodW50ZXIyIiwia2V5Ijoib...

$ atob(ciphertext)
{"data":"MY BANK PASSWORD hunter2","key":"my-secret-key","iv":"1234567890123456","algorithm":"aes"}
```

The dropdown says "AES (Simulated)", but the page title, the H1, the meta description and
the category all say *encryption*. Someone pastes a real secret, gets something that looks
like ciphertext, and shares it — with the key attached.

`crypto-js` is **already a dependency**. Fix is `CryptoJS.AES.encrypt(text, key, { iv })`,
or drop the AES/DES options and present the tool honestly as "Caesar / Base64 / Hex
encoder". Either is fine; shipping a fake cipher labelled AES is not.

### 2. Regex Tester freezes the tab on `.*`

`src/components/tools/implementations/RegexTesterTool.tsx:54`

```js
while ((match = regex.exec(testString)) !== null) { results.push(...) }
```

With the global flag and any pattern that can match empty (`.*`, `a*`, `\b`, `\d*`),
`lastIndex` never advances past a zero-length match, so this loops forever pushing into an
unbounded array. Pattern `.*` against `hello world` made the renderer permanently
unresponsive — the tab has to be killed. `.*` is the first thing anyone types into a regex
tester.

```js
while ((match = regex.exec(testString)) !== null) {
  results.push(...);
  if (match.index === regex.lastIndex) regex.lastIndex++;   // ← missing
}
```

### 3. Video to GIF crashes, and takes the whole page down with it

`src/components/tools/implementations/VideoToGifTool.tsx:8`

`gif-encoder-2` is a Node package (it extends Node streams and expects the `canvas`
native module). It throws at import in the browser:

```
TypeError: Class extends value #<Object> is not a constructor or null
```

`/video-to-gif` is the only route out of 128 that fails — and it fails to a **completely
blank page**: `document.body.innerText.length === 0`. Header, footer, hero, FAQ, all the
prerendered SEO copy — gone, because **there is no error boundary anywhere in the app**
(`grep -r "componentDidCatch\|getDerivedStateFromError" src/` → nothing).

Two separate fixes:

- Swap `gif-encoder-2` for a browser encoder (`gifenc`, `gif.js`), or build GIFs from
  canvas frames directly.
- Wrap `ToolWorkbench`'s `<Suspense>` in an error boundary. Right now any tool that throws
  during render blanks the entire document — the prerendered HTML is discarded and the
  visitor sees white. One boundary around the workbench keeps the page and its content
  intact and shows "this tool failed to load" in the tool's place.

### 4. `/workflow-builder` returns HTTP 404 in production

It is linked from the footer on **all 114 tool pages**, twice from the homepage
(`src/pages/Index.tsx:69,141`), and **it is listed in `public/sitemap.xml:70`** — but it is
not in `PRERENDER_ROUTES`, so no `dist/workflow-builder/index.html` is emitted.
`dist/_redirects` ends with `/* /404.html 404`, and `vercel.json` has no rewrite, so:

```
/workflow-builder    404
/workflows           404
/json-formatter      200
/about               200
```

It only appears to work because clicking the footer link is a client-side route change.
Hard refresh, open-in-new-tab, or any crawler gets a 404. Confirmed the client-render path
also throws a hydration mismatch (`Expected server HTML to contain a matching <button> in
<div>`) because it is hydrating the 404 document.

Add both routes to `PRERENDER_ROUTES` — or, if the workflow builder isn't ready, remove
the footer links, the two homepage CTAs and the sitemap entry. Note `/workflows` currently
renders "Coming soon!" as its entire body.

---

## P1 — broken or misleading behaviour

### 5. XML ↔ JSON converter is completely broken

`src/components/tools/implementations/XmlJsonConverterTool.tsx`

`<root><a>1</a></root>` → empty output, input badged **Invalid**, and this in the UI:

```
this.removeAllListeners is not a function
```

`xml2js` pulls in `sax`, which assumes Node's EventEmitter. It also drags a **104 KB**
`xml2js` chunk into the bundle for a feature that never works. `fast-xml-parser` is
browser-native and a fraction of the size. (`XmlFormatterTool` is fine — it uses
`DOMParser`.)

### 6. Colour Picker never draws the image

`src/components/tools/implementations/image/ImageColorPickerTool.tsx:43`

```js
img.onload = () => {
  setImageSrc(url);
  const canvas = canvasRef.current!;   // still null
  canvas.width = img.naturalWidth;     // TypeError
```

The `<canvas>` only renders once `imageSrc` is set, so `canvasRef.current` is null at this
point in the same tick. Upload succeeds, then `TypeError: Cannot set properties of null
(setting 'width')` and the user is left staring at "Click anywhere on the image to pick a
colour" with no image. Draw from a `useEffect` keyed on `imageSrc` instead.

### 7. Lorem Ipsum generator: crash + empty paragraphs

`src/components/tools/implementations/LoremIpsumGeneratorTool.tsx:29,34`

```js
Array.from({ length: n }, rndSentence)   // mapFn gets (element, index)
function rndSentence(minW = 6, maxW = 14)
```

`Array.from`'s callback passes `(element, index)`, so `maxW` becomes the **array index**.
For index 0, `maxW = 0` and `count = 6 + Math.floor(random * -6)` → can be 0 → `words[0]`
is `undefined` → `TypeError: Cannot read properties of undefined (reading 'charAt')`.
Observed both the crash and this output:

```
"\n\nSit erat.\n\nUllamco. Duis metus nulla occaecat vestibulum. Nam qui."
```

Empty first paragraph, then two sentences instead of 4–8. Wrap the callback:
`Array.from({ length: n }, () => rndSentence())`. Separately, the word list has six
duplicated entries and the output never starts with "Lorem ipsum dolor sit amet" — most
people expect that opener.

### 8. Markdown Preview executes injected scripts

`src/components/tools/implementations/MarkdownPreviewTool.tsx:113,137`

`marked()` output goes straight into `dangerouslySetInnerHTML` with no sanitisation.
Confirmed live: `<img src=x onerror="window.__XSS=1">` **executed**, and a
`javascript:` link rendered as a clickable anchor.

Mostly self-XSS, but the tool's whole purpose is opening `.md` files you were given, and
the script runs on the toolocean.co origin with access to `localStorage`
(`toolOcean.history`). `MarkdownHtmlTool` was tested with the same payload and is clean.
Add `dompurify` (~20 KB) around the `marked()` output.

### 9. Two tools contradict their own privacy claims on the same page

`/dns-lookup` sends the domain you type to `dns.google`; `/ip-address` sends your IP to
`ipapi.co` and `api.ipify.org`. Both tools disclose this honestly in their own FAQ —
and then the auto-generated category FAQ underneath says:

> **Is my text uploaded to a server?**
> No. DNS Lookup is a static page with no backend. Your text is read and processed by
> JavaScript running in this tab, and **it is never transmitted**. You can confirm this by
> opening your browser's network panel — **there are no outbound requests**.

> **Does it work offline?** **Yes**, once the page has loaded.

Both are false for these two tools, and the second one is trivially disproved by following
the instructions in the first. `/http-request-composer` has the same conflict. Add an
`external: true` flag to the catalog entry and have `categoryFaqs()` in
`src/lib/toolContentResolver.ts:83` emit honest copy for those tools.

---

## P2 — systemic UX gaps

### 10. The hero CTAs are dead on 113 of 114 tools

This is the biggest UX finding. `ToolHero` renders a prominent primary button on every
page — "Start with your own data" / "Open a file" / "Choose a PDF" — which fires an intent
on the `toolActions` bus. **Only `JsonFormatterTool` ever subscribes**
(`grep -c subscribeToToolActions` → 1/114).

Measured across all 114 tools:

| Hero CTA | Tools showing it | Tools where it does anything |
|---|---|---|
| "Start with your own data" | 81 | 1 |
| "Open a file" | 81 | 1 |
| "Try this example" | 1 | 1 |
| "Choose a {subject}" | 33 | 0 |

The scroll-to-workbench part works, so it isn't *obviously* broken — the button just
scrolls and then nothing happens. On the 33 file tools, "Choose a PDF" looks exactly like
a file picker trigger and never opens one.

The bus design is right; nothing opted in. Two options:

- Add the three-line `subscribeToToolActions` effect to each tool (mechanical, ~114 small
  edits), or
- Better: have `ToolWorkbench` handle `focus` and `upload` generically — it can find the
  first non-readonly `textarea` and the first `input[type=file]` in its own subtree without
  any tool knowing. That fixes all 114 at once and keeps new tools working by default.

Also worth noting: "Try this example" exists on exactly one page, so all the hand-authored
example content in `src/data/toolContent/` is inert as a CTA.

### 11. The catalogue is two products in one

The JSON Formatter is genuinely excellent — toolbar, split panes, live validation with
line/column, byte/line/key/depth stats, keyboard shortcuts, drag-and-drop, large-input
guard. Then 73 of 114 tools are still the old `<Card><CardTitle>` stack.

Measured across all 114 implementations:

| Affordance | Tools that have it |
|---|---|
| Copy to clipboard | 70 / 114 |
| Download output | 48 / 114 |
| Clear / Reset | **8 / 114** |
| Drag & drop | **4 / 114** |
| Keyboard shortcuts | **1 / 114** |
| Legacy `<CardTitle>` shell | 73 / 114 |
| Web Worker for heavy work | **0 / 114** |

Nobody needs all of these everywhere, but **Clear at 8/114 and drag-and-drop at 4/114** are
the ones users notice. Of the 52 tools that take a file, 52 have no drop zone — you must
click through the picker every time.

A shared `<ToolShell>` (toolbar + input pane + output pane + copy/download/clear + drop
zone) would collapse most of the 22,000 lines under `implementations/` and make the
catalogue feel like one product. The JSON formatter is already the reference design.

### 12. Zero Web Workers — big inputs block the main thread

Every tool processes on the main thread. Only `JsonFormatterTool` guards against it
(auto-format suspends above 512 KB). Feeding a few MB to the CSV, XML, hash or compression
tools janks or freezes the tab, and `AUTO_FORMAT_MAX_BYTES` is the only such guard in the
codebase. Only 4 of 52 file tools check `file.size` at all before processing.

### 13. Nine tools overflow horizontally at 375px

Page scrolls sideways on a phone:

| Tool | Overflow |
|---|---|
| markdown-preview | +173px |
| ip-address | +90px |
| json-merger | +47px |
| html-formatter | +44px |
| sql-formatter | +44px |
| url-encoder | +36px |
| code-explainer | +13px |
| audio-merge | +7px |
| json-schema-validator | +3px |

`html-formatter`, `sql-formatter` and `markdown-preview` have fixed-width children
(403px, 403px, 532px) inside a 375px viewport. `markdown-preview` also renders **two
`<h1>`s** whenever the user's markdown contains one — scope the preview's typography so
user headings start at `h2`.

### 14. Accessibility

- **125 form controls across 66 tools use `placeholder` as their only label.** Placeholders
  vanish on input and aren't reliably announced. These need `<Label htmlFor>` or `aria-label`.
- **21 tools have icon-only buttons with no accessible name** — worst are
  `chmod-calculator` (11), `css-unit-converter` (10), `gitignore-generator` (10),
  `color-palette-generator` (9), `password-generator` (5). A screen reader announces
  "button".
- **16 tools have touch targets under 32px** — `chmod-calculator` (11),
  `gitignore-generator` (10), `color-palette-generator` (9). WCAG 2.2 AA asks for 24px
  minimum; 44px is the comfortable target on a phone.
- **97 of 114 pages skip a heading level** (`h1` → `h3`), because shadcn's `CardTitle`
  renders `h3` and the workbench sits directly under the hero `h1`. One-line fix in the
  shared card usage.

### 15. Grammar bugs in generated copy

`src/lib/toolContentResolver.ts:158` — `Choose a ${profile.subject}` with no article
agreement produces, on live pages:

- "Choose **a** image" (10 tools) · "Choose **a** archive" (3) · "Choose **a** audio file" (2)
- "Choose a PDF" on `/images-to-pdf`, which takes **images** — wrong noun, not just wrong article

`src/data/toolSeo.ts:33` — `privacyFaq(subject)` builds `Is my ${subject} uploaded to a
server?` and is called with plural subjects, producing:

- "Is my **images** uploaded to a server?"
- "Is my **files** uploaded to a server?"
- "Is my **colour values** uploaded to a server?"
- "Is my **generated UUIDs** uploaded to a server?"

Roughly 20 pages carry one of these, in an `<h3>` inside FAQPage structured data — so it's
in the rich results too. Add `article` and `subjectPlural` fields to the category profile
and pick the right one per template.

### 16. Mode toggles silently discard typed input

`UrlEncoderTool.tsx:40` (and the same pattern in `StringEscapeTool`):

```js
setMode(mode === "encode" ? "decode" : "encode");
setInput(output);   // output is "" if you haven't run yet
setOutput("");
```

Swapping direction after a conversion is nice. Swapping **before** one wipes what you
typed with no undo. Guard with `if (output) setInput(output)`.

---

## P3 — code health

**Dead code, 374 lines.** Nothing imports any of these — verified with a full-tree grep
including `scripts/`:

- `src/components/tools/ToolRunner.tsx` (218 lines) — a `switch` over 14 tool IDs that
  duplicates the registry, plus its own copy/download/share bar
- `src/components/tools/PlaceholderTool.tsx`
- All nine eager `*ToolRegistry.ts` files (`pdf`, `csv`, `audio`, `image`, `video`,
  `spreadsheet`, `compression`, `archive`, `converter`) — superseded by `lazyToolRegistry.ts`
- `componentRegistry` in `src/lib/toolRegistry.ts:542`

**Two TypeScript errors** (`npx tsc --noEmit` is not part of `npm run build`, so these ship):

```
PdfToImagesTool.tsx(153,35): TS2345: Property 'canvas' is missing in type
  '{ canvasContext; viewport; }' but required in 'RenderParameters'
VideoToGifTool.tsx(8,1):     TS2578: Unused '@ts-expect-error' directive
```

Adding `tsc --noEmit` to the build would have caught both.

**`npm run lint`: 86 errors, 34 warnings.** The 18 `react-hooks/exhaustive-deps` warnings
are the ones that matter — those are stale-closure bugs waiting to happen. The 50
`no-explicit-any` are mostly in the dead registries above.

**Object URL leaks** — `createObjectURL` with no matching `revokeObjectURL`, so blobs are
pinned for the page's lifetime: `color-picker`, `image-crop`, `image-filters`,
`image-rotate-flip`, `image-watermark`. Each new upload leaks the previous full-size image.

**Bundle** — largest chunks are `PDFButton` 512K, `PdfToImagesTool` 448K, `index` 436K
(132K gzip), `xlsx` 416K, `MdToDocxTool` 340K. Code splitting is working well; the 104K
`xml2js` chunk is pure waste since that tool doesn't function.

**`CLAUDE.md` is out of date** and will mislead the next change. It documents the
`/{category}-tools/:toolId` two-route pattern and the eleven eager registries. The app
actually serves every tool from a flat `/:slug` via one `ToolRoutePage`, and the real
registry is `src/lib/lazyToolRegistry.ts`. "Adding a New Tool" step 2 points at files that
are dead.

---

## What was verified working

Worth stating, since most of this catalogue is solid:

- **127 / 128 routes** render with zero console errors; hydration is clean on every
  prerendered page (an earlier apparent site-wide failure was an artifact of `vite preview`
  serving the SPA fallback instead of the per-route HTML — a real static host is fine).
- **All 8 PDF tools** work on a real 5-page PDF: merge (5+2 → 7 pages), split, compress,
  rotate, reorder, watermark, images→PDF, and PDF→images rendering all 5 pages with a
  Download ZIP.
- **All 10 image tools** except colour picker; **all 5 spreadsheet tools** against a real
  two-sheet XLSX; **all 3 ZIP tools** against a nested archive; both audio tools against
  real WAV files; 3 of 4 video tools against a recorded WebM.
- The JSON family (formatter, minifier, parse, stringify, flattener, fixer, merger, schema
  validator, and the CSV/YAML/TOML/XML converters) all produced correct output, including
  correct error reporting on malformed input.
- Command palette (⌘K) opens with all 116 entries; the 404 page returns a real 404;
  legacy `/tools/*` redirects are correctly configured in both `_redirects` and `vercel.json`.

---

## Suggested order

1. Encryption tool — remove or implement with the `crypto-js` already installed
2. Regex tester `lastIndex` guard — one line
3. Error boundary around `ToolWorkbench` — stops any future tool crash blanking the site
4. `/workflow-builder` + `/workflows` into `PRERENDER_ROUTES` (or delete the links + sitemap entry)
5. Generic `focus` / `upload` handling in `ToolWorkbench` — revives dead CTAs on 113 tools
6. `video-to-gif` encoder swap; `xml-json-converter` → `fast-xml-parser`; colour picker `useEffect`; lorem ipsum `Array.from`
7. Sanitise markdown preview; fix the DNS/IP privacy copy
8. Grammar in `toolContentResolver.ts` + `toolSeo.ts`
9. Delete the 374 lines of dead code; refresh `CLAUDE.md`
10. Shared `<ToolShell>` — Clear, drag & drop, copy/download everywhere
