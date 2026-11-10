# Size-target landing screenshots

These are page-only viewport captures of the four size-target landing pages:
- `/compress-pdf-to-500kb`
- `/compress-pdf-to-1mb`
- `/compress-image-to-200kb`
- `/compress-image-to-10kb`

Each page is shown at 1280 px and 375 px wide, with no file loaded ("loaded") and after a successful run
("result"). One extra capture shows an honest miss.

## Provenance

- **App code:** commit `14b9b61` ("Clear the previous result when the target, format or minimum changes"). The commit
  that adds this folder changes only files under `docs/screenshots/size-landings/`, so the app it shows is the
  same.
- **Build:** a production build of `14b9b61` (`npm run build`, all gates passing). It was served by a local static
  harness on `127.0.0.1` with production-like caching and real 404s.
- **Browser:** Chromium 156 in an Incognito window, with the light theme.
  - Desktop: a 1280×900 viewport at DPR 1, giving 1280×900 PNGs.
  - Mobile: a 375 CSS px wide viewport at DPR 2, giving 750×1624 PNGs.
  - Only the page viewport was captured, with no browser chrome or DevTools, and nothing was cropped or edited.
- **Date:** 2026-11-10, between 1:10 and 1:35 PM IST.

## Fixtures

All inputs are synthetic. They were generated from seed `20261110` with Pillow and numpy for the images and pdf-lib
1.17.1 for the PDFs. They contain no real photos, documents or personal data. The fixtures and their generator scripts
are kept outside the repository and are not committed. The file names visible in the result captures are these fixture
names.

| Fixture | Bytes | SHA-256 (first 12) | Content |
|---|---|---|---|
| `pdf-scan-10page-300dpi.pdf` | 31,248,483 | `75ee5698a576` | 10 A4 pages of seeded scan-like JPEGs |
| `img-photo-like-4000x3000.jpg` | 3,770,527 | `4388f5d4d3cd` | seeded gradient, blobs and mild noise |
| `img-signature-1200x400.jpg` | 152,552 | `eec204575368` | drawn strokes on grainy paper |
| `img-noise-4000x3000.jpg` | 11,651,180 | `b3abcc5d98c9` | seeded full-frame noise (a deliberate worst case) |

## Targets and measured results

1 KB = 1024 bytes. Every delivered file is under its ceiling, and each successful run sent exactly one `tool-run`
analytics event with only `{slug, tool}` in it.

| Capture | Target (bytes) | Input → output (bytes) | Outcome |
|---|---|---|---|
| `pdf500-1280-result.png` | 512,000 | 31,248,483 → 509,997 | Pages redrawn as JPEG, downloaded |
| `pdf500-375-result.png` | 512,000 | 31,248,483 → 509,998 | Same; see the note below |
| `pdf1mb-1280-result.png` | 1,048,576 | 31,248,483 → 1,046,836 | Pages redrawn as JPEG, downloaded |
| `pdf1mb-375-result.png` | 1,048,576 | 31,248,483 → 1,046,837 | Same; see the note below |
| `img200-1280-result.png` | 204,800 | 3,770,527 → 198,026 (4000×3000) | Under the target, downloaded |
| `img200-375-result.png` | 204,800 | 3,770,527 → 198,026 (4000×3000) | Under the target, downloaded |
| `img10-1280-result.png` | 10,240 | 152,552 → 10,143 (1200×400) | Under the target, downloaded |
| `img10-375-result.png` | 10,240 | 152,552 → 10,143 (1200×400) | Under the target, downloaded |
| `img200-375-noise-1kb-miss.png` | 1,024 (custom 1 KB) | 11,651,180 → smallest attempt 3,260 (534×400) | Over the target, not downloaded, no event |

**Note on the one-byte PDF difference:** the 375 px PDF runs came out one byte larger than the 1280 px runs. Both
are under their ceilings, so this is a pass, not a failure; exact byte equality between runs is not a requirement.
- The page image data is byte-identical: the files match up to the final compressed object stream.
- When that stream is decompressed, the only difference found is the digits of the creation and modification time
  that pdf-lib writes.
- The compressed stream is one byte longer.

This is an observation from the two files, not a proven cause.

## Known harness artefacts

The local harness sends a strict same-origin Content-Security-Policy and always answers `/sw.js` with a 404, so no
service worker is installed. During the local runs, DevTools showed console errors and an issue badge, which we
believe come from these two harness settings and not from the app. A Lighthouse SEO run on this build scored 100 on
all four pages. Performance was not measured. Captures from the harness are not a substitute for checking the
deployed site.

## Optimisation

The PNGs were losslessly recompressed with oxipng: `oxipng -o 4 --strip safe`, run through pyoxipng. Only the
`IHDR`, `IDAT` and `IEND` chunks remain. The originals were RGBA with fully opaque alpha, and the optimised files are
RGB.
- Proof that no pixel changed: for every file, the SHA-256 of the decoded RGBA buffer is the same before and after.
- Check with: `python3 -c "from PIL import Image;import hashlib,sys;print(hashlib.sha256(Image.open(sys.argv[1]).convert('RGBA').tobytes()).hexdigest())" file.png`

| File | Size | Original B | Optimised B | RGBA SHA-256 (first 16) |
|---|---|---|---|---|
| `img10-1280-loaded.png` | 1280×900 | 126,084 | 60,658 | `40af9596fd0ce871` |
| `img10-1280-result.png` | 1280×900 | 129,049 | 64,310 | `c90f920baa8e5f8f` |
| `img10-375-loaded.png` | 750×1624 | 153,143 | 71,640 | `b424e53c6ce53d57` |
| `img10-375-result.png` | 750×1624 | 171,071 | 81,437 | `9a4ff792cc2fcc19` |
| `img200-1280-loaded.png` | 1280×900 | 127,982 | 61,978 | `7aa4ec93d3a4a8af` |
| `img200-1280-result.png` | 1280×900 | 122,964 | 60,365 | `e173e7079947cbf5` |
| `img200-375-loaded.png` | 750×1624 | 155,312 | 73,037 | `6712873815b450c4` |
| `img200-375-noise-1kb-miss.png` | 750×1624 | 196,226 | 93,589 | `cc6ba4ca5f3167d4` |
| `img200-375-result.png` | 750×1624 | 173,169 | 82,274 | `96126095475a158b` |
| `pdf1mb-1280-loaded.png` | 1280×900 | 115,681 | 55,205 | `326fc26ff44d931f` |
| `pdf1mb-1280-result.png` | 1280×900 | 145,352 | 72,445 | `27773d915a2ee49e` |
| `pdf1mb-375-loaded.png` | 750×1624 | 137,118 | 63,552 | `0effeb77efd39da2` |
| `pdf1mb-375-result.png` | 750×1624 | 180,231 | 86,607 | `fe4b8fafeb2d21d7` |
| `pdf500-1280-loaded.png` | 1280×900 | 121,596 | 58,138 | `cc333a1bc8022653` |
| `pdf500-1280-result.png` | 1280×900 | 149,740 | 74,543 | `54599167864b3414` |
| `pdf500-375-loaded.png` | 750×1624 | 131,495 | 60,440 | `cb135576726acf92` |
| `pdf500-375-result.png` | 750×1624 | 183,669 | 88,613 | `6d61b5af597fa3c4` |
| **Total (17)** | | 2,519,882 | 1,208,831 | |
