import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S1 } from "./shared";

/**
 * Tier A content for /zip-extractor, written against the query "unzip online".
 *
 * Numbers come from docs/CONTENT_FIXTURES.md session S1. The encrypted-archive
 * behaviour was tested with a real password-protected file rather than assumed,
 * because "how do I open a password protected ZIP" is the most asked question in
 * this category and a vague answer would be worse than none.
 */
export const zipExtractorContent: Partial<ToolPageContent> = {
  tier: "A",

  seo: {
    title: "Unzip Files Online: Open a ZIP in Your Browser",
    description:
      "Open a ZIP archive and save the files inside it without installing anything or uploading the archive. Works offline once loaded. No account, no size cap.",
    keywords: [
      "unzip online",
      "unzip files online",
      "open zip file online",
      "extract zip without software",
      "unzip without uploading",
      "zip extractor browser",
      "unzip on chromebook",
    ],
  },

  hero: {
    h1: "Unzip Files Online",
    subtitle:
      "Open a ZIP archive in this tab and download the files inside individually. The archive is read on your device, so nothing is sent anywhere and there is no queue to wait in.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a ZIP file", action: "upload" },
  },

  intro: {
    heading: "What happens when you open an archive here",
    paragraphs: [
      "A ZIP file is a set of compressed members followed by a directory at the end listing what is inside and where each member starts. Opening one here parses that directory, then runs every member back through DEFLATE to recover the original bytes, and hands you a list with a download beside each file. All of it happens in the page: the archive is read through the browser's file API, and the decompressed contents live in the tab's memory until you close it.",
      "Everything is decompressed at the point you choose the file, not at the point you click a download. A 725 KB archive holding 300 text files was unpacked and listed in 69 milliseconds, and a 20.5 MB archive of three large files took 100 milliseconds. That eagerness is what makes each download instant afterwards, and it is also the tool's main constraint: an archive whose contents will not fit in available memory will not open, because there is no streaming path that writes members to disk as it goes.",
    ],
  },

  features: [
    {
      icon: "Files",
      title: "Every file listed separately",
      body: "You get one row per member with its own download, so you can take the one document you needed out of a forty-file archive without unpacking the rest onto your disk.",
    },
    {
      icon: "Zap",
      title: "No upload and no wait",
      body: "A 20.5 MB archive opened in 100 milliseconds. There is no transfer to sit through first, which on a typical connection is most of what other tools make you wait for.",
    },
    {
      icon: "ShieldCheck",
      title: "Safe for archives you would not upload",
      body: "Exports from a payroll system, a backup of a case folder, a bundle from a client. The contents stay on your machine, so using this is not a decision anyone needs to approve.",
    },
    {
      icon: "Smartphone",
      title: "Works where you have no installer",
      body: "A locked-down work laptop, a Chromebook, a borrowed machine. Anything with a current browser can open an archive here without admin rights or software.",
    },
  ],

  howItWorks: [
    {
      title: "Choose the archive",
      body: "Click Select ZIP File and pick the .zip you want to open. It is read straight from your disk into the page; nothing is copied anywhere else and the original is not modified.",
    },
    {
      title: "Look through the contents",
      body: "Every file in the archive appears as its own row, folders included in the paths. This happens immediately, because the whole archive is unpacked in memory as soon as it is selected.",
    },
    {
      title: "Download what you need",
      body: "Press Download on any row to save that file. Take one, take several, or take none and close the tab; whatever you do not save is simply discarded.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "A folder of documents, 300 files deep",
      description: "The everyday case: an export or a shared bundle with real folder structure.",
      before: { label: "Archive", detail: "724,948 bytes, 300 text files in nested folders" },
      after: { label: "Listed", detail: "300 downloadable files, 69 ms" },
      explanation:
        "Every member was decompressed before the list appeared, which is why each download is instantaneous afterwards. The folder paths are kept in the filenames so you can tell two files called notes.txt apart.",
    },
    {
      kind: "file",
      title: "An archive with a few very large files",
      description: "Where the memory cost of unpacking everything up front is easiest to see.",
      before: { label: "Archive", detail: "20,507,979 bytes, one PNG and two PDFs" },
      after: { label: "Listed", detail: "3 downloadable files, 100 ms" },
      explanation:
        "Three members took longer than three hundred did, because time here follows the number of bytes to decompress rather than the number of entries. The uncompressed contents occupy memory for as long as the tab is open.",
    },
  ],

  measurements: {
    method: MEASURED_S1,
    rows: [
      {
        scenario: "300-entry archive, all entries decompressed and listed",
        input: "724,948 bytes",
        output: "300 files listed",
        timing: "69 ms",
        note: "nested folders preserved in paths",
      },
      {
        scenario: "20.5 MB archive of three large members",
        input: "20,507,979 bytes",
        output: "3 files listed",
        timing: "100 ms",
        note: "time follows bytes, not entry count",
      },
    ],
  },

  scenarios: {
    items: [
      {
        question: "How do I unzip a file on a Chromebook?",
        answer:
          "Open this page and choose the archive. ChromeOS can open ZIPs through the Files app, but that mounts the archive as a temporary drive and copying anything out of it is fiddly. Extracting here gives you an ordinary download per file instead.",
      },
      {
        question: "How do I open a ZIP without installing WinRAR or 7-Zip?",
        answer:
          "You do not need either. Windows and macOS can both open a plain ZIP natively, and when you are on a machine where you cannot install anything, this page does the same job in a tab with no admin rights required.",
      },
      {
        question: "How do I get one file out of a large archive?",
        answer:
          "Choose the archive, find the row you want, press Download on that row alone. Nothing else is written to your disk, which is quicker than unpacking a hundred files into a folder and then deleting ninety-nine of them.",
      },
      {
        question: "How do I unzip on a phone or tablet?",
        answer:
          "The same way as anywhere else, with the caveat that the whole archive is decompressed into memory. A few megabytes is fine on a phone; a large backup is likely to fail where the same file would open on a laptop.",
      },
      {
        question: "How do I open a ZIP that came by email?",
        answer:
          "Save the attachment, then select it here. Because the archive never leaves your device, this is also a reasonable way to look inside an unexpected attachment without giving a copy to a third-party service.",
      },
      {
        question: "How do I see what is inside without extracting it?",
        answer:
          "Use the preview tool instead. It reads the archive's directory and lists the contents without decompressing any member, which on the 20.5 MB archive took 54 milliseconds against 100 for a full extract.",
      },
    ],
  },

  useCases: [
    {
      icon: "Building2",
      audience: "Work machines with locked-down software",
      body: "Plenty of corporate laptops block installers and the well-known archive sites at the same time. A page that unpacks locally works inside both restrictions without an exception being raised.",
    },
    {
      icon: "Briefcase",
      audience: "Client and supplier deliverables",
      body: "Design assets, source files and document bundles usually arrive zipped. Opening them without a round trip through someone else's server keeps a confidentiality agreement simple to honour.",
    },
    {
      icon: "Landmark",
      audience: "Data exports from other systems",
      body: "Account exports, payroll runs and case bundles come out as archives full of personal data. These are exactly the files that should not be handed to a free web service, which is usually why people go looking for one.",
    },
    {
      icon: "GraduationCap",
      audience: "Coursework and shared material",
      body: "Lecture packs and assignment templates get distributed as one file. A student on a shared or managed machine can open them without needing anything installed.",
    },
    {
      icon: "Plane",
      audience: "Working offline",
      body: "Once this page has loaded, unzipping keeps working with the network off. It is genuinely useful on a plane, and it is also the simplest proof that the archive is not going anywhere.",
    },
    {
      icon: "Bug",
      audience: "Checking an unexpected attachment",
      body: "Listing the contents of a suspicious archive without running anything is a reasonable first look. Note that this does not scan for malware; it only shows you what is in there.",
    },
  ],

  limitations: {
    items: [
      {
        title: "Password protected archives will not open",
        body:
          "An encrypted ZIP is refused when the file is selected, with no prompt and no partial listing, because the library underneath does not implement ZIP encryption at all. Tested with an archive made by zip -e. Decrypt it with a desktop tool first.",
      },
      {
        title: "ZIP only, not RAR or 7z",
        body:
          "Those are different container formats with different compression, and nothing here can read them. A file that ends in .zip but was actually produced as a RAR will fail to open too.",
      },
      {
        title: "Everything is unpacked into memory at once",
        body:
          "There is no streaming extraction, so the uncompressed contents of the whole archive have to fit in the tab. Multi-gigabyte backups are the wrong job for this page, and a phone gives up considerably earlier than a laptop.",
      },
      {
        title: "Files download one at a time, flattened",
        body:
          "There is no download-all button, and saving a file puts it straight in your downloads folder rather than recreating the folders it came from. For a forty-file archive that is tedious; the folder structure is still visible in each name.",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Is the archive uploaded anywhere?",
      answer:
        "No, and it is straightforward to confirm. An archive is the easiest case to check, because a real upload of a 20 MB file would take visible seconds: watch the transfer indicator while you select one and there is nothing to see, since the bytes never leave the disk. Disconnecting from the internet before you open an archive is the decisive version of the same test.",
    },
    {
      question: "Can I open a password protected ZIP here?",
      answer:
        "No. Selecting one produces an error rather than a password prompt, because the extraction library has no support for ZIP encryption and rejects the file before it reads the contents. You will need a desktop application such as the built-in Archive Utility, 7-Zip or WinRAR to decrypt it, after which the unprotected copy opens here normally.",
    },
    {
      question: "Does it handle RAR, 7z or tar.gz files?",
      answer:
        "No, only ZIP. RAR and 7z are separate formats with their own compression algorithms, and a .tar.gz is two layers that this does not unwrap. Renaming the extension does not help, because the contents are read rather than the name.",
    },
    {
      question: "How large an archive can I open?",
      answer:
        "There is no fixed cap, because nothing here enforces a tier. The practical limit is memory: every member is decompressed when you select the file, so the uncompressed total has to fit in the tab. Tens of megabytes is routine on a laptop and much less so on a phone.",
    },
    {
      question: "Why does it take a moment before the file list appears?",
      answer:
        "Because the work is done then rather than later. All the members are decompressed as soon as the archive is selected, which is why every download afterwards is instant. On a 20.5 MB archive that initial pass took 100 milliseconds.",
    },
    {
      question: "Are folders inside the archive preserved?",
      answer:
        "In the listing, yes: each row shows the full path so docs/section-4/notes.txt is distinguishable from docs/section-9/notes.txt. In your downloads folder, no. Files are saved individually by name, because a browser download cannot create directories.",
    },
    {
      question: "Can I download everything at once?",
      answer:
        "Not from here. Each file has its own download and there is no bulk option, so an archive with many members is genuinely tedious to unpack completely. For that case a desktop extractor is the better tool, and this one is better when you want two files out of forty.",
    },
    {
      question: "Does unzipping change the files inside?",
      answer:
        "No. DEFLATE is lossless, so the bytes that come out are exactly the bytes that went in when the archive was made. A document, an image or an executable is recovered identically, including its original timestamp where the archive recorded one.",
    },
    {
      question: "Will it tell me if an archive contains a virus?",
      answer:
        "No. This reads the container and shows you what is inside it; there is no malware scanning of any kind. Seeing a filename is not the same as the file being safe, and an unexpected archive is worth treating carefully however you open it.",
    },
    {
      question: "What happens to the extracted files when I close the tab?",
      answer:
        "They disappear. The decompressed contents only ever existed as objects in the page's memory, so closing the tab discards them. Anything you pressed Download on is already saved in your downloads folder and is unaffected.",
    },
    {
      question: "Can I open an archive stored in cloud storage?",
      answer:
        "Download it to your device first, then select it. The file picker reads local files, so a link to a file in Drive or Dropbox is not something this page can open directly.",
    },
    {
      topic: "offline",
      question: "Does this work without an internet connection?",
      answer:
        "Yes, after the page has loaded once. The code that reads archives is already in the browser by then, so you can disconnect and keep opening files. Only reloading the page while offline depends on the browser cache still holding it.",
    },
  ],

  related: [
    {
      name: "ZIP Preview",
      path: "/zip-preview",
      description: "List what is in an archive without decompressing any of it.",
    },
    {
      name: "Create ZIP",
      path: "/zip-creator",
      description: "Bundle files back into a compressed archive.",
    },
    {
      name: "Gzip Decompress",
      path: "/gzip-decompress",
      description: "Unwrap a .gz payload, which is a different format entirely.",
    },
    {
      name: "PDF Merge",
      path: "/pdf-merge",
      description: "Combine PDFs you have just pulled out of an archive.",
    },
    {
      name: "Image Compressor",
      path: "/image-compressor",
      description: "Shrink photographs before you archive them again.",
    },
    {
      name: "Excel Reader",
      path: "/excel-reader",
      description: "Open a spreadsheet extracted from a data export.",
    },
  ],

  headings: {
    features: {
      heading: "Why unzip in the browser",
      lede: "What a local extractor gives you that an upload-based one cannot.",
    },
    howItWorks: { heading: "How to unzip a file in three steps" },
    examples: {
      heading: "Two archives, measured",
      lede: "How long real archives take, and where the time actually goes.",
    },
    scenarios: { heading: "Specific situations" },
    useCases: { heading: "Who opens archives this way" },
    faq: { heading: "Unzipping files: common questions" },
    related: { heading: "Other archive tools" },
    limitations: {
      heading: "What this extractor will not do",
      lede: "Four real boundaries, including the one people hit most often.",
    },
  },
};
