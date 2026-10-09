import type { ToolPageContent } from "@/types/toolContent";

/**
 * Tier A content for /pdf-metadata.
 * Reads the Info dictionary and a shallow XMP packet, then writes edited
 * fields or strips them. XMP is not a full RDF editor.
 */
export const pdfMetadataContent: Partial<ToolPageContent> = {
  tier: "A",
  seo: {
    title: "Edit PDF Metadata Online – No Upload",
    description:
      "Edit PDF metadata in this tab: title, author, producer, dates, and keywords. Change the fields you want or strip them, then download. The file is not uploaded.",
    keywords: [
      "pdf metadata viewer",
      "remove pdf metadata",
      "pdf author remover",
      "strip pdf metadata",
      "pdf xmp viewer",
      "pdf document properties offline",
    ],
    datePublished: "2026-10-08",
    dateModified: "2026-10-08",
  },
  hero: {
    h1: "Edit PDF metadata",
    subtitle:
      "Read the document information and the XMP packet, change the fields you want to keep, or strip them and download a copy. The file is not uploaded to be inspected.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },
  intro: {
    heading: "The labels travel with the file",
    paragraphs: [
      "A PDF carries a small dictionary, the Info dictionary, that names the document: title, author, subject, keywords, the application that created it, the library that wrote it, and the creation and modification times. Many files also embed an XMP packet, an XML description with the same ideas and sometimes a few more, such as a creator tool or a rights statement. Viewers show these in a properties panel. They are not the page content. They survive copying the file, and they often survive a casual export that only changed the pages.",
      "This page reads both places and lists what it found, including which side each value came from. You can edit the standard fields and save a copy, or strip them so the copy's Info dictionary is empty and any metadata stream marked as Metadata is removed. A fixture with a title, an author, and an XMP packet showed those values in the report, and after a strip neither the Info fields nor the XMP packet remained. That is the behaviour to expect. It is not a promise that every private fact inside a PDF lives in those two places.",
    ],
  },
  features: [
    {
      icon: "FileSearch",
      title: "A report before you change anything",
      body: "Title, author, subject, keywords, creator, producer, dates, trapped, and the XMP fields the parser understands are listed with their source. An empty document says so, instead of showing blank inputs with nothing explained.",
    },
    {
      icon: "Keyboard",
      title: "Edit the fields you want to keep",
      body: "The standard Info fields are editable. Saving writes those values into the Info dictionary and rebuilds a small XMP packet so the two descriptions agree.",
    },
    {
      icon: "Eraser",
      title: "Strip is a separate action",
      body: "Strip metadata clears the Info fields and removes metadata streams. It does not run just because you saved an edit. The button is labelled as removal.",
    },
    {
      icon: "AlertTriangle",
      title: "Page content is a different store",
      body: "A name typed on the page, a comment in an annotation, and text inside an embedded file are not Info fields. The report does not call them metadata, and strip does not delete them.",
    },
  ],
  howItWorks: [
    {
      title: "Choose the PDF",
      body: "Pick a file that is not encrypted. The page reads the Info dictionary and the XMP packet locally and lists every field it found.",
    },
    {
      title: "Edit fields or strip them",
      body: "Change the values in the form and press Save metadata, or press Strip metadata to clear the document information and remove metadata streams.",
    },
    {
      title: "Download the copy",
      body: "The browser saves a new file, named with -metadata or -stripped. The file you selected is unchanged.",
    },
  ],
  examples: [
    {
      kind: "file",
      title: "A file that names its author",
      description: "The usual properties panel: a title, a person, a producer string from the library that wrote the PDF.",
      before: { label: "Input", detail: "Info dictionary with title, author, and producer, plus a short XMP packet" },
      after: { label: "Report", detail: "The same strings listed, tagged as coming from the Info dictionary, XMP, or both" },
      explanation:
        "On a fixture written with a title and an author, the report showed both, and the producer string pdf-lib had added. Nothing was changed until a button was pressed. Opening the original afterwards still showed the old properties, because the tool writes a download rather than overwriting the file you picked.",
    },
    {
      kind: "file",
      title: "Stripping the same file",
      description: "You want the copy to stop advertising who made it.",
      before: { label: "Input", detail: "The file above" },
      after: { label: "Output", detail: "Info fields empty, metadata streams removed, page text still present" },
      explanation:
        "After strip, reading the download returned no title, author, creator, or producer, and the XMP packet was gone. The sentence on the page was still extractable. Strip targets the description of the file, not the words of the file. If the author name is also typed in the letterhead, it remains.",
    },
  ],
  useCases: [
    {
      icon: "Mail",
      audience: "Sending a document outside the team",
      body: "The author field still says the person who exported it from a desktop app three years ago. Read the report, clear the fields you do not want a recipient to see, and send the download.",
    },
    {
      icon: "Briefcase",
      audience: "Checking a file you received",
      body: "Before you file a PDF, look at the producer, the creator, and the dates. They often say which tool and which machine wrote it. The report is the properties panel without uploading the document to get it.",
    },
    {
      icon: "Receipt",
      audience: "A template you reuse",
      body: "The title is useful and the old author is not. Edit the title, blank the author, and save. The next copy starts from that.",
    },
    {
      icon: "ScanLine",
      audience: "A scan with a misleading producer string",
      body: "Scanner software writes its name into the producer field. If that name should not travel with the scan, strip or overwrite it. The page images stay.",
    },
  ],
  limitations: {
    heading: "What the report does not cover",
    items: [
      {
        title: "Not a full XMP editor",
        body: "The reader pulls a fixed set of Dublin Core and XMP Basic fields out of the packet. Custom RDF, history arrays, and vendor namespaces are not presented as a tree you can edit field by field.",
      },
      {
        title: "Strip does not redact page content",
        body: "Words, images, annotations, attachments, and form values can all contain names. They are outside the Info dictionary and are left in place.",
        alternative: "pdf-form-fill",
      },
      {
        title: "Encrypted files are refused",
        body: "The properties live inside the encrypted object graph. They cannot be listed until the file opens.",
        alternative: "pdf-unlock",
      },
      {
        title: "Saving rewrites the file",
        body: "A cryptographic signature that covered the old bytes will not validate on the download. Incremental updates and some optional content relationships are not preserved byte for byte.",
      },
    ],
  },
  faqs: [
    {
      topic: "privacy",
      question: "Is the PDF uploaded so the metadata can be read?",
      answer:
        "No. The bytes are parsed in the tab. The report is rendered from that parse. Nothing in the inspection path sends the file or the field values to a server, and the field values are not passed to analytics.",
    },
    {
      question: "Which fields show up in the report?",
      answer:
        "From the Info dictionary: title, author, subject, keywords, creator, producer, creation date, modification date, and trapped. From XMP, when a packet is present: title, creator, description, subject, keywords, creator tool, create date, modify date, producer, and rights. A value found in both is marked as both.",
    },
    {
      question: "What does strip remove?",
      answer:
        "It clears the Info fields and deletes streams that are flagged as metadata, which is where the XMP packet lives in a normal file. A test file that contained both an author and an XMP packet had neither after stripping. Page text was unchanged.",
    },
    {
      question: "Does strip remove hidden text or white text?",
      answer:
        "No. Hidden text is page content. White text is page content. An annotation with a name in it is an annotation. Strip only removes the document-information structures. If a secret is drawn on the page, it is still drawn on the page.",
    },
    {
      question: "Can I change the producer string?",
      answer:
        "Yes. Producer is one of the editable fields. Libraries often overwrite it with their own name when they save. This page writes the producer value you leave in the form, so you can set it or blank it deliberately.",
    },
    {
      question: "Why do dates look different from the properties panel in my viewer?",
      answer:
        "PDF Info dates use a specific format, and XMP dates use another. The report shows the strings it found. When you save an edit, dates you leave blank are omitted rather than invented, and a modification time is written for the save.",
    },
    {
      question: "Will keywords stay a list?",
      answer:
        "They are shown as a comma-separated line, which is how the Info dictionary stores them. You can edit that line. On save, the commas are split back into keywords. Empty segments from a double comma are dropped.",
    },
    {
      question: "What about a PDF that is password protected?",
      answer:
        "The page refuses it. Properties inside ciphertext cannot be listed. Run [the unlock tool](/pdf-unlock) and bring the clear copy back to this page.",
    },
    {
      question: "Does editing metadata change the pages?",
      answer:
        "The page content is copied through as the file is rewritten. Text that was selectable stays selectable. What changes is the description, and the fact that the file is a new save, so any previous digital signature no longer matches.",
    },
    {
      question: "I stripped the author and the letterhead still shows the name. Why?",
      answer:
        "The letterhead is ink on the page. The author field is a label in the file header. They are independent. Removing one does not remove the other. This tool is the label.",
    },
    {
      topic: "offline",
      question: "Can I inspect metadata offline?",
      answer:
        "Yes, once the page's script is loaded. Reading, editing, and stripping do not contact a server. There is no metadata lookup service behind the report.",
    },
    {
      topic: "account",
      question: "Do I need an account to view PDF properties?",
      answer:
        "No. The report exists only for the file you picked, in this tab, until you leave or pick another file.",
    },
    {
      topic: "size",
      question: "Will a long scanned PDF be slow to inspect?",
      answer:
        "The Info dictionary and the XMP packet are small even when the pages are large. Loading the file into memory is the cost, the same as the other PDF tools. The report itself does not render every page.",
    },
  ],
  related: [
    {
      name: "Unlock PDF",
      path: "/pdf-unlock",
      description: "Decrypt a file you can open so its properties can be read here.",
    },
    {
      name: "Encrypt PDF",
      path: "/pdf-encrypt",
      description: "Hide the properties from anyone who does not have the open password, after you have decided which fields to keep.",
    },
    {
      name: "Sign PDF",
      path: "/pdf-sign",
      description: "A visual signature does not update the author field. Check it here if that matters.",
    },
    {
      name: "PDF Compress",
      path: "/pdf-compress",
      description: "Compression rewrites streams and can change the producer string. Inspect afterwards if you need the labels a certain way.",
    },
    {
      name: "Fill PDF Form",
      path: "/pdf-form-fill",
      description: "Form values are not metadata. Filling them is a different edit.",
    },
  ],
  headings: {
    features: { heading: "What the inspection shows", lede: "Info fields, a shallow XMP read, and a strip that is opt-in." },
    howItWorks: { heading: "How to view or remove PDF metadata", lede: "Read the report, then save an edit or strip." },
    examples: { heading: "A properties panel, then an empty one" },
    useCases: { heading: "When the document labels matter" },
    faq: { heading: "Questions about PDF metadata" },
    related: { heading: "Related PDF tools" },
  },
};
