import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S1 } from "./shared";

/**
 * Tier A content for /image-format-converter.
 *
 * All three conversions in the measurements table were run against the same
 * source photograph, which is what makes the comparison between WebP and JPEG
 * meaningful. See docs/CONTENT_FIXTURES.md.
 */
export const imageFormatConverterContent: Partial<ToolPageContent> = {
  tier: "A",

  seo: {
    title: "Convert Image Format: PNG, JPEG and WebP",
    description:
      "Convert between PNG, JPEG and WebP in your browser. WebP came out 18 percent smaller than JPEG on the same photograph, measured. Nothing is uploaded.",
    keywords: [
      "convert image format",
      "png to webp",
      "png to jpg",
      "jpg to png",
      "convert image without uploading",
      "webp converter online",
      "change image file type",
    ],
  },

  hero: {
    h1: "Convert Between Image Formats",
    subtitle:
      "Move an image between PNG, JPEG and WebP without uploading it. Each format is good at something different, and picking the wrong one can multiply your file size rather than reduce it.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose an image", action: "upload" },
  },

  intro: {
    heading: "Choosing between PNG, JPEG and WebP",
    paragraphs: [
      "These three formats make different bargains. PNG is lossless: it reproduces every pixel exactly and supports transparency, which makes it right for logos, screenshots, diagrams and anything with sharp edges or flat colour. JPEG discards detail the eye is weak at noticing and has no transparency, which makes it right for photographs. WebP does both jobs, with a lossy mode that is more efficient than JPEG and a lossless mode that usually beats PNG, and is supported by every current browser.",
      "On the same 3840x2160 photograph, converting to WebP at quality 0.92 produced 1,490,806 bytes while JPEG at the same setting produced 1,825,404: WebP is about 18 percent smaller for visually equivalent output. The direction that surprises people runs the other way. Converting that photograph from JPEG to PNG took it from 2,057,152 bytes to 16,015,580, nearly eight times larger, because PNG faithfully stores photographic noise that JPEG had been throwing away. PNG is not a higher quality version of a JPEG. Once detail has been discarded, storing the result losslessly preserves the loss at great expense.",
    ],
  },

  features: [
    {
      icon: "ArrowDownWideNarrow",
      title: "WebP, and a real reason to use it",
      body: "Measured at 18 percent smaller than JPEG on the same photograph at the same quality. Every current browser reads it, so the compatibility argument against it has expired.",
    },
    {
      icon: "Palette",
      title: "Transparency kept where the format allows it",
      body: "PNG and WebP both carry an alpha channel, so converting between them preserves transparent backgrounds. JPEG cannot, which is worth knowing before converting a logo.",
    },
    {
      icon: "CloudOff",
      title: "Conversion happens in the tab",
      body: "The image is decoded and re-encoded by your own browser. Nothing is transmitted, so unreleased artwork and personal photographs stay where they are.",
    },
    {
      icon: "Zap",
      title: "A second or less",
      body: "PNG to JPEG took 200 milliseconds on a 4K photograph and PNG to WebP 669. WebP costs more encoding time for its extra efficiency, which matters only in bulk.",
    },
  ],

  howItWorks: [
    {
      title: "Select the image",
      body: "Choose any image your browser can decode, including PNG, JPEG, WebP and GIF. It is read locally and drawn to a canvas at its original dimensions.",
    },
    {
      title: "Choose the output format",
      body: "Pick PNG, JPEG or WebP. For a photograph, WebP or JPEG. For a logo, a screenshot or anything with transparency, PNG or WebP.",
    },
    {
      title: "Convert and download",
      body: "The re-encoded image is saved with the matching extension. Lossy formats are written at quality 0.92, which is high enough that the difference is not visible on a photograph.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "PNG to WebP",
      description: "The conversion with the best return on a photographic source.",
      before: { label: "Input", detail: "3840x2160 PNG, 10,887,764 bytes" },
      after: { label: "Output", detail: "WebP, 1,490,806 bytes, 86.3% smaller, 669 ms" },
      settings: "Quality 0.92",
      explanation:
        "Eighty-six percent removed from a lossless original. The same source converted to JPEG at the same quality came out at 1,825,404 bytes, so WebP saved a further 18 percent for about three times the encoding time.",
    },
    {
      kind: "file",
      title: "JPEG to PNG",
      description: "The conversion people expect to improve things, which does the opposite.",
      before: { label: "Input", detail: "3840x2160 JPEG, 2,057,152 bytes" },
      after: { label: "Output", detail: "PNG, 16,015,580 bytes, 678% larger, 306 ms" },
      explanation:
        "Nearly eight times the size, and not one pixel better. PNG stores exactly what it is given, and what it was given had already had detail removed by JPEG. Converting to PNG protects an image from further loss in editing; it cannot undo loss that already happened.",
    },
  ],

  measurements: {
    method: MEASURED_S1,
    rows: [
      {
        scenario: "the photograph, PNG to WebP at quality 0.92",
        input: "10,887,764 bytes",
        output: "1,490,806 bytes",
        timing: "669 ms",
        note: "86.3% smaller",
      },
      {
        scenario: "the photograph, PNG to JPEG at quality 0.92",
        input: "10,887,764 bytes",
        output: "1,825,404 bytes",
        timing: "200 ms",
        note: "83.2% smaller, 18% bigger than WebP",
      },
      {
        scenario: "the photograph, JPEG to PNG",
        input: "2,057,152 bytes",
        output: "16,015,580 bytes",
        timing: "306 ms",
        note: "larger, and no better",
      },
    ],
  },

  scenarios: {
    items: [
      {
        question: "Which format should I use for photographs on a website?",
        answer:
          "WebP, with JPEG as a fallback only if you still support browsers old enough to need it. The measurement above puts WebP 18 percent below JPEG at matched quality on the same image, and that saving applies to every visitor.",
      },
      {
        question: "How do I convert a PNG logo without losing its transparent background?",
        answer:
          "Convert to WebP rather than JPEG. Both PNG and WebP carry an alpha channel, so the transparency survives. JPEG has none, and the transparent areas will come back filled in.",
      },
      {
        question: "How do I convert a WebP someone sent me into something I can open?",
        answer:
          "Convert it to PNG if you need it lossless for editing, or JPEG if it is a photograph and size matters. Most software reads WebP now, but older desktop applications sometimes still do not.",
      },
      {
        question: "Why would anyone convert a JPEG to PNG?",
        answer:
          "Only to stop further loss. If an image is about to go through several rounds of editing and saving, working in PNG prevents each save from degrading it again. It costs a great deal of space and recovers nothing already lost.",
      },
    ],
  },

  useCases: [
    {
      icon: "Code2",
      audience: "Front-end and site performance work",
      body: "Switching photographic assets to WebP is one of the few changes that reduces page weight substantially without any visible difference. On a media-heavy page the saving compounds across every image.",
    },
    {
      icon: "Palette",
      audience: "Design handoff",
      body: "Logos and interface assets need lossless formats with transparency, while the photographs alongside them do not. Converting each to what suits it avoids shipping everything as the heaviest common denominator.",
    },
    {
      icon: "Briefcase",
      audience: "Meeting a format requirement",
      body: "Upload forms frequently accept only JPEG or PNG and reject anything else. Converting locally is faster than finding software that will, particularly on a managed machine.",
    },
    {
      icon: "Smartphone",
      audience: "Making phone photographs usable elsewhere",
      body: "Modern phones produce formats that older desktop software cannot open. Converting to JPEG or PNG makes an image portable without involving a service that would keep a copy.",
    },
    {
      icon: "Database",
      audience: "Reducing stored image weight",
      body: "A library of PNG exports converted to WebP typically loses most of its size. Doing it locally means archives of personal or client images never leave the machine.",
    },
    {
      icon: "GraduationCap",
      audience: "Documents and slides",
      body: "Embedding lossless photographs in a report inflates it enormously. Converting them first keeps the document small enough to email without anyone noticing a difference on screen.",
    },
  ],

  limitations: {
    items: [
      {
        title: "Converting to PNG will usually make a photograph much bigger",
        body:
          "Measured at nearly eight times the original on a 4K image. PNG is the right choice for graphics and the wrong one for photographic content, and it cannot restore detail an earlier lossy save removed.",
      },
      {
        title: "Transparency is lost when converting to JPEG",
        body:
          "JPEG has no alpha channel, so transparent regions are flattened during conversion. A logo intended to sit on a coloured background will come back with a background of its own.",
      },
      {
        title: "Quality is fixed at 0.92 for lossy output",
        body:
          "There is no slider here; the setting is high enough to be visually lossless on photographs and therefore conservative on size. Use the compressor when you want to trade visible quality for a smaller file.",
        alternative: "image-compressor",
      },
      {
        title: "Only PNG, JPEG and WebP can be written",
        body:
          "The browser can decode more formats than it can encode, so a GIF or an SVG can go in but not come out. Animated inputs are flattened to their first frame, and AVIF output is not available.",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Is my image sent to a server to be converted?",
      answer:
        "No. Decoding and re-encoding are both done by your browser, and no request leaves the page while you work. The conversion also runs perfectly well with the network disconnected, which is the clearest demonstration that no server is involved.",
    },
    {
      question: "Is WebP actually smaller than JPEG?",
      answer:
        "Yes, measurably. The same photograph at the same quality setting produced 1,490,806 bytes as WebP and 1,825,404 as JPEG, so WebP was about 18 percent smaller. It took roughly three times as long to encode, which is irrelevant for one image and worth considering for thousands.",
    },
    {
      question: "Do all browsers support WebP now?",
      answer:
        "Every current browser does, including Safari since 2020. The remaining gaps are old operating systems and some desktop applications, so WebP is safe for the web and occasionally awkward as an interchange format with other software.",
    },
    {
      question: "Will converting a JPEG to PNG improve its quality?",
      answer:
        "No, and this is the most common misunderstanding about formats. PNG stores precisely what it is handed. Detail a JPEG encoder discarded is not in the file any more, so converting preserves the degraded version at roughly eight times the size.",
    },
    {
      question: "What happens to a transparent background?",
      answer:
        "It survives conversion to PNG or WebP, both of which have an alpha channel, and is lost converting to JPEG, which does not. Convert transparent graphics to WebP if you want them smaller without losing the transparency.",
    },
    {
      question: "Can I convert an animated GIF?",
      answer:
        "Only its first frame. The image is drawn once to a canvas, so animation is not carried through and you get a still. Converting animation needs a video or animated WebP encoder, which this is not.",
    },
    {
      question: "Does conversion change the dimensions?",
      answer:
        "No. The image is drawn at its natural size, so the pixel dimensions are identical afterwards and only the encoding changes. Resize separately if the image is larger than it needs to be.",
    },
    {
      question: "Is EXIF data carried over?",
      answer:
        "No. Only pixels pass through the canvas, so camera information, capture time and GPS coordinates are dropped. Useful before publishing a photograph, inconvenient if you were depending on those fields.",
    },
    {
      question: "Which format should I choose for a screenshot?",
      answer:
        "PNG, or lossless WebP. Screenshots are full of text and sharp edges, exactly what lossy encoders handle badly: a JPEG screenshot shows fringing around letters that makes small text harder to read.",
    },
    {
      question: "Can I convert several images at once?",
      answer:
        "Not here, it is one at a time. That fits converting an asset or two and is impractical for a library, where a desktop batch tool or a build step will serve you better.",
    },
    {
      question: "Why did my WebP conversion take longer than JPEG?",
      answer:
        "Because WebP does more work to achieve its smaller output. On the 4K photograph it took 669 milliseconds against 200 for JPEG, and returned a file 18 percent smaller in exchange.",
    },
    {
      topic: "offline",
      question: "Does conversion work offline?",
      answer:
        "Yes, once the page has loaded. The encoders are part of your browser rather than something fetched, so conversion continues to work with no connection at all.",
    },
  ],

  related: [
    {
      name: "Compress Image",
      path: "/image-compressor",
      description: "Trade visible quality for size with a slider you control.",
    },
    {
      name: "Resize Image",
      path: "/image-resizer",
      description: "Reduce dimensions, which often saves more than a format change.",
    },
    {
      name: "Image to Base64",
      path: "/image-to-base64",
      description: "Embed a converted image directly into CSS or HTML.",
    },
    {
      name: "Crop Image",
      path: "/image-crop",
      description: "Trim the frame before converting.",
    },
    {
      name: "Favicon Generator",
      path: "/favicon-generator",
      description: "Produce the PNG icon sizes a website needs.",
    },
    {
      name: "SVG to PNG",
      path: "/svg-png",
      description: "Rasterise vector artwork, which this converter does not read.",
    },
  ],

  headings: {
    features: { heading: "What this converter gives you" },
    howItWorks: { heading: "How to convert an image in three steps" },
    examples: {
      heading: "Two conversions, measured",
      lede: "One that saves most of the file, and one that multiplies it.",
    },
    scenarios: { heading: "Specific situations" },
    useCases: { heading: "Who converts image formats" },
    faq: { heading: "Converting image formats: common questions" },
    related: { heading: "Other image tools" },
    limitations: {
      heading: "What this converter will not do",
      lede: "Starting with the conversion that costs you the most.",
    },
  },
};
