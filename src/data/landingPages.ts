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
 * uploading", "smallpdf alternative". Lower volume, far lower competition. Do not
 * assume a competitor uploads: several ship desktop apps that work offline. Say
 * only what their own pages say, and cite it on the row (see LandingComparisonRow).
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
  /** What the named competitor's own page says, for the product and plan named. */
  them: string;
  /** What ToolOcean does. Must be true of the linked tools right now. */
  us: string;
  /** The official page `them` was read from. Shown on the row. */
  source: { url: string; label: string };
  /** ISO date the source was read. Shown on the row; recheck before editing. */
  checkedOn: string;
}

/** A working tool rendered at the top of the page, opened on a preset. */
export type LandingEmbed =
  | { tool: "image-compressor" | "pdf-compress"; targetBytes: number }
  | { tool: "image-format-converter"; output: "image/jpeg" | "image/png" | "image/webp" }
  | { tool: "heic-to-jpg"; format: "jpg" | "png" }
  | { tool: "pdf-unlock" }
  | { tool: "images-to-pdf"; input: "jpeg" | "png" }
  | { tool: "pdf-to-images"; output: "png" | "jpeg" };

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
  /**
   * Optional comparison table. Only for "X alternative" pages. Keep it to the
   * few rows the competitor's own pages support; an unsupported row is removed,
   * not guessed.
   */
  comparison?: {
    heading: string;
    intro: string;
    competitor: string;
    rows: LandingComparisonRow[];
  };
  /**
   * Visible numbered steps. Rendered like howTo but not emitted as HowTo schema,
   * so a page can be actionable without widening its structured data.
   */
  steps?: { heading: string; items: { title: string; body: string }[] };
  /** A measured table from src/data/landingBenchmarks.json. */
  benchmark?: { key: "compress-100kb" | "merge"; heading: string; intro: string };
  faqs: ToolFaqEntry[];
  /** When set, the page renders that tool with its preset already chosen. */
  embed?: LandingEmbed;
  /**
   * Sibling pages and the hub, shown under the tool cards. `tools` only takes
   * catalog slugs; this is for landing pages and category listings too.
   */
  related?: { path: string; label: string; note: string }[];
  /** Command palette entry. Pages without one stay out of the palette. */
  palette?: { name: string; description: string; keywords: string[]; icon: string; category: string };
  /** Key in targetSizeMeasurements.json. The visible byte counts are read from that file. */
  measurementKey?: string;
  howTo?: { name: string; steps: { title: string; body: string }[] };
}

/** Shared closing paragraph fragments, so the honesty stays consistent. */
const HOW_IT_WORKS =
  "The tools are ordinary web pages. When you pick a file, the browser hands your code a reference to it and the work happens in JavaScript and WebAssembly on your own machine. There is no server component to send it to, which is why there is no upload progress bar and no queue.";

/**
 * Official competitor pages read for the comparison rows, and the date they were
 * read. Excerpts for every kept claim are recorded outside the repo alongside the
 * fetched text; recheck the page before changing a row.
 */
