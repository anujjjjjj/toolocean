import type { ToolPageContent } from "@/types/toolContent";

const MEASURED_S3 =
  "Measured by driving the built page in headless Chrome 156 on an 8-core Intel Xeon Linux machine, on 2026-10-29. The fixture is handed to the page's own file input, the page's own button is pressed, the time is the one the page reports for numbering and saving, and the size is the file the browser saved. Fixtures are synthetic text PDFs, so the byte overhead is large relative to the input; on a real document it is the same few hundred bytes per page against a much larger file.";

/**
 * Tier B content for /pdf-page-numbers.
 *
 * The question this page has to answer honestly is what "of N" means once the
 * cover is skipped. N is the last number printed, never the file's page count,
 * and the copy says so in the same words the tool's hint uses.
 */
export const pdfPageNumbersContent: Partial<ToolPageContent> = {
  tier: "B",

  seo: {
    title: "Add Page Numbers to PDF – Free, No Upload",
    description:
      "Number PDF pages in any of six spots: 1, Page 1, 1 of N or Page 1 of N. Skip the cover, pick a start number, and see the real page before you download.",
    keywords: [
      "add page numbers to pdf",
      "number pdf pages online free",
      "pdf page numbering",
      "insert page numbers in pdf",
      "page x of y pdf",
      "pdf page numbers skip first page",
    ],
  },

  hero: {
    h1: "Add Page Numbers to a PDF",
    subtitle:
      "Put 1, Page 1, 1 of N or Page 1 of N in any corner or centred, top or bottom. Leave the cover blank, start from any number, and check a real rendered page first.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },

  intro: {
    heading: "How the numbers are placed",
    paragraphs: [
      "Each number is written into the page as real text in Helvetica, one of the fonts every PDF reader already has, so nothing extra is embedded and the label can be selected and searched like the rest of the page. Position is measured from the area a reader actually sees. When a page carries a crop box, the number sits inside the cropped area rather than out on the trimmed-off margin, and a crop box that starts away from the corner of the sheet moves the number with it.",
      "Scanned and assembled documents often mix portrait and landscape sheets, and some pages are stored sideways with a rotation flag telling the viewer to turn them. Numbering those naively puts the label on the wrong edge, lying on its side. Here every page's rotation is read first, the chosen spot is worked out on the page as it is displayed, and the text is turned to match, so bottom-right means bottom-right on every page and every number reads the right way up.",
    ],
  },

  features: [
    {
      icon: "ListOrdered",
      title: "Four formats, six positions",
      body: "Choose a bare 1, Page 1, 1 of N or Page 1 of N, and put it top or bottom, left, centre or right. Size and distance from the edge are set in points.",
    },
    {
      icon: "FileCheck2",
      title: "A preview that is the real output",
      body: "The preview page is written by the same code as the download and drawn by a PDF renderer, so a rotated or cropped page shows exactly where its number will land.",
    },
    {
      icon: "Layers",
      title: "Covers and front matter",
      body: "Leave the first page blank with one switch, or number only a run such as 3-40. The start number is independent, so the first numbered page can read 1, 3 or 101.",
    },
    {
      icon: "CloudOff",
      title: "The file stays on this device",
      body: "Reading, numbering and saving all happen in this tab. Close it and nothing remains anywhere but the copy you saved.",
    },
  ],

  howItWorks: [
    {
      title: "Open the PDF",
      body: "Drop it on the box or pick it from your files. Its page count appears and the first page is drawn.",
    },
    {
      title: "Choose where and how",
      body: "Pick a spot and a format. Skip the cover or set a page run if needed. The preview updates as you change it.",
    },
    {
      title: "Download the copy",
      body: "It is saved as name-numbered.pdf. The original is not changed.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "A report with a title page",
      description: "Five pages, where the first is a cover that should stay clean.",
      before: { label: "Input", detail: "5-page PDF, cover on page 1" },
      after: { label: "Output", detail: "Pages 2 to 5 read 1 of 4 through 4 of 4" },
      settings: "1 of N, bottom centre, first page unnumbered, start at 1",
      explanation:
        "N is four because four numbers are printed. Set the start to 2 instead and the same pages read 2 of 5 through 5 of 5, matching the sheet count while the cover stays blank.",
    },
    {
      kind: "file",
      title: "A scan with sideways and cropped pages",
      description: "Six pages of four sizes: four stored with a 90, 180, 270 or 90 degree rotation flag, two with an offset crop box.",
      before: { label: "Input", detail: "Mixed portrait and landscape, four rotation flags" },
      after: { label: "Output", detail: "Every label upright in the bottom-right corner as displayed" },
      settings: "Page 1 of N, bottom right, 11 pt, 28 pt from the edge",
      explanation:
        "The corner is chosen on the page a reader sees, then translated back into the page's stored orientation, and the text is turned by the page's own rotation. On the cropped pages the label sits 28 points inside the crop, not inside the hidden margin.",
    },
  ],

  measurements: {
    method: MEASURED_S3,
    rows: [
      {
        scenario: "200 text pages numbered Page 1 of N, bottom right",
        input: "43,425 bytes",
        output: "82,683 bytes",
        timing: "115 ms",
        note: "about 196 bytes per page",
      },
      {
        scenario: "6 mixed pages, four rotated, two cropped, numbered Page 1 of N",
        input: "1,982 bytes",
        output: "3,392 bytes",
        timing: "17 ms",
        note: "every label upright, 28 pt from the displayed corner",
      },
    ],
  },

  useCases: [
    {
      icon: "GraduationCap",
      audience: "Theses and coursework",
      body: "Submission rules often ask for numbered pages with the title page left plain. Skip page one, start at 1, and the body is numbered the way the handbook describes.",
    },
    {
      icon: "Landmark",
      audience: "Legal bundles and exhibits",
      body: "A merged bundle needs page references everyone can cite in a hearing. Page 1 of N in a corner gives each sheet a reference that does not depend on the viewer's own counter.",
    },
    {
      icon: "Printer",
      audience: "Anything that will be printed",
      body: "Once pages leave the screen, the viewer's page counter is gone. A printed number lets a dropped stack be put back in order in a minute.",
    },
    {
      icon: "Briefcase",
      audience: "Board packs and proposals",
      body: "When several documents are combined into one pack, continuous numbers let people say turn to page 14 in a meeting and all land on the same sheet.",
    },
    {
      icon: "Building2",
      audience: "Documents that may not leave the building",
      body: "Contracts and personnel files can be numbered here without being sent to a third party, which is often the deciding rule rather than a preference.",
    },
  ],

  limitations: {
    items: [
      {
        title: "One run of pages per pass",
        body:
          "A single range such as 2- or 3-40 is numbered in sequence. Separate runs, like roman numerals for the front matter and 1, 2, 3 for the body, need two passes on split parts, then a merge.",
      },
      {
        title: "Existing numbers are not detected",
        body:
          "If the document already prints page numbers, the new ones are added beside or over them. Nothing on the page is read, moved or removed.",
      },
      {
        title: "Helvetica in black only",
        body:
          "The label uses one standard font in black, with Western digits and the words Page and of. There is no colour, font or language choice.",
      },
      {
        title: "Locked files must be unlocked first",
        body:
          "A password-protected or restricted PDF is refused rather than half-edited. Remove the protection you already know with Unlock PDF, then number the unlocked copy.",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Is my PDF uploaded to add the numbers?",
      answer:
        "No. The file is read by JavaScript in this tab, the numbers are written into a copy in memory, and your browser saves that copy. There is no server step, and your network panel will show no request carrying the document.",
    },
    {
      question: "What does N mean in 1 of N when I skip the cover?",
      answer:
        "N is the last number printed. Skip the cover of a five-page file and start at 1, and the pages read 1 of 4 to 4 of 4. Start at 2 instead and they read 2 of 5 to 5 of 5. The hint under the range field always shows the current value.",
    },
    {
      question: "Will the numbers be upright on landscape or rotated pages?",
      answer:
        "Yes. Each page's rotation flag is read, the position is worked out on the page as displayed, and the text is turned to match. Top centre is the top centre a reader sees on every page, whatever its orientation or size.",
    },
    {
      question: "My PDF has a crop box. Where does the number go?",
      answer:
        "Inside the visible area. The margin is measured from the edge of the crop box, including any offset, so the label never lands in the part a viewer hides.",
    },
    {
      question: "Can I start numbering on page 3, or start from a number other than 1?",
      answer:
        "Both, separately. Type 3- in the pages field to leave pages 1 and 2 blank, and set Start at to whatever the first numbered page should read. A start of 0 is allowed.",
    },
    {
      question: "Why does my locked PDF not open here?",
      answer:
        "Adding numbers to an encrypted file without its password would produce a broken document, so it is refused. If you know the password, [Unlock PDF](/pdf-unlock) removes it in your browser, and the unlocked copy can be numbered here.",
    },
    {
      question: "Do form fields, links and bookmarks survive?",
      answer:
        "Yes. The numbers are drawn onto the document you opened rather than a rebuilt copy, so fields, links, the outline and the document information are carried over untouched.",
    },
    {
      question: "Can the numbers be removed later?",
      answer:
        "Only with a PDF editor, by deleting the text. The label is ordinary page content, not a toggleable layer, so keep the original if you might need a clean version.",
    },
    {
      question: "How long does a long document take?",
      answer:
        "Not long. Two hundred pages took about 115 ms in a headless desktop Chrome, with the file reading as one more moment before that. Each page gains roughly 200 bytes, so the same 200 pages grew by 39,258 bytes. The font is a reference every reader already has, so nothing larger is embedded.",
    },
    {
      topic: "offline",
      question: "Does this work without a connection?",
      answer:
        "Yes, once this page has loaded. The PDF library and the preview renderer are fetched in the background after the page opens and kept by your browser, so numbering and the preview both work with the network off.",
    },
  ],

  related: [
    { name: "Merge PDF", path: "/pdf-merge", description: "Combine files first, then number the whole bundle." },
    { name: "Split PDF", path: "/pdf-split", description: "Separate the front matter so it can be numbered on its own." },
    { name: "PDF Watermark", path: "/pdf-watermark", description: "Stamp DRAFT or CONFIDENTIAL on the numbered copy." },
    { name: "Unlock PDF", path: "/pdf-unlock", description: "Remove a password you know before numbering." },
    { name: "Rotate PDF", path: "/pdf-rotate", description: "Fix page orientation for good." },
  ],

  headings: {
    features: { heading: "What you can set" },
    howItWorks: { heading: "How to number a PDF's pages" },
    examples: {
      heading: "Two documents, numbered",
      lede: "A cover page, and a scan with rotated and cropped pages.",
    },
    useCases: { heading: "When page numbers matter" },
    faq: { heading: "PDF page numbering: common questions" },
    related: { heading: "Other PDF tools" },
    limitations: {
      heading: "Good to know",
      lede: "What one pass does not cover, and the way around it.",
    },
  },
};
