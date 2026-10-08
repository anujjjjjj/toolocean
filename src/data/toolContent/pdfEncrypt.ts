import type { ToolPageContent } from "@/types/toolContent";

/**
 * Tier A content for /pdf-encrypt.
 * Encryption is AES-256 revision 6 via @cantoo/pdf-lib. Checked with poppler
 * pdfinfo and qpdf on a fixture produced by scripts/verify-pdf-tools.ts.
 */
export const pdfEncryptContent: Partial<ToolPageContent> = {
  tier: "A",
  seo: {
    title: "Encrypt a PDF Offline, No Account",
    description:
      "Set an open password and an optional owner password on a PDF, with permission flags, using AES-256 in the browser. The file and the password stay on the device.",
    keywords: [
      "password protect pdf",
      "encrypt pdf",
      "encrypt pdf offline",
      "pdf owner password",
      "aes-256 pdf",
      "protect pdf no upload",
    ],
    datePublished: "2026-10-08",
    dateModified: "2026-10-08",
  },
  hero: {
    h1: "Password-protect a PDF",
    subtitle:
      "Give the file an open password, and optionally a different owner password that controls printing, copying, and editing. The cipher is AES-256. The work stays in the tab.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },
  intro: {
    heading: "Two passwords, and what each one means",
    paragraphs: [
      "PDF encryption, in the form readers actually implement, is not a single secret. The open password (the user password in the specification) is what a viewer demands before it will show pages. The owner password is a second secret that bypasses the permission flags: printing, copying text, changing pages, annotating, filling forms, accessibility extraction, and assembling pages. If both secrets are the same string, anyone who can open the file can also ignore the flags. The flags only constrain people who open with the user password and do not know the owner password.",
      "This page defaults to AES-256, security handler revision 6, which is the algorithm ISO 32000-2 still recommends. On a one-page fixture encrypted here, poppler's pdfinfo refused to describe the file until the open password was supplied, then reported Encrypted: yes and algorithm AES-256. qpdf reported R = 6 and AESv3 on streams and strings, and the permission bits matched the checkboxes used for that run: low-resolution printing allowed, high-resolution printing and copying not allowed. Those checks were run in this repository against the file the same library writes. They are not a brochure number.",
    ],
  },
  features: [
    {
      icon: "Lock",
      title: "An open password that readers ask for",
      body: "The open password is required. It is confirmed by typing it twice. The download will not open in pdfinfo, qpdf, or a normal viewer until that password is given.",
    },
    {
      icon: "Settings2",
      title: "A separate owner password for the flags",
      body: "Leave the owner password blank and it is stored as a copy of the open password, which means the checkboxes do not bind the opener. The page blocks a download that unchecks a permission unless the owner password is different.",
    },
    {
      icon: "Printer",
      title: "Permission flags, named plainly",
      body: "Printing can be high resolution, low resolution, or refused. Copying, editing page content, annotations, form filling, accessibility extraction, and page assembly are each a checkbox.",
    },
    {
      icon: "ShieldCheck",
      title: "AES-256, not a homemade scramble",
      body: "The file is encrypted by the PDF security handler, revision 6. A reader that supports modern PDF encryption can open it. A toy that only base64-encodes the bytes cannot.",
    },
  ],
  howItWorks: [
    {
      title: "Choose the PDF",
      body: "Pick a file that is not already encrypted. A locked file is refused, because this page will not ask you to stack a second password on ciphertext it cannot read.",
    },
    {
      title: "Set the passwords and the flags",
      body: "Type the open password twice. Add a different owner password if you unchecked anything or limited printing. The note under the fields explains why the two secrets have to differ for the flags to mean something.",
    },
    {
      title: "Download the protected file",
      body: "Press Download protected PDF. The cipher runs locally and the browser saves a file named with -protected. Open that file in a reader and confirm it asks for the password before you delete the original.",
    },
  ],
  examples: [
    {
      kind: "file",
      title: "Open password only, every permission left on",
      description: "You want the file to ask for a password, and you do not need to stop the opener from printing.",
      before: { label: "Input", detail: "An ordinary PDF, no encryption dictionary" },
      after: { label: "Output", detail: "AES-256 revision 6, open password required, owner password equal to it" },
      settings: "Open password set, owner password left blank, all permission checkboxes left on",
      explanation:
        "Blank owner password is filled with the open password so the file is not left with an empty owner secret. Because the secrets match, the flags would not constrain the opener anyway, which is why they are left enabled. pdfinfo on a fixture of this shape reports Encrypted: yes and will not print metadata until the password is passed with -upw.",
    },
    {
      kind: "file",
      title: "Open password plus a stricter owner password",
      description: "A client may read the document, and should not copy text out of it.",
      before: { label: "Input", detail: "A text PDF you can open today" },
      after: { label: "Output", detail: "Copying off, high-resolution printing off, two different passwords" },
      settings: "Copying unchecked, printing set to low resolution, owner password different from the open password",
      explanation:
        "qpdf --show-encryption on that fixture reported extract for any purpose: not allowed, and print high resolution: not allowed, with the supplied user password identified as the user password rather than the owner password. Viewers are supposed to honour those bits. Some tools ignore permission bits once they can decrypt, which is a property of those tools, not a second lock this page can add.",
    },
  ],
  useCases: [
    {
      icon: "Mail",
      audience: "Emailing a draft",
      body: "The attachment should not be readable by anyone who forwards the mailbox. An open password, shared by another channel, is the usual pattern. This page can set that password without the attachment visiting a server.",
    },
    {
      icon: "Briefcase",
      audience: "A client copy that should not be copied out",
      body: "You want them to read and print at low resolution, and you want a different owner password so the flags apply to the password you send them. Set both secrets and uncheck copying.",
    },
    {
      icon: "Receipt",
      audience: "A payslip or a statement",
      body: "The document is already sensitive. Encrypting it on the machine that holds it avoids handing the plaintext to a website in order to get a password on it.",
    },
    {
      icon: "Landmark",
      audience: "A file you will archive",
      body: "You want a standard encryption dictionary a future reader can still open, rather than a zip-with-a-password wrapped around the PDF. AES-256 revision 6 is that dictionary.",
    },
  ],
  limitations: {
    heading: "What password protection does not guarantee",
    items: [
      {
        title: "A weak password is a weak password",
        body: "AES-256 does not rescue a secret that is short or obvious. This page does not score the password or refuse short ones. Choose something you would trust for the document.",
      },
      {
        title: "Permission flags are not a second lock",
        body: "Once software can derive the encryption key, it can ignore the permission bits. Many readers obey them. Some utilities do not. Do not treat unchecked Copy as a technical inability to copy.",
      },
      {
        title: "Already-encrypted files are refused",
        body: "Stacking passwords would require reading the current plaintext first.",
        alternative: "pdf-unlock",
      },
      {
        title: "Very old viewers may not open revision 6",
        body: "AES-256 revision 6 needs a reader from the last several years. Acrobat and current Preview, Chrome, Edge, and Firefox open it. Software stuck on PDF 1.4-era handlers may not.",
      },
    ],
  },
  faqs: [
    {
      topic: "privacy",
      question: "Is the password sent anywhere while the file is encrypted?",
      answer:
        "No. The password is read from the form and passed into the encryption routine in this tab. It is not written to analytics, not stored in localStorage, and not attached to a request. The download is the only copy that leaves the page, and it leaves to your disk.",
    },
    {
      question: "Which algorithm is written into the file?",
      answer:
        "AES-256, security handler revision 6 (qpdf reports this as R = 6 and AESv3). The PDF header is raised to the version that handler requires. RC4 is not offered. It is obsolete, and the library refuses it unless a caller explicitly opts into weak cryptography, which this page does not.",
    },
    {
      question: "What happens if I leave the owner password empty?",
      answer:
        "It is set equal to the open password. That is deliberate. An empty owner password can mean anyone who opens the file is the owner. If you also unchecked a permission, the download is blocked until you supply a different owner password, because otherwise the checkbox would not apply to the person you send the open password to.",
    },
    {
      question: "Why can the opener still copy text if I unchecked Copy?",
      answer:
        "Only if they also know the owner password, or if their software ignores permission bits. With two different passwords, a conforming reader restricts the open password. qpdf, given the open password, reports the restriction. Given the owner password, it reports owner access. A tool that decrypts and rewrites the file can drop the flags entirely. The unlock page on this site is one of those tools, and it expects a secret you were given rather than one you are hunting for.",
    },
    {
      question: "Does encryption also hide the author and title?",
      answer:
        "The Info strings are inside the encrypted file, so a reader that has not been given the password does not show them. pdfinfo on the fixture printed nothing but an incorrect-password error until -upw was set. After the password, the title and author were visible again. Encryption is not a metadata eraser. Use the metadata tool on the plaintext first if the author string itself should be gone.",
    },
    {
      question: "Can I encrypt a PDF that is already password protected?",
      answer:
        "Not on this page. The file is opened with the stock PDF library, which stops on an encryption dictionary. Open [the unlock tool](/pdf-unlock) for a secret you already hold, then protect the result.",
    },
    {
      question: "Will Chrome's built-in viewer open the download?",
      answer:
        "Current Chrome, Edge, Firefox, Preview, and Acrobat open AES-256 revision 6 and prompt for the open password. That was the behaviour pdfinfo and qpdf also showed: no password, no document; the right password, the document. A viewer from before this handler existed may refuse the file.",
    },
    {
      question: "Is the original replaced?",
      answer:
        "No. You download a new file with -protected in the name. The file you selected stays where it was. Delete it yourself if the plaintext should not remain next to the encrypted copy.",
    },
    {
      question: "How long can the password be?",
      answer:
        "The field will take a normal passphrase. Revision 6 is specified for long Unicode passwords, unlike the old 32-byte limit on earlier handlers. This page does not truncate to 32 bytes. Avoid a password you cannot type again. There is no recovery.",
    },
    {
      question: "Does this stop someone editing the PDF in another tool?",
      answer:
        "It stops a conforming reader from editing when they only have the open password and modifying is unchecked. It does not stop someone who has the owner password, and it does not stop a program that decrypts with a password it was given and writes a new file. The password is the control. The checkbox is a request to viewers.",
    },
    {
      topic: "offline",
      question: "Does encryption need a network connection?",
      answer:
        "Not after the page has loaded the encryption library, which is downloaded only when you open this tool. The cipher uses the Web Crypto random source in the browser and does not call a key server. There is no key escrow.",
    },
    {
      topic: "account",
      question: "Is an account required to set a PDF password?",
      answer:
        "No. An account would be a place to store the password, which is the opposite of what you want. Nothing here remembers it for you. Write it down in whatever password store you already use.",
    },
    {
      topic: "size",
      question: "Will the protected file be much larger?",
      answer:
        "Encryption wraps the existing streams. The fixture grew by a few kilobytes of handler data, not by a second copy of the pages. A 10 MB PDF stays on the order of 10 MB. There is no server size cap. Memory on your device is the limit, because the whole file is held while it is rewritten.",
    },
  ],
  related: [
    {
      name: "Unlock PDF",
      path: "/pdf-unlock",
      description: "Take the password off again, if you know it, or clear owner restrictions on a file that already opens.",
    },
    {
      name: "PDF Metadata",
      path: "/pdf-metadata",
      description: "Remove the author and title before you encrypt, if those strings should not be inside either.",
    },
    {
      name: "Sign PDF",
      path: "/pdf-sign",
      description: "Place a visual mark first. Signing after encryption means unlocking, marking, then encrypting the result.",
    },
    {
      name: "PDF Merge",
      path: "/pdf-merge",
      description: "Join documents before protecting them. A locked file cannot be merged until it is unlocked.",
    },
    {
      name: "Fill PDF Form",
      path: "/pdf-form-fill",
      description: "Fill fields before you lock the file, or leave form filling allowed for the open password.",
    },
  ],
  headings: {
    features: { heading: "What the protected file contains", lede: "Passwords, permission flags, and the cipher, as they are written." },
    howItWorks: { heading: "How to password-protect a PDF", lede: "Match these steps to the fields on the page." },
    examples: { heading: "Two setups, checked with real readers" },
    useCases: { heading: "When an open password is the right control" },
    faq: { heading: "Questions about PDF passwords" },
    related: { heading: "What to do before or after encrypting" },
  },
};
