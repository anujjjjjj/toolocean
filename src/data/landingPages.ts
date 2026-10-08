import type { ToolFaqEntry } from "@/types/toolContent";

/**
 * Modifier and comparison landing pages.
 *
 * The per-tool pages target the tool name, "json formatter", "merge pdf", and
 * those SERPs belong to sites with a decade of links. A new domain does not take
 * them, and increasingly nobody wins them because the query gets answered inside a
 * chatbot instead.
 *
 * What is winnable is the qualified version of the same intent: "merge pdf without
 * uploading", "smallpdf alternative no upload". Lower volume, far lower
 * competition, and the qualifier is the one thing this site can honestly claim that
 * the incumbents cannot. They all upload. A page that answers the qualifier
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
  /** When set, the page renders that tool with the ceiling already chosen. */
  embed?: { tool: "image-compressor" | "pdf-compress"; targetBytes: number };
  /** Key in targetSizeMeasurements.json. The visible byte counts are read from that file. */
  measurementKey?: string;
  howTo?: { name: string; steps: { title: string; body: string }[] };
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
    tools: ["pdf-merge", "pdf-split", "pdf-reorder", "pdf-compress", "pdf-unlock"],
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
          "And the first load has to fetch the PDF library, which is a few hundred kilobytes. After that it is cached and the tool opens instantly, including with the network off. A file that still asks for a password is refused. Unlock PDF removes a password you already know, on the same machine, and the clear copy is what you merge.",
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
    tools: [
      "pdf-merge",
      "pdf-split",
      "pdf-compress",
      "pdf-sign",
      "pdf-encrypt",
      "pdf-unlock",
      "pdf-form-fill",
      "pdf-metadata",
      "pdf-rotate",
      "pdf-watermark",
      "pdf-to-images",
    ],
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
          "It has substantially more features, including OCR, certified e-signature workflows, in-place text editing, redaction, and true PDF-to-Word conversion with layout reconstruction. Those are genuinely hard problems and some of them need real server compute. A visual mark placed on a page here is not a substitute for that e-signature product.",
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
        { capability: "Password-protect a PDF (AES-256)", them: "Yes", us: "Yes, in the browser" },
        { capability: "Unlock a PDF you already know the password for", them: "Yes", us: "Yes. No password search" },
        { capability: "Fill an AcroForm and flatten it", them: "Yes", us: "Yes, in the browser" },
        { capability: "View or strip document metadata", them: "Yes", us: "Yes. Info dictionary and a shallow XMP read" },
        {
          capability: "Signature",
          them: "Certified e-sign workflows",
          us: "A visual mark only. Not a certificate",
        },
        { capability: "OCR", them: "Yes", us: "Not available" },
        { capability: "In-place text editing", them: "Yes", us: "Not available" },
        { capability: "Redaction", them: "Yes", us: "Not available" },
        { capability: "PDF to Word", them: "Yes", us: "Not available" },
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
          "For merge, split, compress, rotate, watermark, reorder, PDF-to-image, a visual signature, password protection, unlock, metadata, and AcroForm filling, yes. For OCR, certified e-signatures, in-place text editing, redaction, and high-fidelity PDF-to-Word, no, and it would be dishonest to claim otherwise.",
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
    tools: [
      "pdf-merge",
      "pdf-split",
      "pdf-compress",
      "pdf-reorder",
      "pdf-sign",
      "pdf-encrypt",
      "pdf-unlock",
      "pdf-form-fill",
      "pdf-metadata",
      "images-to-pdf",
      "pdf-watermark",
    ],
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
          "iLovePDF has a far larger catalogue, including OCR, PDF repair, in-place text editing, redaction, and conversions to and from Office formats that genuinely need heavy server-side work. Those are not here and are not planned. Certified e-signatures are not here either. The sign tool places a visual mark and says so on the page.",
          "What is here is the set most people actually open these sites for: merge, split, compress, reorder, rotate, watermark, images to PDF, PDF to images, plus password protection, unlock, metadata, form filling, and a visual signature.",
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
        { capability: "Password-protect a PDF (AES-256)", them: "Yes", us: "Yes, in the browser" },
        { capability: "Unlock a PDF you already know the password for", them: "Yes", us: "Yes. No password search" },
        { capability: "Fill an AcroForm and flatten it", them: "Yes", us: "Yes, in the browser" },
        { capability: "View or strip document metadata", them: "Yes", us: "Yes. Info dictionary and a shallow XMP read" },
        {
          capability: "Signature",
          them: "E-sign tools on their site",
          us: "A visual mark only. Not a certificate",
        },
        { capability: "OCR", them: "Yes", us: "Not available" },
        { capability: "In-place text editing", them: "Yes", us: "Not available" },
        { capability: "Redaction", them: "Yes", us: "Not available" },
        { capability: "PDF to Word and other Office conversion", them: "Yes", us: "Not available" },
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
    tools: ["csv-to-excel", "excel-to-csv", "csv-to-json", "csv-validator", "column-extractor"],
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
  {
    slug: "compress-pdf-to-100kb",
    seo: {
      title: "Compress PDF to 100 KB – No Upload",
      description:
        "Fit a PDF under 100 KB in the browser. Lossless first when that is enough, otherwise the pages become JPEG pictures. 1 KB is 1024 bytes. Nothing is uploaded.",
      keywords: ["compress pdf to 100kb", "pdf under 100kb", "reduce pdf to 100 kb"],
    },
    h1: "Compress a PDF to 100 KB",
    footerLabel: "PDF to 100 KB",
    lede: "The control below is already set to 100 KB, which is 102,400 bytes. A lossless rewrite is tried first. Rasterising is only the fallback, and it means the text can no longer be selected.",
    tools: ["pdf-compress"],
    embed: { tool: "pdf-compress", targetBytes: 100 * 1024 },
    measurementKey: "compress-pdf-to-100kb",
    howTo: {
      name: "How to compress a PDF to 100 KB",
      steps: [
        { title: "Open the file", body: "Choose a PDF from this device. The bytes stay in the tab." },
        { title: "Leave the ceiling at 100 KB", body: "The chip is already selected. 1 KB means 1024 bytes, so the ceiling is 102400 bytes." },
        { title: "Download and read the note", body: "If the note says the text is still selectable, the lossless rewrite fit. If it says pages were rasterised, the copy is pictures." },
      ],
    },
    sections: [
      {
        heading: "What 100 KB is on this page",
        body: [
          "The button labelled 100 KB means 100 times 1024 bytes, not 100 times 1000. A form that asks for 100 KB and then rejects 100000-byte files is using the binary unit, and that is the unit written next to the field.",
          "The fixture for this address is a one-page letter set in Helvetica. The measured result is printed under the tool, from the same JSON the build stores, rather than typed in by hand. A letter that small usually fits a lossless rewrite, so the text stays selectable. A photograph embedded in a PDF will not, and the 200 KB page records that other path.",
        ],
      },
      {
        heading: "When the file cannot stay text",
        body: [
          "If stripping metadata still leaves the file over 102400 bytes, the pages are drawn and saved as JPEG. That is the only way this browser tool reaches a hard ceiling on a scan. The download note says the text is no longer selectable. Do not use that copy for a contract you still need to search.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is 100 KB exactly 100000 bytes?",
        answer: "No. On this page 1 KB is 1024 bytes, so 100 KB is 102400 bytes. The note under the tool states the unit.",
      },
      {
        question: "Will the words still be selectable?",
        answer: "Only when the lossless rewrite already fits under 102400 bytes. The result note says which path ran. A raster copy is pictures of the pages.",
      },
    ],
  },
  {
    slug: "compress-pdf-to-200kb",
    seo: {
      title: "Compress PDF to 200 KB – No Upload",
      description:
        "Fit a PDF under 200 KB in the browser. A photo-heavy file is rasterised when a lossless rewrite cannot fit. Text in that copy is not selectable. Nothing is uploaded.",
      keywords: ["compress pdf to 200kb", "pdf under 200kb", "reduce pdf size to 200 kb"],
    },
    h1: "Compress a PDF to 200 KB",
    footerLabel: "PDF to 200 KB",
    lede: "200 KB here is 204,800 bytes. The tool opens on that chip. A one-page noise photograph used as the fixture does not fit a lossless pass, so the measured copy is a raster and the text is not selectable.",
    tools: ["pdf-compress"],
    embed: { tool: "pdf-compress", targetBytes: 200 * 1024 },
    measurementKey: "compress-pdf-to-200kb",
    howTo: {
      name: "How to compress a PDF to 200 KB",
      steps: [
        { title: "Choose the PDF", body: "The file is read locally. There is no upload step." },
        { title: "Keep 200 KB selected", body: "That chip is the default on this address. Other ceilings live on the main compress page." },
        { title: "Read whether text survived", body: "Lossless means you can still select the words. Raster means the pages are JPEG pictures under the ceiling." },
      ],
    },
    sections: [
      {
        heading: "Why this page is not the 100 KB page",
        body: [
          "The ceiling is twice as large, 204800 bytes, and the fixture is different on purpose. This one embeds a noisy JPEG that starts well above 200 KB. The engine rasterises it. The byte count under the tool is that run, not a promise about your file.",
          "A text letter will often still take the lossless path at this ceiling, the same way it does at 100 KB. The note on the download is the authority for the file you just made.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does 200 KB mean 200000 bytes?",
        answer: "No. 1 KB is 1024 bytes, so the chip is 204800 bytes.",
      },
      {
        question: "Why did my scan become unselectable?",
        answer: "The lossless rewrite did not fit under 204800 bytes, so each page was painted and stored as a JPEG. That is stated in the result note.",
      },
    ],
  },
  {
    slug: "compress-image-to-20kb",
    seo: {
      title: "Compress Image to 20 KB – No Upload",
      description:
        "Shrink a JPEG toward 20 KB in the browser. Quality is searched, then the picture is scaled if it still will not fit. 1 KB is 1024 bytes. Nothing is uploaded.",
      keywords: ["compress image to 20kb", "reduce image to 20kb", "jpeg under 20 kb"],
    },
    h1: "Compress an image to 20 KB",
    footerLabel: "Image to 20 KB",
    lede: "20 KB is 20,480 bytes. The compressor opens on that chip and writes JPEG unless you switch it to WebP. A noisy 1200 by 800 fixture had to be scaled down before it fit.",
    tools: ["image-compressor"],
    embed: { tool: "image-compressor", targetBytes: 20 * 1024 },
    measurementKey: "compress-image-to-20kb",
    howTo: {
      name: "How to compress an image to 20 KB",
      steps: [
        { title: "Select the picture", body: "PNG, JPEG, or WebP. HEIC is not decoded here." },
        { title: "Leave 20 KB selected", body: "The ceiling is 20480 bytes. Transparency is painted onto white before encoding." },
        { title: "Download and check the note", body: "The note reports the byte size, whether it landed under the ceiling, and any JPEG comment padding." },
      ],
    },
    sections: [
      {
        heading: "Scaling is part of hitting 20 KB",
        body: [
          "A detailed photograph often cannot reach 20480 bytes by lowering JPEG quality alone. This page's fixture is 1200 by 800 noise. The measured run scaled it. Your photo may stay full size if it is already simple, or shrink if it is not. The note names the outcome.",
          "There is no HEIC decoder and no promise of a visually identical thumbnail. 20 KB is a small file for a camera photo.",
        ],
      },
    ],
    faqs: [
      {
        question: "Will a phone photo stay sharp at 20 KB?",
        answer: "Usually not. The search lowers quality and then pixel dimensions until the file is at or under 20480 bytes. Fine detail goes first.",
      },
      {
        question: "What does the padding note mean?",
        answer: "Only if you set a minimum and the JPEG would have been smaller than that floor. Comment bytes are added and counted in the note. The 20 KB fixture did not use a minimum.",
      },
    ],
  },
  {
    slug: "compress-image-to-50kb",
    seo: {
      title: "Compress Image to 50 KB – No Upload",
      description:
        "Shrink a JPEG toward 50 KB in the browser without uploading it. The search keeps the highest quality that still fits. 1 KB is 1024 bytes.",
      keywords: ["compress image to 50kb", "image under 50kb", "jpeg 50 kb"],
    },
    h1: "Compress an image to 50 KB",
    footerLabel: "Image to 50 KB",
    lede: "50 KB is 51,200 bytes. The same 1200 by 800 noise fixture used for the 20 KB page fit here without scaling, at a low JPEG quality. That measured size is shown under the tool.",
    tools: ["image-compressor"],
    embed: { tool: "image-compressor", targetBytes: 50 * 1024 },
    measurementKey: "compress-image-to-50kb",
    howTo: {
      name: "How to compress an image to 50 KB",
      steps: [
        { title: "Pick the image", body: "The decode happens in the tab. Several files download as one ZIP." },
        { title: "Confirm the 50 KB chip", body: "It is selected when this page opens. 50 KB is 51200 bytes." },
        { title: "Save the file the note describes", body: "Within the target means the bytes are at or under 51200. Over the target means even the smallest try missed." },
      ],
    },
    sections: [
      {
        heading: "Why 50 KB kept the full pixel size",
        body: [
          "The fixture is identical to the 20 KB run: deterministic noise, 1200 by 800. At 51200 bytes the binary search found a JPEG quality that fit without reducing the dimensions. At 20480 bytes it did not. A real photograph with smooth sky will behave differently, and the note is about your file.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I ask for WebP instead of JPEG?",
        answer: "Yes. The WebP switch is on the tool. WebP is not padded with comment bytes if you also set a minimum.",
      },
      {
        question: "Is the 50 KB figure a guarantee?",
        answer: "No. It is the output of one noise fixture, printed from the measurement file. Your picture gets its own search.",
      },
    ],
  },
  {
    slug: "compress-image-to-100kb",
    seo: {
      title: "Compress Image to 100 KB – No Upload",
      description:
        "Shrink a JPEG toward 100 KB in the browser. Highest quality that fits, then scale only if needed. 1 KB is 1024 bytes. Nothing is uploaded.",
      keywords: ["compress image to 100kb", "reduce jpg to 100kb", "image under 100 kb"],
    },
    h1: "Compress an image to 100 KB",
    footerLabel: "Image to 100 KB",
    lede: "100 KB is 102,400 bytes. On the 1200 by 800 noise fixture the search stayed at full resolution. The byte count under the tool is that run.",
    tools: ["image-compressor"],
    embed: { tool: "image-compressor", targetBytes: 100 * 1024 },
    measurementKey: "compress-image-to-100kb",
    howTo: {
      name: "How to compress an image to 100 KB",
      steps: [
        { title: "Select one or more images", body: "A single file downloads directly. More than one is zipped." },
        { title: "Use the 100 KB ceiling", body: "This page preselects it. 100 KB is 102400 bytes." },
        { title: "Read the size in the note", body: "Quality and scale are chosen so the file lands at or under the ceiling when that is possible." },
      ],
    },
    sections: [
      {
        heading: "A wider ceiling than 20 KB or 50 KB",
        body: [
          "The fixture did not need to lose pixels to fit under 102400 bytes. Quality alone was enough. That is specific to this noise image. A 4000-pixel camera file may still be scaled. The compressor says so in the note instead of pretending every picture behaves like the fixture.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does this upload the photo to hit 100 KB?",
        answer: "No. Encoding runs on a canvas in the tab, in a worker when the browser has OffscreenCanvas, otherwise on the main thread.",
      },
      {
        question: "Can I set a minimum as well as 100 KB?",
        answer: "Yes. A JPEG under that floor is padded with comment bytes, and the padding is included in the reported size. It will not pad past the ceiling.",
      },
    ],
  },
];

export const LANDING_PAGE_PATHS = LANDING_PAGES.map((page) => `/${page.slug}`);

export function findLandingPage(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((page) => page.slug === slug);
}
