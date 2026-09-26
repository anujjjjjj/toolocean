import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S1 } from "./shared";

/**
 * Tier B content for /pdf-reorder.
 *
 * Unlike rotate and watermark, this rebuilds the document from copied pages, so
 * it loses form fields and bookmarks. Tested, not assumed. See
 * docs/CONTENT_FIXTURES.md.
 */
export const pdfReorderContent: Partial<ToolPageContent> = {
  tier: "B",

  seo: {
    title: "Reorder PDF Pages by Dragging Them",
    description:
      "Rearrange the pages of a PDF by dragging them into the order you want, then download the result. Nothing is uploaded and no page is re-rendered.",
    keywords: [
      "reorder pdf pages",
      "rearrange pdf pages",
      "move pages in pdf",
      "change pdf page order",
      "reorder pdf without uploading",
      "sort pdf pages",
    ],
  },

  hero: {
    h1: "Reorder the Pages of a PDF",
    subtitle:
      "Drag pages into the sequence you want and download the rearranged document. Pages are copied rather than redrawn, so nothing loses quality on the way through.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },

  intro: {
    heading: "How the new document is put together",
    paragraphs: [
      "Rearranging means building a new document and copying pages into it in the order you specified. Each page object is transferred with the resources it depends on, references are renumbered so they still resolve, and a fresh index is written. Nothing is rendered and nothing is recompressed, so a scanned page arrives at exactly the resolution it left at and the file barely changes size: a 50,563 byte document came back at 50,562 bytes, one byte smaller, in 25 milliseconds.",
      "That copying is also why this operation loses more than rotating does. PDFs keep some things per sheet and some things once for the whole file, and only the per-sheet half is carried into a rebuilt container. In practice that means fillable fields stop accepting input and the chapter outline vanishes. Merging and splitting work the same way. Rotating or stamping the same file keeps both, because those edit what is already there instead of assembling something new.",
    ],
  },

  features: [
    {
      icon: "MoveVertical",
      title: "Drag pages into place",
      body: "Every page is a thumbnail you can pick up and move. The list is the document, so what you arrange is exactly what you download.",
    },
    {
      icon: "FileCheck2",
      title: "No loss of quality",
      body: "Pages are copied as objects, not redrawn, so text stays selectable and scanned images keep their original resolution and file size.",
    },
    {
      icon: "ShieldCheck",
      title: "The original is left alone",
      body: "Your source is opened read-only and the rearranged copy saves separately, so an arrangement you dislike costs one download and nothing else.",
    },
    {
      icon: "Zap",
      title: "Immediate",
      body: "Rebuilding a twelve page document took 25 milliseconds. There is no upload at either end, which on most connections is the entire wait elsewhere.",
    },
  ],

  howItWorks: [
    {
      title: "Open the document",
      body: "Select your PDF and each page appears as a numbered thumbnail, so you can see what you are moving rather than working from page numbers alone.",
    },
    {
      title: "Drag them into order",
      body: "Move pages until the sequence is right. The numbers shown are the original positions, which makes it easy to confirm nothing has been lost along the way.",
    },
    {
      title: "Download the result",
      body: "Press Download PDF and the rearranged document is saved. Nothing is retained once you close the tab.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "Rebuilding a twelve page document",
      description: "What the operation costs, measured with the order left alone.",
      before: { label: "Input", detail: "12-page text PDF, 50,563 bytes" },
      after: { label: "Output", detail: "50,562 bytes, 25 ms" },
      explanation:
        "One byte smaller, which is the old cross-reference table being replaced. Rearranging pages is close to free in both time and size, because the content itself is only ever copied.",
    },
    {
      kind: "file",
      title: "Moving an appendix to the front",
      description: "The common editorial case.",
      before: { label: "Before", detail: "Pages 1-9 body, pages 10-12 appendix" },
      after: { label: "After", detail: "Pages 10-12 first, then 1-9" },
      explanation:
        "Drag the three appendix pages above the body and download. The pages themselves are identical afterwards; only the order in the new document's page tree differs.",
    },
  ],

  measurements: {
    method: MEASURED_S1,
    rows: [
      {
        scenario: "12-page text PDF rebuilt, order unchanged",
        input: "50,563 bytes",
        output: "50,562 bytes",
        timing: "25 ms",
        note: "content copied, never re-rendered",
      },
    ],
  },

  useCases: [
    {
      icon: "BookOpen",
      audience: "Getting a document into reading order",
      body: "Sections assembled out of sequence, or an appendix that belongs at the front, are fixed by dragging rather than by exporting the whole thing again from the source application.",
    },
    {
      icon: "ScanLine",
      audience: "Correcting a scan",
      body: "A sheaf fed in the wrong order, or a document scanned back to front, becomes correct without rescanning anything.",
    },
    {
      icon: "Briefcase",
      audience: "Assembling submissions",
      body: "Applications and tenders frequently specify the order documents must appear in. Rearranging locally keeps the contents private while you get it right.",
    },
    {
      icon: "Printer",
      audience: "Preparing for print",
      body: "Putting pages in the order they need to be produced avoids relying on printer settings that behave differently on different machines.",
    },
    {
      icon: "GraduationCap",
      audience: "Course and reference material",
      body: "Reordering chapters into the sequence you actually work through makes a long reference document far easier to read on a tablet.",
    },
    {
      icon: "Plane",
      audience: "Working offline",
      body: "The rearranging happens in your browser once the page is open, so it continues to work with no connection.",
    },
  ],

  limitations: {
    items: [
      {
        title: "Form fields and bookmarks are lost",
        body:
          "The document is rebuilt from copied pages, and anything held at document level does not survive that. A fillable form comes back looking right and no longer accepting input, and the outline tree disappears. Rotating or watermarking would keep both.",
      },
      {
        title: "Pages cannot be deleted or duplicated here",
        body:
          "This changes the order and nothing else. Removing a page means extracting everything except it, and there is no way to repeat a page in the output.",
        alternative: "pdf-split",
      },
      {
        title: "No pages from other documents",
        body:
          "You are rearranging one file. Bringing in a page from elsewhere means merging the documents first and then reordering the combined result.",
        alternative: "pdf-merge",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Is the file uploaded to rearrange it?",
      answer:
        "No. The document is read into this tab, a new one is assembled in the order you set, and that copy goes to your downloads. No request carries the document at any point, and disconnecting the machine before you start changes nothing about how it works.",
    },
    {
      question: "Does reordering reduce quality?",
      answer:
        "No. Pages are copied as objects rather than redrawn, so text stays selectable and scanned images keep their exact resolution. The rebuilt twelve page document came out one byte smaller than it went in.",
    },
    {
      question: "Will a fillable form still work afterwards?",
      answer:
        "No, and it is the thing worth checking before you rearrange one. Field definitions are registered once for the whole file, not attached to individual sheets, so rebuilding from copied sheets leaves them behind. What you get back looks identical and silently refuses to accept typing.",
    },
    {
      question: "What happens to bookmarks and the outline?",
      answer:
        "They are lost, for the same reason. The navigation tree belongs to the document, and copying pages into a new one leaves it behind. A long manual will reorder correctly and arrive with no chapter list.",
    },
    {
      question: "Can I delete a page while I am here?",
      answer:
        "Not from this page. Reordering changes sequence only. To drop a page, extract every other page into a new document, which produces the same result by a different route.",
    },
    {
      question: "Can I reverse the whole document?",
      answer:
        "Only by dragging, since there is no reverse button. For a short document that is quick; for a hundred pages it is genuinely tedious and a desktop editor will be faster.",
    },
    {
      question: "Do the thumbnails show the original page numbers?",
      answer:
        "Yes, each keeps the number it had in the source document as you move it around. That makes it straightforward to confirm the new sequence is what you intended and that no page has gone missing.",
    },
    {
      question: "How many pages can it handle?",
      answer:
        "Nothing caps it here. Memory decides, because the source and the document under construction both sit in the tab at once, and drawing a preview for every sheet is the part that actually slows down on a long file.",
    },
    {
      question: "Does the original document change?",
      answer:
        "No. Your selected file is opened read-only, and the rearranged version goes to your downloads as a separate document. Trying several arrangements costs nothing, because the source is never rewritten.",
    },
    {
      topic: "offline",
      question: "Does this work offline?",
      answer:
        "Yes, once the page has loaded. Reading the document and writing the new one are both done in the browser, so no connection is needed afterwards.",
    },
  ],

  related: [
    {
      name: "Rotate PDF",
      path: "/pdf-rotate",
      description: "Turn pages the right way up, keeping form fields intact.",
    },
    {
      name: "Split PDF",
      path: "/pdf-split",
      description: "Remove pages by extracting the ones you want to keep.",
    },
    {
      name: "Merge PDF",
      path: "/pdf-merge",
      description: "Bring in pages from another document before reordering.",
    },
    {
      name: "Add Watermark",
      path: "/pdf-watermark",
      description: "Mark the rearranged document before sending it.",
    },
    {
      name: "PDF to Images",
      path: "/pdf-to-images",
      description: "Export the reordered pages as pictures.",
    },
    {
      name: "Compress PDF",
      path: "/pdf-compress",
      description: "Shrink the result if it is a large scan.",
    },
  ],

  headings: {
    features: { heading: "What this tool gives you" },
    howItWorks: { heading: "How to reorder PDF pages in three steps" },
    examples: {
      heading: "What rearranging costs",
      lede: "Measured on a real document, plus the everyday editorial case.",
    },
    useCases: { heading: "When page order needs changing" },
    faq: { heading: "Reordering PDF pages: common questions" },
    related: { heading: "Other PDF tools" },
    limitations: {
      heading: "What reordering will not do",
      lede: "The first item catches people out, because the document still looks correct.",
    },
  },
};
