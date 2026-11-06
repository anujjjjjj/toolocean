import type { ToolPageContent } from "@/types/toolContent";

/**
 * Tier B content for /grayscale-pdf.
 *
 * The honest trade here is that every page becomes a picture. That is what
 * guarantees a gray printout on any printer, and it is also why text stops
 * being selectable and why a text-only file grows. The page says both before
 * anyone converts, and points to the print dialog when that is enough.
 */
export const grayscalePdfContent: Partial<ToolPageContent> = {
  tier: "B",

  seo: {
    title: "Grayscale PDF – Print Black and White, Save Ink",
    description:
      "Convert a PDF to grayscale or pure black and white for printing, and save colour ink or toner. Done in your browser with no upload. Choose 150 or 300 DPI.",
    keywords: [
      "convert pdf to grayscale",
      "pdf to black and white",
      "make pdf black and white for printing",
      "grayscale pdf",
      "pdf black and white converter no upload",
      "save ink printing pdf",
    ],
  },

  hero: {
    h1: "Grayscale PDF",
    subtitle:
      "Print in black and white and save ink: turn a colour PDF into gray shades or crisp black and white, on your device, then download a copy any printer handles the same way.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },

  intro: {
    heading: "Why convert instead of ticking Grayscale",
    paragraphs: [
      "Print in black and white and save ink or toner on every copy. A coloured heading or photo is mixed from cyan, magenta and yellow, many inkjets blend those colour inks into dark gray too, and the Grayscale tick box is not always there, for example when printing from a phone or through a print shop's upload page. A PDF whose pages hold nothing but gray pixels removes the guesswork: there is no colour left in the file for any printer to spend.",
      "Each page is drawn by the PDF engine in this tab at the resolution you pick, turned into gray using the standard brightness weighting of red, green and blue, and written into a new PDF at exactly the page size and orientation your viewer shows. Pages that are mostly text are stored losslessly; pages that are mostly photographs are stored as a compact gray JPEG, whichever is smaller for that page. The trade is stated up front: the new pages are pictures, so the words in them can no longer be selected, searched or copied.",
    ],
  },

  features: [
    {
      icon: "Printer",
      title: "No colour left to print",
      body: "Every page is stored with a single gray channel, so a driver has no cyan, magenta or yellow to mix, whatever the print dialog is set to.",
    },
    {
      icon: "Settings2",
      title: "Gray shades or pure black and white",
      body: "Grayscale keeps photos and shading readable. Black & white turns each pixel fully black or white at a threshold you set, which is crisp for forms and letters.",
    },
    {
      icon: "Gauge",
      title: "Smallest encoding per page",
      body: "Text pages are kept lossless and compressed; photo pages become a single-channel JPEG. Each page is checked and gets whichever comes out smaller.",
    },
    {
      icon: "CloudOff",
      title: "Converted on your device",
      body: "The PDF is opened and redrawn inside this browser tab, and the new file is assembled there too. It is never uploaded to be converted.",
    },
  ],

  howItWorks: [
    {
      title: "Add the PDF",
      body: "Drop it on the box above or tap to choose it. The name, size and number of pages appear with a small before and after of page one.",
    },
    {
      title: "Pick quality and mode",
      body: "150 DPI suits everyday printing, 300 DPI fine print. Choose Grayscale, or Black & white and slide the threshold until the preview looks right.",
    },
    {
      title: "Convert and download",
      body: "Pages are converted one at a time with a progress bar and a Cancel button. The download keeps your file name with -grayscale added.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "A colourful school worksheet pack",
      description: "Twelve pages of activity sheets with bright headings, clip art and tinted answer boxes, going to a home inkjet.",
      before: { label: "Input", detail: "worksheets.pdf, 12 pages in full colour" },
      after: { label: "Output", detail: "worksheets-grayscale.pdf, gray shades only" },
      settings: "150 DPI, Grayscale",
      explanation:
        "The clip art keeps its shading, so the pictures still read on paper, but the colour cartridges stay idle. The tinted boxes print as light gray rather than solid black, because brightness, not hue, decides each shade.",
    },
    {
      kind: "file",
      title: "A signed form with a pale blue letterhead",
      description: "A two-page application with a light blue logo band and blue-ink signature that needs to go to a laser printer and then a fax.",
      before: { label: "Input", detail: "application.pdf, 2 pages" },
      after: { label: "Output", detail: "application-grayscale.pdf, pure black and white" },
      settings: "300 DPI, Black & white, threshold 160",
      explanation:
        "At threshold 160 the pale letterhead drops to white while the blue signature, which is darker, stays solid black. Raising the threshold would bring the letterhead back as black; lowering it would thin the signature.",
    },
  ],

  useCases: [
    {
      icon: "GraduationCap",
      audience: "Teachers and parents",
      body: "Print class handouts and worksheet packs on a home printer without burning through colour cartridges that cost more than the paper.",
    },
    {
      icon: "Briefcase",
      audience: "Offices on a print budget",
      body: "Send slide decks and reports to a shared laser printer that bills colour pages separately, knowing every page will count as mono.",
    },
    {
      icon: "Landmark",
      audience: "Statements and forms",
      body: "Bank statements, tax forms and contracts often must be printed, signed and scanned back. Black and white makes clean, high-contrast copies.",
    },
    {
      icon: "Printer",
      audience: "Print shops and copy centres",
      body: "Hand over a file that is already gray, so the counter does not charge colour rates for a page with one blue logo on it.",
    },
    {
      icon: "Building2",
      audience: "Anyone with private documents",
      body: "Medical letters, payslips and IDs stay on the laptop or phone they are on. Nothing is sent to a conversion service.",
    },
  ],

  limitations: {
    items: [
      {
        title: "Text becomes part of a picture",
        body:
          "After conversion the words cannot be selected, searched or copied, and screen readers cannot read them. Keep the original, or take the text out with PDF to Text first.",
      },
      {
        title: "Links, forms and bookmarks are dropped",
        body:
          "Only what is visible on each page is redrawn. Clickable links, fillable fields, comments, attachments and the outline do not exist in the new file.",
      },
      {
        title: "Text-only files usually get bigger",
        body:
          "A page of typed words is tiny as text and large as a picture. Photo-heavy files often shrink instead. The result shows both sizes before you download.",
      },
      {
        title: "Locked files must be unlocked first",
        body:
          "Files protected with an open password have to be unlocked, using the password you were given, before any page can be redrawn.",
      },
    ],
  },

  faqs: [
    {
      question: "How do I print a PDF in black and white to save ink?",
      answer:
        "Convert it here first, then print the downloaded copy. Coloured headings and photos draw on the colour cartridges, many inkjets mix dark gray from colour inks as well, and a phone or a print shop's upload form may not offer a Grayscale setting at all. The converted file holds only gray pixels, so there is no colour for a printer to use. Choose Black & white for letters and forms, which also prints crisp and fast, or Grayscale when photos or charts need their shading.",
    },
    {
      topic: "privacy",
      question: "Is my PDF uploaded to convert it to grayscale?",
      answer:
        "No. The file is processed in your browser and never uploaded. It is opened in this tab, each page is redrawn in memory, and the gray copy is put together on your device before you save it. The one thing sent when it finishes is an anonymous usage count to our Umami analytics, which stores nothing on your device: the tool's name, with no file name, size or content.",
    },
    {
      question: "Can I still select or search the text afterwards?",
      answer:
        "No. Every page in the new PDF is an image, so text cannot be selected, searched or copied, and links and form fields are not carried over. If you need any of the words, take them out first with [PDF to Text](/pdf-to-text), and keep the original file alongside the gray copy.",
    },
    {
      question: "Should I choose 150 or 300 DPI?",
      answer:
        "150 DPI is plenty for ordinary documents on an office or home printer and keeps the file smaller. Pick 300 DPI for small print, fine lines in drawings, or anything you will scan or photocopy again, since it holds four times as many pixels per page and the file grows to match.",
    },
    {
      question: "What is the difference between Grayscale and Black & white?",
      answer:
        "Grayscale keeps up to 256 shades, so photos, charts and shaded boxes still look like themselves. Black & white makes every pixel either fully black or fully white: shades lighter than the threshold become white and darker ones black. The default of 160 keeps most coloured text dark while pale backgrounds vanish. Raise it if light text drops out, lower it if a tinted background turns solid black. The preview of page one updates as you move the slider.",
    },
    {
      question: "Why is the gray PDF bigger than the original?",
      answer:
        "Because each page is now a picture. A page of typed text costs a few kilobytes as words but far more as pixels, even in gray. Photo-heavy files often shrink instead, since their colour images become single-channel ones. To keep it small, use 150 DPI, or Black & white, which stores one bit per pixel. If it must fit an upload limit, [PDF Compress](/pdf-compress) can squeeze it further. And if you only need a gray printout from a printer you trust, its own Grayscale option keeps the original file untouched.",
    },
    {
      question: "My PDF is password-protected. What now?",
      answer:
        "Its pages cannot be drawn until the password is removed. For a bank or card statement, follow [the guide to unlocking a statement](/remove-password-from-bank-statement-pdf); for anything else, open [PDF Unlock](/pdf-unlock) and enter the password you were given. Then bring the unlocked copy back here.",
    },
    {
      question: "Is there a page or size limit?",
      answer:
        "There is no fixed limit, because the PDF is never sent to a server. Pages are converted one by one and the browser gets a breather after every page, which keeps scrolling smooth and lets Cancel stop straight away. Memory is the practical ceiling: a few hundred pages at 150 DPI is fine on a laptop, while phones do better with smaller batches or 150 DPI. Unusually large pages such as posters are drawn at a lower resolution so they stay within what a browser can hold.",
    },
    {
      question: "Will the pages keep their size and orientation?",
      answer:
        "Yes. Each output page has the same dimensions in points as the page your viewer shows, and a page stored sideways with a rotation flag comes out the way it appears on screen, not the way it is stored.",
    },
    {
      topic: "offline",
      question: "Does it work offline?",
      answer:
        "After one visit, yes. A moment after the page finishes loading, your browser stores the PDF renderer and the gray encoder, so converting in flight mode or on a patchy connection still works.",
    },
  ],

  related: [
    { name: "PDF to Text", path: "/pdf-to-text", description: "Copy the words out before the pages turn into pictures." },
    { name: "PDF Compress", path: "/pdf-compress", description: "Squeeze the gray copy further to fit an upload or email limit." },
    { name: "PDF to Images", path: "/pdf-to-images", description: "Save pages as separate PNG or JPG files instead of a PDF." },
    { name: "Image Filters", path: "/image-filters", description: "Turn a single photo or scan gray, with brightness and contrast." },
    { name: "Unlock PDF", path: "/pdf-unlock", description: "Remove a password you know so the pages can be converted." },
  ],

  headings: {
    features: { heading: "What the converted file gives you" },
    howItWorks: { heading: "How to convert a PDF to grayscale" },
    examples: {
      heading: "Two printouts, planned",
      lede: "A colourful worksheet pack in gray shades, and a form in pure black and white.",
    },
    useCases: { heading: "Who prints in gray" },
    faq: { heading: "Grayscale PDF: common questions" },
    related: { heading: "Related PDF tools" },
    limitations: {
      heading: "Before you convert",
      lede: "What changes when every page becomes an image.",
    },
  },
};

/**
 * Related links for Image Filters, which has no authored page. Left to
 * deriveRelated() it lists only other image tools, never the PDF version of
 * its own grayscale filter.
 */
export const imageFiltersContent: Partial<ToolPageContent> = {
  related: [
    { name: "Grayscale PDF", path: "/grayscale-pdf", description: "Make every page of a PDF gray or black and white for printing." },
    { name: "Image Compressor", path: "/image-compressor", description: "Shrink the edited photo for email or the web." },
    { name: "Image Resizer", path: "/image-resizer", description: "Change the pixel size of the filtered image." },
    { name: "Image Crop", path: "/image-crop", description: "Trim the edges before or after applying a filter." },
    { name: "Format Converter", path: "/image-format-converter", description: "Save the result as JPG, PNG or WebP." },
  ],
};
