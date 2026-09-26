import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S1 } from "./shared";

/**
 * Tier A content for /pdf-split.
 *
 * Numbers are from docs/CONTENT_FIXTURES.md session S1. The range-parsing
 * behaviour described here (duplicates collapsed, output always ascending,
 * out-of-range values ignored) is read from parsePageRange in the tool itself,
 * not assumed from how such inputs usually behave.
 */
export const pdfSplitContent: Partial<ToolPageContent> = {
  tier: "A",

  seo: {
    title: "Split PDF: Extract Pages Without Uploading",
    description:
      "Pull specific pages or ranges out of a PDF and save them as a new document, entirely in your browser. Type 1-3, 7, 12-15 and download. No account, no watermark.",
    keywords: [
      "split pdf",
      "extract pages from pdf",
      "split pdf without uploading",
      "pdf page extractor",
      "remove pages from pdf",
      "split pdf offline",
      "get one page out of a pdf",
    ],
  },

  hero: {
    h1: "Split PDF Pages Online",
    subtitle:
      "Choose the pages you want and save them as a separate document, without the original leaving your machine. This extracts a selection into one new file rather than bursting a document into dozens of them.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },

  intro: {
    heading: "Extracting pages, and why the result shrinks the way it does",
    paragraphs: [
      "Ask for pages 1 to 10 and this builds an empty document, lifts those ten page objects out of the original along with the resources each one depends on. The fonts it references, the images it draws, the colour spaces it uses, and writes them into the new file with a rebuilt index. The pages you did not ask for are never opened, and neither is the text on the pages you did. It is a copy operation on the file's object graph, which is why ten pages come out in twenty milliseconds.",
      "The consequence worth understanding is that the output size tracks what you keep rather than what you discard, and not always in a straight line. Taking ten pages out of a forty-page text report produced a file 25.4% of the original, almost exactly the proportion of pages kept. Taking ten of twelve pages from a scan produced 89.7% of the original, because every page of a scan carries its own full-page image and those images are the file. A page of dense text weighs almost nothing; a page that is a photograph weighs a megabyte. Which pages you pick matters more than how many.",
    ],
  },

  features: [
    {
      icon: "ListOrdered",
      title: "Ranges and single pages together",
      body: "Type something like 1-3, 7, 12-15 in one go. Hyphens give you a span, commas separate selections, and the two mix freely in a single expression.",
    },
    {
      icon: "ScanLine",
      title: "Page count read up front",
      body: "The document is opened as soon as you pick it and its length is shown, so you can write a range against a real number instead of guessing and checking.",
    },
    {
      icon: "ShieldCheck",
      title: "The original is never modified",
      body: "Extraction reads the file you chose and writes a new one. The document on your disk is untouched, so there is nothing to undo if the range was wrong.",
    },
    {
      icon: "Zap",
      title: "Fast even on heavy scans",
      body: "Ten pages out of a 10 MB scanned document took 35 milliseconds. Nothing is rendered or recompressed, so size affects the result far less than you would expect.",
    },
  ],

  howItWorks: [
    {
      title: "Open the document",
      body: "Select the PDF you want to take pages from. It is read locally and its page count appears beside the filename, which is the number your range has to fit inside.",
    },
    {
      title: "Say which pages you want",
      body: "Write the selection as numbers and spans separated by commas, 1-3, 7, 12-15. Use Select All if you actually want the whole document copied into a fresh file.",
    },
    {
      title: "Extract and save",
      body: "Press Extract. The chosen pages are assembled into one new PDF and downloaded, named after the range you asked for so the file is identifiable later.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "Ten pages out of a long text report",
      description: "The everyday case: one chapter out of something much longer.",
      before: { label: "Source", detail: "40-page A4 report, 165,897 bytes" },
      after: { label: "Pages 1-10", detail: "42,181 bytes, 20 ms" },
      settings: "Range: 1-10",
      explanation:
        "A quarter of the pages produced just over a quarter of the bytes. Text pages are roughly interchangeable in weight, so for a document like this the size of the result is a good proxy for how much of it you kept.",
    },
    {
      kind: "file",
      title: "Most of a scanned document",
      description: "Dropping a couple of pages from a scan barely helps.",
      before: { label: "Source", detail: "12-page scan, 10,324,119 bytes" },
      after: { label: "Pages 1-10", detail: "9,258,693 bytes, 35 ms" },
      settings: "Range: 1-10",
      explanation:
        "Removing two of twelve pages removed a tenth of the file. Each scanned page is a full-page image and those images are almost the entire document, so the only way to make a scan meaningfully smaller is to drop a lot of pages or to re-encode the images.",
    },
  ],

  measurements: {
    method: MEASURED_S1,
    rows: [
      {
        scenario: "pages 1-10 of the 40-page text PDF",
        input: "165,897 bytes",
        output: "42,181 bytes",
        timing: "20 ms",
        note: "25% of pages, 25.4% of bytes",
      },
      {
        scenario: "pages 1-10 of the 12-page scan",
        input: "10,324,119 bytes",
        output: "9,258,693 bytes",
        timing: "35 ms",
        note: "83% of pages, 89.7% of bytes",
      },
    ],
  },

  useCases: [
    {
      icon: "FileSignature",
      audience: "Sending only the relevant part",
      body: "A thirty-page lease where the other party needs the schedule on pages 22 to 26. Extracting locally means the clauses you did not intend to share are not sitting on someone else's server as a side effect.",
    },
    {
      icon: "BookOpen",
      audience: "Study and reference material",
      body: "Lifting one chapter out of a large textbook or standard so it opens quickly on a tablet and can be annotated without scrolling past everything else.",
    },
    {
      icon: "Landmark",
      audience: "Regulated and confidential documents",
      body: "Board packs, patient files and case bundles frequently need one section forwarding. These are the documents where an upload step is the thing that makes the task a policy question instead of a two-minute job.",
    },
    {
      icon: "Mail",
      audience: "Getting under an attachment limit",
      body: "When a document is too large to send, removing the pages the recipient does not need is often quicker than compressing, and unlike compression it costs nothing in quality.",
    },
    {
      icon: "Printer",
      audience: "Printing a subset",
      body: "Producing a file that contains exactly the pages to be printed avoids the perennial error of leaving a print dialog set to a range from the last job.",
    },
    {
      icon: "Files",
      audience: "Breaking up a batch scan",
      body: "A stack of separate documents scanned in one pass arrives as a single PDF. Running the tool once per document turns it back into the individual files it should have been.",
    },
  ],

  limitations: {
    items: [
      {
        title: "One file out, not one file per page",
        body:
          "Everything you select lands in a single document. There is no mode that bursts a 50-page PDF into 50 separate files; to produce several documents, run the extraction once for each range you need.",
      },
      {
        title: "Pages always come out in ascending order",
        body:
          "The selection is treated as a set of page numbers, sorted before extraction. Asking for 9, 2 gives you page 2 followed by page 9, and asking for the same page twice gives it to you once. Extraction cannot be used to reorder or duplicate.",
        alternative: "pdf-reorder",
      },
      {
        title: "Form fields and bookmarks do not survive",
        body:
          "Pages are copied into a new document, and anything held at document level rather than page level is left behind. A fillable field keeps its appearance but stops accepting input, and the outline tree disappears. Worth checking before forwarding an extract of a form.",
      },
      {
        title: "Numbers outside the document are ignored silently",
        body:
          "Ask for 1-999 on a 12-page file and you get all 12 pages with no warning; a range that matches nothing at all is rejected as invalid. The page count shown beside the filename is there so you can avoid guessing.",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Can I confirm the document is not being sent anywhere?",
      answer:
        "Yes, in two ways. Watch the Network panel in your browser's developer tools while you extract, after this page's own files load, nothing further is requested. Or take the machine off the network completely once the page is open and extract anyway; it works, which is impossible for anything that relies on a server.",
    },
    {
      question: "What syntax does the page range accept?",
      answer:
        "Whole numbers and hyphenated spans, separated by commas. 1-3, 7, 12-15 means pages one to three, page seven, and pages twelve to fifteen. Spaces around the commas are fine. Open-ended forms such as 5- are not understood; give the last page number explicitly.",
    },
    {
      question: "Can I get each page as its own file?",
      answer:
        "Not in one action. The extraction produces a single document from whatever you select, so to end up with separate files you run it once per page or per range. For a handful of pages this is quick; for a hundred it is the wrong tool.",
    },
    {
      question: "If I ask for pages 9 and 2, which order do they come out in?",
      answer:
        "Page 2 first, then page 9. The range is collected into a set and sorted ascending before anything is copied, so the original sequence is always preserved and the order you typed is not meaningful.",
    },
    {
      question: "Does extracting reduce image quality?",
      answer:
        "No. The image objects on the pages you keep are copied across unchanged, at their original resolution and with their original compression. A 300 dpi scan extracted from a larger document is byte-for-byte the same scan.",
    },
    {
      question: "Why is my extracted scan barely smaller than the original?",
      answer:
        "Because size in a scanned PDF lives in the page images, and you kept most of them. Ten pages out of twelve came back at 89.7% of the original file. Dropping pages only helps in proportion to the weight of the pages dropped.",
    },
    {
      question: "How do I delete pages rather than keep them?",
      answer:
        "Select everything except the pages you want gone. To remove page 5 from a 20-page document, extract 1-4, 6-20. The result is the document minus that page, which is the same outcome by a different route.",
    },
    {
      question: "Does the original file change?",
      answer:
        "Never. The file you choose is opened read-only in the browser and a separate document is written for download. Whatever is on your disk is exactly as it was, so a mistaken range costs you a download rather than your source.",
    },
    {
      question: "Can I extract from an encrypted PDF?",
      answer:
        "Not while the encryption is in place. A document that needs a password to open cannot have its page objects read until it has been decrypted, so open it in your usual PDF application, save an unprotected copy, and extract from that.",
    },
    {
      question: "Is there a maximum document size?",
      answer:
        "Nothing is capped here, because no server is involved to apply a cap. The constraint is memory: the source document is held in the tab while the new one is built, so very large files behave better on a laptop than on a phone.",
    },
    {
      question: "Do links and annotations come across?",
      answer:
        "Annotations attached to the pages themselves are copied with them. A link that points to a page you did not extract will survive as an annotation with nothing to jump to, because its destination is no longer in the document.",
    },
    {
      topic: "offline",
      question: "Will this run without a connection?",
      answer:
        "Yes, after the first load. All the code needed to open a document and write a new one is already sitting in the browser by then, so pulling the network cable changes nothing. Only a fresh reload needs the page to still be cached.",
    },
  ],

  related: [
    {
      name: "Merge PDF",
      path: "/pdf-merge",
      description: "Put extracted sections back together into one document.",
    },
    {
      name: "Reorder PDF Pages",
      path: "/pdf-reorder",
      description: "Change the sequence of pages, which extraction cannot do.",
    },
    {
      name: "Compress PDF",
      path: "/pdf-compress",
      description: "Shrink a scan when dropping pages has not been enough.",
    },
    {
      name: "PDF to Images",
      path: "/pdf-to-images",
      description: "Save the pages you extracted as PNG or JPG files instead.",
    },
    {
      name: "Rotate PDF",
      path: "/pdf-rotate",
      description: "Straighten pages that were scanned the wrong way up.",
    },
    {
      name: "Add Watermark",
      path: "/pdf-watermark",
      description: "Mark an extract as a copy before you circulate it.",
    },
  ],

  headings: {
    features: {
      heading: "What this page gives you",
      lede: "The parts that matter when the document is confidential or large.",
    },
    howItWorks: { heading: "How to extract pages in three steps" },
    examples: {
      heading: "Two extractions, measured",
      lede: "The same range against very different documents, and why the results diverge.",
    },
    useCases: { heading: "When people reach for this" },
    faq: { heading: "Splitting PDFs: common questions" },
    related: {
      heading: "Other PDF tools",
      lede: "Everything else in the set, working the same local way.",
    },
    limitations: {
      heading: "What extraction will not do",
      lede: "Boundaries of the operation itself, stated so you find them here rather than afterwards.",
    },
  },
};
