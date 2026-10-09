import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S1 } from "./shared";

/**
 * Tier A content for /pdf-compress.
 *
 * Two modes, both described as the component implements them. Figures are the
 * S1 rows in docs/CONTENT_FIXTURES.md, measured by driving this page.
 */
export const pdfCompressContent: Partial<ToolPageContent> = {
  tier: "A",
  seo: {
    title: "Compress a PDF Offline, With an Honest Result",
    description:
      "Shrink a scanned PDF by re-encoding pages as JPEG, or strip metadata without touching the pages. The tool refuses a download that would be larger than the original.",
    keywords: [
      "compress pdf",
      "reduce pdf size",
      "compress pdf offline",
      "shrink scanned pdf",
      "pdf compressor no upload",
      "make pdf smaller",
    ],
    datePublished: "2026-09-17",
    dateModified: "2026-10-08",
  },
  hero: {
    h1: "Compress a PDF",
    subtitle:
      "Two different operations live on this page. One strips document metadata and leaves the pages alone. The other redraws every page as a JPEG, which is what actually shrinks a scan, and what ruins a text document.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },
  intro: {
    heading: "Why most PDFs do not shrink the way you hope",
    paragraphs: [
      "A PDF is a container of objects. Text is a stream of drawing instructions and font programs. A scan is a compressed image, usually JPEG, sitting on a page the size of the paper. Those two files can have the same extension and completely different diets. Asking one slider to make both smaller, without saying which one you have, is how a compressor reports 0.0% and calls it a success. This page used to do that. It does not anymore.",
      "Lossless mode rewrites the file and clears the Info fields: title, author, subject, keywords, producer, creator. On the fixtures measured for this page it recovered nothing you would notice. A 12-page scan went from 10,324,119 bytes to 10,324,083 bytes. A 40-page text PDF went from 165,897 bytes to 165,867 bytes. The pages were not recompressed, because pdf-lib cannot reach inside an existing content stream and re-encode the images it references. The mode exists so you can tidy a file without gambling on quality, and so the label matches the effect.",
      "The other mode renders each page with PDF.js at twice the default scale and embeds a JPEG at the quality you set. That is a real reduction when the page was already a picture. The same 12-page scan, at quality 70, came back at 1,644,152 bytes, 84.1% smaller, in 2,376 ms on the measurement machine. The same operation on the 40-page text PDF went the other way: 165,897 bytes in, 14,810,686 bytes out, and the page refused to download it. Vector glyphs that cost a few bytes became full-page photographs. The refusal is the feature. A compressor that hands you an 89-times-larger file and calls it compressed is not compressing.",
    ],
  },
  features: [
    {
      icon: "Minimize2",
      title: "Lossless means the pages are copied",
      body: "Metadata is cleared and the file is rewritten with object streams. Text stays selectable. Images keep the encoding they arrived with. Expect bytes, not megabytes, unless the Info dictionary was bizarrely large.",
    },
    {
      icon: "Gauge",
      title: "A quality slider that only appears when it does something",
      body: "The slider is hidden in lossless mode, because that mode never reads it. In image mode it sets the JPEG quality from 20 to 100, step 10, and the default is 70, which is the setting the 84.1% figure was measured at.",
    },
    {
      icon: "AlertTriangle",
      title: "Image mode throws the text layer away",
      body: "Each page becomes one JPEG. You cannot select a sentence, search the document, or have a screen reader read it. A scan had no text layer to lose. A contract did.",
    },
    {
      icon: "ShieldCheck",
      title: "A bigger result is not downloaded",
      body: "If the new file is the same size or larger, you get the before-and-after numbers and no download. The original you picked is never overwritten either way.",
    },
  ],
  howItWorks: [
    {
      title: "Choose the PDF",
      body: "Pick a file. The card shows its size on disk, which is the number the comparison uses.",
    },
    {
      title: "Pick lossless or re-encode",
      body: "Lossless strips metadata and rewrites the file. Re-encode pages as images turns on the quality slider and warns that text will no longer be selectable.",
    },
    {
      title: "Download only if it got smaller",
      body: "Press the button. A smaller file downloads, named -optimised or -compressed. A larger result is shown and then discarded.",
    },
  ],
  measurements: {
    method: MEASURED_S1,
    rows: [
      {
        scenario: "12-page scan, re-encode pages as images, quality 70",
        input: "10,324,119 bytes",
        output: "1,644,152 bytes",
        timing: "2,376 ms",
        note: "84.1% smaller. Pages are JPEGs afterwards",
      },
      {
        scenario: "12-page scan, lossless",
        input: "10,324,119 bytes",
        output: "10,324,083 bytes",
        timing: "46 ms",
        note: "36 bytes. Metadata only",
      },
      {
        scenario: "40-page text PDF, lossless",
        input: "165,897 bytes",
        output: "165,867 bytes",
        timing: "22 ms",
        note: "30 bytes. Text unchanged",
      },
      {
        scenario: "40-page text PDF, re-encode pages as images",
        input: "165,897 bytes",
        output: "14,810,686 bytes",
        timing: "875 ms",
        note: "About 89× larger, so the page refuses the download",
      },
    ],
  },
  examples: [
    {
      kind: "file",
      title: "A scan that is mostly JPEG already",
      description: "Twelve full-page photographs, the case image mode is for.",
      before: { label: "Input", detail: "10,324,119 bytes, 12 raster pages" },
      after: { label: "Output", detail: "1,644,152 bytes at JPEG quality 70" },
      settings: "Re-encode pages as images, quality 70",
      explanation:
        "Rendering at scale 2 and encoding JPEG 70 replaced twelve heavy images with twelve smaller ones and a thin page wrapper. The text layer was already absent, so making the pages pictures did not remove something a reader could select. This is the number to expect from a similar scan, not from a born-digital report.",
    },
    {
      kind: "file",
      title: "A text PDF that should be left alone",
      description: "Forty pages of real prose, already a small file.",
      before: { label: "Input", detail: "165,897 bytes of text and fonts" },
      after: { label: "What image mode produced", detail: "14,810,686 bytes, not downloaded" },
      settings: "Re-encode pages as images",
      explanation:
        "The button ran, the size was computed, and the download was blocked because the result was larger. Lossless mode on the same file saved 30 bytes. If you need this document smaller, the pages are not where the weight is. Splitting off pages you do not need removes more than either compressor mode will.",
    },
  ],
  useCases: [
    {
      icon: "Mail",
      audience: "A scan that will not fit in an email",
      body: "Mailbox limits are still measured in megabytes. A 10 MB scan that becomes roughly 1.6 MB at quality 70 is the difference between an attachment and a bounce. Check a page at 100% zoom before you send it, because the JPEG is the page now.",
    },
    {
      icon: "ScanLine",
      audience: "A phone photo of a paper form",
      body: "The page was pixels when the camera took it. Re-encoding does not destroy a text layer that was never there. Drop the quality if the upload form on the other end has a hard cap, and stop when the type becomes hard to read.",
    },
    {
      icon: "Briefcase",
      audience: "A report you still need to search",
      body: "Leave the mode on lossless. You will almost certainly be told the file did not shrink. That answer is more useful than a download you can no longer copy a paragraph out of.",
    },
    {
      icon: "Landmark",
      audience: "An archive that should stay a document",
      body: "Image mode is a display copy. It is a poor archival master, because the words are no longer words. Keep the original next to any JPEG version you make for sending.",
    },
  ],
  limitations: {
    heading: "What compression will not recover",
    items: [
      {
        title: "Lossless mode does not recompress images",
        body: "The measured saving on a real scan was 36 bytes. If a website once promised this kind of rewrite would halve a scan, it was describing a different program.",
      },
      {
        title: "Image mode is not OCR, and it removes text",
        body: "You get pictures of pages. Nothing reads the letters back into a text layer. Search, copy, and screen readers stop working on that download.",
      },
      {
        title: "A text PDF can get vastly larger",
        body: "The 40-page prose fixture grew from 166 KB to 14.8 MB. The page blocks that download. It cannot invent a smaller vector file.",
        alternative: "pdf-split",
      },
      {
        title: "Encrypted files are not opened here",
        body: "Both modes need to read the pages or the document catalogue. A password-protected PDF has to be unlocked first, with a password you know.",
        alternative: "pdf-unlock",
      },
    ],
  },
  faqs: [
    {
      topic: "privacy",
      question: "Is the PDF uploaded to be compressed?",
      answer:
        "No. PDF.js renders in the tab and pdf-lib writes the download in the tab. Disconnect after the page has loaded and both modes still run. The network panel shows the script for this tool, then no request that carries the document.",
    },
    {
      question: "Which mode should I start with?",
      answer:
        "If you can drag to select a sentence in the PDF, start with lossless and expect almost no change. If the pages are photographs of paper, choose re-encode and look at the size it reports. The wrong choice on a text file is blocked when the result grows. The wrong choice on a scan is a file that is still huge.",
    },
    {
      question: "Why was the lossless result the same size?",
      answer:
        "Because the pages were already stored efficiently and the Info dictionary was tiny. The 12-page scan lost 36 bytes. The 40-page text PDF lost 30. A toast tells you when nothing meaningful was stripped, instead of announcing a 0.0% saving as if it were a result.",
    },
    {
      question: "What does the quality number mean?",
      answer:
        "It is the JPEG quality passed to the canvas encoder, from 20 to 100 in steps of 10. The default, 70, is what produced 1,644,152 bytes from the 10,324,119-byte scan. Higher keeps more detail and more bytes. The control is absent in lossless mode so it cannot pretend to affect a path that ignores it.",
    },
    {
      question: "Will the text still be selectable?",
      answer:
        "After lossless, yes. After image mode, no. The page says so next to the radio button, because this is the trade that matters more than the percentage. Annotations and a real text layer do not survive being photographed.",
    },
    {
      question: "Why did nothing download?",
      answer:
        "The new file was not smaller. Image mode on the 40-page text fixture produced 14,810,686 bytes from 165,897, and the button stopped. You still see both numbers on the card. Lossless mode shows the same refusal when the rewrite does not beat the original, which is the usual case.",
    },
    {
      question: "Does this resize the page or change the paper size?",
      answer:
        "No. Image mode renders at scale 2 so the JPEG has enough pixels to look acceptable on a dense screen, then places that JPEG on a page of the original point size. Lossless mode does not render at all. Neither mode crops, rotates, or reflows paragraphs.",
    },
    {
      question: "Can I compress one page and leave the rest?",
      answer:
        "Not on this page. Both modes walk the whole document. Cut the pages you care about with the splitter first, then compress that smaller file, if the weight is concentrated in a few sheets.",
    },
    {
      question: "A password-protected PDF will not open. What now?",
      answer:
        "This tool does not ask for a password. If you know it, remove it with the unlock tool and compress the clear copy. There is no password search here.",
    },
    {
      question: "Are fonts and vectors preserved in image mode?",
      answer:
        "Only as pixels. The font program is not copied, and a vector logo becomes part of the JPEG. Zoom in and you will see compression blocks rather than crisp outlines. Lossless mode keeps the fonts and the vectors exactly, and usually keeps the file size too.",
    },
    {
      topic: "offline",
      question: "Does compression need a connection?",
      answer:
        "Only to load this page the first time, including PDF.js when you have not opened it before. The render loop and the file write do not call an API. There is no queue and no account the job is charged against.",
    },
    {
      topic: "account",
      question: "Is there a free-tier cap on how many PDFs I can compress?",
      answer:
        "No cap, and no account to attach one to. The cost is your CPU and your RAM. A twelve-page scan took a bit over two seconds on the measurement laptop and will take longer on a phone, because the work is on the main thread.",
    },
    {
      topic: "size",
      question: "Can I open the page already aimed at 100 KB or 200 KB?",
      answer:
        "Yes. [Compress a PDF to 100 KB](/compress-pdf-to-100kb) and [compress a PDF to 200 KB](/compress-pdf-to-200kb) load this same tool with that ceiling selected. 1 KB is 1024 bytes. Lossless is attempted before any page is turned into a picture.",
    },
    {
      topic: "size",
      question: "What is the largest PDF this will accept?",
      answer:
        "Nothing in the page checks a maximum. The scan fixture was about 10 MB and finished. A few hundred megabytes has to fit in memory twice, once as the source and once as the rendered bitmaps, and a phone will fail that sooner than a laptop will.",
    },
  ],
  related: [
    {
      name: "PDF Split",
      path: "/pdf-split",
      description: "Drop pages you do not need. On a text PDF that removes more bytes than either compress mode.",
    },
    {
      name: "PDF to Images",
      path: "/pdf-to-images",
      description: "Export pages as separate PNG or JPEG files when you do not need them wrapped back up as a PDF.",
    },
    {
      name: "Unlock PDF",
      path: "/pdf-unlock",
      description: "Clear a password you already know so this page can read the file.",
    },
    {
      name: "PDF Metadata",
      path: "/pdf-metadata",
      description: "See the author and producer strings before a lossless pass clears them, or edit them instead of wiping the set.",
    },
    {
      name: "Image Compressor",
      path: "/image-compressor",
      description: "For a lone photograph that is not inside a PDF yet.",
    },
  ],
  headings: {
    features: { heading: "The two modes, stated as they behave", lede: "One of them barely changes the file. The other changes what the file is." },
    howItWorks: { heading: "How to compress a PDF", lede: "Choose the file, choose the mode, keep the download only when it is smaller." },
    examples: { heading: "A scan that shrinks, and a text file that must not" },
    useCases: { heading: "When each mode is the right one" },
    faq: { heading: "Questions about PDF compression" },
    related: { heading: "If compression is the wrong lever" },
  },
};
