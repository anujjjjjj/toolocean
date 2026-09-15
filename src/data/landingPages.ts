import type { ToolFaqEntry } from "@/types/toolContent";

/**
 * Modifier and comparison landing pages.
 *
 * The per-tool pages target the tool name — "json formatter", "merge pdf" — and
 * those SERPs belong to sites with a decade of links. A new domain does not take
 * them, and increasingly nobody wins them because the query gets answered inside a
 * chatbot instead.
 *
 * What is winnable is the qualified version of the same intent: "merge pdf without
 * uploading", "smallpdf alternative no upload". Lower volume, far lower
 * competition, and the qualifier is the one thing this site can honestly claim that
 * the incumbents cannot — they all upload. A page that answers the qualifier
 * directly can outrank a stronger domain that only answers the head term.
 *
 * Each page has to earn its place: it makes a specific claim, backs it with how the
 * thing actually works, and links to the tools that do the job. A page that only
 * restates the tool page in different words is the scaled-content pattern Google
 * demotes, so if there is nothing extra to say here, do not add the entry.
 */

export interface LandingSection {
  heading: string;
  /** Each paragraph is rendered separately. Write prose. */
  body: string[];
}

export interface LandingComparisonRow {
  capability: string;
  /** What the named competitor does. Must be verifiable from their own site. */
  them: string;
  /** What ToolOcean does. Must be true of the linked tools right now. */
  us: string;
}

export interface LandingPage {
  /** Root-level path segment, e.g. "merge-pdf-without-uploading". */
  slug: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  h1: string;
  /** Short label for the footer link. The H1 is too long to sit in a nav column. */
  footerLabel: string;
  /** One or two sentences directly under the H1. Answers the query immediately. */
  lede: string;
  /** Tool slugs surfaced as the primary conversion path, in order. */
  tools: string[];
  sections: LandingSection[];
  /** Optional honest comparison table. Only for "X alternative" pages. */
  comparison?: {
    heading: string;
    competitor: string;
    rows: LandingComparisonRow[];
  };
  faqs: ToolFaqEntry[];
}

