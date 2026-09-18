import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S1 } from "./shared";

/**
 * Tier A content for /pdf-merge.
 *
 * Every number here comes from docs/CONTENT_FIXTURES.md session S1, measured by
 * driving this page in a browser. Every behavioural claim, what survives a
 * merge and what does not, comes from the copyPages check recorded in the same
 * file. Nothing is estimated.
 */
export const pdfMergeContent: Partial<ToolPageContent> = {
  tier: "A",

  seo: {
    title: "Merge PDF Files: Combine PDFs in Your Browser",
    description:
      "Combine PDF files into one document without uploading them. Reorder by dragging, keep text selectable, and download in about a second. No account, no watermark.",
    keywords: [
      "merge pdf",
      "combine pdf files",
      "merge pdf without uploading",
      "join pdf documents",
      "merge pdf offline",
      "combine pdf free no watermark",
      "merge pdf keep text selectable",
    ],
  },

  hero: {
    h1: "Merge PDF Files Online",
    subtitle:
      "Combine several PDFs into one document, in the order you choose, without sending them anywhere. Pages are copied rather than re-rendered, so nothing is recompressed, and nothing is made smaller either.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose your PDFs", action: "upload" },
  },

  intro: {
    heading: "What merging actually does to your file",
    paragraphs: [
      "A PDF is a collection of numbered objects, page trees, fonts, images, content streams, tied together by a cross-reference table that says where each one lives in the file. Merging does not open your documents and paste one into the other. It creates an empty document, copies the page objects across from each source, renumbers everything so the references still point at the right places, and writes a fresh cross-reference table. The bytes that describe your pages are moved, not reinterpreted.",
      "That is why the result comes back at almost exactly the size it went in. Combining a 12-page scan with a 12-page text document measured 10,374,682 bytes in and 10,374,095 out. A difference of 587 bytes, which is the old cross-reference tables being replaced by one new one. It is also why the whole thing takes 32 milliseconds: no page is ever rendered, no image is ever decoded, and no text is ever re-typeset. If you were hoping the merge would also shrink the file, it will not, and any tool that claims otherwise is quietly re-encoding something.",
    ],
  },

  features: [
    {
      icon: "MoveVertical",
      title: "Drag to set the order",
      body: "The file list is the page order. Drag a document up or down before merging and the output follows, so you do not have to rename files into alphabetical submission first.",
    },
    {
      icon: "FileCheck2",
      title: "Text stays text",
      body: "Because pages are copied rather than rasterised, the merged document keeps selectable text, working search, and any embedded fonts at their original quality.",
    },
    {
      icon: "Layers",
      title: "Any number of documents",
      body: "Add as many PDFs as you like in one pass, and drop individual ones from the list without starting over. There is no per-file or per-merge ceiling to buy your way past.",
    },
    {
      icon: "Gauge",
      title: "Finishes before you look up",
      body: "A 24-page merge of a scan and a text report completed in 32 milliseconds. Structural copying is cheap; the slow part of most online mergers is the round trip, not the work.",
    },
  ],

  howItWorks: [
    {
      title: "Add your PDFs",
      body: "Click the upload panel and select several files at once, or add them in batches. Each one appears in a list with its name and page count so you can confirm you picked the right documents.",
    },
    {
      title: "Drag them into the order you want",
      body: "The list reads top to bottom, and that is the order the pages will appear. Grab a row and move it; use the remove control on anything that should not be in the final document.",
    },
    {
      title: "Merge and download",
      body: "Press Merge PDFs. The combined file is assembled in the tab and saved straight to your downloads folder, named merged.pdf. Nothing is queued and nothing is retained.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "A scan and a typed report in one document",
      description: "The common case: a signed scan that needs a covering document in front of it.",
      before: { label: "Two files", detail: "12-page scan (10.3 MB) + 12-page text PDF (50 KB)" },
      after: { label: "One file", detail: "24 pages, 10,374,095 bytes, 32 ms" },
      explanation:
        "The output is 587 bytes smaller than the two inputs added together. Nothing was compressed. That difference is two cross-reference tables being replaced by one. The scanned pages are still the same images at the same resolution, and the typed pages still have selectable text.",
    },
    {
      kind: "file",
      title: "Two text documents",
      description: "Combining a long report with a short appendix.",
      before: { label: "Two files", detail: "40-page report (165,897 bytes) + 12-page appendix (50,563 bytes)" },
      after: { label: "One file", detail: "52 pages, 216,125 bytes, 35 ms" },
      explanation:
        "216,460 bytes went in and 216,125 came out, a 0.2% difference. Fonts embedded in both documents are not deduplicated by this process, so a merged file is very close to the sum of its parts rather than smaller than it.",
    },
  ],

  measurements: {
    method: MEASURED_S1,
    rows: [
      {
        scenario: "40-page and 12-page text PDFs into one",
        input: "216,460 bytes",
        output: "216,125 bytes",
        timing: "35 ms",
        note: "52 pages, text still selectable",
      },
      {
        scenario: "12-page scan and a 12-page text PDF",
        input: "10,374,682 bytes",
        output: "10,374,095 bytes",
        timing: "32 ms",
        note: "images untouched at original resolution",
      },
    ],
  },

  useCases: [
    {
      icon: "Briefcase",
      audience: "Contracts and signed paperwork",
      body: "A countersigned agreement usually arrives as the scan of a signature page plus the typed original. Combining them on your own machine means the signed copy is never handed to a third party whose retention policy you have not read.",
    },
    {
      icon: "Stethoscope",
      audience: "Medical and legal records",
      body: "Letters, test results and discharge summaries routinely need to travel as one document. These are exactly the files that internal policy forbids putting through a consumer upload service, which is usually why people end up doing it by hand.",
    },
    {
      icon: "GraduationCap",
      audience: "Applications and submissions",
      body: "Portals that accept a single attachment force you to staple a CV, transcripts and certificates together. The order matters to whoever reads it, which is what the drag-to-reorder list is for.",
    },
    {
      icon: "Receipt",
      audience: "Expenses and invoices",
      body: "A month of receipts scanned individually becomes one submission. Nothing here is per-file limited, so a fifty-receipt claim goes through in the same pass as a two-receipt one.",
    },
    {
      icon: "Building2",
      audience: "Anyone on a locked-down network",
      body: "Plenty of workplaces block the well-known PDF sites outright. A page that does the work locally keeps working when the upload-based alternative is unreachable, and does not need an exception raising to use it.",
    },
    {
      icon: "Plane",
      audience: "Working without a connection",
      body: "Once this page has loaded it keeps merging with the network off, because the code that does the job is already in your browser. Useful on a plane, and a straightforward way to satisfy yourself nothing is being sent.",
    },
  ],

  limitations: {
    items: [
      {
        title: "Fillable form fields stop being fillable",
        body:
          "This is the one to know about. A document with form fields comes back looking identical, and the fields no longer work: the values and the field definitions are dropped while their appearance survives as flat page content. Merging a fillable form produces a picture of that form. Check before sending anything on.",
      },
      {
        title: "Bookmarks and outlines are lost",
        body:
          "The navigation tree that some readers show down the side is stored on the document rather than on its pages, so copying pages into a new document leaves it behind. A 400-page manual will merge correctly and arrive with no chapter list.",
      },
      {
        title: "It will not make the file smaller",
        body:
          "Merging is a structural operation, so the output is approximately the sum of the inputs. If the combined document is too large to email, that is a separate job.",
        alternative: "pdf-compress",
      },
      {
        title: "The order is per file, not per page",
        body:
          "You can arrange the documents, not the pages inside them. To interleave pages, or to move page nine ahead of page two, merge first and then rearrange.",
        alternative: "pdf-reorder",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "How can I check the files are really not being uploaded?",
      answer:
        "Open your browser's developer tools, switch to the Network tab, and merge something. You will see this page's own assets load and then nothing at all while the work happens. The stronger test is to disconnect from the network entirely once the page has loaded and merge anyway. It still works, which is not something a tool that needs a server can do.",
    },
    {
      question: "Does merging reduce the quality of scanned pages?",
      answer:
        "No. Scanned pages are images inside the PDF, and those image objects are copied across byte for byte. Nothing is decoded, resampled or re-encoded, so a 300 dpi scan is still a 300 dpi scan afterwards, at the same file size it contributed going in.",
    },
    {
      question: "Why is the merged file not smaller than the originals?",
      answer:
        "Because nothing was thrown away. A merge copies the objects that describe your pages into one container and rebuilds the index; it does not recompress images or subset fonts. Two documents totalling 216,460 bytes produced 216,125 bytes. Expect the sum, not a saving.",
    },
    {
      question: "Will a font that appears in both documents be stored twice?",
      answer:
        "Yes. Each source document brings its own embedded font programs, and they are copied independently rather than matched up and shared. For two documents using the same typeface this adds a little weight, which is part of why the output lands slightly above the raw sum before the cross-reference saving pulls it back.",
    },
    {
      question: "Can I merge a password-protected PDF?",
      answer:
        "Not while it is still protected. A document encrypted with an open password cannot have its pages read without that password being applied first, so remove the protection in whatever application you normally open it with, then merge the unprotected copy.",
    },
    {
      question: "Is there a limit on the number of files or total size?",
      answer:
        "None that this page imposes, because there is no server tier behind it to enforce one. The real ceiling is your device's memory: every document is held in RAM while the new one is assembled, so a laptop copes with far more than a phone does. A 10 MB merge is unremarkable.",
    },
    {
      question: "What order do the pages come out in?",
      answer:
        "Exactly the order the files appear in the list, top to bottom, with each document's own pages kept in sequence. Dragging a row changes the output; the filenames themselves are ignored, so you do not need to rename anything to force an order.",
    },
    {
      question: "Do annotations and highlights survive?",
      answer:
        "Page-level annotations such as highlights, sticky notes and link areas are attached to the pages themselves, so they are carried across. Anything stored at document level rather than page level. The bookmark tree, form field definitions, is not.",
    },
    {
      question: "Can I merge files that are not PDFs?",
      answer:
        "Not here. This page reads PDF page trees, which images and Word documents do not have. Convert them first and then merge the results.",
    },
    {
      question: "Does it work on a phone?",
      answer:
        "Yes, with the caveat that the work happens on the device. Phones have less memory to spare and the merge runs on the main thread, so a large scan-heavy job will make the tab unresponsive for longer than the same job on a laptop.",
    },
    {
      question: "Is anything left behind after I close the tab?",
      answer:
        "No. The documents exist as objects in the page's memory and the merged result as a temporary blob, all of which the browser discards when the tab closes. There is no cache to clear and no history to delete because nothing was written anywhere.",
    },
    {
      topic: "offline",
      question: "Does this keep working offline?",
      answer:
        "Yes, once the page has loaded. Everything that does the merging is already in your browser at that point, so you can switch off the network and carry on. Reloading while offline depends on the browser still holding the page in its cache.",
    },
  ],

  related: [
    {
      name: "Split PDF",
      path: "/pdf-split",
      description: "Pull a page range back out of a document you have merged.",
    },
    {
      name: "Reorder PDF Pages",
      path: "/pdf-reorder",
      description: "Rearrange individual pages once the documents are combined.",
    },
    {
      name: "Compress PDF",
      path: "/pdf-compress",
      description: "Shrink a merged file that is now too large to email.",
    },
    {
      name: "Rotate PDF",
      path: "/pdf-rotate",
      description: "Fix scans that came in sideways before combining them.",
    },
    {
      name: "Images to PDF",
      path: "/images-to-pdf",
      description: "Turn photographs of documents into a PDF you can merge.",
    },
    {
      name: "PDF to Images",
      path: "/pdf-to-images",
      description: "Export the pages of a merged document as PNG or JPG files.",
    },
  ],

  headings: {
    features: {
      heading: "Why merge here rather than upload",
      lede: "What a local merge gives you that a server-side one cannot.",
    },
    howItWorks: { heading: "How to merge PDFs in three steps" },
    examples: {
      heading: "Two merges, measured",
      lede: "Real documents, real byte counts, and what changed between them.",
    },
    useCases: { heading: "Who needs this" },
    faq: { heading: "Merging PDFs: common questions" },
    related: {
      heading: "Other PDF tools",
      lede: "The rest of the toolkit, all working the same way.",
    },
    limitations: {
      heading: "What a merge cannot carry across",
      lede: "Structural facts about PDFs, not shortcomings of this page, worth knowing before you send the result on.",
    },
  },
};
