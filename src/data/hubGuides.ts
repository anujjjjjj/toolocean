import type { ToolFaqEntry } from "@/types/toolContent";

export interface HubGuideRow {
  task: string;
  tool: string;
  path: string;
  limit: string;
}

export interface HubGuideContent {
  heading: string;
  paragraphs: string[];
  tableCaption: string;
  rows: HubGuideRow[];
  faqHeading: string;
  faqs: ToolFaqEntry[];
}

/**
 * Copy for thin category hubs. Each block is specific to that category.
 * Shared "100% secure / lightning fast / completely free" cards were removed
 * because they were the same three sentences on every listing.
 */
export const HUB_GUIDES: Record<string, HubGuideContent> = {
  "/image-tools": {
    heading: "Which image job belongs on which page",
    paragraphs: [
      "These pages edit a picture you already have. The browser decodes it, draws it to a canvas, and offers a download. That covers the ordinary jobs: a new pixel size, a tighter JPEG, a crop, a turn, a text stamp, or a switch between PNG, JPEG, and WebP. It does not cover the jobs that need a model or a format the canvas cannot read.",
      "HEIC from an iPhone is not accepted. AVIF is not a target. Nothing here removes a background, rebuilds a face, or invents pixels to upscale. If a listing elsewhere promises those, it is a different product, and it usually uploads the photo to do it.",
      "The compressor still has a JPEG quality slider. Exact size is a separate mode: it searches quality, then scales, and can pad a JPEG that undershoots a minimum you set. 1 KB is 1024 bytes. Re-encoding drops EXIF and GPS because the pixels are drawn again. That is not a metadata eraser, and it will not scrub a name painted into the picture.",
      "The resizer takes pixels, centimetres, millimetres, or inches, plus a DPI. The default for pixels is 96, with 200 and 300 as presets. A JPEG download stores that DPI in the JFIF header. A PNG download stays pixels only.",
    ],
    tableCaption: "Pick the page that matches the job",
    rows: [
      {
        task: "Change width or height",
        tool: "Image resizer",
        path: "/image-resizer",
        limit: "Pixels, cm, mm, or inches, with a DPI. JPEG stores JFIF density. PNG does not.",
      },
      {
        task: "Make a photo lighter",
        tool: "Image compressor",
        path: "/image-compressor",
        limit: "Quality slider, or an exact ceiling in KB (1024 bytes). EXIF drops because the file is re-encoded.",
      },
      {
        task: "PNG, JPEG, or WebP",
        tool: "Format converter",
        path: "/image-format-converter",
        limit: "Those three formats. No HEIC and no AVIF.",
      },
      {
        task: "Cut a rectangle",
        tool: "Image crop",
        path: "/image-crop",
        limit: "One region you select. It does not auto-detect a subject.",
      },
      {
        task: "Read one pixel",
        tool: "Color picker",
        path: "/color-picker",
        limit: "The colour under the cursor. It does not build a palette from the whole photo.",
      },
      {
        task: "Icon sizes",
        tool: "Favicon generator",
        path: "/favicon-generator",
        limit: "Raster sizes from the image you supply. It does not draw a logo.",
      },
      {
        task: "Turn or mirror",
        tool: "Rotate and flip",
        path: "/image-rotate-flip",
        limit: "90, 180, and 270 degrees, plus horizontal and vertical flips.",
      },
      {
        task: "Stamp text",
        tool: "Watermark",
        path: "/image-watermark",
        limit: "Text only. It does not place a logo image.",
      },
      {
        task: "Brightness and blur",
        tool: "Image filters",
        path: "/image-filters",
        limit: "Slider adjustments. No background removal and no AI upscale.",
      },
      {
        task: "A data URL",
        tool: "Image to Base64",
        path: "/image-to-base64",
        limit: "Text you can paste into HTML or CSS. The text is larger than the file.",
      },
    ],
    faqHeading: "Image questions this hub can answer",
    faqs: [
      {
        question: "Do the image tools upload the photo?",
        answer:
          "No. The file is read with the browser's file API and drawn locally. Disconnect after the page has loaded and a resize or crop still finishes. The download is a blob the browser saves.",
      },
      {
        question: "Can I hit an exact size such as 20 KB?",
        answer:
          "Yes, on the compressor's exact-size mode and on [compress an image to 20 KB](/compress-image-to-20kb), [50 KB](/compress-image-to-50kb), and [100 KB](/compress-image-to-100kb). 1 KB is 1024 bytes. The search may shrink the pixel dimensions. A minimum, if you set one, can pad a JPEG with comment bytes, and the page says when it did.",
      },
      {
        question: "Will compression strip the location from a phone photo?",
        answer:
          "The JPEG that comes out was painted onto a canvas and encoded again, so the camera's EXIF block, including GPS, is not copied across. A street name written on the picture itself is still in the pixels.",
      },
      {
        question: "Why will a HEIC not open?",
        answer:
          "The canvas decoder in this set of pages accepts PNG, JPEG, WebP, and the other types the browser already displays. HEIC is not one of them. Export a JPEG from the phone first, then resize or compress that.",
      },
      {
        question: "Can I resize for a 4 by 6 print?",
        answer:
          "Switch the unit to inches or centimetres and set the DPI, often 300 for a print shop. The page converts that into pixels and, for a JPEG, writes the DPI into the JFIF header. It still does not talk to the printer.",
      },
      {
        question: "Is there background removal or an upscaler?",
        answer:
          "No. Filters change brightness, contrast, saturation, and blur on the pixels you already have. They do not separate a person from a scene, and they do not invent detail.",
      },
    ],
  },
  "/audio-tools": {
    heading: "What the two audio pages actually cut and join",
    paragraphs: [
      "There are two audio tools, and both use the Web Audio API on a file you pick. The cutter takes a start and an end and exports that span. The merger places files one after another into a single clip. Neither one is a multitrack editor: there is no fade curve, no noise reduction, and no pitch shift.",
      "A long recording still has to fit in memory, because the samples are decoded in the tab. If a phone struggles, the same file on a laptop is the practical next step, not a server queue.",
    ],
    tableCaption: "Audio jobs on this hub",
    rows: [
      {
        task: "Keep a span of a recording",
        tool: "Audio cutter",
        path: "/audio-cutter",
        limit: "One start and one end. No crossfade and no silence detection.",
      },
      {
        task: "Place clips in a row",
        tool: "Audio merger",
        path: "/audio-merge",
        limit: "Sequential join. It does not mix two tracks at the same time.",
      },
    ],
    faqHeading: "Audio questions",
    faqs: [
      {
        question: "Does trimming upload the recording?",
        answer:
          "No. Decoding and the export both happen in the tab. The file is not posted anywhere.",
      },
      {
        question: "Can I remove background noise?",
        answer:
          "No. The cutter only changes which samples are kept. It does not filter them.",
      },
      {
        question: "Will a merge match sample rates for me?",
        answer:
          "The Web Audio API resamples into its own context when it decodes. You do not get a studio-style convert dialog, and you should listen to the join before you send it.",
      },
    ],
  },
  "/video-tools": {
    heading: "Short video jobs, and the ones that are absent",
    paragraphs: [
      "Video here means a clip you trim, a frame you save as an image, a look at duration and dimensions, or a short stretch turned into a GIF. The browser's media element does the reading. There is no timeline with multiple layers, no colour grade, and no upload to a transcoder.",
      "GIF export is lossy and looped. It is the wrong choice for a long, sharp clip. Trim first, then convert the short part.",
    ],
    tableCaption: "Video jobs on this hub",
    rows: [
      {
        task: "Save one frame",
        tool: "Video thumbnail",
        path: "/video-thumbnail",
        limit: "A still image from a moment you choose. Not a contact sheet of every scene.",
      },
      {
        task: "Cut a time range",
        tool: "Video trimmer",
        path: "/video-trimmer",
        limit: "One in-point and one out-point. No multi-cut timeline.",
      },
      {
        task: "A looping GIF",
        tool: "Video to GIF",
        path: "/video-to-gif",
        limit: "Short clips. Long videos become huge, soft GIFs.",
      },
      {
        task: "Duration and size",
        tool: "Video metadata",
        path: "/video-metadata",
        limit: "What the browser can read. It is not a full ffprobe dump.",
      },
    ],
    faqHeading: "Video questions",
    faqs: [
      {
        question: "Is the video sent away to be trimmed?",
        answer:
          "No. The media element reads the file locally. A hard refresh still needs the page itself cached, but the clip is not the thing being fetched.",
      },
      {
        question: "Can I turn an hour-long lecture into a GIF?",
        answer:
          "You can try, and you should not. GIF is a poor container for long, detailed footage. Trim a few seconds first.",
      },
      {
        question: "Why is there no subtitle editor?",
        answer:
          "Nothing on this hub reads or writes caption tracks. The tools stay on the picture and the timing of the clip.",
      },
    ],
  },
  "/csv-tools": {
    heading: "CSV work that stays a text file",
    paragraphs: [
      "This hub is for CSV as text: check that rows line up, join files that share a shape, and move between CSV and JSON. Turning a CSV into an Excel workbook lives with the spreadsheet tools, because that writes a different container.",
      "Delimiters are not always commas. A European export often uses semicolons. The CSV to JSON page can be pointed at comma, semicolon, tab, pipe, or a character you type. The validator is the page to open when a row has the wrong number of fields.",
    ],
    tableCaption: "CSV jobs on this hub",
    rows: [
      {
        task: "CSV into JSON objects",
        tool: "CSV to JSON",
        path: "/csv-to-json",
        limit: "Header row optional. Nested JSON is not invented from flat cells.",
      },
      {
        task: "JSON objects into CSV",
        tool: "JSON to CSV",
        path: "/json-to-csv",
        limit: "An array of objects. Nested values need flattening first.",
      },
      {
        task: "Find a broken row",
        tool: "CSV validator",
        path: "/csv-validator",
        limit: "Structure, not business rules. It will not know a price is wrong.",
      },
      {
        task: "Stack files",
        tool: "CSV merge",
        path: "/csv-merge",
        limit: "Same columns. It is not a SQL join on a key.",
      },
    ],
    faqHeading: "CSV questions",
    faqs: [
      {
        question: "Where did the old CSV converter address go?",
        answer:
          "It now opens CSV to JSON. The opposite direction has its own address, JSON to CSV. Both still swap if you already have the file open.",
      },
      {
        question: "Does validation upload the spreadsheet export?",
        answer:
          "No. The text is read locally. A customer export can be checked without posting it.",
      },
      {
        question: "Can I get an xlsx from this hub?",
        answer:
          "Use CSV to Excel on the spreadsheet hub. These pages keep the result as CSV or JSON text.",
      },
    ],
  },
  "/spreadsheet-tools": {
    heading: "Workbooks, without sending the workbook away",
    paragraphs: [
      "SheetJS reads and writes xlsx in the tab. You can look at a sheet, pull chosen columns, turn CSV into a workbook, turn a workbook into CSV, or turn a JSON array into rows. Formulas are not recalculated here. What you see is the values stored in the file, not a fresh Excel session.",
      "A CSV of account numbers should become a workbook with text cells if you care about leading zeros. The CSV to Excel page is the one aimed at that. Renaming a .csv to .xlsx does not do it.",
    ],
    tableCaption: "Spreadsheet jobs on this hub",
    rows: [
      {
        task: "Look at a workbook",
        tool: "Excel reader",
        path: "/excel-reader",
        limit: "Display. It does not edit cells in place.",
      },
      {
        task: "CSV to xlsx",
        tool: "CSV to Excel",
        path: "/csv-to-excel",
        limit: "A workbook download. It does not upload the CSV.",
      },
      {
        task: "xlsx to CSV",
        tool: "Excel to CSV",
        path: "/excel-to-csv",
        limit: "One sheet's values. Charts and macros are not converted.",
      },
      {
        task: "Keep some columns",
        tool: "Column extractor",
        path: "/column-extractor",
        limit: "Columns you tick. Not a pivot table.",
      },
      {
        task: "JSON array to xlsx",
        tool: "JSON to Excel",
        path: "/json-to-excel",
        limit: "An array of objects. Nested objects are not expanded into extra sheets.",
      },
    ],
    faqHeading: "Spreadsheet questions",
    faqs: [
      {
        question: "Are formulas evaluated?",
        answer:
          "No. The reader shows stored values. A cell whose cached value is stale in the file will look stale here too.",
      },
      {
        question: "Does an xlsx leave the laptop?",
        answer:
          "No. Parsing happens in the tab. Close the tab and the copy in memory is gone.",
      },
      {
        question: "Can I merge two workbooks on a key?",
        answer:
          "Not here. Column extractor keeps fields from one file. A join is a different kind of tool.",
      },
    ],
  },
  "/compression-tools": {
    heading: "Text compression, not a zip of your photos",
    paragraphs: [
      "This hub compresses text. Gzip and LZ-String are for a string you paste: a JSON payload, a value you want to tuck into localStorage, a token that has to travel in a URL. Photo and PDF compression live on the image and PDF hubs, because those recompress pixels rather than gzip a string.",
      "Gzip output here is base64 text so you can paste it. It is not a .gz file with a filename header you can hand to every desktop archiver without decoding that text first. Read the page before you expect a binary download.",
    ],
    tableCaption: "Compression jobs on this hub",
    rows: [
      {
        task: "Gzip a string",
        tool: "Gzip compress",
        path: "/gzip-compress",
        limit: "Text in, base64 text out. Not a photo compressor.",
      },
      {
        task: "Undo that gzip",
        tool: "Gzip decompress",
        path: "/gzip-decompress",
        limit: "The base64 this site writes. Arbitrary .gz bytes are a different page.",
      },
      {
        task: "A short string for a URL",
        tool: "LZ-String compress",
        path: "/lz-string-compress",
        limit: "URI-safe text. It is not a general archive format.",
      },
    ],
    faqHeading: "Compression questions",
    faqs: [
      {
        question: "Will gzip make a PDF smaller?",
        answer:
          "Not on this hub. PDF compression is a separate page that either rewrites the file losslessly or re-encodes pages as images. Pasting PDF bytes into a text box is the wrong tool.",
      },
      {
        question: "Is the pasted text uploaded to be compressed?",
        answer:
          "No. pako and LZ-String run locally. The string stays in the tab.",
      },
      {
        question: "Why is the gzip result text instead of a file?",
        answer:
          "So it can be copied into a config, a ticket, or localStorage. If you need a real archive of several files, use the ZIP creator.",
      },
    ],
  },
  "/archive-tools": {
    heading: "ZIP files opened and built in the tab",
    paragraphs: [
      "JSZip reads and writes ZIP locally. You can list an archive, pull files out, or pack files you picked into a new zip. There is no rar, 7z, or tar. A password on a zip is not handled: encrypted entries fail rather than asking you to guess.",
      "Preview lists names and sizes without writing the contents to disk. Extract is the page that actually saves the members. Create is the page that builds a new archive from files you add.",
    ],
    tableCaption: "Archive jobs on this hub",
    rows: [
      {
        task: "See what is inside",
        tool: "ZIP preview",
        path: "/zip-preview",
        limit: "Names and sizes. It does not unpack to disk.",
      },
      {
        task: "Save the members",
        tool: "ZIP extractor",
        path: "/zip-extractor",
        limit: "Unencrypted zips. Password-protected entries are not cracked.",
      },
      {
        task: "Pack files",
        tool: "ZIP creator",
        path: "/zip-creator",
        limit: "A new zip. It does not add to an existing archive in place.",
      },
    ],
    faqHeading: "Archive questions",
    faqs: [
      {
        question: "Does unzipping upload the archive?",
        answer:
          "No. JSZip inflates the bytes in the tab. A download is the browser saving a blob.",
      },
      {
        question: "Can I open a password-protected zip?",
        answer:
          "No. There is no password field and no guessing. Encrypted entries stay encrypted.",
      },
      {
        question: "Where do I compress a single photo?",
        answer:
          "On the image compressor. A zip of one JPEG is often larger than a re-encoded JPEG, and it is a different job.",
      },
    ],
  },
  "/converter-tools": {
    heading: "One address per direction",
    paragraphs: [
      "JSON, YAML, XML, CSV, and TOML each have a page whose name is the direction you came for. CSV to JSON and JSON to CSV used to be three overlapping tools. They are two pages now, and the old addresses redirect. The same split applies to YAML and XML. TOML stays one page, JSON to TOML, and the swap control on it still flips toward JSON.",
      "The stronger converter was kept: file open, and the options that page already had. A swap button is still there if you arrived with the other format. The canonical link is the direction in the address, so search engines are not offered two URLs for one default.",
    ],
    tableCaption: "Directional converters",
    rows: [
      {
        task: "CSV into JSON",
        tool: "CSV to JSON",
        path: "/csv-to-json",
        limit: "Delimiters and an optional header. Not a spreadsheet workbook.",
      },
      {
        task: "JSON into CSV",
        tool: "JSON to CSV",
        path: "/json-to-csv",
        limit: "An array of objects. Nested objects should be flattened first.",
      },
      {
        task: "YAML into JSON",
        tool: "YAML to JSON",
        path: "/yaml-to-json",
        limit: "Comments do not survive. Tabs in the indent are a YAML error.",
      },
      {
        task: "JSON into YAML",
        tool: "JSON to YAML",
        path: "/json-to-yaml",
        limit: "No comments are added. Quote values that look like yes or no if a strict parser matters.",
      },
      {
        task: "XML into JSON",
        tool: "XML to JSON",
        path: "/xml-to-json",
        limit: "Attributes can be kept. A round trip is not byte-identical.",
      },
      {
        task: "JSON into XML",
        tool: "JSON to XML",
        path: "/json-to-xml",
        limit: "Elements from objects. Attributes are not invented.",
      },
      {
        task: "JSON and TOML",
        tool: "JSON to TOML",
        path: "/json-to-toml",
        limit: "One page, still swappable. TOML comments are dropped on the way through JSON.",
      },
    ],
    faqHeading: "Converter questions",
    faqs: [
      {
        question: "Why do two directions have two addresses?",
        answer:
          "So the page you open already faces the way you searched. The swap control remains for the return trip. Old bookmarks redirect rather than competing.",
      },
      {
        question: "Did the file-upload converter get dropped?",
        answer:
          "No. CSV, YAML, and XML still open a local file. The weaker paste-only duplicates were the ones removed.",
      },
      {
        question: "Does conversion upload the document?",
        answer:
          "No. Parsing runs in the tab. Config files and exports stay on the device.",
      },
    ],
  },
};
