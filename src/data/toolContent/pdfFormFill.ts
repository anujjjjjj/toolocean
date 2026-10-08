import type { ToolPageContent } from "@/types/toolContent";

/**
 * Tier A content for /pdf-form-fill.
 * Reads AcroForm fields (text, checkbox, radio, dropdown, list) and writes
 * values, with an optional flatten. Signature fields are reported and skipped.
 */
export const pdfFormFillContent: Partial<ToolPageContent> = {
  tier: "A",
  seo: {
    title: "Fill a PDF Form in the Browser",
    description:
      "Fill text, checkbox, radio, and dropdown fields on an AcroForm PDF, optionally flatten them, and download. The form stays on your device. No account.",
    keywords: [
      "fill pdf form",
      "fill pdf form offline",
      "flatten pdf form",
      "acroform filler",
      "fillable pdf no upload",
      "pdf form fill browser",
    ],
    datePublished: "2026-10-08",
    dateModified: "2026-10-08",
  },
  hero: {
    h1: "Fill a PDF form",
    subtitle:
      "Open an AcroForm, type into the fields it already has, and download. Flatten if the next person should see the answers as page content rather than as a form they can still edit.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a PDF", action: "upload" },
  },
  intro: {
    heading: "Only forms that are already forms",
    paragraphs: [
      "A fillable PDF stores an AcroForm: a list of named fields with types, and on the page a widget that shows the value. This tool reads that list. Text fields become text inputs, checkboxes become checkboxes, radio groups become a set of choices, and dropdowns and list boxes become menus of the options written in the file. You fill them and download. The field names are the names in the PDF, not names invented by this page.",
      "Flattening is optional and off by default. Left off, the download is still a form, with your values stored in the fields, so someone else can open it and change an answer. Turned on, the appearances are drawn into the page and the fields are removed, which is what you want for a copy that should not be edited again. A fixture with a text field, two radios, a dropdown, and a checkbox kept those values when saved unflattened, and after flattening the field list was empty while the answers were still visible in the page text. Signature fields are detected and skipped. This page does not sign forms.",
    ],
  },
  features: [
    {
      icon: "ListChecks",
      title: "The fields the file actually has",
      body: "Text, checkbox, radio, dropdown, and option list are shown. Read-only fields are shown disabled. A file with no AcroForm gets a clear message instead of an empty form.",
    },
    {
      icon: "Check",
      title: "Values written back under the same names",
      body: "Each control is keyed by the fully qualified field name. Radios and dropdowns only accept an option that already exists on the field, so a typo cannot invent a choice the form does not have.",
    },
    {
      icon: "Layers",
      title: "Flatten when the answers should stick",
      body: "The switch bakes appearances into the page and removes the AcroForm. Leave it off to keep the result fillable.",
    },
    {
      icon: "PenLine",
      title: "Signature fields are left alone",
      body: "A signature widget is listed as skipped. Filling it would imply a certificate this page does not create. A visual mark, if that is what you need, is a different tool.",
    },
  ],
  howItWorks: [
    {
      title: "Choose the PDF",
      body: "Pick a fillable PDF. The page lists every AcroForm field it can edit, with the type and, for choices, the options stored in the file.",
    },
    {
      title: "Fill the fields",
      body: "Type, tick, or select values. Read-only fields stay disabled. Empty text fields are left empty rather than filled with a placeholder.",
    },
    {
      title: "Download, flattened or still editable",
      body: "Leave Flatten off to keep a working form, or turn it on to burn the answers into the page. The browser saves a file named with -filled.",
    },
  ],
  examples: [
    {
      kind: "file",
      title: "A short form, still editable",
      description: "You are filling your part and someone else still needs to complete a field.",
      before: { label: "Input", detail: "AcroForm with text, radio, dropdown, and checkbox fields" },
      after: { label: "Output", detail: "The same fields, with values stored, form still present" },
      settings: "Flatten off",
      explanation:
        "On a fixture built with those four field types, the saved file still reported four fields, and the text, the selected radio, the dropdown choice, and the checkbox state matched what was entered. A later pass can change them, here or in any reader that edits AcroForms.",
    },
    {
      kind: "file",
      title: "The same form, flattened",
      description: "The answers are final and should survive a viewer that drops form editing.",
      before: { label: "Input", detail: "The filled form" },
      after: { label: "Output", detail: "No fields left, answers visible as page content" },
      settings: "Flatten on",
      explanation:
        "After flattening, inspecting the download reported no fields. The text that had been typed was still extractable from the page, which is what flatten is supposed to do: move the appearance out of the widget and into the page. It is not a screenshot of the whole document. Existing body text stays text.",
    },
  ],
  useCases: [
    {
      icon: "Receipt",
      audience: "An application that was built as a form",
      body: "The blank PDF has real fields. Filling them here keeps each answer in the named field, which matters if the recipient's process reads the form data rather than the printed page.",
    },
    {
      icon: "Briefcase",
      audience: "Sending a final copy",
      body: "You do not want the recipient to edit your answers by accident. Flatten, download, and send that file. Keep the unflattened download as well if you might need to correct something.",
    },
    {
      icon: "Landmark",
      audience: "A form you would rather not upload",
      body: "Tax-like worksheets, medical intake sheets, and HR forms are full of data you do not want on someone else's server. The fill happens in the tab. The file never needs to be transmitted for the fields to update.",
    },
    {
      icon: "Mail",
      audience: "A form that is not a form",
      body: "Some PDFs look like forms and are only drawn lines. This page will say there is nothing to fill. Printing and writing, or a visual mark, are the alternatives. It will not invent fields on top of underlines.",
    },
  ],
  limitations: {
    heading: "Forms this page cannot complete",
    items: [
      {
        title: "No fields are created",
        body: "If the PDF has no AcroForm, there is nothing to type into. Underlines drawn as vector lines are not fields, and this tool does not turn them into fields.",
      },
      {
        title: "XFA forms are not filled",
        body: "LiveCycle XFA forms, the XML-based forms some older Adobe tooling produced, are a different structure. If the file has no standard AcroForm fields, the page reports that it cannot fill it.",
      },
      {
        title: "Signature fields are skipped",
        body: "They are listed so you can see them, and they are not given a value. A certificate is not created.",
        alternative: "pdf-sign",
      },
      {
        title: "JavaScript and calculated fields are not executed",
        body: "A total that a desktop viewer computes with document scripts will not recompute here. The value you type is the value that is stored. Encrypted files are refused until they are unlocked.",
        alternative: "pdf-unlock",
      },
    ],
  },
  faqs: [
    {
      topic: "privacy",
      question: "Are the answers uploaded when the form is filled?",
      answer:
        "No. The PDF is parsed in the tab, the values stay in the form controls, and the download is written locally. Answers are not sent to analytics. The only copy of what you typed is the file you save, plus whatever the browser keeps in memory until you close the tab.",
    },
    {
      question: "Which field types can I fill?",
      answer:
        "Text fields, checkboxes, radio groups, dropdowns, and option lists. Each is rendered from the field dictionary in the file. Dropdowns and radios offer only the options the PDF already contains. A field marked read-only is shown and cannot be changed.",
    },
    {
      question: "What does flatten do?",
      answer:
        "It asks the library to draw each field's appearance onto the page and then remove the form. The download has no fields left to edit. Text you typed is still text in the page, which a test on a one-page fixture confirmed by extracting it after the field count had dropped to zero. Leave the switch off if the result must stay fillable.",
    },
    {
      question: "Will flatten turn the whole PDF into a picture?",
      answer:
        "No. Flatten affects field appearances. Paragraphs that were already text stay text. A scanned form that was only an image stays an image. You do not get a re-OCR, and you do not lose the text layer that was already there.",
    },
    {
      question: "Why does my form say there is nothing to fill?",
      answer:
        "The file has no AcroForm fields this parser can edit. That happens with flat PDFs that only look like forms, and with XFA forms. Drawing boxes on the page is not something this tool does. [Sign PDF](/pdf-sign) can place a visual mark if what you needed was a signature on a flat page.",
    },
    {
      question: "Can I sign the signature field?",
      answer:
        "No. Signature fields are reported and skipped. This page will not attach a certificate, and it will not draw into the signature widget. A visible mark on the page, which is not a certified signature, is [Sign PDF](/pdf-sign).",
    },
    {
      question: "Are calculated totals updated?",
      answer:
        "No. Field calculation scripts are not run. If a line is supposed to sum other lines inside a desktop PDF viewer, type the figure you want stored. The saved value is the value in the control, not a recomputed one.",
    },
    {
      question: "What happens to fields I leave blank?",
      answer:
        "Text left empty is saved as empty. Checkboxes left unticked are saved unticked. Radios and dropdowns with no selection are left unselected. Nothing is pre-filled on your behalf.",
    },
    {
      question: "Can I fill a password-protected form?",
      answer:
        "Not until it opens without a password. An encrypted file is refused. [Remove the password](/pdf-unlock) on a file you are allowed to open, and fill that copy.",
    },
    {
      question: "Will the filled file work in Adobe and in the browser viewer?",
      answer:
        "Unflattened output is a standard AcroForm with updated values, which current Acrobat and the PDF viewers in Chrome, Edge, and Firefox display. Flattened output no longer needs form support, because the answers are page content. A viewer that cannot run XFA is irrelevant here, because XFA was not written.",
    },
    {
      topic: "offline",
      question: "Can I fill the form offline?",
      answer:
        "Yes, after the page has loaded. Parsing the fields and writing the download do not use the network. There is no form-submission endpoint. If the original form was designed to submit to a URL, this tool does not call that URL. It only saves a file.",
    },
    {
      topic: "account",
      question: "Do I need an account to fill a PDF form?",
      answer:
        "No. The form is not stored against a user. When you leave the page, the values in the controls are gone unless you downloaded them.",
    },
    {
      topic: "size",
      question: "How many fields can this page show?",
      answer:
        "No fixed cap. Every field is listed, so a form with several hundred fields makes a long page and uses more memory. The practical limit is the device, not an account quota.",
    },
  ],
  related: [
    {
      name: "Sign PDF",
      path: "/pdf-sign",
      description: "Place a visual mark on a page that has no signature field you can cryptographically sign.",
    },
    {
      name: "Unlock PDF",
      path: "/pdf-unlock",
      description: "Remove a password you know so the form can be read and filled.",
    },
    {
      name: "Encrypt PDF",
      path: "/pdf-encrypt",
      description: "Password-protect the filled copy, and decide whether form filling stays allowed.",
    },
    {
      name: "PDF Metadata",
      path: "/pdf-metadata",
      description: "The form's author field is separate from the answers. Inspect or strip it on its own.",
    },
    {
      name: "PDF Merge",
      path: "/pdf-merge",
      description: "Append the filled form to the rest of a packet.",
    },
  ],
  headings: {
    features: { heading: "What gets filled", lede: "Existing AcroForm fields, written back under their own names." },
    howItWorks: { heading: "How to fill a PDF form", lede: "Open, fill, then choose whether to flatten." },
    examples: { heading: "Editable answers, and baked-in answers" },
    useCases: { heading: "When the PDF is already a form" },
    faq: { heading: "Questions about filling PDF forms locally" },
    related: { heading: "What to do with the filled file" },
  },
};
