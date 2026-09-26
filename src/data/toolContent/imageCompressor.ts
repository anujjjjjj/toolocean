import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S1 } from "./shared";

/**
 * Tier A content for /image-compressor.
 *
 * Figures from docs/CONTENT_FIXTURES.md session S1, against a real 3840x2160
 * photograph rather than generated noise, which compresses nothing like a photo.
 */
export const imageCompressorContent: Partial<ToolPageContent> = {
  tier: "A",

  seo: {
    title: "Compress Images Online Without Uploading Them",
    description:
      "Shrink JPEG and PNG photos in your browser. A 10.9 MB PNG becomes 1.2 MB, measured. No upload, no daily limit, no account, and the original stays untouched.",
    keywords: [
      "compress image",
      "compress image without uploading",
      "reduce image file size",
      "compress jpeg online",
      "shrink png file size",
      "image compressor private",
      "compress photos in browser",
    ],
  },

  hero: {
    h1: "Compress Images in Your Browser",
    subtitle:
      "Re-encode a photograph at a quality you choose and get a much smaller file back. The image is read from your disk and processed in this tab, so nothing is uploaded and no daily quota applies.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose an image", action: "upload" },
  },

  intro: {
    heading: "Where the saving comes from",
    paragraphs: [
      "Your image is decoded to raw pixels, drawn onto a canvas, and encoded again as JPEG at the quality you set. JPEG discards information the eye is poor at noticing: it works in blocks, converts colour into brightness plus two colour channels, samples the colour channels more coarsely than brightness, and rounds away the fine frequency detail that contributes least to how the picture looks. The quality slider controls how aggressively that rounding happens. Nothing about this is reversible, which is exactly why it saves so much.",
      "The size of the win depends almost entirely on what the file was before. A photograph already saved as JPEG has been through this once, so a second pass at quality 80 took 2,057,152 bytes to 1,199,262, a 41.7 percent saving. The same photograph stored as a lossless PNG went from 10,887,764 bytes to 1,201,043, an 89 percent saving, because PNG had been keeping every pixel exactly and a photograph has no flat regions for that to pay off on. Both results are about 1.2 MB, which is the honest summary: the output size is set by the image and the quality, not by what the input happened to be.",
    ],
  },

  features: [
    {
      icon: "Gauge",
      title: "A quality control that does something",
      body: "The slider is passed straight to the JPEG encoder, so moving it changes the output rather than a label. Around 80 is the usual sweet spot for photographs.",
    },
    {
      icon: "ShieldCheck",
      title: "The original is never touched",
      body: "Compression reads your file and writes a new one to your downloads. Whatever is on disk stays exactly as it was, so a setting you dislike costs you one download.",
    },
    {
      icon: "Infinity",
      title: "No daily limit or file cap",
      body: "There is no account, no queue and no free tier to exhaust, because there is no server metering anything. Compress two images or two hundred in a sitting.",
    },
    {
      icon: "Zap",
      title: "Finishes in well under a second",
      body: "A 3840x2160 photograph took 144 milliseconds from a JPEG and 179 from a PNG. The encoding is fast; on other tools the wait is the upload.",
    },
  ],

  howItWorks: [
    {
      title: "Pick an image",
      body: "Choose a JPEG or PNG from your device. It is decoded locally so the page can see its pixels, and the original file size is shown for comparison.",
    },
    {
      title: "Set the quality",
      body: "Drag the slider to trade detail against size. Around 80 keeps photographs looking unchanged in normal viewing; below about 50 the block structure starts becoming visible in flat areas and gradients.",
    },
    {
      title: "Download the result",
      body: "The compressed JPEG is written to your downloads, and the toast reports how much smaller it came out. Re-run at a different quality as often as you like.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "A photograph already saved as JPEG",
      description: "The common case, and the more modest saving of the two.",
      before: { label: "Input", detail: "3840x2160 JPEG, 2,057,152 bytes" },
      after: { label: "Output", detail: "1,199,262 bytes, 41.7% smaller, 144 ms" },
      settings: "Quality 80",
      explanation:
        "The file had already been through a lossy encoder once, so much of the easily removable detail was gone before this started. A 41.7 percent saving on an already-compressed photograph is a good result rather than a disappointing one.",
    },
    {
      kind: "file",
      title: "The same photograph stored as PNG",
      description: "Where the biggest wins on this site come from.",
      before: { label: "Input", detail: "3840x2160 PNG, 10,887,764 bytes" },
      after: { label: "Output", detail: "1,201,043 bytes, 89.0% smaller, 179 ms" },
      settings: "Quality 80",
      explanation:
        "PNG stores photographic detail losslessly, which is the wrong trade for a photograph and the right one for a logo. Both runs landed near 1.2 MB, because the output size is decided by the picture and the quality rather than by the format it arrived in.",
    },
  ],

  measurements: {
    method: MEASURED_S1,
    rows: [
      {
        scenario: "3840x2160 photograph, JPEG in, quality 80",
        input: "2,057,152 bytes",
        output: "1,199,262 bytes",
        timing: "144 ms",
        note: "41.7% smaller",
      },
      {
        scenario: "3840x2160 photograph, PNG in, quality 80",
        input: "10,887,764 bytes",
        output: "1,201,043 bytes",
        timing: "179 ms",
        note: "89.0% smaller",
      },
    ],
  },

  scenarios: {
    items: [
      {
        question: "How do I get a photo under an email attachment limit?",
        answer:
          "Compress at quality 80 first and check the result; a typical phone photograph drops by half or more. If it is still too large, reduce the dimensions as well, since halving both sides removes three quarters of the pixels.",
      },
      {
        question: "How do I make images load faster on a website?",
        answer:
          "Compress them, then serve them at the size they are actually displayed. A 4000 pixel wide photograph in a 800 pixel column is wasting most of its bytes regardless of how well it is compressed.",
      },
      {
        question: "What quality should I use for photographs?",
        answer:
          "Start at 80. At that setting the difference is very hard to see at normal viewing distance on a photograph, while the file is typically less than half the size. Drop to 60 for thumbnails, and stay above 90 only when the image will be edited again.",
      },
      {
        question: "How do I compress an image without losing quality?",
        answer:
          "You cannot, with this tool: JPEG is lossy by definition and every pass discards something. What you can do is choose a quality where the loss is invisible in practice, which for most photographs is well below the point where the file stops shrinking.",
      },
    ],
  },

  useCases: [
    {
      icon: "Mail",
      audience: "Sending photographs by email",
      body: "Attachment limits are usually 20 or 25 MB, and a handful of modern phone photographs clears that easily. Halving each one locally solves it without involving a file transfer service.",
    },
    {
      icon: "Code2",
      audience: "Web and app developers",
      body: "Page weight is dominated by images on most sites. Compressing before upload is the single cheapest performance improvement available, and doing it locally keeps unreleased assets off third-party servers.",
    },
    {
      icon: "Landmark",
      audience: "Document and evidence handling",
      body: "Photographs of documents, identification and property are exactly the images that should not pass through an anonymous web service. This one cannot receive them even in principle.",
    },
    {
      icon: "Briefcase",
      audience: "Marketplace and property listings",
      body: "Upload forms frequently cap each image at a few megabytes. Compressing to fit is quicker than rescanning or rephotographing, and nothing visible is lost at sensible settings.",
    },
    {
      icon: "Database",
      audience: "Freeing up storage",
      body: "A folder of PNG screenshots or exports can shrink by an order of magnitude. The saving on photographic content is far larger than most people expect before they try it.",
    },
    {
      icon: "Plane",
      audience: "Working without a connection",
      body: "The page keeps compressing with the network off once it has loaded, which is useful on a flight and is also the simplest demonstration that the photograph is not being sent anywhere.",
    },
  ],

  limitations: {
    items: [
      {
        title: "The output is always JPEG",
        body:
          "Whatever you put in, you get a JPEG back. That is the right choice for photographs and the wrong one for logos, screenshots of text and anything with transparency, because JPEG has no alpha channel and blurs hard edges.",
        alternative: "image-format-converter",
      },
      {
        title: "Compression is not reversible",
        body:
          "Detail thrown away is gone, and compressing an already-compressed file again removes more. Work from your original rather than re-compressing an output, and keep that original if the image matters.",
      },
      {
        title: "Dimensions are unchanged",
        body:
          "A 4000 pixel wide photograph stays 4000 pixels wide. When an image is far larger than it will ever be displayed, reducing its size saves much more than re-encoding it does.",
        alternative: "image-resizer",
      },
      {
        title: "Metadata is not preserved",
        body:
          "Redrawing through a canvas drops EXIF, so camera settings, timestamps and any embedded GPS location do not survive. Convenient for privacy, inconvenient if you were relying on capture dates.",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Is my photograph uploaded anywhere?",
      answer:
        "No. The file is read by the page, drawn to a canvas and encoded again entirely in this tab. A photograph is a good case for checking that yourself: a genuine upload of a 10 MB image would show sustained network activity for several seconds, and there is none. Disconnecting before you compress settles it completely.",
    },
    {
      question: "How much smaller will my image get?",
      answer:
        "It depends far more on the source than on anything you choose. A photograph already stored as JPEG dropped 41.7 percent at quality 80, while the same photograph stored as PNG dropped 89 percent. Screenshots and graphics with large flat areas behave differently again, and often do better as PNG.",
    },
    {
      question: "What quality setting should I choose?",
      answer:
        "Eighty is a good default for photographs and is what both measurements above used. Above 90 the file grows quickly for detail almost nobody can see. Below about 50 the eight by eight block structure JPEG works in becomes visible, especially in skies and skin tones.",
    },
    {
      question: "Does compressing reduce the resolution?",
      answer:
        "No. The pixel dimensions are identical afterwards; only how those pixels are stored changes. If the image is much larger than it needs to be, resizing it will save considerably more than compression alone.",
    },
    {
      question: "Can I compress a PNG and get a PNG back?",
      answer:
        "Not here, because the output is always JPEG. For a photograph that is usually what you want, as the PNG measurement above shows. For a logo, a screenshot or anything needing transparency, converting to JPEG is the wrong move.",
    },
    {
      question: "What happens to transparency?",
      answer:
        "It does not survive. Transparency needs an alpha channel and the JPEG specification simply has nowhere to record one, so anything see-through is composited onto a solid backdrop during encoding. A logo cut out against nothing comes back sitting on a rectangle, which is usually discovered only after it has been placed on a coloured page.",
    },
    {
      question: "Is EXIF data such as GPS location kept?",
      answer:
        "No. Drawing the image to a canvas keeps only the pixels, so camera model, exposure settings, capture time and any location tag are all dropped. That is a useful side effect before publishing a photograph, and a loss if you were relying on those dates.",
    },
    {
      question: "Can I compress several images at once?",
      answer:
        "One at a time. The page takes a single image, which suits the common case of getting one photograph under a limit and is tedious for a folder of two hundred. A desktop batch tool is the better answer for that.",
    },
    {
      question: "Why did compressing my screenshot make it look worse?",
      answer:
        "Because JPEG is built for photographs, not for text and sharp lines. It smears the high-contrast edges around letters and produces visible fringing. Screenshots of interfaces or documents should stay as PNG.",
    },
    {
      question: "Will compressing twice make the file half the size again?",
      answer:
        "No, and it will cost you quality for very little. The second pass removes detail the first pass already removed, so the saving is small while the degradation accumulates. Always start from the original.",
    },
    {
      question: "Is there a maximum image size?",
      answer:
        "No fixed limit, since no server is applying one. The constraint is memory: the image is decoded to raw pixels, so a 3840x2160 photograph occupies about 33 MB uncompressed while it is being worked on. Very large images are more comfortable on a laptop than a phone.",
    },
    {
      topic: "offline",
      question: "Does this work offline?",
      answer:
        "Yes, once the page has loaded. Encoding is done by the browser itself, so nothing further is needed from the network. Only a fresh reload while disconnected depends on the page still being cached.",
    },
  ],

  related: [
    {
      name: "Resize Image",
      path: "/image-resizer",
      description: "Reduce the dimensions, which usually saves more than quality alone.",
    },
    {
      name: "Convert Image Format",
      path: "/image-format-converter",
      description: "Move between PNG, JPEG and WebP, and keep transparency when you need it.",
    },
    {
      name: "Crop Image",
      path: "/image-crop",
      description: "Remove the parts of the frame you were not going to keep.",
    },
    {
      name: "Image to Base64",
      path: "/image-to-base64",
      description: "Inline a small compressed image directly in CSS or HTML.",
    },
    {
      name: "Images to PDF",
      path: "/images-to-pdf",
      description: "Collect compressed photographs into a single document.",
    },
    {
      name: "Create ZIP",
      path: "/zip-creator",
      description: "Bundle the results, remembering that zipping images saves nothing.",
    },
  ],

  headings: {
    features: { heading: "What this compressor gives you" },
    howItWorks: { heading: "How to compress an image in three steps" },
    examples: {
      heading: "Two runs, measured",
      lede: "The same photograph in two formats, and why the savings differ so much.",
    },
    scenarios: { heading: "Specific situations" },
    useCases: { heading: "Who compresses images this way" },
    faq: { heading: "Compressing images: common questions" },
    related: { heading: "Other image tools" },
    limitations: {
      heading: "What this tool will not do",
      lede: "Four things worth knowing before you replace an original.",
    },
  },
};
