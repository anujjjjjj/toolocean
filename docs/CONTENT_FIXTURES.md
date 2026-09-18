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

The measurement script patches `URL.createObjectURL` to record the size of every blob the
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
| `page-0.jpg` … `page-11.jpg` | ~860,000 each | twelve different 2550x3300 crops, the pages of `scan-12p.pdf` |
| `report-40p.pdf` | 165,897 | 40-page A4 text-only PDF, Helvetica, generated from real prose |
| `report-12p.pdf` | 50,563 | the same, 12 pages |
| `scan-12p.pdf` | 10,324,119 | 12 A4 pages, each a **different** full-bleed raster image |
| `many-files.zip` | 724,948 | 300 text files in nested folders, DEFLATE |
| `large-members.zip` | 20,507,979 | three large members: a PNG, a scanned PDF, a text PDF |
| `text-0.txt` .. `text-2.txt` | 55,476 each | plain prose, highly compressible |
| `secret.zip` | 18,740 | two text files, AES password protected with `zip -e` |
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
| pdf-compress | 12-page scan, re-encode pages as images, quality 70 | 10,324,119 | 1,644,152 | −84.1% | 2,376 ms |
| pdf-compress | 12-page scan, lossless | 10,324,119 | 10,324,083 | −0.0% | 46 ms |
| pdf-compress | 40-page text PDF, lossless | 165,897 | 165,867 | −0.0% | 22 ms |
| pdf-compress | 40-page text PDF, re-encode pages as images | 165,897 | 14,810,686 | +8,827% | 875 ms |
| pdf-merge | 12-page scan and a 12-page text PDF | 10,374,682 | 10,374,095 | −0.0% | 32 ms |
| pdf-split | pages 1-10 of the 40-page text PDF | 165,897 | 42,181 | −74.6% | 20 ms |
| pdf-split | pages 1-10 of the 12-page scan | 10,324,119 | 9,258,693 | −10.3% | 35 ms |
| zip-creator | three plain text files | 167,472 | 27,859 | −83.4% | 17 ms |
| zip-creator | a JPEG and two PDFs, all already compressed | 2,273,612 | 2,269,170 | −0.2% | 101 ms |
| zip-extractor | 300-entry archive, all entries decompressed and listed | 724,948 | n/a | n/a | 69 ms |
| zip-extractor | 20.5 MB archive of three large members | 20,507,979 | n/a | n/a | 100 ms |
| zip-preview | the same 300-entry archive, listed only | 724,948 | n/a | n/a | 39 ms |
| zip-preview | the same 20.5 MB archive, listed only | 20,507,979 | n/a | n/a | 54 ms |

### What these say

Several of these are more useful than a flattering number would be:

- **image-compressor** is the strong case. The PNG result is the one worth
  leading with, 89% is real, and it is real because re-encoding a photograph as
  JPEG is simply the right thing to do with it, not because of anything clever.
- **pdf-merge** barely changes the byte count, and that is the point: pages are
  copied rather than re-rendered, so nothing is recompressed and nothing is lost.
  "Merging does not shrink your file" is a better answer than a fake percentage.
- **zip-creator** gets very slightly *larger* on this input, because the archive
  is dominated by an already-compressed JPEG that DEFLATE cannot improve, and the
  container costs a few hundred bytes.
- **pdf-compress** is now two different operations with two honest answers.
  Lossless recovers 0.0% on both fixtures. It only strips metadata, and saying
  so is the fix for a tool that used to report that as a success. Re-encoding
  pages as images takes a 10.3 MB scan to 1.6 MB, and takes a 166 KB text
  document to 14.8 MB, because vector glyphs costing a few bytes a page become
  full-page photographs. The tool refuses to hand back the larger file.

The 84.1% figure is the one to publish, with the text-PDF case stated beside it
rather than hidden: a compressor that tells you when not to use it is worth more
than one that always claims a win.

### A fixture that was wrong

The first `scan-12p.pdf` embedded a single image and referenced it twelve times,
so the "12-page scan" was 1.2 MB rather than the ~10 MB a real one weighs.
Measured against it, re-encoding appeared to make files *larger*, an artifact of
pdf-lib deduplicating the repeated image, not a property of the tool. It is
rebuilt from twelve different crops.

Worth remembering when adding fixtures: a file that is the right shape can still
be the wrong measurement, and the failure is silent.

## Behavioural checks

Some claims are not about size. These were tested rather than assumed, because
they end up as statements on a public page.

### What `copyPages` carries, and what it drops

Both pdf-merge and pdf-split build their output with pdf-lib's `copyPages`
followed by `addPage`. Building a source document with a named text field and a
bookmark tree, running exactly that sequence, and reloading the result:

| Property | Before | After |
| --- | --- | --- |
| Form fields (`customer.name`) | present | **gone** |
| Bookmark tree (`/Outlines`) | present | **gone** |
| Page annotations | present | present |
| Page count | 3 | 3 |

The form-field result is the one worth stating on the page, because the failure
is deceptive rather than obvious: the field's *appearance* survives as a page
annotation, so the output still looks like a form and simply cannot be filled in.
Anyone merging a signed or fillable document needs to know that before they send
it on, not after.

Reproduce with a short script against pdf-lib; the sequence is the same six lines
the tools use.

### What the archive numbers say

- **zip-creator compresses now.** It previously called JSZip's `generateAsync`
  without a compression option, and the default is STORE: 167,472 bytes of text
  produced a 167,782 byte archive, very slightly larger than the input. With
  DEFLATE at level 6 the same files produce 27,859 bytes. The fix was one option;
  the miss was a factor of six.
- **Zipping already-compressed files does nothing, and that is worth saying.** A
  JPEG and two PDFs went from 2,273,612 to 2,269,170 bytes, a 0.2% saving for
  101 ms of work. People expect a ZIP to shrink things and are surprised when a
  folder of photos does not.
- **Listing is about twice as fast as extracting.** On a 20.5 MB archive,
  zip-preview showed the contents in 54 ms against zip-extractor's 100 ms,
  because preview reads the archive directory and never decompresses a member.
  The gap widens with member size, not member count.

### Encrypted archives are rejected, not prompted

`zip -e -P hunter2` produces an archive that JSZip refuses at load time with
"Encrypted zip are not supported". There is no password prompt and no partial
listing: the whole file fails to open. This matters because "how do I open a
password protected ZIP" is one of the most common questions in this category, and
the honest answer here is that this tool cannot, rather than a vague one.
