import type { ToolPageContent } from "@/types/toolContent";
import { MEASURED_S2 } from "./shared";

/**
 * Tier A content for /heic-to-jpg.
 *
 * Figures from docs/CONTENT_FIXTURES.md session S2: two real iPhone-style HEIC
 * files, plus a copy of one with a 90 degree irot property added, which is how
 * orientation was checked.
 */
export const heicToJpgContent: Partial<ToolPageContent> = {
  tier: "A",

  seo: {
    title: "HEIC to JPG Converter: Free, Offline, No Upload",
    description:
      "Convert HEIC to JPG or PNG online free. iPhone photos are decoded on your device, kept upright, and saved one by one or as a ZIP. Nothing is uploaded.",
    keywords: [
      "heic to jpg",
      "convert heic to jpg online free",
      "heic to png",
      "heic converter",
      "iphone photo to jpg",
      "heif to jpg",
      "open heic on windows",
    ],
  },

  hero: {
    h1: "Convert HEIC to JPG or PNG",
    subtitle:
      "Turn iPhone HEIC photos into JPG or PNG in this tab. Drop one photo or a whole batch. The decoder runs on your device, so nothing is uploaded.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose HEIC photos", action: "upload" },
  },

  intro: {
    heading: "Why an iPhone photo will not open, and what this page does about it",
    paragraphs: [
      "Since iOS 11, the iPhone camera has saved photos as HEIC by default. HEIC is a HEIF container holding pictures compressed with HEVC, the same codec as a lot of modern video, which is why a 12 megapixel photo fits in two or three megabytes. Safari on Apple devices can show these files. Chrome, Firefox and Edge on Windows, Linux and Android mostly cannot, because the browser has no HEVC still-image decoder built in, and many web forms, older photo editors and print kiosks refuse the file outright.",
      "This page carries its own decoder. When you choose a photo it loads libheif, the open-source HEIF library, compiled to WebAssembly, and runs it in a background worker in your tab. The worker turns the HEIC into plain pixels, the page paints them onto a canvas, and the browser's own encoder writes a JPG or PNG. The decoder is about a megabyte, fetched once from this site and then kept in the browser's cache, so a second visit converts with no connection at all. Nothing about your photo is sent anywhere, which matters more than usual here: phone pictures are personal, and the HEIC usually carries the place it was taken.",
    ],
  },

  features: [
    {
      icon: "Layers",
      title: "A whole camera roll in one pass",
      body: "Choose or drop as many photos as you like. They are converted one after another by the same worker, each row shows its own result, and one bad file does not stop the rest.",
    },
    {
      icon: "Smartphone",
      title: "Portrait photos stay portrait",
      body: "HEIC stores rotation as a separate instruction rather than in the pixels. libheif applies it while decoding, and the canvas never rotates a second time, so a photo held upright comes out upright.",
    },
    {
      icon: "WifiOff",
      title: "Works with the network off",
      body: "After the first visit, the decoder and the page are both in your browser cache. Turn on flight mode and the conversion still finishes, which is the plainest proof that no server is involved.",
    },
    {
      icon: "Gauge",
      title: "Your choice of size or fidelity",
      body: "JPG has a quality slider that starts at 92 percent. PNG keeps every decoded pixel, at several times the size. Switching between them redoes the list with the new setting.",
    },
  ],

  howItWorks: [
    {
      title: "Choose your HEIC photos",
      body: "Drop them on the box or pick them. Each file is checked by its first bytes, not its name.",
    },
    {
      title: "Pick JPG or PNG",
      body: "JPG for sharing, with a quality slider. PNG when you will edit the picture further.",
    },
    {
      title: "Save one or all",
      body: "Each row has its own download. With two or more done, one button saves a ZIP.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "A small HEIC to JPG",
      description: "The common case: a photo someone sent you that will not open on a PC.",
      before: { label: "Input", detail: "1280 x 854 HEIC, 718,114 bytes" },
      after: { label: "Output", detail: "1280 x 854 JPG, 465,789 bytes, about 141 ms" },
      settings: "JPG, quality 92%",
      explanation:
        "The JPG came out 35 percent smaller than the HEIC here, because this file was saved at a generous HEVC quality. The same photo as PNG was 2,302,195 bytes, three times the original, with no visible gain on screen.",
    },
    {
      kind: "file",
      title: "A full-size camera photo",
      description: "Where HEIC earns its keep, and where the slider starts to matter.",
      before: { label: "Input", detail: "3992 x 2992 HEIC, 2,994,394 bytes" },
      after: { label: "Output", detail: "JPG, 3,529,036 bytes at 92%, or 2,322,615 at 80%" },
      settings: "JPG, quality 92% and 80%",
      explanation:
        "At 92 percent the JPG is 18 percent larger than the HEIC it came from. That is expected: HEVC compresses a photograph roughly twice as well as JPEG, so matching its quality costs bytes. Dropping the slider to 80 brought the file below the original, and the difference is hard to see without zooming in.",
    },
  ],

  measurements: {
    method: MEASURED_S2,
    rows: [
      {
        scenario: "1280x854 HEIC to JPG at quality 92",
        input: "718,114 bytes",
        output: "465,789 bytes",
        timing: "141 ms",
        note: "35% smaller than the HEIC",
      },
      {
        scenario: "1280x854 HEIC to PNG",
        input: "718,114 bytes",
        output: "2,302,195 bytes",
        timing: "175 ms",
        note: "3.2 times the HEIC",
      },
      {
        scenario: "3992x2992 HEIC to JPG at quality 92",
        input: "2,994,394 bytes",
        output: "3,529,036 bytes",
        timing: "1,023 ms",
        note: "18% larger than the HEIC",
      },
      {
        scenario: "3992x2992 HEIC to JPG at quality 80",
        input: "2,994,394 bytes",
        output: "2,322,615 bytes",
        note: "22% smaller than the HEIC",
      },
      {
        scenario: "3992x2992 HEIC to PNG",
        input: "2,994,394 bytes",
        output: "22,586,663 bytes",
        timing: "1,393 ms",
        note: "7.5 times the HEIC",
      },
    ],
  },

  scenarios: {
    items: [
      {
        question: "Someone sent me iPhone photos and Windows will not open them. What now?",
        answer:
          "Drop the .heic files on this page and keep JPG selected. Windows opens a JPG in Photos, Paint and every browser without any extension, and the converted file keeps the original pixel dimensions.",
      },
      {
        question: "A website form says my photo is the wrong file type.",
        answer:
          "Most forms accept JPG and PNG only. Convert to JPG, and if the form also has a size cap, lower the quality slider or run the result through the image compressor, which can aim at an exact kilobyte ceiling.",
      },
      {
        question: "How do I stop my iPhone saving HEIC in the first place?",
        answer:
          "Settings, Camera, Formats, then Most Compatible. New photos are saved as JPEG from then on. It does nothing for photos already taken, and the files get larger, which is why many people leave HEIC on and convert only what they share.",
      },
      {
        question: "Which should I choose for printing, JPG or PNG?",
        answer:
          "JPG at 92 percent or higher. Print shops expect it, and at that setting compression is not visible on paper. PNG makes a far larger file without making the print any sharper.",
      },
    ],
  },

  useCases: [
    {
      icon: "Smartphone",
      audience: "Moving photos from an iPhone to a Windows or Android device",
      body: "AirDrop and cloud folders often hand over the original HEIC. Converting on the receiving machine avoids installing a codec pack or a desktop app you will use once.",
    },
    {
      icon: "FileCheck2",
      audience: "Forms that accept JPG only",
      body: "Visa applications, job portals, school systems and insurance claims commonly reject HEIC. A converted JPG at the same dimensions usually passes on the first try.",
    },
    {
      icon: "Printer",
      audience: "Print kiosks and photo labs",
      body: "Many kiosks read JPG from a USB stick and nothing else. Converting a whole holiday folder at once, then saving it as one ZIP, keeps the trip to the shop short.",
    },
    {
      icon: "Briefcase",
      audience: "Work machines you cannot install software on",
      body: "A managed laptop rarely lets you add the HEVC extension. A browser tab needs no admin rights, and policy that forbids sending photos to outside services is respected, because nothing is sent.",
    },
    {
      icon: "Palette",
      audience: "Editing in tools that predate HEIC",
      body: "Older versions of photo editors and design tools cannot import HEIC. A PNG keeps every decoded pixel so nothing is lost before you start editing.",
    },
  ],

  limitations: {
    items: [
      {
        title: "Location and camera data are not copied",
        body:
          "The output holds pixels only. EXIF fields such as GPS position, capture time and camera model stay in the HEIC. That is often what you want before sharing, and inconvenient if a photo library sorts by date taken.",
      },
      {
        title: "Large files are capped at 50 MB each",
        body:
          "A phone HEIC is usually 1 to 5 MB. Anything over 50 MB is refused with a message instead of being decoded, so a mistaken pick cannot exhaust the tab's memory.",
      },
      {
        title: "Live Photo motion and bursts are not kept",
        body:
          "A file with several images gives you its main photo, and the row says so. The short video of a Live Photo is a separate file and is not converted.",
      },
      {
        title: "HDR and wide colour are flattened to standard JPG",
        body:
          "The canvas works in ordinary 8-bit colour, so the extra brightness range of an HDR photo is not carried across, and the Display P3 profile is not attached. Strong reds and greens can look slightly less saturated than in the Photos app.",
        alternative: "Exporting from Apple Photos on a Mac keeps HDR and the P3 colour profile.",
      },
      {
        title: "Very large photos can fail on iPhone and iPad Safari",
        body:
          "Mobile Safari limits canvas size, so a 48 megapixel photo may be too big to encode there. The row says so, and the same file converts on a desktop browser. Safari can also open HEIC directly without converting.",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Are my photos sent anywhere to be converted?",
      answer:
        "No. The decoder is a WebAssembly build of libheif that runs in a worker inside this tab, and the JPG or PNG is written by your browser's canvas. While a batch converts, the only requests the page makes are for its own script and decoder files, and with those cached it converts in flight mode.",
    },
    {
      question: "Will portrait photos come out sideways?",
      answer:
        "No. HEIC records rotation in a separate irot property instead of turning the pixels. libheif applies that property while decoding, and the converted pixels are drawn to the canvas without any further rotation. It was checked with a copy of a landscape photo carrying a 90 degree rotation: the output was 854 by 1280 and matched the turned original pixel for pixel.",
    },
    {
      question: "Why is my JPG bigger than the HEIC?",
      answer:
        "Because HEVC compresses photographs much more efficiently than JPEG. A 2,994,394 byte camera HEIC became 3,529,036 bytes at quality 92. Lower the slider to around 80 if size matters; that same photo then came out at 2,322,615 bytes.",
    },
    {
      question: "Should I convert HEIC to JPG or to PNG?",
      answer:
        "JPG for almost everything: sharing, forms, printing, the web. PNG only when you plan to edit the picture and save it repeatedly, since it never adds compression loss of its own. PNG was 7.5 times the size of the HEIC on a 12 megapixel photo.",
    },
    {
      question: "How many photos can I convert at once?",
      answer:
        "There is no count limit. Photos are converted one at a time so memory stays steady, and each one up to 50 MB is accepted. A 12 megapixel photo took about a second on the test machine; a phone will be slower.",
    },
    {
      question: "What does the error about a file not being HEIC mean?",
      answer:
        "The page reads the first bytes of every file to see what it really is. A HEIC starts with an ftyp box naming a brand such as heic or mif1. If the file is a JPEG or PNG that was given a .heic name, it is reported as already being that format; anything else is turned away before decoding.",
    },
    {
      question: "Can it convert AVIF too?",
      answer:
        "No. AVIF uses the same container as HEIC but a different codec, and this decoder handles only HEVC. An AVIF file is recognised and named in the error rather than failing silently. Recent Chrome, Firefox and Safari open AVIF without help.",
    },
    {
      question: "Is the GPS location removed from the converted photo?",
      answer:
        "Yes. Only pixels pass through the canvas, so EXIF metadata, including location, capture time and camera model, is not written into the JPG or PNG. Keep the original HEIC if you need that information later.",
    },
    {
      question: "Why does a row say the file holds more than one image?",
      answer:
        "HEIF can hold several pictures: a burst, an edited version beside the original, or extra images used by the camera. The page converts the one the file marks as primary, which is the photo you see in the Photos app.",
    },
    {
      topic: "offline",
      question: "Does it work offline?",
      answer:
        "Yes, once this page has loaded with a connection. The worker script and the decoder are stored in the browser's cache shortly after the page opens, before you choose anything, so later conversions need no network.",
    },
    {
      question: "Does converting reduce quality?",
      answer:
        "Every HEIC is already lossy, and JPG adds a little loss of its own. At the default 92 percent that extra loss is very hard to see. PNG adds none, which is why it is so much larger.",
    },
  ],

  related: [
    {
      name: "Compress Image",
      path: "/image-compressor",
      description: "Bring a converted JPG under an exact size limit for a form.",
    },
    {
      name: "Resize Image",
      path: "/image-resizer",
      description: "Scale a 12 megapixel photo down to what a website needs.",
    },
    {
      name: "Convert Image Format",
      path: "/image-format-converter",
      description: "Move a converted JPG or PNG on to WebP.",
    },
    {
      name: "Images to PDF",
      path: "/images-to-pdf",
      description: "Collect converted photos of documents into one PDF.",
    },
    {
      name: "Crop Image",
      path: "/image-crop",
      description: "Trim the frame after conversion.",
    },
    {
      name: "Rotate and Flip",
      path: "/image-rotate-flip",
      description: "Turn a photo that was taken sideways on purpose.",
    },
  ],

  headings: {
    features: { heading: "What this HEIC converter gives you" },
    howItWorks: { heading: "How to convert HEIC to JPG in three steps" },
    examples: {
      heading: "Two conversions, measured",
      lede: "A small photo where JPG wins on size, and a full camera photo where it does not.",
    },
    scenarios: { heading: "Specific situations" },
    useCases: { heading: "Who converts HEIC photos" },
    faq: { heading: "HEIC to JPG: common questions" },
    related: { heading: "Other image tools" },
    limitations: {
      heading: "What this converter will not do",
      lede: "Most of these are about what HEIC holds beyond the picture.",
    },
  },
};
