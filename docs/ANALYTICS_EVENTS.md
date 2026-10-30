# Analytics events

GA4 events (`tool_engage`, `tool_action`) are described in CLAUDE.md under
Analytics. This file covers the one Umami custom event.

## `tool-run`

| Field | Value |
|---|---|
| Event name | `tool-run` (`TOOL_RUN_EVENT` in `src/lib/umami.ts`) |
| `tool` | Tool id, e.g. `image-compressor` |
| `slug` | Route slug the tool was used on. Same as `tool` on a tool page; the landing page's slug when a landing page embeds the tool, e.g. `compress-image-to-20kb` |

Nothing else is sent: no file names, sizes, input or output. If `window.umami` is
missing (blocked, not loaded, prerender) the call does nothing.

### Success signal

A tool calls `markToolSuccess(runKey?)` from `src/lib/toolResult.ts` at the point a
result exists: the output file was produced and downloaded, or the output was
rendered. It is never called on mount, on a page view, or in a failure path.

- Tool pages: `useToolRunEvent(tool, tool)` inside `useWorkbenchAnalytics`
  (mounted by `ToolWorkbench`) turns the signal into the event.
- Landing pages: the embedded tool in `LandingRoutePage.tsx` calls
  `useToolRunEvent(embed.tool, page.slug)`.
- Dedupe (`src/lib/toolRunEvent.ts`): a signal whose `runKey` equals the previous
  one is dropped; an unkeyed signal within 1 s of the last event is dropped. Tools
  pass the output (blob, bytes, string, or the source image) as the key where one
  run can signal twice.

Exceptions to "signal when the output appears":

- `json-formatter` formats on every typing pause, so it signals when the result is
  taken (copied or downloaded), keyed by the output text.
- `color-picker` is keyed by the loaded image, so picking many colours from one
  picture is one run.
- `pdf-to-images` signals once the pages are rendered; downloading them afterwards
  is the same run.

### Coverage

Generated from the source, not maintained by hand:

```bash
for f in $(grep -rl "markToolSuccess(" src/components | sort); do
  base=$(basename "$f" .tsx)
  slugs=$(grep -E "implementations/([a-z]+/)?$base\"" src/lib/lazyToolRegistry.ts | sed -E 's/^ *"([^"]+)".*/\1/' | tr '\n' ' ')
  echo "| $slugs| \`$f\` | $(grep -c "markToolSuccess(" "$f") |"
done
```

`scripts/traffic-week1.test.mjs` fails if a tool under
`implementations/pdf` or `implementations/image`, or the JSON formatter, stops
calling `markToolSuccess`, or if a covered slug is missing from this table.

| Tool slug(s) | Component | Calls |
|---|---|---|
| csv-to-json json-to-csv | `src/components/tools/implementations/CsvJsonConverterTool.tsx` | 2 |
| json-formatter | `src/components/tools/implementations/JsonFormatterTool.tsx` | 2 |
| favicon-generator | `src/components/tools/implementations/image/FaviconGeneratorTool.tsx` | 2 |
| heic-to-jpg | `src/components/tools/implementations/image/HeicToJpgTool.tsx` | 1 |
| color-picker | `src/components/tools/implementations/image/ImageColorPickerTool.tsx` | 1 |
| image-compressor | `src/components/tools/implementations/image/ImageCompressorTool.tsx` | 2 |
| image-crop | `src/components/tools/implementations/image/ImageCropTool.tsx` | 1 |
| image-filters | `src/components/tools/implementations/image/ImageFiltersTool.tsx` | 1 |
| image-format-converter | `src/components/tools/implementations/image/ImageFormatConverterTool.tsx` | 1 |
| image-resizer | `src/components/tools/implementations/image/ImageResizerTool.tsx` | 1 |
| image-rotate-flip | `src/components/tools/implementations/image/ImageRotateFlipTool.tsx` | 1 |
| image-to-base64 | `src/components/tools/implementations/image/ImageToBase64Tool.tsx` | 1 |
| image-watermark | `src/components/tools/implementations/image/ImageWatermarkTool.tsx` | 1 |
| images-to-pdf | `src/components/tools/implementations/pdf/ImagesToPdfTool.tsx` | 1 |
| pdf-compress | `src/components/tools/implementations/pdf/PdfCompressTool.tsx` | 1 |
| pdf-encrypt | `src/components/tools/implementations/pdf/PdfEncryptTool.tsx` | 1 |
| pdf-form-fill | `src/components/tools/implementations/pdf/PdfFormFillTool.tsx` | 1 |
| pdf-merge | `src/components/tools/implementations/pdf/PdfMergeTool.tsx` | 1 |
| pdf-metadata | `src/components/tools/implementations/pdf/PdfMetadataTool.tsx` | 1 |
| pdf-page-numbers | `src/components/tools/implementations/pdf/PdfPageNumbersTool.tsx` | 1 |
| pdf-reorder | `src/components/tools/implementations/pdf/PdfReorderTool.tsx` | 1 |
| pdf-rotate | `src/components/tools/implementations/pdf/PdfRotateTool.tsx` | 1 |
| pdf-sign | `src/components/tools/implementations/pdf/PdfSignTool.tsx` | 1 |
| pdf-split | `src/components/tools/implementations/pdf/PdfSplitTool.tsx` | 1 |
| pdf-to-images | `src/components/tools/implementations/pdf/PdfToImagesTool.tsx` | 1 |
| pdf-unlock | `src/components/tools/implementations/pdf/PdfUnlockTool.tsx` | 1 |
| pdf-watermark | `src/components/tools/implementations/pdf/PdfWatermarkTool.tsx` | 1 |

A file with two calls has two separate success paths (for example the favicon ZIP
and a single size), or a convert and a download keyed by the same output.

Tools not in this table never send `tool-run`. Adding one is a single
`markToolSuccess(<output>)` call on its success path.
