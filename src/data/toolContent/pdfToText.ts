import type { ToolPageContent } from "@/types/toolContent";

/**
 * Tier B content for /pdf-to-text.
 *
 * The honest question here is where the text comes from. It is read from the
 * PDF's own text layer, so a page that is only a photograph of paper has nothing
 * to give, and the page says so by number instead of returning a blank.
 */
export const pdfToTextContent: Partial<ToolPageContent> = {
  tier: "B",

  seo: {
    title: "PDF to Text – Copy Text From a PDF, No Upload",
    description:
      "PDF to text with no upload: copy text from a PDF or extract it to a .txt file in your browser. Pick a page range, keep page breaks, and see which pages are scans.",
    keywords: [
      "pdf to text",
      "extract text from pdf",
      "pdf to txt without uploading",
      "copy text from pdf",
      "pdf to plain text",
      "convert pdf to txt",
    ],
  },

  hero: {
    h1: "PDF to Text",
    subtitle:
      "Copy text from a PDF, no upload: check the words in a preview, then copy them or save a .txt file. Reading happens on your device, page by page.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },

  intro: {
    heading: "Where the text comes from",
    paragraphs: [
      "Copy text from a PDF, no upload needed: the file is opened by JavaScript inside this tab and its text layer is read one page at a time. Most PDFs made by a word processor, a browser's print dialog or an accounting system store every word as real characters with a position on the page. Those characters are what you get back, rebuilt into lines in the order the file draws them, with a space wherever two runs of letters sit a visible distance apart.",
      "A long document does not lock up the page. A progress bar counts pages as they are read, Cancel stops at once, and each page is released from memory as soon as its words are taken. Once reading finishes, switching between the whole file and a page range, turning page markers on or off, or tidying whitespace rebuilds the result instantly from what was already read, without opening the PDF a second time.",
    ],
  },

  features: [
    {
      icon: "FileText",
      title: "Real characters, not a picture",
      body: "The words come from the text layer the PDF already carries, so accents, currency signs and non-Latin scripts arrive as typed characters you can paste anywhere.",
    },
    {
      icon: "ListOrdered",
      title: "Pick exactly which pages",
      body: "Leave it on the whole document or type a list such as 1-3, 5, 8-. A number past the last page is flagged under the box instead of being quietly skipped.",
    },
    {
      icon: "ScanLine",
      title: "Scanned pages named, not hidden",
      body: "Pages with no text layer are listed by number above the result. With page markers on, each one also gets a short note in the text so the count never jumps.",
    },
    {
      icon: "CloudOff",
      title: "Stays on this device",
      body: "The PDF is read in browser memory and the .txt is written there too. Neither the file nor its text is sent anywhere, which is easy to confirm in the network panel.",
    },
  ],

  howItWorks: [
    {
      title: "Open the PDF",
      body: "Drop it on the box at the top of the page, or tap the box to pick a file. Pages are read one after another while a bar shows how far it has got.",
    },
    {
      title: "Choose pages and layout",
      body: "Keep the whole file or type a range, decide whether each page starts with a marker line, and tidy stray spaces if you like.",
    },
    {
      title: "Copy or download",
      body: "Copy puts the text on your clipboard. Download saves it as a UTF-8 .txt file named after the PDF.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "Quoting a paragraph from a report",
      description: "A 40-page annual report exported from a word processor, where only section 3 matters.",
      before: { label: "Input", detail: "annual-report.pdf, 40 pages" },
      after: { label: "Output", detail: "Pages 12 to 14 as plain text, ready to paste" },
      settings: "Page range 12-14, page markers on",
      explanation:
        "Typing 12-14 narrows the preview to three pages and the character and word counts follow. Each page opens with its own marker line, so a quote can be traced back to the page it came from.",
    },
    {
      kind: "file",
      title: "A contract that was partly scanned",
      description: "A typed agreement with two signature pages that were printed, signed by hand and scanned back in.",
      before: { label: "Input", detail: "agreement.pdf, 9 pages" },
      after: { label: "Output", detail: "agreement.txt with seven pages of text" },
      settings: "Whole document, page markers on",
      explanation:
        "The notice above the result reads Pages 8, 9 look like scans, no text layer. In the file those two pages carry a short marker instead of words, because their content is an image and there are no characters to read.",
    },
  ],

  useCases: [
    {
      icon: "Landmark",
      audience: "Bank and card statements",
      body: "Get transaction lines into a spreadsheet or a budgeting note without handing a statement to an online converter. Your account details stay on the laptop you opened it on.",
    },
    {
      icon: "GraduationCap",
      audience: "Students and researchers",
      body: "Lift passages from papers and handouts for notes and citations, with page markers showing exactly where each passage sits in the original.",
    },
    {
      icon: "Briefcase",
      audience: "Contracts and proposals",
      body: "Paste clauses into an email or a review document, or compare two versions of a term in a diff tool once both are plain text.",
    },
    {
      icon: "Keyboard",
      audience: "Writers and editors",
      body: "Recover your own words from an old PDF export when the original document is gone, then check length straight away with the counts above the preview.",
    },
    {
      icon: "Building2",
      audience: "Teams with strict data rules",
      body: "HR letters, patient forms and legal files often may not go to third-party sites. Reading them here never involves another server.",
    },
  ],

  limitations: {
    items: [
      {
        title: "Scanned pages have no text to read",
        body:
          "A page that is a photo or scan of paper holds an image, not characters. This tool does not turn pictures into text, so those pages are listed by number and left empty.",
      },
      {
        title: "Columns can come out of order",
        body:
          "Text arrives in the order the file draws it. Most single-column documents read naturally, but a newsletter layout or a side panel may be interleaved.",
      },
      {
        title: "Tables become lines of words",
        body:
          "Cell borders are drawings, not structure, so a table turns into rows of values separated by spaces. Columns are not lined up in the .txt file.",
      },
      {
        title: "Password-locked files need unlocking first",
        body:
          "A PDF that asks for a password to open cannot be read until that password is removed, using the password you already know.",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Is my PDF uploaded to extract the text?",
      answer:
        "No. Your file never leaves your browser. It is opened in this tab, read page by page in memory, and the text you copy or download is produced right there. There is no account and no copy kept anywhere, and your browser's developer tools will list no request that contains the document.",
    },
    {
      question: "What if the PDF is password-protected?",
      answer:
        "The text cannot be read until the password is removed. If it came from a bank, start with [our guide for password-protected bank statements](/remove-password-from-bank-statement-pdf). For any other file, open [PDF Unlock](/pdf-unlock), enter the password you were given, and bring the unlocked copy back here.",
    },
    {
      question: "Why are some pages empty or listed as scans?",
      answer:
        "Those pages have no text layer. A scanner or phone camera stores each page as a picture, and a picture has no characters for a browser to read. This tool cannot read text out of images, so instead of guessing it names the pages, for example Page 3 looks like a scan, and leaves them empty. If every page is a scan, it says that plainly.",
    },
    {
      question: "Can I extract text from a bank statement PDF privately?",
      answer:
        "Yes. The statement is read on your own device and nothing is transmitted, which matters for account numbers and balances. Most banks send statements with a real text layer, so the transaction lines come through. If yours opens only with a password, unlock it first with [the bank statement password guide](/remove-password-from-bank-statement-pdf), then bring the unlocked copy back.",
    },
    {
      question: "How do I get only some pages, and what are the page markers?",
      answer:
        "Type a list in the page box: 1-3, 5, 8- means pages one to three, page five, and page eight to the end. Spaces do not matter, and a page past the end is reported under the box. With Mark page breaks on, each page starts with a line such as --- Page 5 ---. Turn it off for one continuous flow with a blank line between pages.",
    },
    {
      question: "Will a very large PDF freeze my browser?",
      answer:
        "It should not. Pages are read one at a time with a pause between each, so the tab keeps responding and the progress bar keeps moving. Cancel stops reading straight away. A file with thousands of pages still takes time and memory, and phones take longer than desktops, but nothing is uploaded, so there is no size cap from a server.",
    },
    {
      question: "Why does text from a two-column layout come out jumbled?",
      answer:
        "A PDF stores where each run of text is drawn, not which column it belongs to. The text comes out in the order the file draws it, which is usually correct for single-column documents. When two columns sit side by side, a line from the left column is often joined to the line beside it in the right column, and sidebars or footnotes can land mid-paragraph. Selecting a page range for just the part you need makes the result easier to fix by hand.",
    },
    {
      question: "What does Tidy whitespace change?",
      answer:
        "It collapses runs of spaces into one, removes spaces left at the ends of lines, and squeezes several blank lines into a single one. The words and line breaks stay as they were. Turn it off if you want spacing exactly as rebuilt from the page positions.",
    },
    {
      question: "What file do I get when I download?",
      answer:
        "A plain .txt file in UTF-8 that keeps the PDF's name, so Bank Statement.pdf becomes Bank Statement.txt. It contains exactly what the preview shows, including page markers if they are on.",
    },
    {
      topic: "offline",
      question: "Does it work without an internet connection?",
      answer:
        "It does after your first visit. Shortly after this page finishes loading, your browser keeps its own copy of the PDF reader, so flight mode does not stop you extracting text.",
    },
  ],

  related: [
    { name: "PDF to Images", path: "/pdf-to-images", description: "Save pages as pictures when the layout matters more than the words." },
    { name: "PDF Split", path: "/pdf-split", description: "Cut out the section you need before reading its text." },
    { name: "PDF Unlock", path: "/pdf-unlock", description: "Remove a password you know so the text can be read." },
    { name: "Word Counter", path: "/word-counter", description: "Paste the extracted text to check reading time and length." },
    { name: "Line Break Remover", path: "/line-break-remover", description: "Join lines that a PDF broke in the middle of sentences." },
  ],

  headings: {
    features: { heading: "What you get" },
    howItWorks: { heading: "How to copy text from a PDF" },
    examples: {
      heading: "Two documents, read",
      lede: "A page range from a long report, and a file with scanned pages in it.",
    },
    useCases: { heading: "When you need the words, not the PDF" },
    faq: { heading: "PDF to text: common questions" },
    related: { heading: "Other tools for this job" },
    limitations: {
      heading: "Good to know",
      lede: "What a text layer can and cannot give you.",
    },
  },
};

/**
 * Related links for Word Counter, which has no authored page. Left to
 * deriveRelated() it lists cron and timestamp tools, and never PDF to Text,
 * the usual source of the text people paste into it.
 */
export const wordCounterContent: Partial<ToolPageContent> = {
  related: [
    { name: "PDF to Text", path: "/pdf-to-text", description: "Get the text out of a PDF to count it here." },
    { name: "Line Break Remover", path: "/line-break-remover", description: "Rejoin lines before counting sentences." },
    { name: "Case Converter", path: "/case-converter", description: "Switch the same text to upper, lower or title case." },
    { name: "Text Diff Viewer", path: "/text-diff", description: "See what changed between two drafts." },
    { name: "Duplicate Lines Remover", path: "/duplicate-remover", description: "Drop repeated lines from a pasted list." },
  ],
};
