# Compress image to 30 KB screenshots

Page-only viewport captures of `/compress-image-to-30kb` at 1280 px and 375 px wide:
- before a file is chosen ("empty")
- a JPG phone photo that fits ("photo")
- a PNG signature saved as a JPG ("signature-png")
- a JPG already within the limit, left as it is ("already")
- a worst-case image that cannot fit ("fallback")

## Provenance

- **App code:** commit `8a93fe5` ("Drop the repeated unit sentence from the 30 KB page's preset line"). The commit
  that refreshes this folder changes only files under `docs/screenshots/compress-image-to-30kb/`, so the app it shows
  is the same. On this page the "Preset ceilings" line ends after the presets, and the exact-size paragraph opens with
  "On this page 30 KB means 30,000 bytes, and the 29 KB chip is 29,696 bytes." In every run that sentence appeared
  exactly once, and no "1 KB = 1024 bytes" claim appeared.
- **Build:** a production build of `8a93fe5` (`npm run build`, all gates passing), served by
  `node scripts/serve-dist.mjs` on `127.0.0.1`.
- **Browser:** Google Chrome 156, driven headless by Playwright with the light theme.
  - Every request to a host other than the local server was aborted, and `window.umami` was stubbed.
  - Desktop: a 1280×900 viewport at DPR 1, giving 1280×900 PNGs.
  - Mobile: a 375 CSS px wide viewport at DPR 2, giving 750×1624 PNGs.
  - Nothing was cropped or edited. The toasts are the tool's own.
- **Date:** 2026-11-17, IST.

## Inputs

| File | Bytes | Pixels | What it is |
|---|---|---|---|
| `photo-car-4032x3024.jpg` | 2,519,375 | 4032×3024 | A real iPhone 8 photo of a car, from Wikimedia Commons, CC0 ("1998 Pontiac Grand Prix, front left, 4-5-2021.jpg") |
| `signature-transparent-1800x600.png` | 83,296 | 1800×600 | A generated signature-style scribble, dark blue on a transparent background (seed 20261117) |
| `signature-small-600x200.jpg` | 14,972 | 600×200 | The same kind of scribble, saved small as a JPG |
| `blocks-noise-6000x4500.png` | 594,556 | 6000×4500 | 8 px blocks of random saturated colour, a deliberate worst case |

The generated files contain no real signature or personal data. None of the inputs are committed.

## Results

The page reads 30 KB as 30,000 bytes and aims at 29,696 bytes (the 29 KB chip). A result counts as a pass only at
30,000 bytes or fewer.

| Input | Chrome 156, 1280 and 375 | Firefox 155, 1280 and 375 | Outcome |
|---|---|---|---|
| JPG photo | 2,519,375 → 28,578 (957×718) | 2,519,375 → 28,874 (957×718) | JPG saved, under the target after scaling |
| PNG signature | 83,296 → 29,630 (1800×600) | 83,296 → 29,627 (1800×600) | Converted to JPG, saved at full size |
| Small JPG signature | 14,972, left as is | 14,972, left as is | Already within 30,000 bytes; nothing re-encoded or downloaded |
| Worst-case PNG | smallest attempt 60,291 (801×601) | smallest attempt 83,367 (801×601) | Still over the target; not downloaded |

Firefox was not captured.

- Every saved file is a JPEG, checked by its first bytes, and named `*-sized.jpg`.
- Each saved run sent exactly one `tool-run` event with `{tool: image-compressor, slug: compress-image-to-30kb}`.
  Runs that saved nothing sent none.
- Neither browser showed horizontal overflow at either width.
- Chrome logged one console error per page load, `net::ERR_FAILED`. It comes from the harness aborting the Umami
  script. Firefox logged none.

## Optimisation

The PNGs were losslessly recompressed with oxipng (`-o 4 --strip safe`, through pyoxipng). For every file, the SHA-256
of the decoded RGBA buffer is the same before and after.
