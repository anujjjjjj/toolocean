import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S1 } from "./shared";

/**
 * Tier A content for /pdf-to-images, written against "pdf to jpg".
 *
 * The page keeps its slug and covers both output formats, because the tool does.
 * Minting a second near-identical URL for the higher-volume phrasing would split
 * the same content across two pages competing with each other.
 *
 * Figures from docs/CONTENT_FIXTURES.md session S1.
 */
export const pdfToImagesContent: Partial<ToolPageContent> = {
  tier: "A",

  seo: {
    title: "PDF to JPG: Convert PDF Pages to Images Free",
    description:
      "Turn PDF pages into JPG or PNG images in your browser, at the resolution you choose. Nothing is uploaded. Download pages individually or all at once as a ZIP.",
    keywords: [
      "pdf to jpg",
      "pdf to image",
      "convert pdf to png",
      "pdf to jpg without uploading",
      "extract images from pdf pages",
      "pdf page to picture",
      "pdf to jpg high resolution",
    ],
  },

  hero: {
    h1: "Convert PDF Pages to JPG or PNG",
    subtitle:
      "Render each page of a PDF as an image at the resolution you pick, then save them one by one or as a single ZIP. The document is read in this tab and never uploaded.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },

  intro: {
    heading: "Rendering pages, and why the format you pick dominates everything",
    paragraphs: [
      "Each page is drawn the way a PDF reader draws it. The page description is interpreted, fonts are laid out, vector paths are filled and any embedded images are placed, all onto a canvas at the scale you choose. At 2x that canvas is 144 dots per inch rather than the 72 a PDF point implies, which is why the output still looks sharp on a high-density screen. What comes out is a picture of the page: text is no longer text, and nothing in the result can be selected, searched or read by a screen reader.",
      "The single biggest decision here is JPEG or PNG, and the gap is much larger than people expect. A 12-page scanned document rendered to JPEG at quality 90 produced 3,006,308 bytes across all pages. The same document at the same resolution rendered to PNG produced 23,899,262 bytes, eight times as much, for output that is visually identical on screen. On a text document it is starker still: a 40-page report of 165,897 bytes became a 25,256,591 byte set of PNGs, about 152 times its original size, because every page becomes a lossless raster of largely white paper. PNG is the correct choice when you need exact pixels for archival or further editing. For sending a page to someone, JPEG is almost always what you want.",
    ],
  },

  features: [
    {
      icon: "ScanLine",
      title: "Resolution you control",
      body: "1x, 2x or 4x, which is 72, 144 or 288 dots per inch. Higher settings are worth it for printing or for reading small print; 2x is enough for anything viewed on a screen.",
    },
    {
      icon: "ListOrdered",
      title: "Convert only the pages you need",
      body: "Give a page range rather than the whole document. Rendering is the slow part, so converting three pages out of two hundred takes a fraction of the time and memory.",
    },
    {
      icon: "Layers",
      title: "Save individually or as one archive",
      body: "Each page gets its own download, and there is a Download ZIP option when you want the lot. A 12-page conversion is one file rather than twelve separate saves.",
    },
    {
      icon: "CloudOff",
      title: "The document stays on your machine",
      body: "Rendering happens in the page using the same engine your browser uses to display PDFs. Nothing is transmitted, which matters when the document is a contract or a medical letter.",
    },
  ],

  howItWorks: [
    {
      title: "Open the PDF",
      body: "Select the document and its page count is read immediately, so you know what range is valid before you choose anything else.",
    },
    {
      title: "Choose format and resolution",
      body: "Pick JPEG for something you are going to send or publish, PNG when you need exact pixels. Then set the scale: 2x suits screens, 4x suits printing, and both cost proportionally more memory.",
    },
    {
      title: "Convert and download",
      body: "Press Convert to Images. Every page appears as a preview with its own download, plus a Download ZIP button for all of them at once.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "A scanned document as JPEG",
      description: "The usual intent: pages you can attach, paste or upload somewhere that wants images.",
      before: { label: "Input", detail: "12-page scan, 10,324,119 bytes" },
      after: { label: "Output", detail: "12 JPEGs, 3,006,308 bytes zipped" },
      settings: "JPEG, quality 90, 2x (144 dpi)",
      explanation:
        "Smaller than the PDF it came from, by 70.9 percent, because the source stored each page as a high-resolution scan and this re-encodes at screen resolution. Good enough to read, far easier to send.",
    },
    {
      kind: "file",
      title: "The same pages as PNG",
      description: "The same conversion with only the format changed.",
      before: { label: "Input", detail: "12-page scan, 10,324,119 bytes" },
      after: { label: "Output", detail: "12 PNGs, 23,899,262 bytes zipped" },
      settings: "PNG, 2x (144 dpi)",
      explanation:
        "Eight times the JPEG output, and larger than the original PDF, for pictures that look the same on screen. PNG earns that cost only when the pixels themselves matter, such as archival copies or images about to be edited repeatedly.",
    },
  ],

  measurements: {
    method: MEASURED_S1,
    rows: [
      {
        scenario: "12-page scan to JPEG at 2x, quality 90",
        input: "10,324,119 bytes",
        output: "3,006,308 bytes zipped",
        note: "70.9% smaller than the PDF",
      },
      {
        scenario: "12-page scan to PNG at 2x",
        input: "10,324,119 bytes",
        output: "23,899,262 bytes zipped",
        note: "eight times the JPEG output",
      },
      {
        scenario: "40-page text PDF to PNG at 2x",
        input: "165,897 bytes",
        output: "25,256,591 bytes zipped",
        note: "about 152 times the source",
      },
    ],
  },

  scenarios: {
    items: [
      {
        question: "How do I turn one page of a PDF into a JPG?",
        answer:
          "Set the page range to just that page number before converting. Only the page you asked for is rendered, which is quicker than converting everything and deleting the rest.",
      },
      {
        question: "What resolution do I need for printing?",
        answer:
          "Use 4x, which is 288 dots per inch, and choose PNG if the page contains line art or text. For screen use, 2x is plenty and costs a quarter of the memory.",
      },
      {
        question: "How do I get a PDF page into a slide deck or a document?",
        answer:
          "Convert the page to JPEG at 2x and insert the image. Most presentation software handles a JPEG far better than an embedded PDF, and the file stays small.",
      },
      {
        question: "How do I extract the photographs that are inside a PDF?",
        answer:
          "This is not that. It renders whole pages, so you get the page with its margins and text rather than the original embedded image at its native resolution. Cropping the rendered page afterwards is the nearest route.",
      },
    ],
  },

  useCases: [
    {
      icon: "Mail",
      audience: "Sending a page to someone",
      body: "Recipients on a phone, or in a chat application that previews images but not documents, get something they can actually see without downloading and opening a reader.",
    },
    {
      icon: "GraduationCap",
      audience: "Slides and reports",
      body: "Dropping a rendered page into a presentation avoids the embedded-PDF problems that show up when the deck is opened on another machine.",
    },
    {
      icon: "Printer",
      audience: "Print and reprographics",
      body: "A print shop that wants images rather than a document can be given exactly what it asks for, at 288 dots per inch, without the file passing through any service in between.",
    },
    {
      icon: "Landmark",
      audience: "Records and evidence",
      body: "Case files, statements and identification documents often need to be supplied as images. Rendering them locally keeps sensitive paperwork off third-party servers entirely.",
    },
    {
      icon: "Code2",
      audience: "Thumbnails and previews",
      body: "Generating a cover image for a document listing is a one-page conversion at low resolution, which takes almost no time and produces a small file.",
    },
    {
      icon: "Plane",
      audience: "Working offline",
      body: "The rendering engine is part of the page once it has loaded, so conversions continue with no connection, which is also the simplest proof the document is not being sent anywhere.",
    },
  ],

  limitations: {
    items: [
      {
        title: "The text stops being text",
        body:
          "An image of a page cannot be selected, searched, copied from or read aloud. If the point is to get the words out of a PDF, this is the wrong direction entirely and no resolution setting changes that.",
      },
      {
        title: "PNG output is enormous on text documents",
        body:
          "A 166 KB, 40-page report rendered to PNG produced a 25 MB archive. The format defaults to PNG for fidelity, so switch to JPEG unless you specifically need lossless pixels.",
      },
      {
        title: "Everything is rendered and held in memory",
        body:
          "Each page is drawn to a canvas at the chosen scale and kept until you leave. A long document at 4x will exhaust a phone quickly, so use a page range for anything substantial.",
      },
      {
        title: "Embedded images are not extracted at their original quality",
        body:
          "Pages are re-rendered rather than unpacked, so a photograph inside a PDF comes back at the resolution you rendered at, not the resolution it was stored at.",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Does the PDF get uploaded to convert it?",
      answer:
        "It does not. Pages are rendered by the PDF engine already running inside your browser, and the resulting images are built in the same tab. There is no request carrying your document at any point, and the conversion works identically with the machine disconnected from the network.",
    },
    {
      question: "Should I choose JPG or PNG?",
      answer:
        "JPG for almost everything. On a 12-page scan, JPEG produced 3,006,308 bytes against PNG's 23,899,262 for output that looks the same on screen. Choose PNG when you need exact pixels, such as an archival copy or an image you will edit repeatedly.",
    },
    {
      question: "What do 1x, 2x and 4x mean?",
      answer:
        "They are multiples of a PDF's native 72 points per inch, so 72, 144 and 288 dots per inch. 2x is the right default for reading on a screen. 4x is for printing or for very small print, and uses roughly four times the memory of 2x.",
    },
    {
      question: "Can I convert only some pages?",
      answer:
        "Yes, set a page range instead of leaving it as all. Only those pages are rendered, so converting page 7 of a 300-page document is nearly instant and uses almost no memory.",
    },
    {
      question: "How do I download every page at once?",
      answer:
        "Use the Download ZIP button that appears after conversion. It packages every rendered page into a single archive, which is much less tedious than saving twelve images one at a time.",
    },
    {
      question: "Will the images be as sharp as the PDF?",
      answer:
        "At a high enough scale they will look the same on screen, but a PDF's text is vector and can be zoomed indefinitely while an image cannot. Zooming into a rendered page eventually shows pixels where the PDF would still show clean letterforms.",
    },
    {
      question: "Can I get the text out of the PDF this way?",
      answer:
        "No, this goes the other direction. Rendering turns text into pixels, so the output contains no selectable text at all. Extracting words needs a text extractor or, for a scan, optical character recognition, and neither is offered here.",
    },
    {
      question: "Why is my PNG output bigger than the PDF I started with?",
      answer:
        "Because a PDF stores instructions and a PNG stores every pixel losslessly. A 40-page text document of 165,897 bytes became 25,256,591 bytes of PNG, since each page turned into a full raster of mostly white paper. JPEG avoids most of that.",
    },
    {
      question: "Does it handle password protected PDFs?",
      answer:
        "No. The renderer refuses a document it cannot decrypt, and there is no place to type a password here. Open it in whichever reader you normally use, save an unlocked copy from there, and convert that instead.",
    },
    {
      question: "Is there a page or file size limit?",
      answer:
        "Nothing fixed, because there is no server enforcing one. Memory is the constraint: every converted page is held as an image until you navigate away. Use a page range for long documents, particularly at 4x and particularly on a phone.",
    },
    {
      question: "Are the pages in the right order in the ZIP?",
      answer:
        "Yes, filenames carry the page number so they sort correctly in any file browser. A range such as 5-8 produces four files numbered by their position in the original document rather than renumbered from one.",
    },
    {
      topic: "offline",
      question: "Does this work without a connection?",
      answer:
        "Yes, after the page has loaded once. PDF rendering and image encoding are both done by your browser, so nothing more is needed from the network.",
    },
  ],

  related: [
    {
      name: "Images to PDF",
      path: "/images-to-pdf",
      description: "The reverse trip, turning pictures back into a document.",
    },
    {
      name: "Compress Image",
      path: "/image-compressor",
      description: "Shrink the rendered pages further before sending them.",
    },
    {
      name: "Split PDF",
      path: "/pdf-split",
      description: "Pull out the pages you want before converting anything.",
    },
    {
      name: "Compress PDF",
      path: "/pdf-compress",
      description: "Make a scan smaller while keeping it a PDF.",
    },
    {
      name: "Crop Image",
      path: "/image-crop",
      description: "Trim margins off a rendered page.",
    },
    {
      name: "Merge PDF",
      path: "/pdf-merge",
      description: "Combine documents before rendering them as images.",
    },
  ],

  headings: {
    features: { heading: "What this converter gives you" },
    howItWorks: { heading: "How to convert a PDF to images in three steps" },
    examples: {
      heading: "The same document, two formats",
      lede: "Identical resolution, identical appearance, eight times the size.",
    },
    scenarios: { heading: "Specific situations" },
    useCases: { heading: "Who converts PDF pages to images" },
    faq: { heading: "PDF to image: common questions" },
    related: { heading: "Other PDF and image tools" },
    limitations: {
      heading: "What this conversion costs you",
      lede: "Rendering a page is a one-way trip, and the first item is the one that catches people out.",
    },
  },
};
