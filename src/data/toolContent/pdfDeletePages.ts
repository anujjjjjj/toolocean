import type { ToolPageContent } from "@/types/toolContent";

/**
 * Tier B content for /pdf-delete-pages.
 *
 * The honest question here is what "deleted" means. The kept pages are copied into
 * a new file, so a removed page's content is really gone, and the same rebuild is
 * why bookmarks, form behaviour and jumps inside the document do not survive.
 */
export const pdfDeletePagesContent: Partial<ToolPageContent> = {
  tier: "B",

  seo: {
    title: "Delete Pages from PDF – No Upload, Free",
    description:
      "Delete or remove pages from a PDF with no upload. See a thumbnail of every page, tap the ones to drop, or type 2-4, 9, then download the shorter copy.",
    keywords: [
      "delete pages from pdf",
      "remove pages from pdf",
      "delete pdf pages no upload",
      "remove page from pdf online free",
      "delete odd pages pdf",
      "cut pages out of a pdf",
    ],
  },

  hero: {
    h1: "Delete Pages from a PDF",
    subtitle:
      "See every page as a thumbnail, tap the ones you do not want, and download a shorter copy. Your original file stays exactly as it was.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },

  intro: {
    heading: "What happens to a deleted page",
    paragraphs: [
      "No upload: delete pages from a PDF right in your browser, with the file read and rewritten inside this tab. Thumbnails are drawn on your device as you scroll, so a 300-page report opens without rendering 300 pages up front. Each thumbnail is a toggle. Mark a page and it turns red, the count above the grid drops by one, and the range box rewrites itself in compact form such as 2-4, 9.",
      "The download is a new document holding copies of the kept pages in their original order. Nothing is hidden or flagged: a removed page's text and pictures are left out of the new file, and any leftover copy that an internal link would have dragged along is stripped before saving. If two pages share a font or a logo and one of them stays, that shared item stays too, because the kept page still needs it.",
    ],
  },

  features: [
    {
      icon: "Layers",
      title: "A thumbnail of every page",
      body: "Pages keep their real shape in the grid, wide sheets included, so a stray landscape table or a blank back side is easy to spot before you mark it.",
    },
    {
      icon: "ListChecks",
      title: "Three ways to choose",
      body: "Tap pages, press Select odd or Select even for a duplex scan, or type a list. The box and the grid stay in step whichever you use.",
    },
    {
      icon: "Gauge",
      title: "Long files stay responsive",
      body: "Only pages near the screen are drawn, two at a time, at low resolution. Scroll past a section and its unfinished thumbnails are skipped.",
    },
    {
      icon: "CloudOff",
      title: "The file stays on this device",
      body: "Opening, previewing and rebuilding all happen locally. Close the tab and the only thing left is the copy your browser saved.",
    },
  ],

  howItWorks: [
    {
      title: "Open the PDF",
      body: "Drag the file onto the box above, or tap to browse. Thumbnails appear as the pages come into view.",
    },
    {
      title: "Mark the pages to remove",
      body: "Tap thumbnails, use Select odd or Select even, or type a list such as 2-4, 9.",
    },
    {
      title: "Download the shorter copy",
      body: "It is saved as name-edited.pdf. The original on your device is not changed.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "A scan with blank back sides",
      description: "A 20-sheet duplex scan where every even page came out empty.",
      before: { label: "Input", detail: "40-page PDF, even pages blank" },
      after: { label: "Output", detail: "20-page PDF named scan-edited.pdf" },
      settings: "Select even, then Download PDF (20 pages)",
      explanation:
        "One press marks every even page, and the thumbnails let you check that none of them holds a stray note before you save. If one does, tap it to bring that sheet back.",
    },
    {
      kind: "file",
      title: "A statement with pages you would rather not share",
      description: "A ten-page document where only some pages are relevant to the person receiving it.",
      before: { label: "Input", detail: "10-page PDF" },
      after: { label: "Output", detail: "7-page PDF holding pages 1 and 5 to 10" },
      settings: "Pages to delete: 2-4",
      explanation:
        "Typing 2-4 marks three pages at once and the line above the grid reads Keeping 7 of 10 pages. Numbers printed on the pages themselves do not change, so the copy jumps from 1 to 5.",
    },
  ],

  useCases: [
    {
      icon: "Printer",
      audience: "Scans from an office copier",
      body: "Feeders pick up blank backs, separator sheets and the odd double-fed page. Clearing them out takes a minute and makes the file shorter to read and to print.",
    },
    {
      icon: "Landmark",
      audience: "Statements and financial records",
      body: "A landlord or lender may need only the summary page. Send that page and leave the transaction history out of the copy they receive.",
    },
    {
      icon: "GraduationCap",
      audience: "Coursework and applications",
      body: "Portals often cap the page count. Drop the cover sheet or appendix you do not need and the upload limit stops being a problem.",
    },
    {
      icon: "Briefcase",
      audience: "Reports sent outside the team",
      body: "Internal notes and draft appendices tend to sit at the back of a deck export. Remove them before the PDF goes to a client.",
    },
    {
      icon: "Building2",
      audience: "Files that may not leave the building",
      body: "Contracts and personnel records can be trimmed here without passing through anyone else's server, which is often the rule rather than a preference.",
    },
  ],

  limitations: {
    items: [
      {
        title: "Bookmarks and fillable fields do not carry over",
        body:
          "The copy is built from pages alone, so the outline is dropped and form fields stop being editable. Filled-in values usually remain visible on the page.",
      },
      {
        title: "Links between pages stop working",
        body:
          "Table-of-contents style jumps are cut so they cannot pull a removed page back into the file. Links to websites keep working.",
      },
      {
        title: "Printed page numbers stay as they were",
        body:
          "Numbers drawn on the pages are part of the artwork. To renumber, run the copy through Add Page Numbers, which adds new ones rather than replacing the old.",
      },
      {
        title: "Locked files must be unlocked first",
        body:
          "This tool will not open a file with a password or editing restrictions. Clear them using the password you already have, then come back.",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Is my PDF uploaded to delete the pages?",
      answer:
        "No. The file is opened by JavaScript in this tab, the thumbnails are drawn on your device, and the shorter copy is built in memory before your browser saves it. No request carries the document, and your network panel will confirm that.",
    },
    {
      question: "Is a deleted page really gone from the new file?",
      answer:
        "Its text and images are not copied, and any hidden copy that an internal link would have brought along is removed before saving. Something shared with a kept page, such as a font or a logo, stays because that page still uses it. Your original file is untouched, so delete that yourself if it must go.",
    },
    {
      question: "How do I remove several pages at once?",
      answer:
        "Type them in the Pages to delete box, separated by commas, with a dash for a run: 2-4, 9. Spaces do not matter, 4-2 reads the same as 2-4, and 8- means page 8 to the end. Tapping a thumbnail rewrites the box in the same short form.",
    },
    {
      question: "What happens if I type a page that does not exist?",
      answer:
        "A note appears under the box saying how many pages the file has, and your current selection stays as it was. The download waits until the list is valid, so a typo cannot quietly remove the wrong sheets.",
    },
    {
      question: "Can I delete every page?",
      answer:
        "No. A PDF has to contain at least one page, so the download button is disabled once all of them are marked and a note explains why. Unmark any one page to continue.",
    },
    {
      question: "My PDF asks for a password. What should I do?",
      answer:
        "Locked files cannot be changed here. If your bank sent it, our [statement unlock guide](/remove-password-from-bank-statement-pdf) covers that case. For anything else, use [Unlock PDF](/pdf-unlock) with the password you already know, then open the unlocked copy here.",
    },
    {
      question: "Will this work on a very long PDF?",
      answer:
        "Yes. Pages are drawn only as they approach the screen, at low resolution and two at a time, so a 300-page file does not stall the tab. A progress line shows how many are done. Very large files still need memory on your device, and a phone will be slower than a laptop.",
    },
    {
      question: "Does removing pages reduce quality?",
      answer:
        "No. Kept pages are copied as they are, without being rendered to images, so text stays selectable and pictures keep their resolution. The thumbnails are low resolution, but they are only previews and never go into the file.",
    },
    {
      question: "Can I keep certain pages instead of removing them?",
      answer:
        "Yes, though [Split PDF](/pdf-split) is the shorter route when you know the run you want to keep. To change the order rather than the content, use [PDF Page Reorder](/pdf-reorder).",
    },
    {
      topic: "offline",
      question: "Does this work without a connection?",
      answer:
        "Yes, once this page has loaded. Your browser keeps the PDF engine and the thumbnail renderer once they arrive, a moment after the page opens, so you can go offline and carry on.",
    },
  ],

  related: [
    { name: "Split PDF", path: "/pdf-split", description: "Pull out a run of pages as its own file." },
    { name: "PDF Page Reorder", path: "/pdf-reorder", description: "Change the order of the pages you kept." },
    { name: "Unlock PDF", path: "/pdf-unlock", description: "Remove a password you know before editing." },
    { name: "Add Page Numbers", path: "/pdf-page-numbers", description: "Number the shorter copy from 1." },
    { name: "Merge PDF", path: "/pdf-merge", description: "Join the trimmed file to another document." },
  ],

  headings: {
    features: { heading: "What you get" },
    howItWorks: { heading: "How to delete pages from a PDF" },
    examples: {
      heading: "Two documents, trimmed",
      lede: "A duplex scan, and a short file with a run of pages removed.",
    },
    useCases: { heading: "When you need to remove pages" },
    faq: { heading: "Deleting PDF pages: common questions" },
    related: { heading: "Other PDF tools" },
    limitations: {
      heading: "Good to know",
      lede: "What rebuilding the file leaves behind, and what to do about it.",
    },
  },
};
