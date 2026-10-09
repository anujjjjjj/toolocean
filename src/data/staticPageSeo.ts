import { TOOL_CATALOG } from "@/data/toolCatalog";

const TOOL_COUNT = TOOL_CATALOG.length;

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
    title: "Developer Tools – JSON, Text, Encoding",
    description:
      "Format JSON, encode and decode, hash, and transform text in the browser. Three tools on this hub do call the network, and their pages say so.",
  },
  "/pdf-tools": {
    title: "PDF Tools – Merge, Sign, Encrypt, No Upload",
    description:
      "Merge, split, compress, sign, password-protect, unlock, edit metadata, and fill AcroForm PDFs in the tab. No upload. OCR and PDF-to-Word are not here.",
  },
  "/csv-tools": {
    title: "CSV Tools – Convert, Validate, Merge",
    description:
      "Turn CSV into JSON or JSON into CSV, check that rows line up, and stack files that share columns. Workbooks are on the spreadsheet hub.",
  },
  "/audio-tools": {
    title: "Audio Tools – Cut and Merge, No Upload",
    description:
      "Trim a recording to a start and end, or place clips one after another, with the Web Audio API. No fades, no noise removal, no upload.",
  },
  "/image-tools": {
    title: "Image Tools – Resize, Compress, No Upload",
    description:
      "Resize in pixels, compress a JPEG, crop, and convert PNG, JPEG, or WebP in the browser. No HEIC, no background removal, no exact-kilobyte mode.",
  },
  "/video-tools": {
    title: "Video Tools – Trim, Thumbnail, GIF",
    description:
      "Trim a clip, save one frame, read duration and dimensions, or turn a short stretch into a GIF. No timeline editor and no upload.",
  },
  "/spreadsheet-tools": {
    title: "Spreadsheet Tools – Excel and CSV",
    description:
      "Read an xlsx, pull columns, and convert between CSV, JSON, and Excel in the tab. Formulas are not recalculated. Files stay on the device.",
  },
  "/compression-tools": {
    title: "Compression Tools – Gzip and LZ-String",
    description:
      "Gzip or LZ-String a pasted string for a URL or localStorage. Photo and PDF compression live on their own hubs. Output here is text, not a .gz file.",
  },
  "/archive-tools": {
    title: "Archive Tools – ZIP, No Upload",
    description:
      "List, extract, or create a ZIP in the browser. No RAR or 7z, and password-protected entries are not opened or guessed.",
  },
  "/converter-tools": {
    title: "Converter Tools – JSON, YAML, XML, TOML",
    description:
      "One page per direction for CSV, YAML, and XML, plus JSON to TOML. Old combined addresses redirect. Parsing stays in the tab.",
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
    title: `All ${TOOL_COUNT} Free Browser Tools - Complete List`,
    description:
      "Every ToolOcean tool in one place, grouped by category: PDF, image, video, audio, CSV, spreadsheet, archive, compression, converters and developer utilities.",
  },
  "/about": {
    title: "About ToolOcean - Who Builds It and How It Works",
    description: `ToolOcean is a free collection of ${TOOL_COUNT} browser-based tools built and maintained by Anuj Kabra. Every tool runs client-side. Files are not uploaded.`,
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
