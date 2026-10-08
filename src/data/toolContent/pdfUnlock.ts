import type { ToolPageContent } from "@/types/toolContent";

/**
 * Tier A content for /pdf-unlock.
 * Removes an encryption dictionary when the file already opens, or when the
 * user supplies the password they already know. No guessing, no wordlists.
 */
export const pdfUnlockContent: Partial<ToolPageContent> = {
  tier: "A",
  seo: {
    title: "Remove PDF Password You Know – No Upload",
    description:
      "Remove a PDF password you already know, or clear owner restrictions when the file already opens. One attempt, no wordlist, and the copy downloads from this tab.",
    keywords: [
      "unlock pdf",
      "remove pdf password",
      "decrypt pdf offline",
      "remove pdf restrictions",
      "unlock pdf no upload",
      "pdf owner password removal",
    ],
    datePublished: "2026-10-08",
    dateModified: "2026-10-08",
  },
  hero: {
    h1: "Remove a PDF password you know",
    subtitle:
      "Clear owner restrictions, or decrypt a file when you know the password. The copy that downloads has no encryption dictionary. This page does not guess passwords.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },
  intro: {
    heading: "For documents you are allowed to open",
    paragraphs: [
      "A PDF can be locked in two ways that look similar in a file picker and behave differently in a reader. An open password (the user password) stops the pages from being shown until the secret is typed. An owner password leaves the pages readable and attaches permission bits: do not print, do not copy, do not edit. Some files have both. This page handles the cases where you already have what the file needs. If the file opens with no password, the restrictions are cleared and a new file is written. If the file demands a password, you type the one you know, once, and the page either decrypts it or tells you that password was wrong.",
      "There is no wordlist, no mask, and no retry loop. A wrong password is a single failure. That is a product decision, not a missing feature. Removing a password from a document you own, or that the owner asked you to unlock, is a normal editing step. Searching for a password you do not have is a different activity, and it is not implemented here. The same library that writes AES-256 on the encrypt page reads it back when the password is correct, so a file protected on this site can be opened again on this site.",
    ],
  },
  features: [
    {
      icon: "LockOpen",
      title: "A report before anything is written",
      body: "After you choose a file, the page says whether it has no encryption, owner restrictions only, or a password that must be typed. You see that before the download button does anything.",
    },
    {
      icon: "KeyRound",
      title: "One password, one attempt",
      body: "If a password is required, you type it and press Remove password. A wrong secret stops there. Nothing tries the next guess, because there is no next guess.",
    },
    {
      icon: "FileText",
      title: "Title and author are kept",
      body: "The Info dictionary, title, author, dates, keywords, is copied onto the unlocked file. Unlocking removes the encryption dictionary. It does not wipe the metadata. That is a separate step.",
    },
    {
      icon: "ShieldCheck",
      title: "AES-256 revision 6 is readable",
      body: "Files this site's encrypt tool writes, and other PDFs that use the standard security handler, decrypt when the password is right. A custom security handler this library does not know is reported as a failure, not silently skipped.",
    },
  ],
  howItWorks: [
    {
      title: "Choose the PDF",
      body: "Pick the file. The page reads it locally and reports whether a password is required or only owner restrictions are present.",
    },
    {
      title: "Type the password if one is asked for",
      body: "Owner-only files need nothing. Files that refuse to open need the password you already have. The field is a single entry, not a search.",
    },
    {
      title: "Download the unlocked copy",
      body: "Press Remove password. A new file named with -unlocked is saved. It opens without a prompt, and qpdf reports it as not encrypted.",
    },
  ],
  examples: [
    {
      kind: "file",
      title: "Owner restrictions, no open password",
      description: "The PDF opens in a viewer, and copying or printing is greyed out.",
      before: { label: "Input", detail: "Readable PDF with an encryption dictionary and permission bits" },
      after: { label: "Output", detail: "The same pages, no encryption dictionary, Info fields preserved" },
      explanation:
        "Because the file loads without a user password, the page does not ask for one. The rewrite drops the encryption dictionary and writes the pages out in the clear. A check with qpdf on a fixture of this kind reported the output as not encrypted. The title and author strings were still present, because they were copied on purpose.",
    },
    {
      kind: "file",
      title: "A known open password",
      description: "You encrypted the file earlier, or someone sent you the password by another channel.",
      before: { label: "Input", detail: "AES-256 PDF that pdfinfo refuses without a password" },
      after: { label: "Output", detail: "A file pdfinfo opens with no -upw flag" },
      settings: "The correct open password typed once",
      explanation:
        "A fixture encrypted with this site's protect tool, then unlocked with the same password, opened in pdfinfo with Encrypted: no. The wrong password produced one error and no file. The page does not keep the rejected secret.",
    },
  ],
  useCases: [
    {
      icon: "Briefcase",
      audience: "A file you protected and now need to edit",
      body: "You set the password last month. You still have it. Unlock writes a working copy so merge, rotate, or form filling can run, then you can encrypt again if the finished file should be locked.",
    },
    {
      icon: "Printer",
      audience: "A client PDF that opens but will not print",
      body: "The sender gave you a file with printing turned off, and also the means to open it, or it opens with no prompt. Clearing the owner flags is what the print dialog was waiting for.",
    },
    {
      icon: "Files",
      audience: "Merging a packet that includes one locked file",
      body: "Merge refuses encrypted inputs. Unlock the one you are allowed to open, then merge the unlocked copy with the rest.",
    },
    {
      icon: "Landmark",
      audience: "An archive copy without a password you might lose",
      body: "A password you cannot find later is a destroyed document. If the archive should be readable by the future you, unlock it while you still know the secret and store the clear copy where you store other records.",
    },
  ],
  limitations: {
    heading: "What unlock will not do",
    items: [
      {
        title: "It will not search for a password",
        body: "One typed secret, one attempt. There is no dictionary, no incremental brute force, and no recovery of a password you have forgotten. If you do not know it, this page cannot help.",
      },
      {
        title: "Only documents you already have the right to open",
        body: "A password you were given, or a document you encrypted, is the intended input. Stripping protection from a file you were not allowed to read is outside what this page is for.",
      },
      {
        title: "Certificate security and unknown handlers fail",
        body: "Public-key PDF security, and vendor handlers the library does not implement, cannot be decrypted here. The error says the password was wrong or the file could not be read. It does not fall back to stripping bytes blindly.",
      },
      {
        title: "Metadata is not removed",
        body: "Author, title, and dates survive the unlock so the document still describes itself.",
        alternative: "pdf-metadata",
      },
    ],
  },
  faqs: [
    {
      topic: "privacy",
      question: "Does the password leave the browser when I unlock a file?",
      answer:
        "No. The file bytes and the password are used by the decryption routine in this tab. The password is not sent to analytics and is not stored. A wrong attempt is discarded with the error. The download is an unencrypted PDF on your disk, so treat that file as plaintext from then on.",
    },
    {
      question: "What is the difference between an open password and owner restrictions?",
      answer:
        "An open password is required before any page is drawn. Owner restrictions assume the pages can be shown and then ask the viewer not to print, copy, or edit. The inspection line on this page names which of those it found. Owner-only files unlock with the button alone. Open-password files need the secret typed in.",
    },
    {
      question: "Why is there only one chance to type the password?",
      answer:
        "Because a retry loop is how a guesser works, and this page is not a guesser. If you mistyped, reload the field and type the password you know. If you do not know it, another hundred tries on this site will not discover it, and they are not offered.",
    },
    {
      question: "Will the unlocked file still show the title and author?",
      answer:
        "Yes. Those Info fields are copied onto the new document before it is saved. A test of a file that had a title and an author showed both strings present after unlock, and absent only after a separate metadata strip. Use [PDF Metadata](/pdf-metadata) when the strings themselves should go.",
    },
    {
      question: "Can I unlock a file I encrypted on the protect page?",
      answer:
        "Yes, with the open password you set. The two tools share the AES-256 revision 6 handler. After unlock, pdfinfo reports the copy as not encrypted. You can then edit it and, if you want a password again, run it back through [Encrypt PDF](/pdf-encrypt).",
    },
    {
      question: "Merge said my PDF was encrypted. Where do I remove the password?",
      answer:
        "Here. [PDF Merge](/pdf-merge) and [PDF Split](/pdf-split) refuse an encryption dictionary because they cannot read the pages without the key. Unlock the file you are allowed to open, download the clear copy, and merge or split that copy.",
    },
    {
      question: "Does unlock also remove a digital signature?",
      answer:
        "Rewriting the file changes the bytes a cryptographic signature covered, so an existing certified signature will no longer validate. The page does not try to preserve a signature dictionary across the rewrite. If the signature is the record you need, keep the original locked file.",
    },
    {
      question: "What if the file has no password at all?",
      answer:
        "The inspection says it is not encrypted, and the button stays disabled. There is nothing to remove. You can still use the other PDF tools on it directly.",
    },
    {
      question: "Can I see the pages before I commit to the download?",
      answer:
        "The page tells you the lock type. It does not render a preview of an encrypted document before the password succeeds, because rendering would be the same as decrypting. After a successful unlock you have the file, and any viewer will show it.",
    },
    {
      question: "Are permission flags gone, or only ignored?",
      answer:
        "Gone from the output. The new file has no encryption dictionary, which qpdf reports as not encrypted. A viewer is not being asked to ignore flags. There are no flags left to ignore.",
    },
    {
      topic: "offline",
      question: "Can I unlock a PDF while offline?",
      answer:
        "Yes, after this page has loaded, including the decryption library. The password check and the rewrite do not contact a server. A forgotten password cannot be recovered offline either. Nothing on a server has it.",
    },
    {
      topic: "account",
      question: "Do I need an account to remove a PDF password?",
      answer:
        "No. There is no identity attached to the action, and no history of which files you unlocked stored on a server. The browser may keep the downloaded file in your downloads folder, which is your machine.",
    },
    {
      topic: "size",
      question: "Is there a size limit on the locked PDF?",
      answer:
        "No account quota. The encrypted bytes and the decrypted copy are both in memory while the rewrite runs. A very large file can fail on a device with little RAM, the same way any other local PDF tool on this site can.",
    },
  ],
  related: [
    {
      name: "Encrypt PDF",
      path: "/pdf-encrypt",
      description: "Put a password back on, with permission flags, after you have finished editing.",
    },
    {
      name: "PDF Merge",
      path: "/pdf-merge",
      description: "Join the unlocked copy with other files. Merge cannot read a file that is still encrypted.",
    },
    {
      name: "PDF Split",
      path: "/pdf-split",
      description: "Cut the unlocked copy into ranges. Split has the same restriction on encrypted input.",
    },
    {
      name: "PDF Metadata",
      path: "/pdf-metadata",
      description: "Strip the author and title that unlocking deliberately keeps.",
    },
    {
      name: "Sign PDF",
      path: "/pdf-sign",
      description: "Place a visual mark once the file opens without a password.",
    },
  ],
  headings: {
    features: { heading: "What unlock changes in the file", lede: "The encryption dictionary goes. The document information stays." },
    howItWorks: { heading: "How to unlock a PDF", lede: "The inspection, the password field, and the download." },
    examples: { heading: "Owner flags, and a password you know" },
    useCases: { heading: "When removing the password is the right next step" },
    faq: { heading: "Questions about unlocking your own PDF" },
    related: { heading: "Tools that need an unlocked file" },
  },
};
