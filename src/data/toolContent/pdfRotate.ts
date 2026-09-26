import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S1 } from "./shared";

/**
 * Tier B content for /pdf-rotate.
 *
 * The preservation claim here is the opposite of the one on pdf-merge, and both
 * were tested: rotate modifies the loaded document in place, so form fields and
 * bookmarks survive. See docs/CONTENT_FIXTURES.md.
 */
export const pdfRotateContent: Partial<ToolPageContent> = {
  tier: "B",

  seo: {
    title: "Rotate PDF Pages Online and Save Permanently",
    description:
      "Turn PDF pages the right way up and keep the change when you save. Rotate every page or just the sideways ones. Nothing is uploaded and nothing is re-rendered.",
    keywords: [
      "rotate pdf",
      "rotate pdf pages",
      "rotate pdf and save",
      "turn pdf sideways page",
      "rotate pdf without uploading",
      "fix upside down pdf",
    ],
  },

  hero: {
    h1: "Rotate PDF Pages",
    subtitle:
      "Turn individual pages or the whole document and download a copy that stays that way. The rotation is stored in the file rather than applied by your viewer, so it travels with the document.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },

  intro: {
    heading: "Why rotating costs nothing",
    paragraphs: [
      "Every page in a PDF carries an optional entry recording how it should be displayed, in ninety degree steps. Rotating here changes that number and saves the document. No content is moved, no image is decoded and nothing is re-rendered: the page description is identical afterwards and only the instruction about which way up to draw it has changed. Viewers, printers and browsers all honour it, which is why the result looks right everywhere rather than only where you fixed it.",
      "The measurements make the point better than the explanation does. Turning all twelve pages of a 50,563 byte text document produced a file 15 bytes larger, in 17 milliseconds. Doing the same to a 10,324,119 byte scan added 14 bytes and took 33 milliseconds. A ten megabyte document and a fifty kilobyte one cost almost exactly the same, because the work has nothing to do with what is on the pages.",
    ],
  },

  features: [
    {
      icon: "MoveVertical",
      title: "Per page or all at once",
      body: "Rotate the whole document in one press, or turn only the three sheets that went through the scanner sideways. Each page keeps its own setting.",
    },
    {
      icon: "FileCheck2",
      title: "Nothing is re-rendered",
      body: "Text stays selectable and images keep their original resolution, because the page content is untouched and only its display angle changes.",
    },
    {
      icon: "Check",
      title: "Form fields and bookmarks survive",
      body: "The document is modified in place rather than rebuilt, so a fillable form is still fillable afterwards and the outline tree is still there. Not every PDF operation can say that.",
    },
    {
      icon: "Zap",
      title: "Instant on any size of file",
      body: "A 10 MB scan took 33 milliseconds, barely more than a 50 KB document. Cost here does not follow file size, because no pixels are involved.",
    },
  ],

  howItWorks: [
    {
      title: "Open the document",
      body: "Select your PDF and every page appears in a list with its current orientation, so you can see which ones actually need turning.",
    },
    {
      title: "Turn the pages that need it",
      body: "Use the per-page controls for individual sheets, or All Left and All Right when the whole document came in the wrong way round. Rotations accumulate, so pressing right twice gives you 180 degrees.",
    },
    {
      title: "Apply and download",
      body: "Press Apply Rotations and the corrected copy is saved to your downloads. The original file on your disk is unchanged.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "A text document turned upright",
      description: "Twelve pages, all rotated ninety degrees.",
      before: { label: "Input", detail: "12-page text PDF, 50,563 bytes" },
      after: { label: "Output", detail: "50,578 bytes, 17 ms" },
      settings: "All Right, applied to every page",
      explanation:
        "Fifteen bytes larger across twelve pages, which is the rotation entry written onto each one. Nothing else in the file changed.",
    },
    {
      kind: "file",
      title: "A large scan, same operation",
      description: "The case that shows rotation does not care what is on the page.",
      before: { label: "Input", detail: "12-page scan, 10,324,119 bytes" },
      after: { label: "Output", detail: "10,324,133 bytes, 33 ms" },
      settings: "All Right, applied to every page",
      explanation:
        "Fourteen bytes added to a ten megabyte document, in about twice the time the small file took. The scanned images were never decoded, so their size is irrelevant to the work.",
    },
  ],

  measurements: {
    method: MEASURED_S1,
    rows: [
      {
        scenario: "all 12 pages of a text PDF turned 90 degrees",
        input: "50,563 bytes",
        output: "50,578 bytes",
        timing: "17 ms",
        note: "15 bytes added",
      },
      {
        scenario: "all 12 pages of a 10 MB scan turned 90 degrees",
        input: "10,324,119 bytes",
        output: "10,324,133 bytes",
        timing: "33 ms",
        note: "14 bytes added",
      },
    ],
  },

  useCases: [
    {
      icon: "ScanLine",
      audience: "Fixing scanner output",
      body: "A sheet fed in the wrong way round produces a sideways page in an otherwise correct document. Turning that one page is quicker than rescanning the stack.",
    },
    {
      icon: "Printer",
      audience: "Preparing something to print",
      body: "A printer will honour the stored rotation, so correcting it in the file avoids the guesswork of landscape settings and manual feed orientation.",
    },
    {
      icon: "Briefcase",
      audience: "Documents you are about to send",
      body: "A contract where page four arrives upside down looks careless. Fixing it locally takes seconds and the document never goes near a third party.",
    },
    {
      icon: "Smartphone",
      audience: "Reading on a phone or tablet",
      body: "A sideways page is genuinely hard to read on a small screen, since the reader scales it to fit the wrong dimension. Correcting the file fixes it on every device at once.",
    },
    {
      icon: "Landmark",
      audience: "Filing and records",
      body: "Archives and submission portals often reject or flag incorrectly oriented pages. Correcting them before submission avoids a rejection days later.",
    },
    {
      icon: "Plane",
      audience: "Working offline",
      body: "Rotation runs entirely in the browser once the page has loaded, so a document can be tidied up with no connection at all.",
    },
  ],

  limitations: {
    items: [
      {
        title: "Only ninety degree steps",
        body:
          "PDF records orientation as 0, 90, 180 or 270 degrees, so a page scanned at a slight angle cannot be straightened here. Correcting a few degrees of skew needs software that re-renders the page.",
      },
      {
        title: "The visible content is not moved",
        body:
          "Rotation changes how a page is displayed, not where the ink sits on it. A page whose text was drawn sideways into an upright page will still read sideways after rotating, because the page itself was never the problem.",
      },
      {
        title: "Nothing is cropped or resized",
        body:
          "Turning a page swaps how tall and wide it appears without changing its dimensions. A landscape page rotated into portrait is still a landscape page being displayed upright.",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Does the document get uploaded to rotate it?",
      answer:
        "No. The file is opened by code running in this tab, one number per page is changed, and a new copy is written to your downloads. Nothing is transmitted, and the operation works with the machine disconnected from the network entirely.",
    },
    {
      question: "Will the rotation stick when I send the file to someone else?",
      answer:
        "Yes. The angle is written into the document rather than applied by a viewer, so anyone who opens it sees the corrected orientation. This is the difference between rotating here and rotating in a reader, where the change is often just a display preference that is not saved.",
    },
    {
      question: "Can I rotate one page and leave the others alone?",
      answer:
        "Yes, each page has its own controls and its own stored angle. Mixed orientations in one document are fine, which is the usual situation when a couple of sheets went through a scanner the wrong way.",
    },
    {
      question: "Does rotating reduce quality or change the file size?",
      answer:
        "Neither in any meaningful way. Nothing is re-rendered, so text stays selectable and images keep their resolution. Twelve pages of a 10 MB scan grew by fourteen bytes, which is the rotation entries themselves.",
    },
    {
      question: "Can I rotate by an arbitrary angle to fix a crooked scan?",
      answer:
        "No. The format only allows quarter turns, and this writes one of those. Deskewing a page that is a few degrees off needs a tool that redraws the content, which necessarily rasterises it.",
    },
    {
      question: "Are fillable form fields still usable afterwards?",
      answer:
        "Yes, and that is not true of every PDF operation. Rotation modifies the document in place rather than copying its pages into a new one, so form fields, the bookmark tree and anything else held at document level all survive. Merging or reordering the same file would drop them.",
    },
    {
      question: "What happens if I rotate the same page twice?",
      answer:
        "The rotations add up, so two turns to the right give you 180 degrees and four bring you back to where you started. The value is normalised, so you cannot end up with an invalid angle by pressing a button too many times.",
    },
    {
      question: "Is there a limit on document size or page count?",
      answer:
        "None imposed here. Rotation is unusually light work, so the practical ceiling is simply holding the document in memory while it is rewritten. Very large scans are fine because their images are never decoded.",
    },
    {
      question: "Does the original file change?",
      answer:
        "No. A corrected copy is written to your downloads and the file on your disk is left exactly as it was, so getting the direction wrong costs you one download rather than your source document.",
    },
    {
      topic: "offline",
      question: "Does this work without a connection?",
      answer:
        "Yes, after the first visit. Reading a page tree and writing one number onto each sheet needs no outside help, so the network is irrelevant from the moment the tab finishes loading.",
    },
  ],

  related: [
    {
      name: "Reorder PDF Pages",
      path: "/pdf-reorder",
      description: "Change the sequence once the pages are the right way up.",
    },
    {
      name: "Split PDF",
      path: "/pdf-split",
      description: "Pull out the pages you actually need.",
    },
    {
      name: "Merge PDF",
      path: "/pdf-merge",
      description: "Combine the corrected document with others.",
    },
    {
      name: "Add Watermark",
      path: "/pdf-watermark",
      description: "Mark the document before circulating it.",
    },
    {
      name: "PDF to Images",
      path: "/pdf-to-images",
      description: "Render the corrected pages out as pictures.",
    },
    {
      name: "Compress PDF",
      path: "/pdf-compress",
      description: "Shrink a large scan after straightening it.",
    },
  ],

  headings: {
    features: { heading: "What this tool gives you" },
    howItWorks: { heading: "How to rotate PDF pages in three steps" },
    examples: {
      heading: "Two documents, measured",
      lede: "A small file and a large one, costing almost exactly the same.",
    },
    useCases: { heading: "When pages need turning" },
    faq: { heading: "Rotating PDFs: common questions" },
    related: { heading: "Other PDF tools" },
    limitations: { heading: "What rotation cannot fix" },
  },
};
