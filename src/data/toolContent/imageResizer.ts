import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S1 } from "./shared";

/**
 * Tier A content for /image-resizer.
 *
 * The figures here only became true once the tool stopped writing every result
 * as PNG regardless of input. See docs/CONTENT_FIXTURES.md.
 */
export const imageResizerContent: Partial<ToolPageContent> = {
  tier: "A",

  seo: {
    title: "Resize Images Online Without Uploading Them",
    description:
      "Change an image's width and height in your browser, with the aspect ratio locked by default. Nothing is uploaded, the original is untouched, and there is no cap.",
    keywords: [
      "resize image",
      "resize image online",
      "resize image without uploading",
      "change image dimensions",
      "scale down photo",
      "resize jpeg keep aspect ratio",
      "image resizer private",
    ],
  },

  hero: {
    h1: "Resize an Image Online",
    subtitle:
      "Set the width or height you need and download the scaled image. The aspect ratio is locked unless you unlock it, and the result comes back in the format you put in.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose an image", action: "upload" },
  },

  intro: {
    heading: "Why resizing saves more than compressing does",
    paragraphs: [
      "Resampling happens on a canvas: the image is decoded, drawn into a smaller rectangle so the browser interpolates between neighbouring pixels, and encoded again. The important arithmetic is that pixel count grows with the square of the dimensions. Halving the width also halves the height when the ratio is locked, which leaves a quarter of the pixels. That is why reducing dimensions is usually the far bigger lever: a 3840x2160 photograph taken down to 1920x1080 went from 2,057,152 bytes to 683,263, a saving of 66.8 percent, which is more than re-encoding the same file at a lower quality achieves.",
      "Most images on the internet are far larger than the space they are shown in, and every one of those extra pixels is paid for on every load while being invisible. A photograph displayed in an 800 pixel column does not benefit from being 4000 pixels wide. The cost of resizing is that it is one-way: interpolation throws away information, and scaling back up afterwards produces a soft approximation rather than the detail that was there. Resize a copy, and keep the original wherever the image might be re-used at a different size.",
    ],
  },

  features: [
    {
      icon: "Lock",
      title: "Aspect ratio locked by default",
      body: "Type a width and the height follows, so images do not end up stretched. Unlock it deliberately when you actually want to distort the frame.",
    },
    {
      icon: "FileCheck2",
      title: "The format survives the round trip",
      body: "A JPEG comes back as a JPEG and a PNG as a PNG, so a photograph does not silently become a much larger lossless file on the way through.",
    },
    {
      icon: "ShieldCheck",
      title: "Nothing is uploaded and nothing is overwritten",
      body: "The image is read locally and a new file is written to your downloads. The original on disk is untouched whatever dimensions you try.",
    },
    {
      icon: "Zap",
      title: "Immediate on ordinary photographs",
      body: "Scaling a 3840x2160 JPEG to half its width took 58 milliseconds. Even a 10.9 MB PNG completed in 212, without waiting on a network at either end.",
    },
  ],

  howItWorks: [
    {
      title: "Open your image",
      body: "Select a file and its current dimensions appear in the width and height boxes, so you always start from the real numbers rather than guessing.",
    },
    {
      title: "Enter the size you want",
      body: "Change either box and the other follows while the lock is on. For the web, match the width to the space the image will be displayed in rather than to the screen size.",
    },
    {
      title: "Download the resized copy",
      body: "The scaled image is saved to your downloads, named with its new dimensions, and the toast reports the resulting file size so you can see what the change bought.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "A photograph halved in each direction",
      description: "The standard case: a 4K photograph reduced to something reasonable for a page.",
      before: { label: "Input", detail: "3840x2160 JPEG, 2,057,152 bytes" },
      after: { label: "Output", detail: "1920x1080 JPEG, 683,263 bytes, 58 ms" },
      settings: "Aspect ratio locked, width set to 1920",
      explanation:
        "Half the width and half the height is a quarter of the pixels, and the file fell by 66.8 percent. That is a larger saving than re-encoding the original at a lower quality would have produced, and the image still exceeds most display sizes.",
    },
    {
      kind: "file",
      title: "A lossless PNG at the same target",
      description: "The same picture stored without compression, scaled identically.",
      before: { label: "Input", detail: "3840x2160 PNG, 10,887,764 bytes" },
      after: { label: "Output", detail: "1920x1080 PNG, 4,858,793 bytes, 212 ms" },
      settings: "Aspect ratio locked, width set to 1920",
      explanation:
        "Still a PNG afterwards, because the source was one. It fell by 55.4 percent and remains far heavier than the JPEG, which is what lossless storage of a photograph costs. Converting it would save considerably more than resizing did.",
    },
  ],

  measurements: {
    method: MEASURED_S1,
    rows: [
      {
        scenario: "3840x2160 JPEG down to 1920 wide",
        input: "2,057,152 bytes",
        output: "683,263 bytes",
        timing: "58 ms",
        note: "66.8% smaller, still JPEG",
      },
      {
        scenario: "3840x2160 PNG down to 1920 wide",
        input: "10,887,764 bytes",
        output: "4,858,793 bytes",
        timing: "212 ms",
        note: "55.4% smaller, still PNG",
      },
    ],
  },

  scenarios: {
    items: [
      {
        question: "What size should an image be for a website?",
        answer:
          "Match the width to the widest the image is ever displayed at, then double it if you are supporting high-density screens. A full-width banner rarely needs more than 2000 pixels, and an image in a content column rarely more than 1600.",
      },
      {
        question: "How do I resize a photo for a profile picture?",
        answer:
          "Most platforms want a square, so crop to square first and then resize to the dimensions they ask for, commonly 400x400 or 512x512. Resizing a rectangular photograph into a square without cropping stretches faces.",
      },
      {
        question: "How do I make an image smaller without stretching it?",
        answer:
          "Leave the aspect ratio locked, which is the default, and only change one of the two boxes. The other updates to keep the proportions, so the picture scales rather than distorts.",
      },
      {
        question: "How do I resize an image to an exact file size?",
        answer:
          "There is no direct way to target a byte count here. Reduce the dimensions, check the reported size, and adjust. Combining a smaller width with compression gets under a specific limit faster than either alone.",
      },
    ],
  },

  useCases: [
    {
      icon: "Code2",
      audience: "Preparing assets for the web",
      body: "Oversized images are the most common cause of a slow page. Scaling to the display size removes bytes that were never going to be seen, and doing it locally keeps unpublished work off other people's servers.",
    },
    {
      icon: "Briefcase",
      audience: "Meeting an upload requirement",
      body: "Job portals, visa applications and marketplace listings often specify exact pixel dimensions. Hitting them precisely is easier here than in an image editor you would otherwise have to open.",
    },
    {
      icon: "Mail",
      audience: "Sending photographs",
      body: "Reducing dimensions shrinks a photograph far more than compression does, which is usually the quickest route under an attachment limit when several images are involved.",
    },
    {
      icon: "GraduationCap",
      audience: "Documents and presentations",
      body: "Dropping full-resolution photographs into a slide deck or report bloats the file for no visible gain, since they are displayed at a fraction of their size anyway.",
    },
    {
      icon: "Smartphone",
      audience: "Anyone without an image editor",
      body: "On a managed laptop or a borrowed machine there may be nothing installed that can resize an image. A browser tab needs no permission and no installation.",
    },
    {
      icon: "Landmark",
      audience: "Handling sensitive photographs",
      body: "Identification documents, medical images and evidence photographs regularly need resizing to fit a form. This page cannot receive them, which removes the question of whether uploading is allowed.",
    },
  ],

  limitations: {
    items: [
      {
        title: "Enlarging cannot add detail",
        body:
          "Scaling up interpolates between pixels that already exist, so the result is a larger, softer version of the same information. It will not recover a licence plate or sharpen a distant face.",
      },
      {
        title: "Resampling is one-way",
        body:
          "The discarded pixels are gone. Going back to the original dimensions afterwards produces a blurry approximation, so resize a copy and keep the source when the image may be needed at another size.",
      },
      {
        title: "Metadata does not survive",
        body:
          "Redrawing through a canvas keeps pixels and nothing else, so EXIF including camera settings, capture time and GPS coordinates is dropped. Often welcome before publishing, occasionally a problem.",
      },
      {
        title: "One image at a time, and no cropping",
        body:
          "There is no batch mode and no way to change the framing here. Changing the aspect ratio without cropping first will stretch the picture rather than trim it.",
        alternative: "image-crop",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Does my image leave my device?",
      answer:
        "It does not. The picture is decoded, drawn at the new size and encoded again by your own browser, with no request made at any point. If you want to satisfy yourself, put the machine into aeroplane mode after this page has loaded and resize something; it works exactly as before.",
    },
    {
      question: "Will resizing reduce the quality?",
      answer:
        "Scaling down discards pixels, which is the point, and at normal viewing sizes the result looks the same because there were more pixels than the display could use. Quality loss only becomes visible if you then view the image much larger than its new dimensions.",
    },
    {
      question: "What format do I get back?",
      answer:
        "Whatever you put in. A JPEG returns a JPEG and a PNG returns a PNG, so a photograph does not become a much heavier lossless file on the way through. Formats a browser cannot encode, such as HEIC or GIF, come back as PNG.",
    },
    {
      question: "Why is my resized PNG still so large?",
      answer:
        "Because PNG stores every pixel exactly, which is expensive for photographic content. The measurement above went from 10.9 MB to 4.9 MB purely through resizing; converting the result to JPEG or WebP would take far more off than any further size reduction.",
    },
    {
      question: "How do I keep the proportions correct?",
      answer:
        "Leave the aspect lock on, which it is by default, and edit only one dimension. The other recalculates automatically. Turning the lock off lets you enter both independently, which stretches the image unless the numbers happen to match the original ratio.",
    },
    {
      question: "Can I make an image larger?",
      answer:
        "You can enter bigger numbers, and the browser will interpolate to fill them, but no detail is created. The output is a softer version of the same picture at a larger size, and for print or display work the right answer is usually to find a higher resolution original.",
    },
    {
      question: "Does it work with HEIC photographs from an iPhone?",
      answer:
        "Only if your browser can decode HEIC, which Safari on Apple devices can and most others cannot. Where it does work the output is written as PNG, since canvas cannot encode HEIC. Converting to JPEG first is the more reliable route.",
    },
    {
      question: "Is there a limit on image size or dimensions?",
      answer:
        "Nothing is imposed here. The practical ceiling is memory, because the image is held as raw pixels while it is redrawn: a 3840x2160 photograph is about 33 MB in that form. Browsers also cap canvas dimensions, typically in the tens of thousands of pixels per side.",
    },
    {
      question: "Can I resize a batch of images together?",
      answer:
        "No, this handles one at a time. That suits fitting a single image to a requirement and is slow for a folder of hundreds, where a desktop tool or a command line utility is the better choice.",
    },
    {
      question: "What are good dimensions for social media?",
      answer:
        "Platforms change these regularly, so check the current guidance rather than trusting a number here. As a rule they re-encode whatever you upload, so supplying something close to their stated size avoids a second round of compression on top of yours.",
    },
    {
      question: "Does resizing change the file on my computer?",
      answer:
        "No. A new file is written to your downloads folder and the original stays exactly where it was, at its original dimensions. Nothing here modifies anything in place.",
    },
    {
      topic: "offline",
      question: "Can I use this without an internet connection?",
      answer:
        "Yes, provided the page has loaded once. All the work is done by the browser's own image handling, so no connection is needed afterwards. Reloading while offline relies on the browser cache.",
    },
  ],

  related: [
    {
      name: "Compress Image",
      path: "/image-compressor",
      description: "Re-encode at a lower quality after reducing the dimensions.",
    },
    {
      name: "Convert Image Format",
      path: "/image-format-converter",
      description: "Turn a heavy resized PNG into a much smaller WebP or JPEG.",
    },
    {
      name: "Crop Image",
      path: "/image-crop",
      description: "Change the framing before resizing, to avoid stretching.",
    },
    {
      name: "Rotate and Flip",
      path: "/image-rotate-flip",
      description: "Fix orientation on photographs that came in sideways.",
    },
    {
      name: "Favicon Generator",
      path: "/favicon-generator",
      description: "Produce the small square icon sizes a site needs.",
    },
    {
      name: "Images to PDF",
      path: "/images-to-pdf",
      description: "Combine resized images into one document.",
    },
  ],

  headings: {
    features: { heading: "What this resizer gives you" },
    howItWorks: { heading: "How to resize an image in three steps" },
    examples: {
      heading: "Two resizes, measured",
      lede: "The same target dimensions against two formats, and what each saved.",
    },
    scenarios: { heading: "Specific situations" },
    useCases: { heading: "Who resizes images this way" },
    faq: { heading: "Resizing images: common questions" },
    related: { heading: "Other image tools" },
    limitations: {
      heading: "What resizing cannot do",
      lede: "Including the one people most often hope for.",
    },
  },
};
