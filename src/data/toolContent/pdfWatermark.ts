import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S1 } from "./shared";

/**
 * Tier B content for /pdf-watermark.
 *
 * The honesty problem specific to this page is that a drawn watermark is not a
 * security control. Anyone selling it as one is misleading people, so the
 * limitations lead with it.
 */
export const pdfWatermarkContent: Partial<ToolPageContent> = {
  tier: "B",

  seo: {
    title: "Add a Watermark to a PDF, Free and Private",
    description:
      "Stamp text such as DRAFT or CONFIDENTIAL across every page of a PDF, with your own colour, size, opacity and position. Nothing is uploaded. Adds about 240 bytes a page.",
    keywords: [
      "add watermark to pdf",
      "pdf watermark free",
      "stamp confidential on pdf",
      "watermark pdf without uploading",
      "draft watermark pdf",
      "pdf watermark text",
    ],
  },

  hero: {
    h1: "Add a Watermark to a PDF",
    subtitle:
      "Stamp text across every page, with the colour, size, opacity and position you choose. It is drawn into the page content, so it travels with the document, and it is a label rather than a lock.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },

  intro: {
    heading: "What gets written into the file",
    paragraphs: [
      "The text you type is drawn onto each page as ordinary page content, using an embedded standard font, at the size, colour, opacity and position you set. It becomes part of the page description rather than an annotation layered on top, so it prints, it survives being sent on, and it appears in every viewer rather than only the one that made it. The cost is small and predictable: stamping twelve pages added 2,917 bytes and forty pages added 9,373, working out at roughly 240 bytes per page for the drawn text plus the font that has to be embedded once.",
      "Worth being clear about what this is for. A watermark is a visible label that communicates status, marks a copy as a draft, or discourages casual reuse of a document. It is not protection. The text sits in the page content stream where any PDF editor can select and delete it, and anyone can render the page to an image and work from that. If a document genuinely must not be redistributed, watermarking is the wrong mechanism and the answer is access control rather than ink.",
    ],
  },

  features: [
    {
      icon: "Palette",
      title: "Colour, size and opacity",
      body: "Pick the exact shade, point size and transparency. A pale grey at low opacity sits behind the text without making it unreadable, which is what most documents want.",
    },
    {
      icon: "MoveVertical",
      title: "Position on the page",
      body: "Place the stamp where it will be seen without covering the content that matters. Centre is the default; corners suit documents with dense middles.",
    },
    {
      icon: "Check",
      title: "Form fields and bookmarks survive",
      body: "Text is drawn onto the file you opened, not onto a replacement assembled from it, so a form still accepts input afterwards and the outline is still there.",
    },
    {
      icon: "CloudOff",
      title: "The document never leaves the tab",
      body: "Things people mark CONFIDENTIAL are precisely the things that should not be uploaded to mark them confidential. This does the work locally.",
    },
  ],

  howItWorks: [
    {
      title: "Open the document",
      body: "Select the PDF you want to stamp. Its page count is read straight away, so you know how many pages the watermark will be applied to.",
    },
    {
      title: "Set the text and how it looks",
      body: "Type the wording, then adjust colour, size, opacity and position. Lower opacity keeps the underlying text legible; larger sizes are harder to crop out of a screenshot.",
    },
    {
      title: "Apply and download",
      body: "Press Apply Watermark and the stamped copy is saved to your downloads. The file you started from is untouched, so you can try different settings freely.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "CONFIDENTIAL across a short document",
      description: "The default settings on a twelve-page report.",
      before: { label: "Input", detail: "12-page text PDF, 50,563 bytes" },
      after: { label: "Output", detail: "53,480 bytes, 5.8% larger, 25 ms" },
      settings: "CONFIDENTIAL, centre, 48pt, 30% opacity, grey",
      explanation:
        "2,917 bytes for twelve pages, which includes embedding the font once. The proportion looks noticeable only because the source is small; on a scan the same stamp is a rounding error.",
    },
    {
      kind: "file",
      title: "The same stamp over forty pages",
      description: "Showing how the cost scales with page count rather than file size.",
      before: { label: "Input", detail: "40-page text PDF, 165,897 bytes" },
      after: { label: "Output", detail: "175,270 bytes, 5.6% larger, 24 ms" },
      settings: "CONFIDENTIAL, centre, 48pt, 30% opacity, grey",
      explanation:
        "9,373 bytes across forty pages, about 234 a page, and no slower than the twelve page run. The per-page cost is the drawn text; the font is embedded once regardless of length.",
    },
  ],

  measurements: {
    method: MEASURED_S1,
    rows: [
      {
        scenario: "CONFIDENTIAL across 12 text pages",
        input: "50,563 bytes",
        output: "53,480 bytes",
        timing: "25 ms",
        note: "2,917 bytes added",
      },
      {
        scenario: "CONFIDENTIAL across 40 text pages",
        input: "165,897 bytes",
        output: "175,270 bytes",
        timing: "24 ms",
        note: "about 234 bytes per page",
      },
    ],
  },

  useCases: [
    {
      icon: "FileSignature",
      audience: "Marking drafts",
      body: "A document labelled DRAFT cannot be mistaken for the signed version when both are sitting in someone's downloads folder three weeks later.",
    },
    {
      icon: "Briefcase",
      audience: "Circulating commercially sensitive material",
      body: "Proposals and pricing sent to several parties are easier to keep track of when each is visibly marked, and the marking discourages casual forwarding.",
    },
    {
      icon: "Landmark",
      audience: "Copies of official documents",
      body: "Stamping a scan as a copy, or marking who it was issued to, is standard practice for records that could otherwise be passed off as originals.",
    },
    {
      icon: "GraduationCap",
      audience: "Teaching and sample material",
      body: "Specimen papers and worked examples marked as samples stop them circulating as the real thing, which matters more than it sounds for assessment material.",
    },
    {
      icon: "Building2",
      audience: "Anywhere uploading is not allowed",
      body: "The documents most likely to need a confidentiality stamp are the ones least appropriate to upload to a free web service. Doing it locally removes the contradiction.",
    },
    {
      icon: "Plane",
      audience: "Working offline",
      body: "Everything needed is in the tab after the first visit, so documents can be marked up on a train with no signal at all.",
    },
  ],

  limitations: {
    items: [
      {
        title: "A watermark is not protection",
        body:
          "The text is ordinary page content. Any PDF editor can select and delete it, and rendering the page to an image sidesteps it entirely. Use it to label and to discourage, never to secure. Real restriction needs access control, not ink.",
      },
      {
        title: "Text only, no images or logos",
        body:
          "There is no option to stamp a company mark or a signature graphic. Only typed text using a standard embedded font can be drawn.",
      },
      {
        title: "One setting for the whole document",
        body:
          "The same text, size, colour and position are applied to every page. Different wording on different pages, or skipping the cover, needs the document splitting and reassembling.",
      },
      {
        title: "No rotated or tiled watermarks",
        body:
          "The stamp is drawn horizontally in one place per page. The diagonal repeated pattern some tools produce is not available here, which also makes it marginally easier to crop around.",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Is my document uploaded to add the watermark?",
      answer:
        "No, and this page would be a strange one to get that wrong on. The file is opened in this tab, text is drawn onto each page and a stamped copy is written to your downloads. Documents being marked confidential are exactly the ones that should not pass through someone else's server on the way.",
    },
    {
      question: "Can the watermark be removed by the person I send it to?",
      answer:
        "Yes, with a little effort. The text is part of the page content stream, so a PDF editor can select and delete it. Treat it as a label that communicates status and discourages casual reuse, not as a control that prevents anything.",
    },
    {
      question: "How much larger does the file get?",
      answer:
        "Roughly 240 bytes per page. Twelve pages grew by 2,917 bytes and forty by 9,373, the difference being that the font is embedded once regardless of length. On a scanned document that is far below a rounding error.",
    },
    {
      question: "Will the watermark appear when the document is printed?",
      answer:
        "Yes. It is drawn into the page rather than added as an annotation, so printers and every viewer treat it as part of the content. This is the behaviour you want; annotation-based stamps are sometimes skipped when printing.",
    },
    {
      question: "Can I use an image or a company logo?",
      answer:
        "No, text only. The watermark is typed and drawn using a standard embedded font, and there is no option to place a graphic. A logo stamp needs a full PDF editor.",
    },
    {
      question: "Can I put different text on different pages?",
      answer:
        "Not in one pass, since the settings apply to the whole document. Splitting the file, stamping each part separately and merging the results is the route, though merging will cost you any form fields.",
    },
    {
      question: "What opacity should I use?",
      answer:
        "Around 30 percent, the default, is readable as a watermark while leaving the text underneath legible. Higher values start to interfere with reading; much lower and the mark stops being noticed, which defeats the purpose.",
    },
    {
      question: "Does adding a watermark affect the text underneath?",
      answer:
        "Not at all. The existing content is untouched and the watermark is drawn over it, so text remains selectable and searchable exactly as before, including the words sitting behind the stamp.",
    },
    {
      question: "Do form fields still work after stamping?",
      answer:
        "Yes. Stamping edits the file you opened instead of assembling a replacement, which means everything registered once for the whole document stays registered: fields, the outline, the lot. Send the same file through reorder or merge and you would lose them.",
    },
    {
      topic: "offline",
      question: "Does this work without an internet connection?",
      answer:
        "Yes, once the page has loaded. The font is one of the standard set the PDF library carries, so nothing is fetched while you work.",
    },
  ],

  related: [
    {
      name: "Rotate PDF",
      path: "/pdf-rotate",
      description: "Straighten pages before stamping them.",
    },
    {
      name: "Split PDF",
      path: "/pdf-split",
      description: "Stamp only part of a document by extracting it first.",
    },
    {
      name: "Merge PDF",
      path: "/pdf-merge",
      description: "Combine stamped sections into one file.",
    },
    {
      name: "Compress PDF",
      path: "/pdf-compress",
      description: "Reduce a large stamped scan before sending it.",
    },
    {
      name: "PDF to Images",
      path: "/pdf-to-images",
      description: "Render stamped pages as pictures.",
    },
    {
      name: "Reorder PDF Pages",
      path: "/pdf-reorder",
      description: "Rearrange pages in the stamped document.",
    },
  ],

  headings: {
    features: { heading: "What this tool gives you" },
    howItWorks: { heading: "How to watermark a PDF in three steps" },
    examples: {
      heading: "Two documents, measured",
      lede: "What the stamp costs, and how that scales with page count.",
    },
    useCases: { heading: "When documents need marking" },
    faq: { heading: "Watermarking PDFs: common questions" },
    related: { heading: "Other PDF tools" },
    limitations: {
      heading: "What a watermark will not do",
      lede: "Starting with the one that matters most.",
    },
  },
};
