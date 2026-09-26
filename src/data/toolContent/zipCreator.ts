import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S1 } from "./shared";

/**
 * Tier A content for /zip-creator, written against "zip files online".
 *
 * The compression figures here only became true when the tool was fixed: it was
 * calling JSZip's generateAsync with no compression option, and the default is
 * STORE. See docs/CONTENT_FIXTURES.md.
 */
export const zipCreatorContent: Partial<ToolPageContent> = {
  tier: "A",

  seo: {
    title: "Zip Files Online: Make a ZIP in Your Browser",
    description:
      "Bundle several files into one compressed ZIP archive without uploading them. Text compresses by about 83 percent. Free, no account, no file size ceiling.",
    keywords: [
      "zip files online",
      "create zip file online",
      "make a zip archive",
      "zip files without uploading",
      "compress files into zip",
      "zip files in browser",
      "combine files into one zip",
    ],
  },

  hero: {
    h1: "Create a ZIP File Online",
    subtitle:
      "Pick several files and get back one compressed archive, built in this tab. Text and documents shrink substantially. Photos and PDFs will not, and this page is straightforward about which is which.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose files to zip", action: "upload" },
  },

  intro: {
    heading: "What compression actually buys you, and when it buys nothing",
    paragraphs: [
      "Building an archive here reads each file you picked, runs its bytes through DEFLATE at level 6, and writes the compressed results into one container with a directory at the end recording what went where. DEFLATE works by finding repeated sequences and replacing later copies with a short reference back to the first. That is why it does so well on text: prose, source code, CSV exports and log files repeat words, indentation and punctuation constantly. Three plain text files totalling 167,472 bytes came out as a 27,859 byte archive, a saving of 83.4 percent, in 17 milliseconds.",
      "It is also why it does nothing for a folder of photographs. A JPEG, a PNG, a PDF containing images, an MP4 and an existing ZIP have all already had their redundancy removed by a codec designed for exactly that data, and there is no repetition left for a general-purpose algorithm to find. A JPEG and two PDFs totalling 2,273,612 bytes produced an archive of 2,269,170 bytes: a 0.2 percent saving for 101 milliseconds of effort. Zipping those files is still worth doing, because one attachment is easier to send than three, but expecting it to make them smaller is the most common misunderstanding about archives.",
    ],
  },

  features: [
    {
      icon: "Layers",
      title: "Many files, one attachment",
      body: "Select everything in one go and get a single archive back. This is the actual reason most people zip things: mail clients and upload forms deal far better with one file than with fifteen.",
    },
    {
      icon: "Minimize2",
      title: "Real compression, not just bundling",
      body: "DEFLATE at level 6, the same setting zlib uses by default. Text-shaped data typically loses four fifths of its size, which is the difference between an archive being useful and being a container.",
    },
    {
      icon: "Check",
      title: "Duplicate names handled",
      body: "Two files called report.pdf from different folders both go in, with the second renamed report (1).pdf rather than silently overwriting the first.",
    },
    {
      icon: "CloudOff",
      title: "Nothing is uploaded to be zipped",
      body: "The archive is assembled in the page from files read off your disk. For anything confidential this is the difference between a two-minute task and a conversation with whoever owns the data policy.",
    },
  ],

  howItWorks: [
    {
      title: "Select your files",
      body: "Click Add Files and choose as many as you like, in one selection or several. Each one appears in a list so you can check the archive will contain what you expect.",
    },
    {
      title: "Review the list",
      body: "Remove anything that should not be in there. Names are made unique automatically, so adding two files with the same name is safe rather than destructive.",
    },
    {
      title: "Create and download",
      body: "Press Create ZIP. The archive is compressed in the tab and saved as archive.zip. Nothing is uploaded at any point and nothing is kept once the tab closes.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "Three text documents",
      description: "The case where compression earns its keep.",
      before: { label: "Input", detail: "3 plain text files, 167,472 bytes total" },
      after: { label: "archive.zip", detail: "27,859 bytes, 83.4% smaller, 17 ms" },
      settings: "DEFLATE, level 6",
      explanation:
        "Text repeats itself constantly, so most of the file can be replaced with references to earlier occurrences. Source code, CSV exports and log files behave the same way and see similar savings.",
    },
    {
      kind: "file",
      title: "A photo and two PDFs",
      description: "The case people expect to work and it does not.",
      before: { label: "Input", detail: "1 JPEG and 2 PDFs, 2,273,612 bytes total" },
      after: { label: "archive.zip", detail: "2,269,170 bytes, 0.2% smaller, 101 ms" },
      settings: "DEFLATE, level 6",
      explanation:
        "These formats are already compressed by codecs built for their own data, so there is nothing left for DEFLATE to remove. The archive is still one file instead of three, which is usually the real goal.",
    },
  ],

  measurements: {
    method: MEASURED_S1,
    rows: [
      {
        scenario: "three plain text files",
        input: "167,472 bytes",
        output: "27,859 bytes",
        timing: "17 ms",
        note: "83.4% smaller",
      },
      {
        scenario: "a JPEG and two PDFs, all already compressed",
        input: "2,273,612 bytes",
        output: "2,269,170 bytes",
        timing: "101 ms",
        note: "0.2% smaller, and that is expected",
      },
    ],
  },

  scenarios: {
    items: [
      {
        question: "How do I zip files to attach to an email?",
        answer:
          "Add them all and create the archive. Whether it gets under an attachment limit depends entirely on what the files are: a folder of documents usually will, a folder of photographs almost certainly will not, because photos are already compressed.",
      },
      {
        question: "How do I zip files on a Chromebook?",
        answer:
          "This page does it without anything installed. ChromeOS can create archives from the Files app, but on a managed device that is sometimes restricted, and a browser tab is not.",
      },
      {
        question: "How do I combine files without compressing them?",
        answer:
          "That is not offered here, and for most inputs it does not matter: already-compressed files come out essentially unchanged anyway. Compression is applied uniformly because the cost on incompressible data is milliseconds.",
      },
      {
        question: "How do I zip a whole folder?",
        answer:
          "Select the files inside it. The picker takes files rather than directories, so a deep folder tree is better handled by your operating system's own right-click option, which preserves the structure.",
      },
    ],
  },

  useCases: [
    {
      icon: "Mail",
      audience: "Sending a batch of documents",
      body: "One attachment instead of twelve, and for text-shaped documents a much smaller one. The recipient gets a single file that every operating system can open without extra software.",
    },
    {
      icon: "Briefcase",
      audience: "Handing over confidential material",
      body: "Contracts, HR files and financial records get bundled before they are sent. Building the archive locally means the sensitive part of the job never involves a third party at all.",
    },
    {
      icon: "Database",
      audience: "Archiving logs and exports",
      body: "Log files and CSV dumps are close to the ideal case for DEFLATE, routinely losing most of their size. Zipping them before storage is the cheapest space saving available.",
    },
    {
      icon: "GraduationCap",
      audience: "Coursework submissions",
      body: "Portals that accept a single file force everything into one archive. Doing that in a browser tab works on a university machine where installing software is not an option.",
    },
    {
      icon: "Code2",
      audience: "Sharing a small codebase",
      body: "Source files compress extremely well and stay exactly as they were, so a zipped snapshot is a reliable way to hand over code without a repository.",
    },
    {
      icon: "Plane",
      audience: "Packing things up offline",
      body: "The page keeps working with no connection once it has loaded, so an archive can be prepared on a train and sent when there is signal again.",
    },
  ],

  limitations: {
    items: [
      {
        title: "Folder structure is not preserved",
        body:
          "Files are added by name at the top level of the archive, so a selection spanning several directories comes out flat. Your operating system's own compress option is the better choice when the tree matters.",
      },
      {
        title: "No password protection",
        body:
          "Archives are written unencrypted. Anything requiring a password needs a desktop tool, and the extractor here cannot open encrypted archives either, so this is consistent rather than an oversight.",
      },
      {
        title: "Everything is held in memory while it is built",
        body:
          "Each file is read into the tab and the finished archive is assembled there too, so the working set is roughly the total size twice over. Large jobs behave much better on a laptop than a phone.",
      },
      {
        title: "Already-compressed files will not shrink",
        body:
          "Photos, PDFs, video and existing archives come out about the same size, because their redundancy has already been removed. Compress the images first if the goal is a smaller total.",
        alternative: "image-compressor",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Are my files uploaded to build the archive?",
      answer:
        "No. The files are read from your disk by the page and compressed in the tab, and the finished archive is handed straight to your downloads. Open your browser's Network panel while you do it and you will see no requests at all after the page itself has loaded.",
    },
    {
      question: "Why is my ZIP of photos the same size as the photos?",
      answer:
        "Because JPEG and PNG have already done the compressing. DEFLATE looks for repeated byte sequences, and an image codec has already removed those. A JPEG and two PDFs went from 2,273,612 bytes to 2,269,170, a saving of 0.2 percent. The archive is still useful as one file rather than three.",
    },
    {
      question: "How much smaller will my files actually get?",
      answer:
        "It depends entirely on the type. Plain text, CSV, JSON, HTML, source code and logs typically lose 70 to 85 percent; measured here, three text files went from 167,472 to 27,859 bytes. Office documents are already zipped internally and save little. Images, audio, video and PDFs save almost nothing.",
    },
    {
      question: "What compression level is used?",
      answer:
        "DEFLATE at level 6, which is zlib's default and the point where extra effort stops buying meaningful size. There is no setting to change it, because on compressible data the gain from level 9 is small and on incompressible data no level helps.",
    },
    {
      question: "Can I add a password to the archive?",
      answer:
        "No. Archives are created without encryption and there is no option to add one. If the contents need protecting in transit, encrypt them with a desktop archiver or send them through a channel that is already encrypted.",
    },
    {
      question: "What happens if two files have the same name?",
      answer:
        "Both are kept. The second is renamed with a numeric suffix, so two files called report.pdf become report.pdf and report (1).pdf. Nothing is silently replaced, which matters when you have selected the same filename from two different folders.",
    },
    {
      question: "Is there a limit on how many files or how much data?",
      answer:
        "Nothing is capped by this page, because there is no server applying a quota. The real limit is memory: the files and the archive being built both sit in the tab at once. A few hundred megabytes is reasonable on a desktop machine.",
    },
    {
      question: "Will the archive open on Windows and macOS?",
      answer:
        "Yes. It is a standard ZIP using DEFLATE, which every operating system has opened natively for years, along with every archive utility. Nothing unusual is written into the container.",
    },
    {
      question: "Can I zip a folder rather than individual files?",
      answer:
        "The file picker takes files, not directories, so you select the contents rather than the folder. Note that the paths are not rebuilt inside the archive, so everything arrives at the top level.",
    },
    {
      question: "Does compressing change the files themselves?",
      answer:
        "No. DEFLATE is lossless, so extracting the archive gives back byte-for-byte what went in. This is unlike image or video compression, where making something smaller means discarding detail.",
    },
    {
      question: "Why does zipping a large photo take longer than zipping text?",
      answer:
        "Because the algorithm still has to read every byte looking for repetition, even when it finds almost none. The JPEG and PDF job took 101 milliseconds against 17 for the much smaller text files, and produced almost no saving for that work.",
    },
    {
      topic: "offline",
      question: "Does this work without a connection?",
      answer:
        "Yes, once loaded. Compression happens entirely in your browser, so after the first visit you can disconnect and still build archives. A fresh reload while offline needs the page to still be in the browser cache.",
    },
  ],

  related: [
    {
      name: "Unzip Files",
      path: "/zip-extractor",
      description: "Open an archive and pull individual files back out.",
    },
    {
      name: "ZIP Preview",
      path: "/zip-preview",
      description: "Check what is inside an archive before extracting it.",
    },
    {
      name: "Image Compressor",
      path: "/image-compressor",
      description: "Shrink photos first, since zipping them will not.",
    },
    {
      name: "Gzip Compress",
      path: "/gzip-compress",
      description: "Compress a single payload rather than bundling files.",
    },
    {
      name: "PDF Compress",
      path: "/pdf-compress",
      description: "Reduce a scanned PDF before adding it to an archive.",
    },
    {
      name: "CSV Merge",
      path: "/csv-merge",
      description: "Combine spreadsheets into one file instead of zipping several.",
    },
  ],

  headings: {
    features: {
      heading: "What this tool gives you",
      lede: "The parts that matter when the files are sensitive or numerous.",
    },
    howItWorks: { heading: "How to zip files in three steps" },
    examples: {
      heading: "Two archives, measured",
      lede: "The same settings against very different data, and why the results diverge so sharply.",
    },
    scenarios: { heading: "Specific situations" },
    useCases: { heading: "Who bundles files this way" },
    faq: { heading: "Creating ZIP files: common questions" },
    related: { heading: "Other archive tools" },
    limitations: {
      heading: "What this tool will not do",
      lede: "Including the one that surprises people most often.",
    },
  },
};
