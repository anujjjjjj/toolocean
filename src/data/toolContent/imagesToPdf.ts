import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S1 } from "./shared";

/**
 * Tier A content for /images-to-pdf.
 *
 * The central fact here is that JPEG data is embedded rather than re-encoded, so
 * the document weighs what its pictures weigh. Measured in
 * docs/CONTENT_FIXTURES.md session S1.
 */
export const imagesToPdfContent: Partial<ToolPageContent> = {
  tier: "A",

  seo: {
    title: "Images to PDF: Combine Photos Into One Document",
    description:
      "Turn JPG and PNG images into a single PDF in your browser, in the order you choose. Photos are embedded without re-encoding, so quality is untouched. No uploads.",
    keywords: [
      "images to pdf",
      "jpg to pdf",
      "png to pdf",
      "combine photos into pdf",
      "convert pictures to pdf without uploading",
      "photo to pdf converter",
      "scan photos to one pdf",
    ],
  },

  hero: {
    h1: "Convert Images to a PDF",
    subtitle:
      "Pick several photographs or scans and get one document back, with the pages in the order you arrange them. JPEGs are embedded exactly as they are, so nothing is recompressed on the way in.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose images", action: "upload" },
  },

  intro: {
    heading: "What the document ends up weighing, and why",
    paragraphs: [
      "A PDF page can hold an image as an object, and for JPEG that object can be the original compressed data verbatim. This takes advantage of that: a JPEG you add is copied into the document byte for byte, with a page created at the image's own pixel dimensions and the picture drawn to fill it. Nothing is decoded, resampled or re-encoded, which is why the operation is close to instant and why a photograph looks exactly as it did before. Three 2550x3300 JPEGs totalling 3,549,756 bytes produced a 3,551,383 byte PDF, a difference of about 1,600 bytes for the document structure wrapped around them.",
      "The consequence is that a PDF of photographs is as heavy as the photographs. There is no compression step to hope for, so a folder of twenty phone pictures makes a document of roughly twenty phone pictures. If that is too large to send, the answer is to make the images smaller before they go in rather than to look for a setting here. PNG behaves slightly differently, since PNG data is also embedded directly, and formats a browser has to convert first are passed through a canvas and written as JPEG.",
    ],
  },

  features: [
    {
      icon: "MoveVertical",
      title: "Drag the pages into order",
      body: "The list is the page order, so you arrange it here rather than renaming files into a sequence first. Remove anything that should not be in the document without starting again.",
    },
    {
      icon: "FileCheck2",
      title: "Photographs are not re-encoded",
      body: "JPEG data is embedded as it stands, so there is no second round of lossy compression and no visible softening. A scan goes in and comes out at exactly the same quality.",
    },
    {
      icon: "Layers",
      title: "Mixed formats in one document",
      body: "JPEG, PNG and anything else your browser can decode can go into the same PDF. Each page is sized to its own image rather than forced onto a fixed paper size.",
    },
    {
      icon: "Zap",
      title: "Effectively instant",
      body: "Three full-page scans became a document in 38 milliseconds, because copying compressed data is cheap. There is no upload to sit through at either end.",
    },
  ],

  howItWorks: [
    {
      title: "Add your images",
      body: "Select as many as you like, in one go or in batches. Each appears in a list with a thumbnail so you can check you have the right pictures before building anything.",
    },
    {
      title: "Put them in order",
      body: "Drag rows to rearrange, and remove any that should not be included. The document is built top to bottom, so what you see in the list is what the reader will page through.",
    },
    {
      title: "Create and download",
      body: "Press the create button and the PDF is assembled in the tab and saved to your downloads. Nothing is uploaded and nothing is kept once you close the page.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "Three scanned pages into one document",
      description: "The common case: photographs of paperwork that need to travel together.",
      before: { label: "Input", detail: "3 JPEGs at 2550x3300, 3,549,756 bytes total" },
      after: { label: "Output", detail: "3-page PDF, 3,551,383 bytes, 38 ms" },
      explanation:
        "The document is 1,627 bytes heavier than the pictures that went into it, which is the page tree and cross-reference table. Nothing was recompressed, so each page is pixel-identical to the JPEG it came from.",
    },
    {
      kind: "file",
      title: "Making the document smaller",
      description: "What to do when the result is too large to send.",
      before: { label: "Straight conversion", detail: "3,549,756 bytes of images, 3,551,383 byte PDF" },
      after: { label: "Images compressed first", detail: "compress each image, then convert" },
      explanation:
        "Because the images are embedded rather than re-encoded, the only way to reduce the PDF is to reduce them. Running each photograph through the compressor at quality 80 first typically halves the document, and this page will then embed the smaller versions unchanged.",
    },
  ],

  measurements: {
    method: MEASURED_S1,
    rows: [
      {
        scenario: "three 2550x3300 JPEGs into one document",
        input: "3,549,756 bytes",
        output: "3,551,383 bytes",
        timing: "38 ms",
        note: "1,627 bytes of PDF structure, no recompression",
      },
    ],
  },

  scenarios: {
    items: [
      {
        question: "How do I turn photos of a document into a single PDF?",
        answer:
          "Photograph each page, add them all here, drag them into reading order and create the document. Take the photographs square-on in even light; this does not deskew or crop, so the pages arrive exactly as shot.",
      },
      {
        question: "How do I make the PDF small enough to email?",
        answer:
          "Compress the images before adding them. Nothing on this page re-encodes them, so the document size is set entirely by what you put in. Quality 80 on each photograph usually halves the result without a visible difference.",
      },
      {
        question: "How do I combine scans that came out as separate files?",
        answer:
          "Add them all in one selection, check the order in the list, and build. This is the usual fix for a scanner that saves each sheet individually instead of producing one document.",
      },
      {
        question: "How do I get the pages in the right order?",
        answer:
          "Drag the rows. The order in the list is the order in the document, and filenames are ignored, so there is no need to rename anything into a numbering scheme first.",
      },
    ],
  },

  useCases: [
    {
      icon: "FileSignature",
      audience: "Sending paperwork that was photographed",
      body: "Signed forms, receipts and identity documents are usually captured as separate pictures and wanted as one file. Doing it locally keeps the originals off any service.",
    },
    {
      icon: "Receipt",
      audience: "Expenses and claims",
      body: "A month of photographed receipts becomes one submission. There is no per-file charge or count limit, so a large claim is no harder than a small one.",
    },
    {
      icon: "GraduationCap",
      audience: "Coursework and applications",
      body: "Portals that accept a single PDF force photographs of certificates and transcripts into one document, in a specific order that matters to whoever reviews it.",
    },
    {
      icon: "Briefcase",
      audience: "Property and inspection records",
      body: "Site photographs are far easier to circulate as a paginated document than as a folder, and they keep their original resolution for anyone who needs to look closely.",
    },
    {
      icon: "BookOpen",
      audience: "Notes and whiteboards",
      body: "Pictures of pages or a whiteboard become something you can page through and annotate rather than a camera roll nobody will scroll.",
    },
    {
      icon: "Plane",
      audience: "Assembling documents offline",
      body: "The page keeps working with the network off once loaded, so a submission can be prepared while travelling and sent on arrival.",
    },
  ],

  limitations: {
    items: [
      {
        title: "The PDF is as large as the images",
        body:
          "There is no compression step, by design, because re-encoding would degrade photographs that have already been through a lossy encoder once. Reduce the images first if the document needs to be smaller.",
        alternative: "image-compressor",
      },
      {
        title: "No cropping, deskewing or edge detection",
        body:
          "This is not a document scanner. A photograph taken at an angle, with a desk visible around the page, becomes a PDF page showing exactly that. Crop and straighten before adding them.",
        alternative: "image-crop",
      },
      {
        title: "Pages are sized to the images, not to A4",
        body:
          "Each page takes the pixel dimensions of its own picture, so a document built from photographs of different sizes has pages of different sizes. That prints unevenly unless your images are consistent.",
      },
      {
        title: "The result contains no text",
        body:
          "A photograph of a page is pixels. The document cannot be searched or have text copied out of it, and there is no character recognition here to change that.",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Are my photographs uploaded to build the PDF?",
      answer:
        "No. The images are read from your device, assembled into a document in this tab and handed to your downloads. Photographs of identity documents and paperwork are exactly the files worth being careful with, and the simplest check is to disconnect from the network before building one: it still works.",
    },
    {
      question: "Does converting reduce the quality of my photographs?",
      answer:
        "No. JPEG data is embedded into the document exactly as it is, with no decode and no second encode, so each page is pixel-identical to the file you added. That is also why the document is not smaller than its images.",
    },
    {
      question: "Why is the PDF the same size as all my pictures added together?",
      answer:
        "Because it essentially is those pictures, in a container. Three JPEGs totalling 3,549,756 bytes produced a 3,551,383 byte document. The extra 1,627 bytes are the page structure. Nothing is compressed on the way in.",
    },
    {
      question: "How do I control the order of the pages?",
      answer:
        "Drag rows in the list before creating the document. It reads top to bottom, and the filenames play no part, so photographs numbered awkwardly by a camera can still be put in the right sequence without renaming anything.",
    },
    {
      question: "Can I mix JPG and PNG in the same document?",
      answer:
        "Yes. Both are embedded directly, and any other format your browser can decode is converted to JPEG on the way in. A document can contain a mixture without anything special being done.",
    },
    {
      question: "Will the pages be A4 or letter sized?",
      answer:
        "Neither by default. Each page is created at the pixel dimensions of the image on it, so a set of photographs at different resolutions produces pages of different sizes. For consistent printing, resize the images to matching dimensions first.",
    },
    {
      question: "Can I add a whole folder at once?",
      answer:
        "You can select many files in one go, but the picker takes files rather than directories. Select the contents of the folder and they all arrive in the list together.",
    },
    {
      question: "How many images can I combine?",
      answer:
        "There is no imposed limit. Memory is the real one: every image and the finished document are held in the tab at once, so a hundred high-resolution photographs are much happier on a laptop than a phone.",
    },
    {
      question: "Can I use iPhone photos saved as HEIC?",
      answer:
        "It depends on the browser rather than on this page. Apple's own has the decoder built in; Chrome and Firefox on most platforms do not, and the file simply will not open. Setting the camera to Most Compatible, which makes it write JPEG, avoids the question entirely and is worth doing before a batch of scanning.",
    },
    {
      question: "Can I add page numbers, margins or a header?",
      answer:
        "No. The document is images on pages and nothing else; there is no text layer, no template and no annotation. A PDF editor is the right tool if the result needs anything added to it.",
    },
    {
      question: "Is the original image file changed?",
      answer:
        "Not at all. The pictures are read and a new PDF is written to your downloads. Everything on your disk stays exactly as it was, so you can rebuild the document in a different order as often as you like.",
    },
    {
      topic: "offline",
      question: "Does this work without an internet connection?",
      answer:
        "Yes, once the page has loaded. Building a PDF is done entirely in your browser, so no connection is needed afterwards and only a fresh reload depends on the cache.",
    },
  ],

  related: [
    {
      name: "PDF to Images",
      path: "/pdf-to-images",
      description: "The reverse, rendering document pages back out as pictures.",
    },
    {
      name: "Compress Image",
      path: "/image-compressor",
      description: "Shrink photographs first, since this will not.",
    },
    {
      name: "Crop Image",
      path: "/image-crop",
      description: "Trim the desk out of a photographed page before converting.",
    },
    {
      name: "Resize Image",
      path: "/image-resizer",
      description: "Match dimensions so the finished pages are consistent.",
    },
    {
      name: "Merge PDF",
      path: "/pdf-merge",
      description: "Attach the result to an existing document.",
    },
    {
      name: "Rotate PDF",
      path: "/pdf-rotate",
      description: "Fix pages built from photographs taken sideways.",
    },
  ],

  headings: {
    features: { heading: "What this converter gives you" },
    howItWorks: { heading: "How to turn images into a PDF in three steps" },
    examples: {
      heading: "One conversion, measured",
      lede: "What the document weighs, and what to do when that is too much.",
    },
    scenarios: { heading: "Specific situations" },
    useCases: { heading: "Who builds PDFs from images" },
    faq: { heading: "Images to PDF: common questions" },
    related: { heading: "Other PDF and image tools" },
    limitations: {
      heading: "What this converter will not do",
      lede: "It assembles pages. It is not a scanner app.",
    },
  },
};
