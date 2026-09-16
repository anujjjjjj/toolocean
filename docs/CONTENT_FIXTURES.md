# Content fixtures

Every number in a `measurements` block on a tool page has to come from a row in
this file. `scripts/check-content.mjs` enforces that: a measurement whose
`scenario` string does not appear here fails the build.

The reason for the rule is that `measurements` is the one thing on these pages a
competitor cannot copy. iLovePDF cannot publish "a 12-page 300 dpi scan goes
4.1 MB to 1.6 MB in 2.3 s" without disclosing their own figures. That advantage
disappears completely the first time a number is estimated rather than measured,
so the corpus is the asset and the pages are downstream of it.

## How to add a fixture

1. Put the file in the local fixture corpus (not in the repo — several of these
   are large, and some are only representative if they are real documents).
   Record where it came from below.
2. Run it through the tool in a normal browser tab, not a headless harness. The
   numbers should be what a reader would see.
3. Record the device, browser and version, and the date, in the run notes.
4. Add the row here, then reference the exact `scenario` string from the tool's
   content module.

Re-measure when the tool's implementation changes materially — moving work into
a Web Worker, or switching an encoder, will move these numbers.

## Run environment

Record one block per measuring session, and reference it from the `method` line
of any `measurements` table that used it.

| Session | Device | OS | Browser | Date |
| --- | --- | --- | --- | --- |
| _none yet_ | | | | |

## Fixtures

| Scenario | Source | Notes |
| --- | --- | --- |
| _none yet_ | | |

## Planned corpus

The tools that most need real numbers, and the files they need:

- **pdf-compress** — a 12-page 300 dpi scanned invoice, a 40-page text-only
  report, and a 60-page slide export. The text-only case is the important one:
  it barely shrinks, and saying so is more useful than any ratio.
- **image-compressor / image-format-converter** — a 4000x3000 photograph, a
  screenshot with large flat areas, a PNG with transparency, and a HEIC from a
  phone.
- **zip-extractor / zip-creator / zip-preview** — a nested archive of a few
  hundred files, and one large enough to show why reading the central directory
  without inflating matters.
- **video-trimmer / video-to-gif** — a 30 s 1080p clip.
- **excel-reader / csv-to-excel** — a 50k-row CSV and a two-sheet workbook with
  formulas, which read as their last cached value rather than being recomputed.

Until a row exists here, the corresponding page ships without a `measurements`
section. An empty section is better than an invented one.
