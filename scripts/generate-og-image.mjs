/**
 * Generates the default Open Graph card at public/og-default.png.
 *
 * The site previously pointed og:image at /favicon.svg. Facebook, X, LinkedIn and
 * Slack all reject SVG for link previews, so every share rendered with no image
 * at all — and a missing preview image measurably depresses click-through on the
 * social and chat surfaces where developer tools actually spread.
 *
 * Requires ImageMagick (`brew install imagemagick`). This is a one-off asset
 * generator, not part of `npm run build`: the output is committed so a deploy
 * never depends on ImageMagick being present.
 *
 *   node scripts/generate-og-image.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "og-default.png");

// Facebook and X both crop to 1.91:1; 1200x630 is the size that survives it intact.
const WIDTH = 1200;
const HEIGHT = 630;

const BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";
const REGULAR = "/System/Library/Fonts/Supplemental/Arial.ttf";

for (const font of [BOLD, REGULAR]) {
  if (!existsSync(font)) {
    console.error(`✗ font not found: ${font}`);
    process.exit(1);
  }
}

// Matches the app's dark theme: background hsl(220 14% 9%), primary hsl(172 66% 50%).
const BACKGROUND = "#14161a";
const PRIMARY = "#2bd4bd";
const FOREGROUND = "#fafafa";
const MUTED = "#9aa4b2";

const args = [
  "-size",
  `${WIDTH}x${HEIGHT}`,
  `xc:${BACKGROUND}`,

  // Accent bar down the left edge.
  "-fill",
  PRIMARY,
  "-draw",
  "rectangle 0,0 12,630",

  // Soft accent glow behind the wordmark.
  "-fill",
  "#1d3b39",
  "-draw",
  "roundrectangle 80,72 356,140 34,34",

  "-font",
  BOLD,
  "-pointsize",
  "34",
  "-fill",
  PRIMARY,
  "-annotate",
  "+112+120",
  "ToolOcean",

  // Headline.
  "-font",
  BOLD,
  "-pointsize",
  "76",
  "-fill",
  FOREGROUND,
  "-annotate",
  "+80+280",
  "Browser-first tools",

  "-font",
  BOLD,
  "-pointsize",
  "76",
  "-fill",
  PRIMARY,
  "-annotate",
  "+80+372",
  "for developers",

  // Positioning line.
  "-font",
  REGULAR,
  "-pointsize",
  "36",
  "-fill",
  MUTED,
  "-annotate",
  "+80+452",
  "Your files never leave your device.",

  // Trust strip.
  "-font",
  REGULAR,
  "-pointsize",
  "27",
  "-fill",
  MUTED,
  "-annotate",
  "+80+552",
  "No uploads   ·   No sign-up   ·   Works offline   ·   Free",

  OUT,
];

try {
  execFileSync("magick", args, { stdio: "inherit" });
  console.log(`✓ og image: public/og-default.png (${WIDTH}x${HEIGHT})`);
} catch (error) {
  console.error("✗ ImageMagick failed. Install it with `brew install imagemagick`.");
  process.exit(1);
}
