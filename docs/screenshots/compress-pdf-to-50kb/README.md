# Compress PDF to 50 KB screenshots

Page-only viewport captures of `/compress-pdf-to-50kb` at 1280 px and 375 px wide: before a file is chosen
("empty"), after the text fixture fits ("success"), after the one-page scan fixture fits ("scan"), and after a
heavy scan that cannot fit ("fallback").

## Provenance

- **App code:** commit `ab1620d` ("Add a compress-to-50 KB PDF landing page"). The commit that adds this folder
  changes only files under `docs/screenshots/compress-pdf-to-50kb/`, so the app it shows is the same.
- **Build:** a production build of `ab1620d` (`npm run build`, all gates passing), served by
  `node scripts/serve-dist.mjs` on `127.0.0.1`.
- **Browser:** Google Chrome 156 (Playwright, headless, light theme). Every request to a host other than the local
  server was aborted and `window.umami` was stubbed, so no analytics left the machine.
  - Desktop: a 1280×900 viewport at DPR 1, giving 1280×900 PNGs.
  - Mobile: a 375 CSS px wide viewport at DPR 2, giving 750×1624 PNGs.
  - Only the page viewport was captured, with no browser chrome, and nothing was cropped or edited. The toast in the
    result captures is the tool's own.
- **Date:** 2026-11-16, IST.

## Fixtures

All inputs are synthetic, generated with Pillow, numpy, fontTools and reportlab from seed `20261116`. They contain
no real documents or personal data, and are kept outside the repository. Byte sizes are stable between
regenerations; hashes are not, because the font and PDF writers stamp the current time.

| Fixture | Bytes | Pages | Content |
|---|---|---|---|
| `text-letter-1p.pdf` | 294,725 | 1 | A4 typed letter: a full TrueType heading font and a Latin/Greek/Cyrillic body font embedded, no images |
| `scan-certificate-1p.pdf` | 2,535,792 | 1 | A4 page holding a 3024×4032 phone-photo-style JPEG of a made-up certificate (paper grain, shading, slight tilt, seal, photo box) |
| `scan-heavy-20p.pdf` | 41,296,997 | 20 | Twenty A4 pages of dense colour noise (a deliberate worst case) |

## Targets and measured results

The page reads 50 KB as 50,000 bytes and aims at 49,152 bytes (the 48 KB chip). A result counts as a pass only at
50,000 bytes or fewer. Each delivered run sent exactly one `tool-run` event with only `{tool, slug}` =
`{pdf-compress, compress-pdf-to-50kb}`; the miss sent none.

| Capture | Target (bytes) | Input → output (bytes) | Outcome |
|---|---|---|---|
| `pdf50-1280-success.png` | 49,152 | 294,725 → 47,814 | Page redrawn as JPEG, downloaded |
| `pdf50-1280-scan.png` | 49,152 | 2,535,792 → 48,233 | Page redrawn as JPEG, downloaded |
| `pdf50-1280-fallback.png` | 49,152 | 41,296,997 → smallest attempt 89,629 | Still over the target, not downloaded, no event |
| `pdf50-375-success.png` | 49,152 | 294,725 → 47,815 | Page redrawn as JPEG, downloaded |
| `pdf50-375-scan.png` | 49,152 | 2,535,792 → 48,232 | Page redrawn as JPEG, downloaded |
| `pdf50-375-fallback.png` | 49,152 | 41,296,997 → smallest attempt 89,629 | Still over the target, not downloaded, no event |

The two widths differ by one byte on the text fixture (47,814 and 47,815) and on the scan fixture (48,233 and
48,232). All four are under the target; exact byte equality between runs is not a requirement.

Firefox 155 (Playwright build, not captured) gave:

| Fixture | Width | Input → output (bytes) |
|---|---|---|
| success | 1280 | 294,725 → 48,484 |
| success | 375 | 294,725 → 48,484 |
| scan | 1280 | 2,535,792 → 48,375 |
| scan | 375 | 2,535,792 → 48,374 |
| fallback | 1280 | 41,296,997 → miss, smallest attempt 107,186 |
| fallback | 375 | 41,296,997 → miss, smallest attempt 107,186 |

Firefox drew the text fixture at a reduced resolution to fit, so its note added that small print may be hard to read;
Chrome fitted it without that step. Both browsers missed on the heavy scan and showed the fallback.

No horizontal overflow at either width in either browser. Chrome logged one console error per page load,
`net::ERR_FAILED`, which is the harness aborting the Umami script request; Firefox logged none.

## Optimisation

Losslessly recompressed with oxipng (`-o 4 --strip safe`, through pyoxipng). For every file, the SHA-256 of the
decoded RGBA buffer is the same before and after.
