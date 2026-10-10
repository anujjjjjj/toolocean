/**
 * The default Open Graph card lives at public/og-default.png (1200×630).
 *
 * Paper background #F6F1E7, the horizon mark, “ToolOcean”, “Free tools that
 * run in your browser”, and toolocean.co. It is committed so a deploy does
 * not need a rasterizer. Do not point og:image back at favicon.svg: Facebook,
 * X, LinkedIn, and Slack reject SVG previews.
 *
 * This script used to paint an older dark card with ImageMagick. Running it
 * no longer overwrites the committed PNG.
 */
console.log("public/og-default.png is the committed 1200×630 card. Nothing to regenerate.");
