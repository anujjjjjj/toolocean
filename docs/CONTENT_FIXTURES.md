# Content fixtures

Every number in a `measurements` block on a tool page has to come from a row in
this file. `scripts/check-content.mjs` enforces that: a measurement whose
`scenario` string does not appear here fails the build.

The reason for the rule is that `measurements` is the one thing on these pages a
competitor cannot copy. iLovePDF cannot publish "a 12-page scan goes 4.1 MB to
1.6 MB in 2.3 s" without disclosing their own figures. That advantage disappears
the first time a number is estimated rather than measured, so the corpus is the
asset and the pages are downstream of it.

## How these were measured

Not by calling the underlying library in Node, which would be easier and would be
measuring the wrong thing. Each run drives the actual tool page in a real browser
over the DevTools protocol: the fixture is handed to the page's own file input,
the page's own button is clicked, and the bytes recorded are the bytes the page
hands to the download. The numbers are what a reader would see.

The harness patches `URL.createObjectURL` to record the size of every blob the
page produces, and suppresses the download click so nothing is written to disk.

## Run environment

| Session | Device | OS | Browser | Date |
| --- | --- | --- | --- | --- |
| S1 | Apple M4 Pro | macOS 15.5 | Chrome 152.0.7977.83 headless | 2026-09-17 |

Timings are from a warm page on a fast machine with no network involved, so they
are a floor rather than a typical result. A mid-range phone is several times
slower, and every one of these tools runs on the main thread.

## Fixtures

Source material is deliberately real: a 3840x2160 photograph (the macOS Sequoia
Sunrise wallpaper) and real prose (this project's own `docs/TOOL_AUDIT.md`).
Synthetic noise compresses nothing like a photograph, and lorem ipsum compresses
nothing like English, so either would produce numbers that look precise and mean
nothing.

| Fixture | Bytes | What it is |
| --- | --- | --- |
| `photo-3840.jpg` | 2,057,152 | 3840x2160 photograph, JPEG quality 85 |
| `photo-3840.png` | 10,887,764 | the same photograph, lossless PNG |
| `scan-page.jpg` | 1,206,570 | the photograph at 2480px, standing in for a 300 dpi scan |
| `report-40p.pdf` | 165,897 | 40-page A4 text-only PDF, Helvetica, generated from real prose |
| `report-12p.pdf` | 50,563 | the same, 12 pages |
| `scan-12p.pdf` | 1,209,181 | 12 A4 pages, each a full-bleed raster image |
| `many-files.zip` | 160,235 | 300 small text files in nested folders |
| `one-photo.zip` | 2,055,994 | a single already-compressed JPEG |

The fixture files are not committed. They are reproducible from the sources
above, and several are large enough that committing them would be the wrong
trade.

## Measurements

Session S1 throughout.

| Tool | Scenario | Input | Output | Change | Time |
| --- | --- | --- | --- | --- | --- |
| image-compressor | 3840x2160 photograph, JPEG in, quality 80 | 2,057,152 | 1,199,262 | −41.7% | 144 ms |
| image-compressor | 3840x2160 photograph, PNG in, quality 80 | 10,887,764 | 1,201,043 | −89.0% | 179 ms |
| pdf-merge | 40-page and 12-page text PDFs into one | 216,460 | 216,125 | −0.2% | 35 ms |
| zip-creator | one JPEG and two text PDFs into one archive | 2,273,612 | 2,273,946 | +0.0% | 33 ms |
| pdf-compress | 40-page A4 text-only PDF | 165,897 | 165,867 | −0.0% | 22 ms |
| pdf-compress | 12 A4 pages of full-bleed raster | 1,209,181 | 1,209,141 | −0.0% | 12 ms |

### What these say

Three of these are publishable as they stand, and two of them are more useful
than a flattering number would be:

- **image-compressor** is the strong case. The PNG result is the one worth
  leading with — 89% is real, and it is real because re-encoding a photograph as
  JPEG is simply the right thing to do with it, not because of anything clever.
- **pdf-merge** barely changes the byte count, and that is the point: pages are
  copied rather than re-rendered, so nothing is recompressed and nothing is lost.
  "Merging does not shrink your file" is a better answer than a fake percentage.
- **zip-creator** gets very slightly *larger* on this input, because the archive
  is dominated by an already-compressed JPEG that DEFLATE cannot improve, and the
  container costs a few hundred bytes. Saying so is more useful than any ratio.

- **pdf-compress does not compress.** Both fixtures came back 0.0% smaller, and
  the run takes 12–22 ms because almost nothing happens: the implementation
  strips document metadata and re-saves with object streams, and the quality
  slider the page presents is never read by the code that produces the file. The
  page is titled "Compress PDF" and reports a savings percentage that is always
  approximately zero. It is listed in `KNOWN_BROKEN` until either the tool or the
  claim changes.