const CHECKED_ON = "2026-11-06";
const SOURCES = {
  smallpdfMerge: { url: "https://smallpdf.com/merge-pdf", label: "Smallpdf, Merge PDF page" },
  smallpdfPricing: { url: "https://smallpdf.com/pricing", label: "Smallpdf, Pricing page" },
  ilovepdfPricing: { url: "https://www.ilovepdf.com/pricing", label: "iLovePDF, Pricing page" },
  ilovepdfDesktop: { url: "https://www.ilovepdf.com/desktop", label: "iLovePDF, Desktop page" },
  ilovepdfSecurity: { url: "https://www.ilovepdf.com/help/security", label: "iLovePDF, Security page" },
} as const;

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "merge-pdf-without-uploading",
    seo: {
      title: "Merge PDFs Without Uploading: Steps and a Check",
      description:
        "Combine PDFs in this browser tab: choose the files, drag them into order, save merged.pdf. With a network check you can run and a measured test on generated files.",
      keywords: [
        "merge pdf without uploading",
        "combine pdf offline",
        "merge pdf locally",
        "private pdf merger",
      ],
    },
    h1: "Merge PDFs without uploading them",
    footerLabel: "Merge PDFs",
    lede:
      "Merge PDF reads your files and joins them inside this browser tab, then saves the result as merged.pdf. The PDFs are not sent to a server. Below: the steps, what can stop a merge, and how to check the no-upload part yourself.",
    tools: ["pdf-merge", "pdf-reorder", "pdf-delete-pages", "pdf-split", "pdf-unlock"],
    steps: {
      heading: "How to merge PDFs here",
      items: [
        {
          title: "Open Merge PDF and choose two or more files",
          body: "Each file appears as a numbered row with its page count. Choose several at once, or add them one at a time.",
        },
        {
          title: "Put the rows in order",
          body: "Drag a row by its handle to move it; the merged file follows the numbers. If dragging is awkward, remove a row with its × button and use Add More Files, which always adds to the end.",
        },
        {
          title: "Press Merge & Download",
          body: "The button needs at least two files. Your browser saves merged.pdf holding every page of every file, in that order.",
        },
        {
          title: "Fix single pages afterwards",
          body: "To move, drop or pull out individual pages rather than whole files, open merged.pdf in PDF Page Reorder, Delete PDF Pages or PDF Split.",
        },
      ],
    },
    sections: [
      {
        heading: "Files the merge cannot read",
        body: [
          "Merge PDF has to open each file to copy its pages. An encrypted PDF, whether it asks for a password to open or only restricts editing, is reported as \"Error reading PDF\" and left off the list, and so is a damaged file. If you know the password, remove it with Unlock PDF on the same device and merge the unlocked copy.",
        ],
      },
      {
        heading: "What the merge keeps and drops",
        body: [
          "Each page is carried into the new file unchanged. Nothing is redrawn, so text stays text and images keep their resolution; in the measured run below, the merged file's text was still selectable. No watermark is added.",
          "Document-level parts are not carried across. Bookmarks and fillable form fields from the source files do not survive into merged.pdf, and its title and author fields start empty. Fill and save forms before merging, and add bookmarks afterwards in a desktop PDF editor if you need them.",
        ],
      },
      {
        heading: "Memory, not a server quota, is the limit",
        body: [
          "Every chosen file is read into the tab's memory, and merged.pdf is built there before it is saved. This site sets no file-count or size cap; the ceiling is how much memory your browser gives the tab. We measured a desktop browser only, so we do not quote a figure for phones.",
        ],
      },
      {
        heading: "Check the no-upload part yourself",
        body: [
          "On the Merge PDF page, open your browser's developer tools, select the Network tab, tick Preserve log and clear the list. Choose your files and press Merge & Download. Requests that fetch script files from this site are the page loading its own code. Look at every request that sends a body: none should contain your documents. The analytics requests, which do send small bodies, are described in the first question below so you can recognise them.",
          "For a stronger test, choose the files while online, set the Network tab's throttling menu to Offline, then press Merge & Download. merged.pdf is still produced, which a server-side merger cannot do. That is the offline run in the table above.",
        ],
      },
    ],
    benchmark: {
      key: "merge",
      heading: "Measured: three generated PDFs merged in a desktop browser",
      intro:
        "Five runs of the real Merge PDF page on one machine, plus one run with the network switched off after the files were chosen. These are this machine's numbers, not a promise for your files or device.",
    },
    faqs: [
      {
        question: "Is anything sent while I merge?",
        answer:
          "Your PDFs are not. The site does send analytics about the visit, and that is separate from your files. When a page loads, the Umami script records a page view, and Google Analytics, when configured, is set up to send page views without setting cookies unless you accept the banner. On the Merge PDF page, the site is also set up to send Google Analytics interaction events named tool_engage and tool_action, carrying the tool's slug and the fixed name of the button pressed. When a merge succeeds, Umami receives an event named tool-run whose only fields are tool and slug, here pdf-merge and pdf-merge. None of these include file names, sizes, page counts or contents. The page also fetches its own script files from this site as you use it.",
      },
      {
        question: "Why was one of my files left off the list?",
        answer:
          "It could not be opened. That happens with encrypted PDFs, including ones that open without a password but restrict editing, and with damaged files. Remove a password you know with Unlock PDF, then add the unlocked copy.",
      },
      {
        question: "Is there a file size or page count limit?",
        answer:
          "None set by this site. The files and the merged copy are held in the tab's memory, so the limit is your device and browser. Our measured run merged about 4 MB of input on a desktop; we have not measured phones.",
      },
      {
        question: "Does merging lower the quality or add a watermark?",
        answer:
          "No. Pages are copied without being redrawn, so text stays selectable, images keep their resolution and nothing is stamped on them. Bookmarks and fillable form fields are not carried over.",
      },
    ],
    related: [
      { path: "/pdf-tools", label: "All PDF tools", note: "Every PDF tool on the site, each running in the browser." },
      {
        path: "/compress-pdf-to-100kb",
        label: "Compress a PDF to 100 KB",
        note: "When the merged file has to fit a 100 KB upload limit.",
      },
      {
        path: "/grayscale-pdf",
        label: "Grayscale PDF",
        note: "For a black-and-white printout of the merged file without spending colour ink.",
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
      title: "Smallpdf Alternative for Merging, Splitting and Compressing",
      description:
        "Choosing between Smallpdf and ToolOcean to merge, split or compress PDFs: where files go, free-plan limits and features, with each Smallpdf fact cited and dated.",
      keywords: [
        "smallpdf alternative",
        "smallpdf alternative free",
        "smallpdf daily limit",
        "merge pdf without smallpdf",
      ],
    },
    h1: "A Smallpdf alternative for merging, splitting and compressing",
    footerLabel: "Smallpdf alternative",
    lede:
      "Smallpdf's online merge uploads your files, and its Windows app, according to Smallpdf, works offline. ToolOcean's tools run in your browser tab. This page compares the two for the jobs people most often switch for, cites a Smallpdf page on every row, and says when Smallpdf is the better choice.",
    tools: ["pdf-merge", "pdf-split", "pdf-compress", "images-to-pdf"],
    sections: [
      {
        heading: "Which one to use",
        body: [
          "Use ToolOcean when the job is a merge, split or compress of PDFs you would rather not upload, and you want no account, app or daily allowance. For the merge itself, the merge-without-uploading page has the steps and a check you can run. For an upload form with a size limit, the 100 KB page explains the byte counts and shows where a file cannot fit.",
          "Use Smallpdf when you need what its pricing page lists and this site does not have: OCR, text editing, redaction, e-signatures through Sign.com, conversion to and from Word, Excel and PowerPoint, and a mobile app. Smallpdf describes its Windows app as merging, editing and organising PDFs without an internet connection, if you want that on a PC. Its pricing page also states ISO/IEC 27001 certification and offers team plans with centralised billing, which matter when your organisation needs a supplier it can contract with.",
        ],
      },
      {
        heading: "What we did not compare",
        body: [
          "We have not tested Smallpdf's speed, output sizes or Windows app, so this page makes no performance claim about it. Each row is what a Smallpdf page said on the date shown beside it; if that page changes, the row can be out of date until it is rechecked.",
        ],
      },
    ],
    comparison: {
      heading: "Smallpdf and ToolOcean, row by row",
      intro:
        "Four questions, each answered from the Smallpdf page cited on its row. Prices are left out because the pricing page we read did not give them as text, and anything we could not find on Smallpdf's own pages is left out rather than guessed.",
      competitor: "Smallpdf",
      rows: [
        {
          capability: "Online merge: where the files go",
          them: "You upload them. Smallpdf says they are encrypted with TLS and deleted from its servers after one hour.",
          us: "Read and merged in your browser tab. Not uploaded.",
          source: SOURCES.smallpdfMerge,
          checkedOn: CHECKED_ON,
        },
        {
          capability: "Working without internet",
          them: "The Smallpdf Windows app, which Smallpdf says merges, edits and organizes PDFs on your PC without an internet connection.",
          us: "No app. With the page loaded and files chosen, a merge still finished offline in our test.",
          source: SOURCES.smallpdfMerge,
          checkedOn: CHECKED_ON,
        },
        {
          capability: "Free plan",
          them: "Free lists \"Limited document downloads\"; Pro lists \"Unlimited document downloads\".",
          us: "No plans and no download counter.",
          source: SOURCES.smallpdfPricing,
          checkedOn: CHECKED_ON,
        },
        {
          capability: "Merging Word, Excel or image files",
          them: "Supported. Smallpdf says PDFs can be combined with Word, Excel, PowerPoint and JPG or PNG files.",
          us: "PDFs only. Turn images into a PDF first with Images to PDF.",
          source: SOURCES.smallpdfMerge,
          checkedOn: CHECKED_ON,
        },
      ],
    },
    faqs: [
      {
        question: "Does Smallpdf upload my files?",
        answer:
          "Its online Merge PDF page says you upload them, that they are encrypted with TLS, and that they are deleted from its servers after one hour. The same page offers a Windows app that, by Smallpdf's description, merges PDFs without an internet connection. We have not tested either.",
      },
      {
        question: "Is ToolOcean free without a daily limit?",
        answer:
          "Yes. There is no account, plan or counter, because the work runs on your own device and costs the site nothing per file.",
      },
      {
        question: "What does Smallpdf do that ToolOcean does not?",
        answer:
          "From its pricing and merge pages: OCR, text editing, redaction, e-signatures through Sign.com, Office conversions, merging Word, Excel, PowerPoint and image files directly, cloud storage and a mobile app. ToolOcean has none of those. Its Sign PDF tool places a visual signature, not an e-signature workflow.",
      },
      {
        question: "Which suits a merge that must stay on my computer?",
        answer:
          "ToolOcean in the browser does, and by Smallpdf's own description so does its Windows app. Smallpdf's online merge does not, because it uploads. Your organisation's policy decides which suppliers you may use.",
      },
    ],
    related: [
      {
        path: "/merge-pdf-without-uploading",
        label: "Merge PDFs without uploading",
        note: "Step-by-step merge, with a network check and measured runs.",
      },
      {
        path: "/compress-pdf-to-100kb",
        label: "Compress a PDF to 100 KB",
        note: "For upload forms with a size limit, including files that cannot fit.",
      },
      {
        path: "/ilovepdf-alternative",
        label: "iLovePDF alternative",
        note: "The same choice against iLovePDF's web tools, Desktop app and mobile apps.",
      },
    ],
  },
  {
    slug: "ilovepdf-alternative",
    seo: {
      title: "iLovePDF Alternative: Web, Desktop or In-Browser Tools",
      description:
        "iLovePDF's web tools, Desktop app and free limits next to ToolOcean's in-browser merge and compress, with every iLovePDF fact cited to its own pages and dated.",
      keywords: [
        "ilovepdf alternative",
        "ilovepdf desktop alternative",
        "ilovepdf free limit",
        "ilovepdf without account",
      ],
    },
    h1: "An iLovePDF alternative: web, desktop or browser tab",
    footerLabel: "iLovePDF alternative",
    lede:
      "iLovePDF is three products: web tools that process files on its platform, a Desktop app for Windows and macOS that it says works on your computer, and mobile apps. ToolOcean is a website whose tools run in your browser tab. Which comparison matters depends on which iLovePDF you would otherwise use.",
    tools: ["pdf-merge", "pdf-split", "pdf-compress", "pdf-reorder"],
    sections: [
      {
        heading: "Picking by situation",
        body: [
          "You want to merge or compress a few PDFs now, without installing anything or making an account: ToolOcean in a browser tab does that, and the work stays on your device. The merge-without-uploading and 100 KB pages walk through both jobs, with measured runs and the cases that fail.",
          "You work with PDFs daily on one computer and want right-click conversions, bulk processing and an offline reader: iLovePDF describes its Desktop app as built for that, and its tools come with the paid plan.",
          "You need OCR, PDF to Word, Excel or PowerPoint, repair, redaction, comparison or PDF/A: those are on iLovePDF's pricing page and are not on this site.",
        ],
      },
      {
        heading: "What iLovePDF offers that this site cannot",
        body: [
          "iLovePDF's security page says it holds ISO/IEC 27001:2022 certification, and its pricing page lists regional file processing on Premium and single sign-on on Business, along with shared billing for teams. If your organisation needs a contracted supplier with those, that is a reason to choose it. The security page also says signed documents are kept for up to five years for legal reasons, which is worth knowing before you sign there.",
        ],
      },
      {
        heading: "Speed and output size",
        body: [
          "We have not measured iLovePDF's speed or output sizes, and we make no claim that this site is faster. Our own timings, for this site alone, are on the merge and 100 KB pages.",
        ],
      },
    ],
    comparison: {
      heading: "iLovePDF and ToolOcean, row by row",
      intro:
        "Each iLovePDF answer comes from the page cited on its row and names the product or plan it applies to. Limits and prices change, so check the source before relying on one.",
      competitor: "iLovePDF",
      rows: [
        {
          capability: "Web tools: where the files go",
          them: "For ordinary web processing, its security page says files are deleted automatically within two hours; signed documents can be kept for up to five years.",
          us: "Processed in your browser tab. Not uploaded.",
          source: SOURCES.ilovepdfSecurity,
          checkedOn: CHECKED_ON,
        },
        {
          capability: "Desktop app",
          them: "Windows and macOS. iLovePDF says it processes files on your computer. The reader is free; Desktop Tools and Reader is listed at US$9 a month or US$60 a year.",
          us: "Nothing to install. In our offline test the merge completed once the page and files were loaded.",
          source: SOURCES.ilovepdfDesktop,
          checkedOn: CHECKED_ON,
        },
        {
          capability: "Free merge on the web (Basic plan)",
          them: "Up to 25 files and 100 MB per Merge task. Premium: 500 files and 4 GB.",
          us: "No file-count or size cap set by the site. Your device's memory is the limit.",
          source: SOURCES.ilovepdfPricing,
          checkedOn: CHECKED_ON,
        },
        {
          capability: "Free compress on the web (Basic plan)",
          them: "Up to 2 files and 200 MB per Compress task. Premium: 10 files and 4 GB.",
          us: "One PDF at a time, no size cap set by the site, with a target-size option such as 100 KB.",
          source: SOURCES.ilovepdfPricing,
          checkedOn: CHECKED_ON,
        },
        {
          capability: "Phones",
          them: "iOS and Android apps are linked, and the Premium subscription lists work on web, mobile and desktop.",
          us: "A website only. Our measurements did not include phones.",
          source: SOURCES.ilovepdfDesktop,
          checkedOn: CHECKED_ON,
        },
      ],
    },
    faqs: [
      {
        question: "Does iLovePDF Desktop upload files?",
        answer:
          "Its Desktop page says it processes files on your computer. We have not tested the app. The web tools are different: files are processed on iLovePDF's platform and, according to its security page, deleted within two hours.",
      },
      {
        question: "How many files can I merge for free on iLovePDF?",
        answer:
          "Its pricing page, read on 6 November 2026, lists 25 files and 100 MB per Merge task on the free Basic plan. ToolOcean sets no count or size limit; your device's memory is the practical one.",
      },
      {
        question: "Does ToolOcean have a desktop or mobile app?",
        answer:
          "No. It is a website. The merge we tested kept working offline once the page and files had loaded, but there is nothing to install, no right-click integration and no app-store version.",
      },
      {
        question: "Is ToolOcean faster than iLovePDF?",
        answer:
          "We have not compared them, so we do not claim it. The timings we publish are for this site alone, on generated files and one desktop machine.",
      },
    ],
    related: [
      {
        path: "/merge-pdf-without-uploading",
        label: "Merge PDFs without uploading",
        note: "The steps, what stops a merge, and a check you can run.",
      },
      {
        path: "/compress-pdf-to-100kb",
        label: "Compress a PDF to 100 KB",
        note: "Byte counts for upload forms, and what happens when a file will not fit.",
      },
      {
        path: "/smallpdf-alternative",
        label: "Smallpdf alternative",
        note: "The same decision against Smallpdf, with its own sourced rows.",
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
        "Aim a PDF at 100 KB (102,400 bytes, or type 100000) in your browser. Lossless first, JPEG pages only if needed, and a plain note when a file cannot fit.",
      keywords: ["compress pdf to 100kb", "pdf under 100kb", "reduce pdf to 100 kb", "pdf 100000 bytes"],
    },
    h1: "Compress a PDF to 100 KB",
    footerLabel: "PDF to 100 KB",
    lede: "The size control below starts at 100 KB, which here is 102,400 bytes. If your form counts 100 KB as 100,000 bytes, type 100000 into the custom box. Some PDFs cannot get that small, and the note under the tool tells you when that happens.",
    tools: ["pdf-compress", "pdf-split", "pdf-delete-pages"],
    embed: { tool: "pdf-compress", targetBytes: 100 * 1024 },
    howTo: {
      name: "How to compress a PDF to 100 KB",
      steps: [
        { title: "Open the file", body: "Choose a PDF from this device. The bytes stay in the tab." },
        {
          title: "Check the ceiling",
          body: "The 100 KB chip is already selected. 1 KB means 1024 bytes, so that is 102,400 bytes. For a limit of 100,000 bytes, type 100000 in the custom box and press Use.",
        },
        {
          title: "Press Fit to size & Download, then read the note",
          body: "The note says whether the lossless rewrite fit, so the text is still selectable; whether the pages became JPEG pictures to fit; or that even the smallest picture copy is still over the target. If that copy would be bigger than your original, nothing is downloaded.",
        },
      ],
    },
    sections: [
      {
        heading: "100,000 or 102,400 bytes",
        body: [
          "Both meanings of 100 KB are in use, and upload forms rarely say which one they apply. This tool counts 1 KB as 1024 bytes, so its 100 KB chip is 102,400 bytes. If the form gives no hint, aim for 100,000: a file under 100,000 bytes passes either reading.",
          "The gap is small but real. In the measured table, the 36-page text report rewrites losslessly to 101,411 bytes. That passes a 102,400-byte ceiling with its text intact and fails a 100,000-byte one.",
        ],
      },
      {
        heading: "What the tool tries, in order",
        body: [
          "First a lossless rewrite: the title, author, subject, keywords, producer and creator fields are cleared and the file is saved again with compressed object streams. If that is under the ceiling, that is your file, with the text untouched.",
          "Otherwise every page is drawn at twice its size, which is 144 pixels per inch of page, and saved as a JPEG picture. The tool searches JPEG quality between 0.15 and 0.85; if no quality fits, it shrinks the pictures to 70% and searches again, up to five times. The smallest pictures it will try are about 24 pixels per inch, far too coarse for body text.",
        ],
      },
      {
        heading: "When a file cannot fit",
        body: [
          "There are two ways to miss, and the measured table shows both. If even the smallest picture copy is over the ceiling but smaller than your original, nothing is downloaded and the note gives that copy's size next to the target; the 24-page noise test file ends there. If the smallest picture copy would be bigger than the original, nothing is downloaded and a message says re-encoding would make it bigger. Text-heavy files tend to end there, because pictures of text cost far more than the text, and the 36-page report at 100,000 bytes is that case.",
          "What helps: send fewer pages, using PDF Split or Delete PDF Pages and uploading the parts separately if the form allows it; ask whether the form accepts a larger file; or, for a scan, rescan at a lower resolution. Retrying the same file at the same ceiling gives the same answer.",
        ],
      },
      {
        heading: "Selectable text or a picture copy",
        body: [
          "A lossless result is still the original document, so its words can be searched, copied and read aloud by a screen reader. A picture copy has no text layer, so none of that works. In our runs the one-page photo test file fit at 144 pixels per inch, but a dense page pushed to the low end of the search can be unreadable. Open the download and zoom in before you submit it.",
        ],
      },
    ],
    benchmark: {
      key: "compress-100kb",
      heading: "Measured on generated test files",
      intro:
        "Each row is the tool on this page, run five times on one desktop machine. Two of the rows are files that could not be brought under the target.",
    },
    faqs: [
      {
        question: "Is 100 KB 100,000 or 102,400 bytes here?",
        answer:
          "102,400. The tool counts 1 KB as 1024 bytes. For a form that means 100,000 bytes, type 100000 in the custom box; a bare number is read as bytes.",
      },
      {
        question: "Why did nothing download?",
        answer:
          "The smallest picture copy the tool could make was bigger than your original, so it kept the original rather than hand you a larger file. That is common for text-heavy PDFs. Send fewer pages, or check whether the form accepts a bigger file.",
      },
      {
        question: "Will the words still be selectable?",
        answer:
          "Only if the lossless rewrite fits. The note under the tool says which path ran. A picture copy has no text layer, so it cannot be searched or copied.",
      },
      {
        question: "Can every PDF be brought under 100 KB?",
        answer:
          "No. In our measured runs a 36-page text report could not get under 100,000 bytes, and a 24-page noise-filled file stayed well over a 102,400-byte target. The note tells you when this happens.",
      },
    ],
    related: [
      {
        path: "/compress-pdf-to-200kb",
        label: "Compress a PDF to 200 KB",
        note: "The same tool with a 204,800-byte ceiling.",
      },
      { path: "/compress-pdf-to-500kb", label: "Compress a PDF to 500 KB", note: "A 512,000-byte ceiling for scanned certificates." },
      { path: "/compress-pdf-to-1mb", label: "Compress a PDF to 1 MB", note: "A 1,048,576-byte ceiling for multi-page uploads." },
      {
        path: "/merge-pdf-without-uploading",
        label: "Merge PDFs without uploading",
        note: "Join files first, then bring the result down to size here.",
      },
      { path: "/pdf-compress", label: "Compress PDF", note: "The full tool, with lossless, picture and exact-size modes." },
      { path: "/pdf-tools", label: "All PDF tools", note: "Split, delete pages and the rest, all in the browser." },
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
    related: [
      { path: "/compress-pdf-to-100kb", label: "Compress a PDF to 100 KB", note: "A tighter 102,400-byte ceiling, with measured runs." },
      { path: "/compress-pdf-to-500kb", label: "Compress a PDF to 500 KB", note: "More room for a scanned certificate or marksheet." },
      { path: "/compress-pdf-to-1mb", label: "Compress a PDF to 1 MB", note: "For uploads that bundle several pages." },
      { path: "/pdf-compress", label: "Compress PDF", note: "Every mode and ceiling in one tool." },
      { path: "/pdf-tools", label: "All PDF tools", note: "Split, merge and delete pages without uploading." },
    ],
  },
  {
    slug: "compress-pdf-to-500kb",
    seo: {
      title: "Compress PDF to 500 KB for Online Forms – No Upload",
      description:
        "Aim a scanned certificate or marksheet PDF under 500 KB in your browser. Lossless first, JPEG pages only if needed, and a plain note when it cannot fit.",
      keywords: ["compress pdf to 500kb", "pdf under 500kb", "reduce pdf size to 500 kb", "certificate pdf 500kb"],
    },
    h1: "Compress a PDF to 500 KB",
    footerLabel: "PDF to 500 KB",
    lede: "Some online application forms cap a scanned certificate or marksheet at 500 KB; check your form's notice for its exact limit. Here that ceiling is 512,000 bytes, and the size control below opens on it. The tool keeps the text when a lossless rewrite is small enough, and otherwise redraws the pages as JPEG pictures.",
    tools: ["pdf-compress", "pdf-split", "pdf-delete-pages"],
    embed: { tool: "pdf-compress", targetBytes: 500 * 1024 },
    howTo: {
      name: "How to compress a PDF to 500 KB",
      steps: [
        { title: "Choose the scan", body: "Pick the PDF from this device. It is read inside the tab, so there is no upload wait." },
        {
          title: "Leave 500 KB, or pick 488 KB",
          body: "The 500 KB chip means 512,000 bytes. If the form counts 500 KB as 500,000 bytes, type 488 KB in the custom box and press Use; 499,712 bytes passes both readings.",
        },
        {
          title: "Press Fit to size, then check every page",
          body: "A file is saved only when it lands under the ceiling and is smaller than your original. Open it and zoom in on each page before you send it to the form.",
        },
      ],
    },
    sections: [
      {
        heading: "What happens to a scan on the way to 500 KB",
        body: [
          "The first attempt changes nothing you can see. The document's title, author and similar fields are cleared, and the file is saved again with compressed object streams. A PDF made from typed text can land under 512,000 bytes this way, and its words stay searchable.",
          "A phone or office scan is different, because each page is already a large picture. The tool then paints every page, stores it as a JPEG and searches for the highest JPEG quality that still fits. When even the lowest quality in that search is too big, the pictures are made smaller and the search runs again. It gives up quality before pixels.",
        ],
      },
      {
        heading: "Long files and readability",
        body: [
          "The ceiling is shared by every page, so a long scan leaves fewer bytes for each sheet. A fit on a long file can mean pages drawn at reduced resolution, and when that happens the note warns that small print may be hard to read. Fit or not, look at the result yourself before submitting it.",
          "Every page is painted and held in memory at the same time, so a scan with many pages takes longer and can exhaust a phone's memory. If the form allows separate uploads, split the file first and compress each part.",
        ],
      },
      {
        heading: "When it cannot reach 500 KB",
        body: [
          "If the smallest copy the tool can make is still over the ceiling, nothing is downloaded and the run is not counted as finished. The note shows the bytes it reached beside the target. From there: split the document with PDF Split, drop pages the form did not ask for with Delete PDF Pages, rescan at a lower resolution or in greyscale, or ask whether the form takes a larger file.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is 500 KB 500,000 or 512,000 bytes here?",
        answer: "512,000. This tool counts 1 KB as 1024 bytes. When a form means 500,000 bytes, choose 488 KB in the custom box instead: 499,712 bytes is under both figures.",
      },
      {
        question: "My scan is many megabytes. Can it get under 500 KB?",
        answer:
          "It depends on the page count and how much detail each page holds. A scan is mostly picture data, so redrawing its pages as JPEG pictures can shrink it a lot, but there is no promise, and each extra page shares the same budget. The note reports the result in bytes; if it says the pages were drawn at reduced resolution, zoom in before you submit.",
      },
      {
        question: "Why can I no longer select the text?",
        answer:
          "The lossless rewrite was not small enough, so each page became a JPEG picture. Pictures carry no text layer, so search and copy stop working. A plain scan has no text layer to begin with, so in that case nothing is lost on that front.",
      },
      {
        question: "The note says it is still over the target. What now?",
        answer:
          "Nothing was saved. Split the PDF and upload the parts if the form allows it, delete pages it did not ask for, rescan the paper at a lower resolution or in greyscale, or check whether the form accepts a bigger file.",
      },
      {
        question: "Is my PDF uploaded anywhere?",
        answer:
          "No, your files aren't uploaded: the PDF is read and rewritten inside this tab. The site does count visits, separately from files. Umami records a page view, and Google Analytics, when configured, sends page views without cookies unless you accept the banner. After a PDF is saved under the ceiling, Umami also gets an event named tool-run whose only fields are tool and slug, here pdf-compress and compress-pdf-to-500kb. No file name, size or content is included.",
      },
    ],
    related: [
      { path: "/compress-pdf-to-100kb", label: "Compress a PDF to 100 KB", note: "For forms with a much tighter cap." },
      { path: "/compress-pdf-to-200kb", label: "Compress a PDF to 200 KB", note: "A 204,800-byte ceiling." },
      { path: "/compress-pdf-to-1mb", label: "Compress a PDF to 1 MB", note: "Twice the room, for longer documents." },
      { path: "/pdf-compress", label: "Compress PDF", note: "The parent tool, with every mode." },
      { path: "/pdf-tools", label: "All PDF tools", note: "Split, delete pages and merge in the browser." },
    ],
  },
  {
    slug: "compress-pdf-to-1mb",
    seo: {
      title: "Compress PDF to 1 MB for Scans & Certificates – No Upload",
      description:
        "Aim a PDF under 1 MB (1,048,576 bytes) without uploading it. Text PDFs may pass losslessly; scans become JPEG pages, and the note says which happened.",
      keywords: ["compress pdf to 1mb", "pdf under 1mb", "reduce pdf to 1 mb", "scanned pdf 1mb"],
    },
    h1: "Compress a PDF to 1 MB",
    footerLabel: "PDF to 1 MB",
    lede: "1 MB here is 1,048,576 bytes, the ceiling the size control opens on. It suits uploads that bundle several pages, such as a degree certificate with its marksheets, or a CV with scanned attachments. If the lossless rewrite already fits, the text is kept; if not, the pages become JPEG pictures.",
    tools: ["pdf-compress", "pdf-merge", "pdf-split"],
    embed: { tool: "pdf-compress", targetBytes: 1024 * 1024 },
    howTo: {
      name: "How to compress a PDF to 1 MB",
      steps: [
        { title: "Select the PDF", body: "One file at a time. To send several documents as one, join them with Merge PDF first." },
        {
          title: "Keep 1 MB, or use 976 KB",
          body: "The 1 MB chip equals 1,048,576 bytes. A form that treats 1 MB as 1,000,000 bytes is safer with 976 KB typed in the custom box: 999,424 bytes, under either count.",
        },
        {
          title: "Read the note before uploading",
          body: "It says whether the text survived, gives the bytes before and after, and asks you to zoom in on the pages. A result over the ceiling is not saved.",
        },
      ],
    },
    sections: [
      {
        heading: "More room per page than 500 KB",
        body: [
          "Doubling the ceiling doubles what each page can spend. On a multi-page scan that can mean the search stops at a larger picture size or a higher JPEG quality than it would for 500 KB. Whether it does for your file depends on how much detail the pages carry, which is why the note reports the result instead of predicting it.",
        ],
      },
      {
        heading: "Combining documents before compressing",
        body: [
          "Some forms want one PDF holding several certificates. Join them with Merge PDF, which also runs in the browser, and then bring the merged file here. Compressing each part first and merging afterwards works too, but then you have to share the ceiling out between the parts by hand.",
        ],
      },
      {
        heading: "Why a result can sit far below 1 MB",
        body: [
          "The picture search starts at full size and looks for the best JPEG quality that fits, with quality capped at 0.85. A short scan can fit well under the ceiling even at that cap, so a one-page certificate may come back much smaller than 1 MB. That is expected, not a fault.",
          "A typed PDF that already fits after the lossless rewrite keeps its text and loses only its metadata fields. If your original is under the ceiling and the rewrite does not shrink it, nothing is saved, and the note tells you to upload the original.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does 1 MB mean 1,000,000 or 1,048,576 bytes here?",
        answer: "1,048,576, because 1 KB is 1024 bytes on this site. For a form counting in thousands, enter 976 KB in the custom box, which is 999,424 bytes.",
      },
      {
        question: "My PDF is already under 1 MB. Why did nothing download?",
        answer:
          "When the original already fits and a lossless rewrite does not make it smaller, the tool keeps your file rather than hand back a copy that is no better. The note shows the original's size in bytes. Upload it as it is.",
      },
      {
        question: "Will a typed document lose its text?",
        answer:
          "Not if the lossless rewrite fits, which a text-only PDF can do at this ceiling. The note says so. Only when pages are redrawn as pictures does the text stop being selectable.",
      },
      {
        question: "My long scan is still over 1 MB. What can I do?",
        answer:
          "Nothing is saved in that case. Divide the file with PDF Split, remove unneeded pages with Delete PDF Pages, scan again at a lower resolution or in greyscale, or confirm whether the form allows a larger upload.",
      },
      {
        question: "Does anything leave my device?",
        answer:
          "Your files aren't uploaded; the rewrite runs in this tab. Visit analytics are kept apart from files: a page view goes to Umami, and to Google Analytics if it is configured, which sets no cookies until you accept the banner. When a PDF is saved under the ceiling, Umami receives a tool-run event with just two fields, tool and slug, here pdf-compress and compress-pdf-to-1mb. File names, sizes and contents are never part of it.",
      },
    ],
    related: [
      { path: "/compress-pdf-to-100kb", label: "Compress a PDF to 100 KB", note: "The tightest preset, with measured runs." },
      { path: "/compress-pdf-to-200kb", label: "Compress a PDF to 200 KB", note: "For portals with a 200 KB cap." },
      { path: "/compress-pdf-to-500kb", label: "Compress a PDF to 500 KB", note: "Half this ceiling, for single certificates." },
      { path: "/merge-pdf-without-uploading", label: "Merge PDFs without uploading", note: "Combine the documents before compressing." },
      { path: "/pdf-compress", label: "Compress PDF", note: "The parent tool, with every mode." },
      { path: "/pdf-tools", label: "All PDF tools", note: "Everything for PDFs that runs in the browser." },
    ],
  },
  {
    slug: "compress-image-to-20kb",
    seo: {
      title: "Compress Image to 20 KB for Exam & Form Photos",
      description:
        "Compress a photo or signature to 20 KB for exam and government application forms. Runs in your browser, 1 KB is 1024 bytes, and nothing is uploaded.",
      keywords: [
        "compress image to 20kb",
        "photo 20kb for exam form",
        "signature 20kb",
        "reduce photo size for application form",
        "jpeg under 20 kb",
      ],
    },
    h1: "Compress an image to 20 KB",
    footerLabel: "Image to 20 KB",
    lede: "Online exam and government application forms often want a photo or signature no larger than 20 KB. That is 20,480 bytes here. The compressor opens on that chip and writes JPEG unless you switch it to WebP. A noisy 1200 by 800 fixture had to be scaled down before it fit.",
    tools: ["image-compressor"],
    embed: { tool: "image-compressor", targetBytes: 20 * 1024 },
    measurementKey: "compress-image-to-20kb",
    howTo: {
      name: "How to compress an image to 20 KB",
      steps: [
        { title: "Select the picture", body: "PNG, JPEG, or WebP. Convert a HEIC with the HEIC to JPG page first." },
        { title: "Leave 20 KB selected", body: "The ceiling is 20480 bytes. Transparency is painted onto white before encoding." },
        { title: "Download and check the note", body: "The note reports the byte size, whether it landed under the ceiling, and any JPEG comment padding." },
      ],
    },
    sections: [
      {
        heading: "Photo and signature limits on application forms",
        body: [
          "Many online application forms, for exams, recruitment, scholarships and government services, cap the photograph at somewhere between 20 KB and 50 KB and the scanned signature at 10 KB to 20 KB. Some also set a minimum, and many fix the pixel dimensions or ask for a plain light background. The numbers differ from form to form and change between years, so check the notice for the form you are filling in rather than trusting a figure from anywhere else, including this page.",
          "For a size cap, keep the 20 KB chip or type the form's own figure into the custom box, for example 15 KB or 50 KB. For a minimum, put it in the minimum field: a JPEG that would land below it is padded with comment bytes so it clears the floor, and the note says by how much. If the form also fixes width and height, set those in the resizer first and compress the resized file, so the size search does not change the dimensions you just chose.",
          "A signature scan is usually small already once it is cropped tightly. Crop away the empty paper around the ink before compressing; less blank area means more of the byte budget goes to the strokes themselves.",
        ],
      },
      {
        heading: "Scaling is part of hitting 20 KB",
        body: [
          "A detailed photograph often cannot reach 20480 bytes by lowering JPEG quality alone. This page's fixture is 1200 by 800 noise. The measured run scaled it. Your photo may stay full size if it is already simple, or shrink if it is not. The note names the outcome.",
          "This page has no HEIC decoder, so convert an iPhone photo on the HEIC to JPG page first. There is no promise of a visually identical thumbnail. 20 KB is a small file for a camera photo.",
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
      {
        question: "What size should my exam form photo and signature be?",
        answer: "Use the figures in your form's own notice. As a general pattern, many online application forms cap photos at 20 KB to 50 KB and signatures at 10 KB to 20 KB, and some set a minimum too. Type the exact ceiling into the custom box if it is not 20 KB.",
      },
      {
        question: "My file is 20 KB here but the form still rejects it. Why?",
        answer: "This page counts 1 KB as 1024 bytes, so 20 KB is 20,480 bytes. A form that counts in thousands stops at 20,000. If you cannot tell which the form uses, type 19 KB into the custom box. That lands under both readings.",
      },
      {
        question: "Does the form portal see my photo before I upload it there?",
        answer: "No. This page compresses on your device and sends nothing. The only upload is the one you make yourself on the form's website, with the smaller file.",
      },
    ],
    related: [
      { path: "/compress-image-to-10kb", label: "Compress an image to 10 KB", note: "For a scanned signature with a tighter cap." },
      { path: "/compress-image-to-50kb", label: "Compress an image to 50 KB", note: "A 51,200-byte ceiling." },
      { path: "/compress-image-to-100kb", label: "Compress an image to 100 KB", note: "A 102,400-byte ceiling." },
      { path: "/compress-image-to-200kb", label: "Compress an image to 200 KB", note: "For document photos and larger caps." },
      { path: "/image-compressor", label: "Image Compressor", note: "The parent tool, with quality and exact-size modes." },
      { path: "/image-tools", label: "All image tools", note: "Resize, crop and convert in the browser." },
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
        { title: "Save the file the note describes", body: "Within the target means the bytes are at or under 51200 and the file is saved. Over the target means even the smallest try missed, so nothing is saved." },
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
    related: [
      { path: "/compress-image-to-10kb", label: "Compress an image to 10 KB", note: "The smallest preset, for signatures." },
      { path: "/compress-image-to-20kb", label: "Compress an image to 20 KB", note: "For exam and form photos." },
      { path: "/compress-image-to-100kb", label: "Compress an image to 100 KB", note: "Twice this ceiling." },
      { path: "/compress-image-to-200kb", label: "Compress an image to 200 KB", note: "For document photos." },
      { path: "/image-compressor", label: "Image Compressor", note: "Every ceiling, plus a JPEG quality slider." },
      { path: "/image-tools", label: "All image tools", note: "Resize, crop and convert in the browser." },
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
    related: [
      { path: "/compress-image-to-10kb", label: "Compress an image to 10 KB", note: "For signatures and thumbnails." },
      { path: "/compress-image-to-20kb", label: "Compress an image to 20 KB", note: "For exam and form photos." },
      { path: "/compress-image-to-50kb", label: "Compress an image to 50 KB", note: "Half this ceiling." },
      { path: "/compress-image-to-200kb", label: "Compress an image to 200 KB", note: "Twice this ceiling." },
      { path: "/image-compressor", label: "Image Compressor", note: "Every ceiling, plus a JPEG quality slider." },
      { path: "/image-tools", label: "All image tools", note: "Resize, crop and convert in the browser." },
    ],
  },
  {
    slug: "compress-image-to-200kb",
    seo: {
      title: "Compress Image to 200 KB for Form Photos – No Upload",
      description:
        "Aim a phone photo or document scan under 200 KB for exam, job and government forms. Runs in your browser, keeps full pixel size when it can, no upload.",
      keywords: ["compress image to 200kb", "photo under 200kb", "reduce image size to 200 kb", "jpg 200kb for form"],
    },
    h1: "Compress an image to 200 KB",
    footerLabel: "Image to 200 KB",
    lede: "200 KB is 204,800 bytes, and the compressor below opens on that chip. Some forms use it as the cap for a photo of a document, such as a certificate photographed on a phone, or for a portrait photo. If your file is already under the ceiling, the tool says so and leaves the original for you to upload.",
    tools: ["image-compressor", "image-crop", "image-resizer"],
    embed: { tool: "image-compressor", targetBytes: 200 * 1024 },
    howTo: {
      name: "How to compress an image to 200 KB",
      steps: [
        { title: "Pick the photo", body: "JPG, PNG or WebP. Convert a HEIC photo with HEIC to JPG first." },
        {
          title: "Keep 200 KB, or use 195 KB",
          body: "The chip is 204,800 bytes. If the form's 200 KB means 200,000 bytes, type 195 KB in the custom box: 199,680 bytes fits both.",
        },
        {
          title: "Check bytes and pixel size",
          body: "The note lists the original and new size in bytes, the pixel dimensions and any format change. A copy that is not smaller than your original is not saved.",
        },
      ],
    },
    sections: [
      {
        heading: "Pixel size at 200 KB",
        body: [
          "The search keeps every pixel whenever some JPEG quality fits at full size. It tries full size first, looking for the highest JPEG quality under 204,800 bytes, and only reduces the dimensions, by a quarter at a time, if no quality fits. The note prints the final width and height, so you can see whether that happened.",
        ],
      },
      {
        heading: "Already under 200 KB?",
        body: [
          "A passport-size photo or a cropped signature may already be well under the cap. Re-encoding such a file can make it bigger, not smaller, so the tool compares the two and keeps your original when the new copy is not smaller.",
          "The exception is a format you asked for. If you press JPEG or WebP and that differs from the original's format, the converted copy is saved even when it grows, and the note shows the change, for example PNG → JPEG.",
        ],
      },
      {
        heading: "Photographing a document",
        body: [
          "Lay the paper flat in even light and crop away the table around it before compressing. Background pixels cost bytes like any others, and a tight crop leaves more of the budget for the printed text. Transparent areas, if any, are filled with white.",
        ],
      },
    ],
    faqs: [
      {
        question: "Will my photo be resized to reach 200 KB?",
        answer: "Only if no JPEG quality fits at full size. Then the dimensions shrink by a quarter and the search repeats. The note shows the final pixel size.",
      },
      {
        question: "Why was nothing downloaded for my small photo?",
        answer: "Your original was already under 204,800 bytes and the new copy came out no smaller, so the tool kept the original. Upload that file as it is.",
      },
      {
        question: "Is 200 KB 200,000 or 204,800 bytes?",
        answer: "204,800 here. Type 195 KB, which is 199,680 bytes, to pass a form that counts 200 KB as 200,000.",
      },
      {
        question: "Can I compress several photos at once?",
        answer:
          "Yes. Choose more than one file and the photos that land under the ceiling are saved together in one ZIP. Any that miss the target or come out no smaller are listed in the note and left out.",
      },
      {
        question: "Are my photos uploaded?",
        answer:
          "No, your files aren't uploaded. Decoding and encoding run in this tab. The site keeps visit analytics apart from files: Umami counts a page view, Google Analytics does too when configured, without cookies unless you accept the banner, and after a file is saved Umami logs a tool-run event holding only tool and slug, here image-compressor and compress-image-to-200kb.",
      },
    ],
    related: [
      { path: "/compress-image-to-10kb", label: "Compress an image to 10 KB", note: "For signatures." },
      { path: "/compress-image-to-20kb", label: "Compress an image to 20 KB", note: "For exam and form photos." },
      { path: "/compress-image-to-50kb", label: "Compress an image to 50 KB", note: "A 51,200-byte ceiling." },
      { path: "/compress-image-to-100kb", label: "Compress an image to 100 KB", note: "Half this ceiling." },
      { path: "/image-compressor", label: "Image Compressor", note: "The parent tool, with quality and exact-size modes." },
      { path: "/image-tools", label: "All image tools", note: "Resize, crop and convert in the browser." },
    ],
  },
  {
    slug: "compress-image-to-10kb",
    seo: {
      title: "Compress Image to 10 KB for Signatures & Forms",
      description:
        "Aim a signature or small photo under 10 KB for application forms. Runs in your browser; large photos may be scaled down to fit, and nothing is uploaded.",
      keywords: ["compress image to 10kb", "signature 10kb", "photo under 10kb", "reduce signature size", "jpg 10 kb"],
    },
    h1: "Compress an image to 10 KB",
    footerLabel: "Image to 10 KB",
    lede: "10 KB is 10,240 bytes. Some application forms ask for a scanned signature or a small photo at about this size, and this page opens the compressor on the 10 KB chip. A tightly cropped signature is cheap to store; a full camera photo has to be shrunk a long way first.",
    tools: ["image-compressor", "image-resizer", "image-crop"],
    embed: { tool: "image-compressor", targetBytes: 10 * 1024 },
    howTo: {
      name: "How to compress an image to 10 KB",
      steps: [
        { title: "Crop or resize first", body: "Crop the signature close to the ink. For a photo, set the form's pixel size with the Image Resizer before compressing." },
        {
          title: "Keep the 10 KB chip, or try 9 KB",
          body: "10 KB here is 10,240 bytes. For a form that counts 10 KB as 10,000 bytes, enter 9 KB in the custom box, which is 9,216 bytes.",
        },
        { title: "Zoom in on the result", body: "The note gives bytes, pixel size and format. Check that strokes or facial features are still clear before you upload." },
      ],
    },
    sections: [
      {
        heading: "Signatures and thumbnails",
        body: [
          "A signature is mostly blank paper with thin dark lines, which JPEG stores cheaply. Once the empty margins are cropped off, the search may keep the full pixel size. A passport-size photo already at the pixel size a form asks for is in a similar position.",
        ],
      },
      {
        heading: "What 10 KB does to a camera photo",
        body: [
          "A phone photo has millions of pixels and fine texture. To fit 10,240 bytes the tool lowers JPEG quality and then reduces the dimensions by a quarter at a time, down to about 13% of each side at the lowest quality it tries. The result fits, but it can look blocky up close, and the note prints the final width and height whenever the tool had to scale.",
        ],
      },
      {
        heading: "Choosing the pixel size yourself",
        body: [
          "If the form's notice gives pixel dimensions, resize to those with the Image Resizer, then come back and compress. That way the dimensions are the ones the form asked for, not the ones the size search settled on. Check the notice each time; sizes differ between forms and from one year to the next.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is 10 KB 10,000 or 10,240 bytes here?",
        answer: "10,240. If a form counts in thousands, use 9 KB (9,216 bytes), which is under both.",
      },
      {
        question: "Why did my photo come out so small?",
        answer:
          "No JPEG quality fit 10,240 bytes at full size, so the tool reduced the dimensions until one did. The note shows the new width and height. Resize to the form's pixel size first if you want to choose them yourself.",
      },
      {
        question: "What pixel size should a signature or photo be?",
        answer: "Whatever your form's notice says. The figures vary, so this page does not suggest one. Resize to that size first, then compress.",
      },
      {
        question: "The form also sets a minimum, such as 4 KB. How do I meet it?",
        answer:
          "Type the minimum into the optional minimum field. A JPEG that would come out smaller is padded with comment bytes to clear it, and the note says how many. WebP is not padded.",
      },
      {
        question: "JPEG or WebP for an application form?",
        answer: "Use the format your form lists. JPEG is the default here; press WebP only if the form accepts it.",
      },
      {
        question: "Does my signature leave my device?",
        answer:
          "No, your files aren't uploaded. The image is decoded and re-encoded in this tab. Separately, the site counts visits: a page view in Umami, and in Google Analytics when configured, which stays cookieless unless you accept the banner. When a file is saved, Umami gets a tool-run event with only tool and slug, here image-compressor and compress-image-to-10kb.",
      },
    ],
    related: [
      { path: "/compress-image-to-20kb", label: "Compress an image to 20 KB", note: "For exam and form photos." },
      { path: "/compress-image-to-50kb", label: "Compress an image to 50 KB", note: "A 51,200-byte ceiling." },
      { path: "/compress-image-to-100kb", label: "Compress an image to 100 KB", note: "A 102,400-byte ceiling." },
      { path: "/compress-image-to-200kb", label: "Compress an image to 200 KB", note: "For document photos." },
      { path: "/image-resizer", label: "Image Resizer", note: "Set the form's pixel size before compressing." },
      { path: "/image-compressor", label: "Image Compressor", note: "The parent tool, with quality and exact-size modes." },
      { path: "/image-tools", label: "All image tools", note: "Resize, crop and convert in the browser." },
    ],
  },
  {
    slug: "webp-to-jpg",
    seo: {
      title: "WebP to JPG Converter – Free, No Upload",
      description:
        "Convert WebP to JPG in your browser. The converter opens with JPG selected, fills transparent areas with white and keeps the pixel size. Nothing is uploaded.",
      keywords: ["webp to jpg", "convert webp to jpg", "webp to jpeg", "webp converter no upload", "save webp as jpg"],
    },
    h1: "Convert WebP to JPG",
    footerLabel: "WebP to JPG",
    lede:
      "Browsers and many websites now hand out pictures as .webp, and a lot of desktop software and upload forms still turn them away. The converter below already has JPG chosen as the output: pick the WebP and download a .jpg with the same width and height.",
    tools: ["image-format-converter", "image-compressor", "image-resizer", "heic-to-jpg"],
    embed: { tool: "image-format-converter", output: "image/jpeg" },
    howTo: {
      name: "How to convert WebP to JPG",
      steps: [
        { title: "Pick the .webp file", body: "Drop it on the box or browse to it. Your browser decodes it inside this tab." },
        { title: "Keep JPEG as the output", body: "This page opens with JPEG selected. PNG and WebP are still in the menu if you change your mind." },
        { title: "Download the JPG", body: "The file keeps its original name with a .jpg extension and is written at quality 0.92." },
      ],
    },
    sections: [
      {
        heading: "Where the WebP files come from",
        body: [
          "Right-clicking an image and choosing Save often produces a .webp now, because sites serve WebP to any browser that asks for it. Phone screenshots shared through some chat apps arrive the same way. The file is fine; the problem is the next program in the chain. An older photo editor, a print kiosk, a job portal or a council form may only list JPG and PNG.",
          "JPG is the safe interchange choice for a photograph. Every operating system previews it, every form that accepts pictures accepts it, and every printer driver understands it.",
        ],
      },
      {
        heading: "What changes inside the file",
        body: [
          "The WebP is drawn onto a canvas at its natural size and encoded again as JPEG at quality 0.92. JPEG cannot store transparency, so this converter paints a white background first. Without that step the transparent pixels would come out black, which is what a bare canvas export does.",
          "Expect the JPG to be somewhat larger than the WebP. When one photograph was encoded both ways at 0.92 for the format converter's measurements, the JPEG came out about 22 percent heavier. If a form has a size cap as well as a format rule, run the JPG through the compressor afterwards.",
          "Only pixels survive the trip. EXIF fields such as camera model and GPS position are not written into the JPG, and an animated WebP becomes a still of its first frame.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is the WebP uploaded to convert it?",
        answer:
          "No. Decoding and encoding both happen in your browser's canvas. You can load the page, switch off the network, and the conversion still completes, which a server-based converter could not do.",
      },
      {
        question: "Why did my transparent WebP get a white background?",
        answer:
          "JPG has no alpha channel, so something has to fill the see-through areas. White is what most people expect on a document or form. If you need the transparency kept, switch the output to PNG instead.",
      },
      {
        question: "Will the JPG lose quality compared with the WebP?",
        answer:
          "A little, in principle, because every lossy encode discards some detail. At quality 0.92 the difference is very hard to see on a photograph. Converting does not recover anything the WebP encoder already removed.",
      },
      {
        question: "Can I convert a folder of WebP images at once?",
        answer:
          "Not on this page. The converter handles one picture per download, which suits the usual case of a single image a form refused. For many files, a desktop batch tool will be quicker.",
      },
      {
        question: "Does an animated WebP stay animated?",
        answer:
          "No. The picture is drawn once, so only the first frame becomes the JPG. JPG has no animation support of its own.",
      },
    ],
    related: [
      { path: "/image-format-converter", label: "Image format converter", note: "The same tool with every direction between PNG, JPG and WebP" },
      { path: "/heic-to-jpg", label: "HEIC to JPG", note: "For iPhone photos, which this converter cannot decode" },
      { path: "/compress-image-to-20kb", label: "Compress an image to 20 KB", note: "When the form also caps the file size" },
      { path: "/image-tools", label: "All image tools", note: "Resize, crop, compress and convert in the browser" },
    ],
    palette: {
      name: "WebP to JPG",
      description: "Convert a WebP image to JPG",
      keywords: ["webp", "jpg", "jpeg", "convert", "webp to jpg"],
      icon: "Repeat",
      category: "Image Tools",
    },
  },
  {
    slug: "heic-to-png",
    seo: {
      title: "HEIC to PNG Converter – Lossless, No Upload",
      description:
        "Convert iPhone HEIC photos to PNG in your browser. The decoder runs on your device, photos stay upright, and a batch saves as one ZIP. Nothing is uploaded.",
      keywords: ["heic to png", "convert heic to png", "iphone photo to png", "heif to png", "heic to png no upload"],
    },
    h1: "Convert HEIC to PNG",
    footerLabel: "HEIC to PNG",
    lede:
      "PNG is the choice when an iPhone photo is going into an editor rather than an email. The converter below opens with PNG selected, decodes each HEIC with a WebAssembly build of libheif in this tab, and writes a lossless PNG of the result.",
    tools: ["heic-to-jpg", "image-format-converter", "image-compressor", "images-to-pdf"],
    embed: { tool: "heic-to-jpg", format: "png" },
    howTo: {
      name: "How to convert HEIC to PNG",
      steps: [
        { title: "Drop the HEIC photos", body: "One file or a batch. Each is checked by its first bytes, so a renamed JPEG is reported rather than converted." },
        { title: "Leave PNG selected", body: "This page starts on PNG. The JPG button is there if a smaller file matters more than editing headroom." },
        { title: "Save each PNG or a ZIP", body: "Every row has its own download. With two or more finished, one button stores them all in a ZIP." },
      ],
    },
    sections: [
      {
        heading: "When PNG beats JPG for an iPhone photo",
        body: [
          "A HEIC is already lossy. Turning it into JPG adds a second, small round of loss, and every later save in an editor adds another. PNG adds none: the pixels the decoder produced are stored exactly, so retouching, cropping and saving repeatedly never degrades the picture further.",
          "That makes PNG the right intermediate for design work, for compositing, and for software that predates HEIC. It is the wrong format for sharing or for an upload form, where JPG does the same job at a fraction of the size.",
        ],
      },
      {
        heading: "How large the PNG gets",
        body: [
          "Measured on the files used for the HEIC converter: a 1280 by 854 photo of 718,114 bytes became a PNG of 2,302,195 bytes, a little over three times the original. A full 3992 by 2992 camera photo of 2,994,394 bytes became 22,586,663 bytes, about seven and a half times larger. Plan for that before converting a whole camera roll.",
          "Rotation is applied while decoding, so portrait shots come out portrait. Camera EXIF, including GPS position and capture time, is not copied into the PNG, and Live Photo motion stays behind in the original.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is HEIC to PNG lossless?",
        answer:
          "The PNG step is. It stores the decoded pixels exactly. The HEIC itself was compressed with loss when the camera saved it, and nothing can restore that, but converting to PNG adds no further loss.",
      },
      {
        question: "Why is the PNG so much bigger than the HEIC?",
        answer:
          "HEVC compression in a HEIC is very efficient for photographs, while PNG is designed for exact reproduction. On a 12 megapixel test photo the PNG was about seven and a half times the size of the HEIC.",
      },
      {
        question: "Are my photos uploaded?",
        answer:
          "No. The decoder is fetched from this site once, then runs in a worker inside your tab. With it cached, the conversion works in flight mode.",
      },
      {
        question: "Can I switch some photos to JPG instead?",
        answer:
          "Yes. Press JPG and the list is redone with the quality slider setting. Press PNG again to go back. The setting applies to every row at once.",
      },
    ],
    related: [
      { path: "/heic-to-jpg", label: "HEIC to JPG", note: "The full converter page, with measurements for both outputs" },
      { path: "/webp-to-jpg", label: "WebP to JPG", note: "For WebP images a form or program will not accept" },
      { path: "/image-format-converter", label: "Image format converter", note: "Move the PNG on to WebP or JPG later" },
      { path: "/image-tools", label: "All image tools", note: "Every image page on this site" },
    ],
    palette: {
      name: "HEIC to PNG",
      description: "iPhone HEIC photos to lossless PNG",
      keywords: ["heic", "heif", "png", "iphone", "heic to png", "convert"],
      icon: "Smartphone",
      category: "Image Tools",
    },
  },
  {
    slug: "remove-password-from-bank-statement-pdf",
    seo: {
      title: "Remove Password from Bank Statement PDF, No Upload",
      description:
        "Unlock a bank or credit card statement PDF with the password you already have, inside your browser. Nothing is uploaded, and unknown passwords are not cracked.",
      keywords: [
        "remove password from bank statement pdf",
        "unlock bank statement pdf",
        "credit card statement pdf password remove",
        "bank statement pdf password",
        "unlock statement pdf no upload",
      ],
    },
    h1: "Remove the password from a bank statement PDF",
    footerLabel: "Unlock a bank statement PDF",
    lede:
      "Statements from banks and card issuers often arrive as password-protected PDFs. If you know the password, the tool below opens the file once and saves a copy that no longer asks for it. It runs in this tab, and it does not guess passwords you do not have.",
    tools: ["pdf-unlock", "pdf-merge", "pdf-encrypt", "pdf-compress"],
    embed: { tool: "pdf-unlock" },
    howTo: {
      name: "How to remove the password from a statement PDF",
      steps: [
        { title: "Choose the statement", body: "Pick the PDF your bank or card issuer sent. The page reports whether it needs a password to open." },
        { title: "Type the password you were given", body: "Enter it exactly as the bank's email or website describes. One attempt is made per press." },
        { title: "Download the unlocked copy", body: "A new file ending in -unlocked is saved. It opens in any viewer without a prompt." },
      ],
    },
    sections: [
      {
        heading: "Where the statement password usually comes from",
        body: [
          "Banks set these passwords so a statement sent by email is not readable by whoever else sees the inbox. The password is often built from details the bank already holds about you: a date of birth written in a fixed pattern, the first letters of your name, or part of a customer ID, PAN or account number. Some combine two of those.",
          "The exact rule varies by bank and sometimes by statement type, so read the instructions rather than guessing. They are normally in the email that carried the PDF, on the statement page of your online banking, or in the bank's help pages. Unlocking on your own device is useful when you need the file in a tool that cannot handle encryption: an accounting package, a loan or visa application portal, or a merge with other months.",
        ],
      },
      {
        heading: "What this page will not do",
        body: [
          "It will not find a password you do not know. There is no wordlist, no list of common bank formats, and no repeated guessing. A wrong entry fails once and nothing else is tried. If the format escapes you, your bank can tell you how its statement passwords are formed.",
          "Once unlocked, the copy is an ordinary PDF that anyone can open. Store it where you keep other financial records, and if you need to send it on, consider protecting it again with a password of your own on the Encrypt PDF page.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the password for my bank statement PDF?",
        answer:
          "Only your bank can say for certain, and this page has no way to look it up. It is often a combination such as your date of birth with part of your name, or a customer ID or PAN. The email or online banking page that delivered the statement normally explains the format.",
      },
      {
        question: "Can this crack the password if I have forgotten it?",
        answer:
          "No. The tool makes exactly one attempt with the password you type. It cannot recover, search for, or bypass an unknown password. Ask the bank to explain the format, or download a fresh copy from online banking.",
      },
      {
        question: "Is my statement or password sent anywhere?",
        answer:
          "No. The PDF and the password are used only by code running in this tab. The password is not stored or sent to analytics. Open your browser's network panel while unlocking and you will see no upload.",
      },
      {
        question: "Can I combine a year of statements into one PDF?",
        answer:
          "Yes. Unlock each month here first, because the merge tool cannot read an encrypted file. Then put the unlocked copies through [PDF Merge](/pdf-merge) in date order.",
      },
      {
        question: "Will the unlocked copy be accepted wherever the original was?",
        answer:
          "The pages and text are identical. If the statement carries a digital signature, though, rewriting the file means that signature will no longer validate. Keep the original locked PDF for anyone who needs to verify it.",
      },
    ],
    related: [
      { path: "/pdf-unlock", label: "Unlock PDF", note: "The general tool, including owner restrictions on files that already open" },
      { path: "/merge-pdf-without-uploading", label: "Merge PDFs without uploading", note: "Join several unlocked statements" },
      { path: "/compress-pdf-to-200kb", label: "Compress a PDF to 200 KB", note: "For portals that cap the upload size" },
      { path: "/pdf-tools", label: "All PDF tools", note: "Every PDF page on this site" },
    ],
    palette: {
      name: "Unlock bank statement PDF",
      description: "Remove a statement password you already know",
      keywords: ["bank", "statement", "credit card", "pdf", "password", "unlock", "remove"],
      icon: "LockOpen",
      category: "PDF Tools",
    },
  },
  {
    slug: "jpg-to-pdf",
    seo: {
      title: "JPG to PDF Converter – JPEGs Kept As-Is, No Upload",
      description:
        "Turn JPG photos into one PDF in your browser. Each JPEG goes onto its own page byte for byte, without re-encoding, and files that are not JPEG are named and refused.",
      keywords: ["jpg to pdf", "jpeg to pdf", "convert jpg to pdf", "jpg to pdf without uploading", "jfif to pdf"],
    },
    h1: "Convert JPG to PDF",
    footerLabel: "JPG to PDF",
    lede:
      "This page takes JPEG files only. Each photo you add is checked by its first bytes, placed on a page the size of the photo, and copied into images_combined.pdf without being decoded and saved again, so every page is exactly as sharp as the original file.",
    tools: ["images-to-pdf", "image-compressor", "heic-to-jpg", "pdf-compress"],
    embed: { tool: "images-to-pdf", input: "jpeg" },
    howTo: {
      name: "How to convert JPG to PDF",
      steps: [
        {
          title: "Add the JPG files",
          body: "Drop them on the box or browse. A file counts as JPEG when its first three bytes are FF D8 FF, so .jfif and .jpe files and files with a blank type are taken, while a PNG renamed to .jpg is turned away by name.",
        },
        {
          title: "Arrange the thumbnails",
          body: "The number on each thumbnail is its page number. Drag a thumbnail onto another to move it, or hover over it and press × to take it out.",
        },
        {
          title: "Press Create PDF",
          body: "Your browser saves images_combined.pdf with one page per photo, in thumbnail order. Leave the size box empty to keep every JPEG byte for byte.",
        },
      ],
    },
    sections: [
      {
        heading: "What happens to each JPEG",
        body: [
          "A PDF can hold JPEG data untouched, because its DCT filter is the same compression a .jpg file uses. The pdf-lib library reads the photo's width, height and colour channels from its header and copies the compressed data into the document unchanged. Nothing is decoded and encoded again, so there is no extra round of loss, and building the file takes very little time.",
          "Each page is made exactly as many points wide and high as the photo has pixels. A 12 megapixel phone picture of 4000 by 3000 pixels therefore becomes a page about 55 by 42 inches. PDF viewers zoom it to fit the window, and printing with Fit to page brings it down to paper size, but it is the reason the pages are not A4.",
        ],
      },
      {
        heading: "Phone photos that come out sideways",
        body: [
          "Phones often store a portrait photo as landscape pixels plus an EXIF orientation tag telling viewers to turn it. This tool does not read that tag. The stored pixels go onto the page as they are, and the page takes their landscape shape. The thumbnail may still look upright, because browsers apply the tag when they display a picture.",
          "If a page arrives turned on its side, fix it afterwards with Rotate PDF, or rotate the photo in an editor and save it before adding it here.",
        ],
      },
      {
        heading: "When the PDF has to stay under a size",
        body: [
          "The optional box under the thumbnails takes a ceiling such as 500 KB. With it filled in, every photo is decoded and written again as a smaller JPEG to fit its share of the budget, so this is the one path where pixels change. If the finished file is still over the ceiling, a message says how large it came out. 1 KB here means 1024 bytes.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does the JPG lose quality inside the PDF?",
        answer:
          "Not while the size box is empty. The JPEG data is copied into the PDF unchanged, so each page shows exactly the pixels of its photo. Only a size ceiling makes the tool encode the pictures again.",
      },
      {
        question: "Why was my file rejected as not a JPG?",
        answer:
          "The check reads the start of the file, not its name. A screenshot saved as PNG and renamed .jpg begins with the PNG signature, so it is refused and named in the status line above the thumbnails. Images to PDF accepts a mix of formats and converts the others for you.",
      },
      {
        question: "Can I add .jfif or .jpeg files?",
        answer:
          "Yes. .jpeg, .jfif and .jpe are the same format under other names, and the file picker offers them. A JPEG whose type your browser reports as blank is accepted as well, because the bytes decide.",
      },
      {
        question: "What page size will the PDF have?",
        answer:
          "Each page matches its photo, one point per pixel, so pages from different cameras come out different sizes. To print evenly, resize the photos to the same dimensions first or choose Fit to page in the print dialog.",
      },
      {
        question: "Are my photos uploaded to make the PDF?",
        answer:
          "No. The photos are read and assembled into the PDF inside this tab. The site does collect visit analytics, which is separate from your files: a page view when the page opens, and, after a PDF is created, an Umami event named tool-run whose only fields are tool and slug, here images-to-pdf and jpg-to-pdf. Neither carries file names, sizes or contents.",
      },
    ],
    related: [
      { path: "/images-to-pdf", label: "Images to PDF", note: "The same converter without the JPG lock, for JPG, PNG and WebP together" },
      { path: "/png-to-pdf", label: "PNG to PDF", note: "For screenshots and diagrams saved as PNG" },
      { path: "/pdf-to-jpg", label: "PDF to JPG", note: "The opposite direction, pages back out as photos" },
      { path: "/heic-to-jpg", label: "HEIC to JPG", note: "Turn iPhone photos into JPEGs before adding them here" },
      { path: "/compress-pdf-to-100kb", label: "Compress a PDF to 100 KB", note: "When the finished PDF meets an upload limit" },
      { path: "/pdf-tools", label: "All PDF tools", note: "Every PDF page on this site" },
    ],
  },
  {
    slug: "png-to-pdf",
    seo: {
      title: "PNG to PDF Converter – Lossless Pages, No Upload",
      description:
        "Put PNG screenshots and diagrams into one PDF in your browser. Pixels are stored losslessly, transparency is kept as a mask, and files that are not PNGs are refused.",
      keywords: ["png to pdf", "convert png to pdf", "screenshot to pdf", "png to pdf without uploading", "transparent png to pdf"],
    },
    h1: "Convert PNG to PDF",
    footerLabel: "PNG to PDF",
    lede:
      "Screenshots, diagrams and scanned line art are usually PNGs, and this page accepts PNG files only. Each one is decoded, stored in the PDF with lossless compression on a page the size of the image, and saved with the rest as images_combined.pdf.",
    tools: ["images-to-pdf", "image-format-converter", "image-compressor", "pdf-compress"],
    embed: { tool: "images-to-pdf", input: "png" },
    howTo: {
      name: "How to convert PNG to PDF",
      steps: [
        {
          title: "Add the PNG files",
          body: "A file is accepted when it begins with the eight-byte PNG signature. A JPEG renamed to .png is refused, and the line above the thumbnails names it.",
        },
        {
          title: "Set the page order",
          body: "Pages follow the numbered badges. Drag one thumbnail over another to change places; hover a thumbnail and press × to remove it.",
        },
        {
          title: "Create the PDF",
          body: "Leave the size box blank so nothing is turned into JPEG, then press Create PDF. images_combined.pdf downloads with one page per PNG.",
        },
      ],
    },
    sections: [
      {
        heading: "How a PNG is stored in the PDF",
        body: [
          "A PNG cannot be dropped into a PDF as it is, the way a JPEG can, because PDF has no PNG filter. pdf-lib decodes each file to 8-bit red, green, blue and alpha values and writes the colour into the document with Flate, the same deflate compression PNG uses inside. The picture on the page matches the decoded pixels exactly.",
          "Two side effects follow. A 16-bit PNG, as some scientific and photo-editing exports are, is reduced to 8 bits per channel. A palette PNG, the compact kind with 256 colours or fewer, is expanded to full colour, so its page can take noticeably more bytes than the original file. An animated PNG stops the conversion with the message Animated PNGs are not supported.",
        ],
      },
      {
        heading: "Transparent areas",
        body: [
          "If any pixel is less than fully opaque, the alpha values are written into the PDF as a soft mask next to the colour, so see-through areas stay see-through. Nothing is painted behind them; what shows there is whatever the PDF viewer draws under the page, which in most viewers is white. A PNG with no transparent pixels gets no mask at all.",
        ],
      },
      {
        heading: "PNG or JPG for this PDF",
        body: [
          "For screenshots, text and flat colour, PNG keeps edges crisp. For photographs it usually makes a far heavier PDF than the same pictures as JPEG, so convert those with the image format converter and use JPG to PDF instead.",
          "The optional size box turns every page into JPEG to reach its ceiling, which undoes the reason for choosing PNG. Use it only when the size limit matters more than exact pixels.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is PNG to PDF lossless?",
        answer:
          "For ordinary 8-bit PNGs, yes: the decoded pixels are stored with lossless compression. There are two exceptions. A 16-bit image is reduced to 8 bits per channel, and filling in the size ceiling re-encodes every picture as JPEG.",
      },
      {
        question: "Does transparency survive in the PDF?",
        answer:
          "Yes. Partly or fully transparent pixels are written as a soft mask, so nothing is filled in. The PDF adds no background colour of its own; most viewers show a white page underneath.",
      },
      {
        question: "Why is the PDF bigger than my PNG files?",
        answer:
          "PNG encoders choose a prediction filter for each row and often use a colour palette. The PDF stores plain 8-bit colour with deflate and neither of those tricks, so screenshots with few colours grow the most.",
      },
      {
        question: "My file was rejected as not a PNG. Why?",
        answer:
          "Its first bytes are not the PNG signature. Phone photos and many web downloads are JPEG or WebP even when they are named .png. Use JPG to PDF for JPEGs, or Images to PDF for a mix of formats.",
      },
      {
        question: "Do my screenshots leave the device?",
        answer:
          "No. Decoding and building the PDF both run in this tab. What the site does send is visit analytics: a page view when the page loads, and an Umami event called tool-run once a PDF has been made, with only two fields, tool and slug, here images-to-pdf and png-to-pdf. File names, sizes and contents are not part of either.",
      },
    ],
    related: [
      { path: "/images-to-pdf", label: "Images to PDF", note: "Mix PNG, JPG and WebP in one document" },
      { path: "/jpg-to-pdf", label: "JPG to PDF", note: "For photographs, embedded without re-encoding" },
      { path: "/pdf-to-png", label: "PDF to PNG", note: "Turn PDF pages back into lossless PNGs" },
      { path: "/image-format-converter", label: "Image format converter", note: "Switch a photo from PNG to JPG before building the PDF" },
      { path: "/compress-pdf-to-200kb", label: "Compress a PDF to 200 KB", note: "When a portal caps the upload size" },
      { path: "/pdf-tools", label: "All PDF tools", note: "Every PDF page on this site" },
    ],
  },
  {
    slug: "pdf-to-jpg",
    seo: {
      title: "PDF to JPG Converter – Pick the Quality, No Upload",
      description:
        "Turn PDF pages into JPG images in your browser. Set JPEG quality from 50 to 100 and 72, 144 or 288 dpi, convert a page range, then save single pages or one ZIP.",
      keywords: ["pdf to jpg", "convert pdf to jpg", "pdf to jpeg", "pdf page to jpg", "pdf to jpg without uploading"],
    },
    h1: "Convert PDF to JPG",
    footerLabel: "PDF to JPG",
    lede:
      "The converter below has JPG fixed as the output, so the only choices are how sharp and how compressed. Pages are drawn by pdf.js inside this tab, encoded as JPEG, and offered one at a time or together in a ZIP.",
    tools: ["pdf-to-images", "pdf-split", "image-compressor", "pdf-compress"],
    embed: { tool: "pdf-to-images", output: "jpeg" },
    howTo: {
      name: "How to convert PDF to JPG",
      steps: [
        {
          title: "Choose the PDF",
          body: "Its page count appears as soon as the file is read, so you know which page numbers are valid.",
        },
        {
          title: "Set quality, scale and pages",
          body: "Quality starts at 90 and moves in steps of 5 between 50 and 100. Scale is 1x, 2x or 4x, with 2x preselected. Type a range such as 1-3, 7 or leave it as all.",
        },
        {
          title: "Convert and save",
          body: "Press Convert to Images. Each page gets a Download button and a name like report_page_3.jpg, and Download ZIP packs them all into report_images.zip.",
        },
      ],
    },
    sections: [
      {
        heading: "What scale means in pixels",
        body: [
          "A PDF measures pages in points, 72 to the inch. At 1x a page gets one pixel per point, so an A4 page of 595 by 842 points becomes an image about 595 by 842 pixels. 2x doubles both sides to roughly 1190 by 1684, and 4x gives about 2380 by 3368. US Letter at 2x is 1224 by 1584. Each step up multiplies the pixel count by four, and the memory needed with it.",
          "For reading on a screen or pasting into a document, 2x is plenty. Pick 4x for printing or for small print you need to zoom into, and convert long files a page range at a time.",
        ],
      },
      {
        heading: "Quality, and what it costs",
        body: [
          "The quality number is handed straight to the browser's JPEG encoder. Lower values give smaller files with softer edges around lettering; at 90 most pages are hard to tell from the PDF on screen. The setting applies to every page in a run, and converting again replaces the previous set, so try another value if the first result is too heavy.",
        ],
      },
      {
        heading: "What a JPG of a page is not",
        body: [
          "The result is a picture. Text in it cannot be selected or searched, and links and form fields stop working. Pages are drawn onto a white background, so any transparent part of the PDF comes out white. If you need the words rather than an image of them, PDF to Text copies them out.",
        ],
      },
    ],
    faqs: [
      {
        question: "What JPEG quality should I use?",
        answer:
          "Start with the default of 90. Move toward 70 if the images are going by email or chat and size matters, and use 100 only if you will edit the pages further. The slider covers 50 to 100.",
      },
      {
        question: "How do I convert just one page?",
        answer:
          "Type its number in the page range box, for example 4. Ranges and lists work too, like 2-5, 9. Numbers outside the document are skipped, and if nothing valid remains the tool asks for a valid range.",
      },
      {
        question: "What are the JPG files called?",
        answer:
          "Each one keeps the PDF's name plus its page number in the original document, such as invoice_page_2.jpg. The ZIP is named after the PDF as well, as invoice_images.zip.",
      },
      {
        question: "Can I get PNG instead?",
        answer:
          "Not on this page; JPG is locked so it cannot change between runs. PDF to PNG has the same controls with PNG output, and PDF to Images lets you switch between the two.",
      },
      {
        question: "Is the PDF uploaded to convert it?",
        answer:
          "No. pdf.js renders the pages in this tab and the browser encodes them. Separately, the visit is counted: a page view when the page loads, and once a conversion finishes, an Umami event named tool-run that holds only tool and slug, here pdf-to-images and pdf-to-jpg. It is sent when the images are ready, not on download, and includes no file name, page count or content.",
      },
    ],
    related: [
      { path: "/pdf-to-images", label: "PDF to Images", note: "The same converter with a JPG or PNG choice" },
      { path: "/pdf-to-png", label: "PDF to PNG", note: "Lossless page images for diagrams and editing" },
      { path: "/jpg-to-pdf", label: "JPG to PDF", note: "Put photos back into a single PDF" },
      { path: "/compress-image-to-100kb", label: "Compress an image to 100 KB", note: "When one page image is still too big for a form" },
      { path: "/pdf-tools", label: "All PDF tools", note: "Every PDF page on this site" },
    ],
  },
  {
    slug: "pdf-to-png",
    seo: {
      title: "PDF to PNG Converter – Lossless Page Images, Free",
      description:
        "Save PDF pages as PNG images in your browser: lossless pixels at 72, 144 or 288 dpi, a page range, single downloads or one ZIP. Your PDF never leaves this tab.",
      keywords: ["pdf to png", "convert pdf to png", "pdf page to png", "pdf to png high resolution", "pdf to png without uploading"],
    },
    h1: "Convert PDF to PNG",
    footerLabel: "PDF to PNG",
    lede:
      "PNG output keeps every rendered pixel exactly, which is what you want for diagrams, line art and pages you will edit again. The converter below has PNG fixed, so there is no quality slider: choose the scale and the pages, then save.",
    tools: ["pdf-to-images", "pdf-to-text", "image-crop", "pdf-split"],
    embed: { tool: "pdf-to-images", output: "png" },
    howTo: {
      name: "How to convert PDF to PNG",
      steps: [
        {
          title: "Open the PDF",
          body: "The page count is read first, so the range box knows its limits.",
        },
        {
          title: "Pick a scale and the pages",
          body: "2x is preselected; 4x doubles each side again for print work. Leave the range as all, or list pages like 1, 4-6.",
        },
        {
          title: "Convert, then save",
          body: "Convert to Images draws each page and shows a preview. Download saves one page as name_page_N.png; Download ZIP saves them all as name_images.zip.",
        },
      ],
    },
    sections: [
      {
        heading: "Why PNG pages get large",
        body: [
          "PNG compresses without throwing anything away, which suits flat colour and sharp edges, but it stores every pixel of the page, white margins included. In measurements taken for the general converter, a 40 page text PDF of 165,897 bytes turned into 25,256,591 bytes of PNG at 2x, and a 12 page scan produced 23,899,262 bytes as PNG against 3,006,308 as JPEG at quality 90.",
          "If the images are for sending rather than editing, PDF to JPG will give you much smaller files.",
        ],
      },
      {
        heading: "Backgrounds and transparency",
        body: [
          "pdf.js fills the canvas with white before it draws a page, and this converter keeps that default. Even a PDF with transparent areas therefore produces opaque PNGs on white. A cut-out with real transparency has to be made in an image editor afterwards.",
        ],
      },
      {
        heading: "Choosing the scale for PNG",
        body: [
          "Scale multiplies the PDF's 72 points per inch: 1x is 72 dpi, 2x is 144 and 4x is 288. For slides or a web page, 2x stays crisp on high-density screens. 4x is for printing diagrams or reading fine print, and holds sixteen times the pixels of 1x, which PNG stores in full.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is PDF to PNG lossless?",
        answer:
          "The PNG step is: the pixels pdf.js draws are saved exactly. The drawing step turns vector text and shapes into a fixed grid of pixels at the scale you chose, so a higher scale keeps more detail.",
      },
      {
        question: "Will the PNG have a transparent background?",
        answer:
          "No. Pages are drawn onto white, so the images are opaque even where the PDF page is empty.",
      },
      {
        question: "Why is there no quality setting?",
        answer:
          "PNG has no quality level to pick; it is always lossless. File size depends on the scale and on how busy the page is. For a smaller file, use PDF to JPG.",
      },
      {
        question: "How do I save every page at once?",
        answer:
          "After converting, press Download ZIP. The archive holds one PNG per converted page, numbered by its position in the original document, so a range of 5-8 gives page 5 to page 8 rather than 1 to 4.",
      },
      {
        question: "Does the PDF get sent anywhere?",
        answer:
          "No. Rendering and PNG encoding happen in this tab. Apart from your file, the site sends visit analytics: a page view on load, and when conversion completes, an Umami event named tool-run carrying just tool and slug, here pdf-to-images and pdf-to-png. No file name, page count or page content is included.",
      },
    ],
    related: [
      { path: "/pdf-to-images", label: "PDF to Images", note: "The same converter with a JPG or PNG choice" },
      { path: "/pdf-to-jpg", label: "PDF to JPG", note: "Much smaller page images for sharing" },
      { path: "/png-to-pdf", label: "PNG to PDF", note: "Put PNG images back into one PDF" },
      { path: "/pdf-to-text", label: "PDF to Text", note: "Copy the words instead of a picture of them" },
      { path: "/pdf-tools", label: "All PDF tools", note: "Every PDF page on this site" },
    ],
  },
];

export const LANDING_PAGE_PATHS = LANDING_PAGES.map((page) => `/${page.slug}`);

export function findLandingPage(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((page) => page.slug === slug);
}
