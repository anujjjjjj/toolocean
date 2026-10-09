import type { ToolPageContent } from "@/types/toolContent";

/**
 * Tier A content for /pdf-sign.
 * Behaviour described here matches PdfSignTool and applySignatureImage:
 * a PNG is drawn onto one chosen page. No certificate is created.
 */
export const pdfSignContent: Partial<ToolPageContent> = {
  tier: "A",
  seo: {
    title: "Sign PDF Online Free – Draw or Type, No Upload",
    description:
      "Draw or type a signature, or place a PNG, on one page and download. The mark is visual ink only, with no certificate, and the PDF stays in this tab.",
    keywords: [
      "sign pdf",
      "sign pdf without uploading",
      "add signature to pdf",
      "visual pdf signature",
      "draw signature on pdf",
      "pdf signature no account",
    ],
    datePublished: "2026-10-08",
    dateModified: "2026-10-08",
  },
  hero: {
    h1: "Sign a PDF online free",
    subtitle:
      "Draw a mark, type a name in a script face, or drop in a PNG, then put it on one page and download. The result is ink on the page. It is not a certified or qualified electronic signature.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },
  intro: {
    heading: "What this mark is, and what it is not",
    paragraphs: [
      "A PDF can carry two very different things that people both call a signature. One is a picture: strokes, a typed name, or a scan of ink, painted into the page content at a position you choose. The other is a cryptographic signature: a certificate, a byte range, a hash, and a trust decision a reader can verify. This page produces only the first. The download looks signed because a mark is visible. A reader that checks certificates will not report a valid digital signature, because none was made.",
      "That limit is the point of saying it up front. Plenty of everyday paperwork, a permission slip, an internal form, a scan you are sending back to a colleague, only needs the visible mark. A filing that demands a qualified electronic signature, or a contract whose counterpart checks the signature panel, needs a provider that issues certificates. Using a picture in that second case does not make the document signed in the legal sense those processes mean. The amber note above the controls repeats this so it is on the tool, not only in the essay below.",
    ],
  },
  features: [
    {
      icon: "FileSignature",
      title: "Three ways to make the mark",
      body: "Draw with a pointer on the pad, type a name and render it in a script face the browser has, or import a PNG or JPEG of a signature you already made. All three become a PNG before they are placed.",
    },
    {
      icon: "MoveVertical",
      title: "One page, a position you can see",
      body: "Pick the page, then drag the mark on a preview or nudge it with the sliders for left, top, and width. The preview uses the same fractions the file is written with.",
    },
    {
      icon: "Layers",
      title: "Existing text stays text",
      body: "The mark is drawn on top of the page. The page is not photographed. Words that were selectable before the mark was added are still selectable afterwards, except where the picture covers them.",
    },
    {
      icon: "AlertTriangle",
      title: "No certificate, on purpose",
      body: "There is no signature field, no private key, and no timestamp authority. If a workflow needs those, this download will fail that check, and the page says so before you start.",
    },
  ],
  howItWorks: [
    {
      title: "Choose the PDF",
      body: "Pick a file. The page count is read locally. An encrypted file is refused, with a pointer toward unlocking it first if you know the password.",
    },
    {
      title: "Draw, type, or import the mark",
      body: "Use the drawing pad and press Use this drawing, type a name and press Use this name, or choose a PNG or JPEG. The mark appears on the page preview.",
    },
    {
      title: "Place it and download",
      body: "Drag the mark or move the sliders, choose the page when there is more than one, then download. The file is named with -signed and saved to your device.",
    },
  ],
  examples: [
    {
      kind: "file",
      title: "A typed name on a one-page letter",
      description: "The usual case: a short letter that needs a visible name at the foot of the page.",
      before: { label: "Input", detail: "One-page PDF, selectable text, no signature field" },
      after: { label: "Output", detail: "Same page, with a script-face PNG of the name in the lower area" },
      explanation:
        "The typed name is rasterised in the browser, cropped to the ink, and drawn as an image. The letter's own text is still a text layer. Opening the file in a reader shows the name. The signature panel stays empty, because no signature dictionary was written.",
    },
    {
      kind: "file",
      title: "A transparent PNG on page two of a scan",
      description: "A signature exported from a drawing app, placed on a chosen page of a multi-page scan.",
      before: { label: "Input", detail: "Multi-page PDF plus a PNG with a transparent background" },
      after: { label: "Output", detail: "The PNG on the selected page only; other pages untouched" },
      explanation:
        "Only the page index you selected receives the image. A JPEG of ink on white paper keeps that white rectangle, which the preview shows before you download, so a box you did not want is visible while you can still move it.",
    },
  ],
  useCases: [
    {
      icon: "Mail",
      audience: "Sending a form back",
      body: "A club, a school, or a landlord asks for a signed copy and will look at the page, not at a certificate panel. A visible mark on the right page is what they asked for.",
    },
    {
      icon: "Briefcase",
      audience: "Internal approvals",
      body: "A draft that needs your name on it before it circulates inside a team, where the record of approval lives in the email thread rather than in a signature standard.",
    },
    {
      icon: "ScanLine",
      audience: "Marking a scan",
      body: "You already signed on paper, scanned it, and need the same kind of mark on a different page of a packet. Import the image of the ink and place it.",
    },
    {
      icon: "Landmark",
      audience: "Knowing when to stop",
      body: "If the instructions say qualified electronic signature, advanced electronic signature, or certificate, stop here. This page will not produce one, and pretending otherwise would waste the filing.",
    },
  ],
  limitations: {
    heading: "What this signature cannot do",
    lede: "The gaps are the reason to read this before you rely on the download.",
    items: [
      {
        title: "Not a certified or qualified signature",
        body: "No certificate chain, no PAdES or PKCS#7 signature, no long-term validation data. Readers that verify signatures will show none.",
        alternative: "Use a trust service or your organisation's signing platform when the process requires a certificate.",
      },
      {
        title: "Encrypted files are refused",
        body: "A PDF that needs a password to open cannot have a page drawn on until it is decrypted.",
        alternative: "pdf-unlock",
      },
      {
        title: "One mark, one page, per download",
        body: "The controls place a single image on the page you selected. Initials on every page, or a signature field that several people fill in turn, are a different product.",
      },
      {
        title: "Rewriting drops an existing digital signature",
        body: "Saving a new file changes bytes. Any cryptographic signature that was already on the document will no longer validate, because the byte range it covered has changed.",
      },
    ],
  },
  faqs: [
    {
      topic: "privacy",
      question: "Does the signed copy get uploaded while the mark is drawn?",
      answer:
        "No. The PDF and the mark are read with the File API and drawn with pdf-lib in this tab. The download is a blob URL on your machine. A network panel during the draw shows no request carrying the document.",
    },
    {
      question: "Will Adobe or Preview call this a valid digital signature?",
      answer:
        "No. Those panels look for a signature dictionary and a certificate. This tool never writes either. You will see the picture on the page and an empty signature panel. That is the correct result, not a glitch.",
    },
    {
      question: "Is a typed name the same as a drawn one?",
      answer:
        "On the page, both are images. Typing renders the letters in a script font the browser supplies, crops the transparent margin, and embeds that PNG. Drawing records your pointer strokes and does the same. Neither stores the text of the name as a PDF text object, so you cannot search for the signature the way you search the letter.",
    },
    {
      question: "Can I sign every page at once?",
      answer:
        "Not in one action. The page menu and the preview refer to a single page, and the download writes the image there only. Run it again on the same file if a second page needs its own mark, using the download as the next input.",
    },
    {
      question: "What if my signature photo has a white background?",
      answer:
        "The white comes with it. JPEG has no transparency, and a photo of paper is a rectangle of paper. The preview shows that rectangle on the page before you download. A PNG exported with a transparent background avoids the box.",
    },
    {
      question: "Does the original file on disk change?",
      answer:
        "No. The file you picked is read, and a separate download is written. Closing the tab discards the in-memory copy. Keep the original if you might need an unsigned version.",
    },
    {
      question: "Can I place the mark on an encrypted PDF?",
      answer:
        "Not directly. The open fails with a message to decrypt first. Clear it with [the unlock tool](/pdf-unlock) and sign the copy that opens.",
    },
    {
      question: "Will the mark print?",
      answer:
        "Yes, it is ordinary page content, so it prints with the page. It is not an annotation you can toggle off in a review pane. If you need the unsigned page later, use the original file.",
    },
    {
      question: "Which image formats can I import?",
      answer:
        "PNG, JPEG, and WebP. They are drawn through a canvas and embedded as PNG, so a WebP becomes a PNG inside the PDF. Very large photos are kept at their pixel size and then scaled to the width you set, which can make the download heavier than the letter was.",
    },
    {
      question: "Does this fill a signature form field?",
      answer:
        "No. AcroForm signature fields are left alone. Filling text, checkboxes, radios, and dropdowns is a different tool, and even that one does not create a cryptographic signature. A picture on the page and a signature field are different structures.",
    },
    {
      topic: "offline",
      question: "Can I sign after I disconnect?",
      answer:
        "Yes, once this page's script has loaded, including the PDF library and, for the preview, PDF.js. Disconnect and the draw, type, place, and download steps still run. Refreshing with no network only succeeds when those scripts are still cached.",
    },
    {
      topic: "account",
      question: "Do I need an account to sign?",
      answer:
        "No. There is no identity check, because this is not an identity product. Anyone with the page can place a mark. That is another reason it is not a qualified signature: nothing here binds the mark to a person.",
    },
    {
      topic: "size",
      question: "Is there a page or file limit?",
      answer:
        "None set by a server, because there is no server quota. The PDF and the preview bitmap both sit in memory. A long scanned packet is slower to preview than a one-page letter, and a phone will struggle sooner than a laptop.",
    },
  ],
  related: [
    {
      name: "Fill PDF Form",
      path: "/pdf-form-fill",
      description: "Type into AcroForm fields and flatten them, when the page is a real form rather than a letter that needs a mark.",
    },
    {
      name: "Unlock PDF",
      path: "/pdf-unlock",
      description: "Remove a password you already know so a locked file can be signed here.",
    },
    {
      name: "PDF Watermark",
      path: "/pdf-watermark",
      description: "Stamp repeating text across every page, which is a different job from a signature in one spot.",
    },
    {
      name: "PDF Merge",
      path: "/pdf-merge",
      description: "Join the signed page with the rest of a packet after the mark is in place.",
    },
    {
      name: "PDF Metadata",
      path: "/pdf-metadata",
      description: "See the author and producer strings, which a visual signature does not update.",
    },
  ],
  headings: {
    features: { heading: "What the visual signature includes", lede: "The controls on this page, and the one thing they refuse to pretend." },
    howItWorks: { heading: "How to place a signature on a PDF", lede: "The same three steps the page asks you to do." },
    examples: { heading: "What the download actually contains" },
    useCases: { heading: "When a visible mark is enough" },
    faq: { heading: "Questions about signing a PDF locally" },
    related: { heading: "PDF tools that sit next to this one" },
    limitations: { heading: "What this signature cannot do" },
  },
};
