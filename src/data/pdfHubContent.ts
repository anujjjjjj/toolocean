import type { ToolFaqEntry } from "@/types/toolContent";

/**
 * Copy for /pdf-tools that is too specific to live in the shared category template.
 * The page renders it, and the category graph emits the same FAQs as FAQPage.
 */
export const PDF_HUB_FAQS: ToolFaqEntry[] = [
  {
    question: "Do these PDF tools upload the file?",
    answer:
      "No. Choosing a file hands the bytes to JavaScript in the tab. Merge, split, compress, sign, encrypt, unlock, metadata, and form filling all finish locally, and the download is a blob your browser saves. There is no account the document is filed under.",
  },
  {
    question: "What can I do with a PDF here?",
    answer:
      "Thirteen tools: merge, split, reorder, rotate, compress, watermark, PDF to images, images to PDF, a visual signature, AES-256 password protection, unlock when you already know the password, an Info and XMP report with a strip option, and AcroForm filling with an optional flatten.",
  },
  {
    question: "Is the signature a certified electronic signature?",
    answer:
      "No. Sign PDF draws, types, or places an image on one page. Readers that check certificates will not report a valid digital signature, because none was written. Use it when a visible mark is what the recipient asked for.",
  },
  {
    question: "Can I remove a password from a PDF?",
    answer:
      "Only a password you already know, or owner restrictions on a file that already opens. Unlock PDF tries that one secret and stops. It does not guess. Merge and split both refuse a file that is still encrypted, and they point at that unlock step.",
  },
  {
    question: "What do Smallpdf and iLovePDF still do that this hub does not?",
    answer:
      "OCR, in-place text editing, redaction, and PDF-to-Word with layout reconstruction are not available, and they are labelled that way on the comparison pages. Certified e-sign workflows are not available either. The comparisons are at [Smallpdf alternative](/smallpdf-alternative) and [iLovePDF alternative](/ilovepdf-alternative).",
  },
  {
    question: "Will a hard refresh of a tool page 404?",
    answer:
      "No. Each tool is prerendered to its own HTML file, which is what a crawler and a reload both receive. The old /pdf-tools/tool-name URLs redirect to the flat ones.",
  },
  {
    question: "I only need to combine two files without sending them anywhere. Where do I start?",
    answer:
      "The short version of that job is written up at [Merge PDFs without uploading](/merge-pdf-without-uploading), and the tool itself is [PDF Merge](/pdf-merge). If one of the files asks for a password, unlock it first.",
  },
];