/** Shared closing paragraph fragments, so the honesty stays consistent. */
const HOW_IT_WORKS =
  "The tools are ordinary web pages. When you pick a file, the browser hands your code a reference to it and the work happens in JavaScript and WebAssembly on your own machine. There is no server component to send it to, which is why there is no upload progress bar and no queue.";

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "merge-pdf-without-uploading",
    seo: {
      title: "Merge PDFs Without Uploading Them Anywhere",
      description:
        "Combine PDF files entirely inside your browser. No upload, no account, no watermark, and no file size limit imposed by a server, because there is no server.",
      keywords: [
        "merge pdf without uploading",
        "combine pdf offline",
        "merge pdf locally",
        "private pdf merger",
      ],
    },
    h1: "Merge PDFs without uploading them anywhere",
    footerLabel: "Merge PDFs",
    lede:
      "Most online PDF mergers upload your document to their server, merge it there, and hand back a download link. This one does the merge in the browser tab you already have open, so the file never goes anywhere.",
    tools: ["pdf-merge", "pdf-split", "pdf-reorder", "pdf-compress"],
    sections: [
      {
        heading: "Why the upload matters",
        body: [
          "A PDF you need to merge is rarely a blank one. It is a signed contract, a set of payslips, a scan of a passport, a medical letter. Uploading it means handing a copy to a company you have no relationship with, whose retention policy you have not read, and whose breach history you cannot check.",
          "Most services are not doing anything sinister with it. That is not really the point. The point is that the merge does not require the upload at all, so the risk is being taken for no reason.",
        ],
      },
      {
        heading: "How merging locally actually works",
        body: [
          HOW_IT_WORKS,
          "For PDFs specifically, the merge is a structural operation: the page objects from each document are copied into a new document and the cross-reference table is rebuilt. Nothing needs to be rendered or re-encoded, which is why it finishes almost instantly even on a large file, and why the text stays selectable and the quality is untouched.",
        ],
      },
      {
        heading: "What you give up",
        body: [
          "Honestly, two things. The work happens on your device, so a very large document is bounded by your available memory rather than by a server with 64 GB of RAM. On a phone with a lot of tabs open, a few hundred megabytes is where it starts to struggle.",
          "And the first load has to fetch the PDF library, which is a few hundred kilobytes. After that it is cached and the tool opens instantly, including with the network off.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I know it is really not uploading?",
        answer:
          "Open your browser's developer tools, switch to the Network tab, and merge a file. You will see the page's own assets load and then nothing further. You can also disconnect from the network entirely after the page loads and the merge still works, which is not possible for a tool that needs a server.",
      },
      {
        question: "Is there a file size or page count limit?",
        answer:
          "There is no limit we impose, because there is no server tier to enforce one. The practical ceiling is your device's memory, since the documents are held in RAM while they are combined. A laptop handles far larger files than a phone.",
      },
      {
        question: "Does merging reduce quality or add a watermark?",
        answer:
          "Neither. Pages are copied across as-is rather than re-rendered, so text stays selectable, images keep their original resolution, and nothing is stamped onto the output.",
      },
    ],
  },
  {
    slug: "json-formatter-offline",
    seo: {
      title: "Offline JSON Formatter That Never Sends Your Data",
      description:
        "Format, validate and minify JSON with the network switched off. Runs entirely in the browser, so API responses containing tokens and customer data stay on your machine.",
      keywords: [
        "json formatter offline",
        "json formatter no upload",
        "private json formatter",
        "json beautifier local",
      ],
    },
    h1: "An offline JSON formatter that never sends your data",
    footerLabel: "Format JSON offline",
    lede:
      "The JSON you need to read is usually an API response, and API responses usually contain a bearer token, a customer email, or an internal ID. Pasting that into a site that posts it to a backend is a habit worth breaking.",
    tools: ["json-formatter", "json-minifier", "json-schema-validator", "json-flattener"],
    sections: [
      {
        heading: "The problem with pasting API responses into a web tool",
        body: [
          "Plenty of popular JSON formatters process server-side. The paste goes into a POST body, gets formatted somewhere else, and comes back. For public sample data that is fine. For a production response captured while debugging, you have just moved a live credential and real customer records onto infrastructure you do not control, usually in breach of whatever data policy your employer has.",
          "It is also completely unnecessary. JSON parsing and serialisation are built into every browser. Formatting JSON needs no more infrastructure than a text box.",
        ],
      },
      {
        heading: "Genuinely offline, not just private",
        body: [
          "Once the page has loaded, the formatter keeps working with the network disconnected. That is the practical test for whether a tool is really client-side, and it is worth doing once on any tool you plan to trust: load it, go offline, and see if it still works.",
          "It also means the tool is usable on a locked-down network, on a plane, or inside an environment where the sites that would normally do this are blocked by policy.",
        ],
      },
      {
        heading: "What it does beyond formatting",
        body: [
          "Validation reports the line and column of the first syntax error rather than just refusing, which is the part that actually saves time on a large document. There is a live byte, line, key and depth count, optional alphabetical key sorting, and minification for when you need the compact form back.",
          "Keyboard shortcuts cover format, minify, copy and download, and large documents suspend format-as-you-type so the tab stays responsive instead of dropping keystrokes.",
        ],
      },
    ],
    faqs: [
      {
        question: "Will it work with the network turned off?",
        answer:
          "Yes, once the page has loaded. All the code that formats and validates is already in your browser at that point. Reloading the page while offline needs the browser cache to still hold it, but the tool itself needs nothing further.",
      },
      {
        question: "Is it safe to paste a production API response in?",
        answer:
          "The data does not leave your tab, so it is materially safer than a server-side formatter. Your own organisation's policy still applies, and you should check it. Nothing is stored in the page either, so closing the tab discards it.",
      },
      {
        question: "How large a document can it handle?",
        answer:
          "Multi-megabyte documents format fine. Above roughly half a megabyte, formatting as you type is suspended automatically and you press the Format button instead, because re-serialising on every keystroke is what makes these tools feel broken on large files.",
      },
    ],
  },
  {
    slug: "convert-images-without-uploading",
    seo: {
      title: "Convert & Resize Images Without Uploading Them",
      description:
        "Resize, compress, crop and convert images between PNG, JPG and WebP entirely in your browser. Photos and screenshots never leave your device.",
      keywords: [
        "convert image without uploading",
        "resize image offline",
        "image converter no upload",
        "private image compressor",
      ],
    },
    h1: "Convert and resize images without uploading them",
    footerLabel: "Convert images",
    lede:
      "Screenshots contain more than you think: open tabs, filenames, Slack messages, internal URLs. Running them through an image converter that uploads is a quiet way to leak all of it.",
    tools: ["image-resizer", "image-compressor", "image-format-converter", "image-crop"],
    sections: [
      {
        heading: "Screenshots are the risky case",
        body: [
          "Everyone thinks about photos when they think about image privacy, and photos do carry GPS coordinates and camera serial numbers in their EXIF data. But the more common exposure is the work screenshot: the one that needs resizing before it goes in a document, and that happens to include a customer name in a sidebar or a staging URL in the address bar.",
          "That image goes to a converter, sits in a temp directory somewhere, and is retained for as long as that company's cleanup job says. There is no reason for it to have left your laptop.",
        ],
      },
      {
        heading: "Canvas does all of this natively",
        body: [
          HOW_IT_WORKS,
          "For images the browser already has everything required: decoding, scaling with proper resampling, cropping, and re-encoding to PNG, JPEG or WebP with a quality setting. A server adds nothing to the result. It is simply how these sites were built before browsers could do it, and how they stayed built because the upload is what makes the ad-funded business model work.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does this strip EXIF and location data?",
        answer:
          "Re-encoding through the canvas drops the original metadata as a side effect, so a converted or resized image will not carry the GPS coordinates or camera details the original had. If stripping metadata is the actual goal rather than a side benefit, convert the image and use the output.",
      },
      {
        question: "Which formats are supported?",
        answer:
          "PNG, JPEG and WebP for both input and output, plus anything else your browser can decode on the input side. AVIF support depends on your browser version rather than on us.",
      },
      {
        question: "Is the quality as good as a desktop app?",
        answer:
          "For resizing, compression and format conversion, yes. The browser's image pipeline is the same one that renders every image you see. Colour-managed professional work with ICC profiles is the case where a real image editor still wins.",
      },
    ],
  },
  {
    slug: "smallpdf-alternative",
    seo: {
      title: "A Smallpdf Alternative That Doesn't Upload Your Files",
      description:
        "Smallpdf processes your documents on its servers and limits free use. This alternative runs in your browser: no upload, no daily task limit, no account, no watermark.",
      keywords: [
        "smallpdf alternative",
        "smallpdf alternative free",
        "smallpdf without account",
        "pdf tools no upload",
      ],
    },
    h1: "A Smallpdf alternative that does not upload your files",
    footerLabel: "Smallpdf alternative",
    lede:
      "Smallpdf is a good product. It is also a server-side one with a free tier designed to run out, which makes it the wrong shape for confidential documents and for anyone who just needs to merge something twice a day.",
    tools: ["pdf-merge", "pdf-split", "pdf-compress", "pdf-rotate", "pdf-watermark", "pdf-to-images"],
    sections: [
      {
        heading: "The two differences that actually matter",
        body: [
          "The first is where the work happens. Smallpdf uploads your document, processes it in their infrastructure, and deletes it on a stated schedule. That is a normal and well-run arrangement, and it is still an upload of a document you may not be permitted to upload.",
          "The second is the free tier. Server-side processing costs money per document, so a free tier has to be metered. Client-side processing costs nothing per document, because the compute is yours, which is why there is no counter here.",
        ],
      },
      {
        heading: "Where Smallpdf is still the better choice",
        body: [
          "It has substantially more features, including OCR, e-signature workflows, and true PDF-to-Word conversion with layout reconstruction. Those are genuinely hard problems and some of them need real server compute.",
          "It also has a team behind it, a support address, and an enterprise agreement you can sign. If you need someone accountable, that matters more than where the bytes are processed.",
        ],
      },
    ],
    comparison: {
      heading: "Side by side",
      competitor: "Smallpdf",
      rows: [
        {
          capability: "Where files are processed",
          them: "Uploaded to their servers, deleted on a stated schedule",
          us: "In your browser tab; never transmitted",
        },
        { capability: "Free tier limits", them: "Metered free tasks per day", us: "No counter, no metering" },
        { capability: "Account required", them: "For most workflows", us: "Never" },
        { capability: "Works offline", them: "No", us: "Yes, once the page has loaded" },
        { capability: "OCR and e-signatures", them: "Yes", us: "No" },
        { capability: "Support and enterprise agreements", them: "Yes", us: "No" },
      ],
    },
    faqs: [
      {
        question: "Is this actually free, or free until a limit?",
        answer:
          "Free with no limit, because there is no per-document cost to recover. The processing runs on your device, so a thousand merges cost us exactly what zero merges cost us.",
      },
      {
        question: "Can it replace Smallpdf entirely?",
        answer:
          "For merge, split, compress, rotate, watermark, reorder and PDF-to-image, yes. For OCR, e-signature workflows and high-fidelity PDF-to-Word, no, and it would be dishonest to claim otherwise.",
      },
    ],
  },
  {
    slug: "ilovepdf-alternative",
    seo: {
      title: "An iLovePDF Alternative With No Upload and No Limits",
      description:
        "iLovePDF uploads your documents and caps free usage. This alternative does the same core PDF tasks in your browser, with no account, no watermark and no task limit.",
      keywords: [
        "ilovepdf alternative",
        "ilovepdf alternative no upload",
        "free pdf tools no limit",
        "ilovepdf without account",
      ],
    },
    h1: "An iLovePDF alternative with no upload and no limits",
    footerLabel: "iLovePDF alternative",
    lede:
      "iLovePDF covers a lot of ground and does it well. Every task still starts by uploading your document, and the free tier is bounded. If your blocker is either of those, the core tools here do the same jobs locally.",
    tools: ["pdf-merge", "pdf-split", "pdf-compress", "pdf-reorder", "images-to-pdf", "pdf-watermark"],
    sections: [
      {
        heading: "What changes when the processing is local",
        body: [
          "No upload means no wait proportional to your connection speed, no queue, and no copy of your document in someone else's storage. On a slow connection with a large file, the local version finishes while the hosted one is still transferring.",
          "It also means the privacy question stops being about trust. You do not have to believe a retention policy if nothing was ever sent.",
        ],
      },
      {
        heading: "An honest scope check",
        body: [
          "iLovePDF has a far larger catalogue, including OCR, PDF repair, and conversions to and from Office formats that genuinely need heavy server-side work. Those are not here and are not planned.",
          "What is here is the set most people actually open these sites for: merge, split, compress, reorder, rotate, watermark, images to PDF, and PDF to images.",
        ],
      },
    ],
    comparison: {
      heading: "Side by side",
      competitor: "iLovePDF",
      rows: [
        { capability: "Where files are processed", them: "Uploaded to their servers", us: "In your browser tab" },
        { capability: "Free tier limits", them: "Metered tasks, larger files need Premium", us: "No metering" },
        { capability: "Account required", them: "For higher limits and some tools", us: "Never" },
        { capability: "Works offline", them: "No", us: "Yes, once the page has loaded" },
        { capability: "Office conversion and OCR", them: "Yes", us: "No" },
        { capability: "Mobile apps", them: "Yes", us: "No, it is a website" },
      ],
    },
    faqs: [
      {
        question: "Why would a browser-based tool be faster?",
        answer:
          "Because the file never crosses the network. A hosted tool has to upload the document, wait for a worker, then download the result. A local tool skips all three. On a large file over a typical connection the difference is substantial.",
      },
      {
        question: "Does it add a watermark to free output?",
        answer:
          "No. There is no paid tier for a watermark to be advertising, so nothing is stamped on the output.",
      },
    ],
  },
  {
    slug: "csv-to-excel-without-uploading",
    seo: {
      title: "Convert CSV to Excel Without Uploading the File",
      description:
        "Turn CSV into a real .xlsx workbook inside your browser. Useful when the data is customer records or financial exports that should not be sent to a converter.",
      keywords: [
        "csv to excel without uploading",
        "csv to xlsx offline",
        "convert csv locally",
        "private csv converter",
      ],
    },
    h1: "Convert CSV to Excel without uploading the file",
    footerLabel: "CSV to Excel",
    lede:
      "CSV exports are almost always the sensitive kind: customer lists, payroll runs, transaction histories, anything pulled out of an internal dashboard. That is exactly the category of file that should not be pasted into an online converter.",
    tools: ["csv-to-excel", "excel-to-csv", "csv-json-converter", "csv-validator", "column-extractor"],
    sections: [
      {
        heading: "The file you are converting is the problem",
        body: [
          "Nobody converts a CSV of sample data. They convert the export from the CRM, the finance system, or the analytics tool, and those files carry names, email addresses, salaries and revenue figures. In most organisations, uploading one of those to an unvetted third party is a policy breach whether or not anything bad happens.",
          "The conversion itself is not the hard part. Writing an xlsx workbook is a well-defined format operation that runs perfectly well in a browser tab.",
        ],
      },
      {
        heading: "Getting the parsing right",
        body: [
          "Most CSV bugs come from the edge cases rather than the format: quoted fields containing commas, embedded newlines inside a quoted value, a UTF-8 byte order mark on the first header, and semicolon delimiters from European locales. The tools here handle all four, and the validator will point at the row when something is genuinely malformed.",
          "The other common surprise is Excel reformatting values on open, turning long account numbers into scientific notation and text that looks like a date into a date. Writing a real xlsx with explicit cell types avoids that, which is the main advantage over simply renaming the file.",
        ],
      },
    ],
    faqs: [
      {
        question: "Will long numbers still turn into scientific notation?",
        answer:
          "That happens when Excel guesses the type of a value in a plain CSV. Writing a real xlsx workbook lets the cell type be set explicitly, which is why converting properly is better than renaming the extension.",
      },
      {
        question: "Does it handle semicolon-delimited CSV?",
        answer:
          "Yes. The delimiter is selectable, which covers the semicolon-separated exports common in European locales where the comma is the decimal separator.",
      },
      {
        question: "Can it do multiple sheets?",
        answer:
          "The CSV to Excel conversion produces a single sheet, since a CSV is a single table by definition. Going the other way, the Excel tools read every sheet in a workbook and let you pick.",
      },
    ],
  },
];

export const LANDING_PAGE_PATHS = LANDING_PAGES.map((page) => `/${page.slug}`);

export function findLandingPage(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((page) => page.slug === slug);
}
