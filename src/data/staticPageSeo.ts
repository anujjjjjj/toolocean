/**
 * SEO copy for the non-tool pages: the homepage and the ten category listings.
 *
 * Both the React page and scripts/prerender.mjs read from here. Before this
 * existed each listing page held its own useSEO literal and the prerender had a
 * second, differently-worded copy, so the title in the served HTML disagreed
 * with the title the page set after hydration. One source removes that class of
 * bug entirely.
 *
 * Tool pages are absent by design; their SEO is derived per tool by
 * resolveToolContent().
 */

export interface StaticPageSeo {
  title: string;
  description: string;
}

export const HOME_SEO: StaticPageSeo = {
  title: "ToolOcean - Free Online Developer, PDF, Image & File Tools",
  description:
    "ToolOcean is a free collection of browser-based developer, PDF, image, audio, video, and file tools. 100% client-side. Your files never leave your device.",
};

export const CATEGORY_PAGE_SEO: Record<string, StaticPageSeo> = {
  "/dev-tools": {
    title: "Developer Tools - Free Online JSON, Text & Encoding Utilities",
    description:
      "Format, convert, encode, and transform your data with free browser-based developer utilities. No uploads, no sign-up, everything runs client-side.",
  },
  "/pdf-tools": {
    title: "PDF Tools - Merge, Sign, Encrypt & Fill Forms Offline",
    description:
      "Thirteen free browser PDF tools: merge, split, compress, sign, encrypt, unlock, metadata, and form fill. No uploads, files stay on your device.",
  },
  "/csv-tools": {
    title: "CSV Tools - Convert, Validate & Merge CSV Files Online Free",
    description:
      "Free browser-based CSV tools: convert CSV to JSON, validate CSV format, and merge multiple CSV files. No uploads. Everything runs in your browser.",
  },
  "/audio-tools": {
    title: "Audio Tools - Cut & Merge Audio Files Online Free",
    description:
      "Free browser-based audio tools: trim and merge audio files with the Web Audio API. No uploads. Your audio never leaves your device.",
  },
  "/image-tools": {
    title: "Image Tools - Resize, Compress & Convert Images Online Free",
    description:
      "Free browser-based image tools: resize, compress, crop, convert format, watermark, and apply filters. No uploads, images never leave your device.",
  },
  "/video-tools": {
    title: "Video Tools - Trim, Extract Thumbnails & Convert to GIF Free",
    description:
      "Free browser-based video tools: trim clips, extract thumbnails, view metadata, and convert video to GIF. No uploads. Your videos never leave your device.",
  },
  "/spreadsheet-tools": {
    title: "Spreadsheet & Excel Tools - Convert & Export Online Free",
    description:
      "Free browser-based spreadsheet tools: read Excel files, convert CSV to Excel, export to CSV, and extract columns. No uploads, powered by SheetJS in your browser.",
  },
  "/compression-tools": {
    title: "Compression Tools - Gzip & LZ-String Compress Online Free",
    description:
      "Free browser-based compression tools: gzip compress/decompress and LZ-String compression for URLs and localStorage. No uploads, all client-side.",
  },
  "/archive-tools": {
    title: "Archive Tools - Extract, Create & Preview ZIP Files Online Free",
    description:
      "Free browser-based ZIP tools: extract files, create new archives, and preview ZIP contents without extracting. No uploads, powered by JSZip in your browser.",
  },
  "/converter-tools": {
    title: "Converter Tools - Convert File Formats & Data Online Free",
    description:
      "Free browser-based converters: Markdown to DOCX, JSON to TOML/YAML/XML/CSV, HTML to Markdown, colors, timestamps, and more. No uploads required.",
  },
};

/**
 * The About/Privacy/Terms trio.
 *
 * Kept separate from CATEGORY_PAGE_SEO because prerenderRoutes derives the
 * category listing routes from that object's keys, folding these in would list
 * them as tool categories in the breadcrumbs and the sitemap's listing tier.
 */
/**
 * Static app pages that are not tools and not category listings.
 *
 * /workflow-builder lives here because it has to be prerendered like everything
 * else. It was previously absent from PRERENDER_ROUTES while still being linked
 * from the footer of all 114 tool pages, twice from the homepage, and listed in
 * sitemap.xml, so the one URL the sitemap advertised as a real page was the one
 * URL that answered 404, because _redirects falls through to `/* /404.html 404`.
 * Anyone hard-refreshing it, opening it in a new tab, or crawling it got the 404
 * document and then a hydration mismatch as the client rendered over it.
 */
export const INFO_PAGE_SEO: Record<string, StaticPageSeo> = {
  "/workflow-builder": {
    title: "Workflow Builder - Chain Browser Tools Together",
    description:
      "Chain ToolOcean's text tools into a repeatable pipeline: format, convert, and transform in sequence. Runs entirely in your browser with no uploads.",
  },
  "/all-tools": {
    title: "All 119 Free Browser Tools - Complete List",
    description:
      "Every ToolOcean tool in one place, grouped by category: PDF, image, video, audio, CSV, spreadsheet, archive, compression, converters and developer utilities.",
  },
  "/about": {
    title: "About ToolOcean - Who Builds It and How It Works",
    description:
      "ToolOcean is a free collection of 119 browser-based tools built and maintained by Anuj Kabra. Learn why every tool runs client-side and nothing is ever uploaded.",
  },
  "/privacy": {
    title: "Privacy Policy - What ToolOcean Does and Doesn't Collect",
    description:
      "Your files and text never leave your device. There is no server to receive them. Read exactly what ToolOcean stores locally, and how analytics and consent work.",
  },
  "/terms": {
    title: "Terms of Use - ToolOcean",
    description:
      "The terms covering your use of ToolOcean's free browser-based tools, including the no-warranty disclaimer and limitation of liability.",
  },
};
