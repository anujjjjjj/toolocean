import type { CategoryKey } from "@/data/toolCatalog";
import type { ToolBadgeKey, ToolFeature, ToolStep } from "@/types/toolContent";

/**
 * Category-level page defaults.
 *
 * These fill the sections that are genuinely identical across a category, so
 * per-tool authoring can focus on what is actually specific to that tool
 * (examples, use cases, real FAQs).
 *
 * Every claim here is factually true of every tool in the category — the site is
 * a static bundle with no backend, so "nothing is uploaded" is a description of
 * the architecture, not marketing. That distinction is what keeps shared copy on
 * the right side of the thin-content line: it is boilerplate because the fact is
 * boilerplate, not because we ran out of things to say.
 */

export interface CategoryProfile {
  /** Whether the tool's primary input is pasted text or a picked file. */
  ioMode: "text" | "file";
  /** Singular noun for the thing a user brings, e.g. "PDF", "image", "text". */
  subject: string;
  /** Plural/mass form used mid-sentence. */
  subjectPlural: string;
  badges: ToolBadgeKey[];
  features: ToolFeature[];
  howItWorks: ToolStep[];
}

/** Shared by every category — the privacy architecture does not vary. */
function privacyFeatures(subjectPlural: string): ToolFeature[] {
  return [
    {
      icon: "CloudOff",
      title: "Your data never leaves the tab",
      body: `There is no upload step and no server to receive one. The page loads once, then all work on your ${subjectPlural} happens in local JavaScript.`,
    },
    {
      icon: "Zap",
      title: "No upload or queue wait",
      body: "Processing starts the moment you press the button. You are not waiting on a network round-trip or a shared job queue, so results are effectively instant.",
    },
    {
      icon: "Infinity",
      title: "No caps or paywalls",
      body: "No daily limits, no per-file ceilings imposed by a server tier, no watermarks, and no account. The practical limit is your own device's memory.",
    },
  ];
}

const FILE_FEATURES: ToolFeature[] = [
  {
    icon: "WifiOff",
    title: "Keeps working offline",
    body: "Once the page has loaded you can go offline and it still works, because the code that does the job is already on your machine.",
  },
  {
    icon: "ShieldCheck",
    title: "Safe for confidential files",
    body: "Contracts, invoices, medical scans, and internal documents can be processed without them ever being transmitted — which is often the difference between being allowed to use a tool at work and not.",
  },
];

const TEXT_FEATURES: ToolFeature[] = [
  {
    icon: "WifiOff",
    title: "Keeps working offline",
    body: "Once the page has loaded you can go offline and it still works, because the code that does the job is already on your machine.",
  },
  {
    icon: "ShieldCheck",
    title: "Safe for secrets and production data",
    body: "API responses, tokens, and customer records can be inspected without pasting them into someone else's server log — the usual reason these tools are banned internally.",
  },
];

function textSteps(subject: string, verb: string, output: string): ToolStep[] {
  return [
    {
      title: `Paste your ${subject}`,
      body: `Paste directly into the editor, drop a file onto it, or use "Open file" to pick one from your device. Nothing is sent anywhere when you do.`,
    },
    {
      title: verb,
      body: "Adjust the options if you need to, then run it. Results appear beside your input so you can compare the two.",
    },
    {
      title: `Copy or download the ${output}`,
      body: "Copy the result to your clipboard in one click, or save it as a file. You can also keep editing and re-run as many times as you like.",
    },
  ];
}

function fileSteps(subject: string, verb: string): ToolStep[] {
  return [
    {
      title: `Choose your ${subject}`,
      body: `Pick a file from your device or drag it onto the page. It is read locally — the file is never transmitted.`,
    },
    {
      title: verb,
      body: "Set the options you want and run it. Progress is shown as your browser works through the file.",
    },
    {
      title: "Download the result",
      body: "Save the finished file straight back to your device. Nothing is retained after you close the tab.",
    },
  ];
}

const BASE_BADGES: ToolBadgeKey[] = ["browser-first", "no-uploads", "offline", "free"];

export const CATEGORY_PROFILES: Record<CategoryKey, CategoryProfile> = {
  dev: {
    ioMode: "text",
    subject: "text",
    subjectPlural: "text",
    badges: BASE_BADGES,
    features: [...privacyFeatures("input"), ...TEXT_FEATURES],
    howItWorks: textSteps("input", "Run the tool", "result"),
  },
  pdf: {
    ioMode: "file",
    subject: "PDF",
    subjectPlural: "PDFs",
    badges: BASE_BADGES,
    features: [...privacyFeatures("PDFs"), ...FILE_FEATURES],
    howItWorks: fileSteps("PDF", "Set your options"),
  },
  image: {
    ioMode: "file",
    subject: "image",
    subjectPlural: "images",
    badges: BASE_BADGES,
    features: [...privacyFeatures("images"), ...FILE_FEATURES],
    howItWorks: fileSteps("image", "Adjust and preview"),
  },
  video: {
    ioMode: "file",
    subject: "video",
    subjectPlural: "videos",
    badges: BASE_BADGES,
    features: [...privacyFeatures("videos"), ...FILE_FEATURES],
    howItWorks: fileSteps("video", "Choose the range and settings"),
  },
  audio: {
    ioMode: "file",
    subject: "audio file",
    subjectPlural: "audio files",
    badges: BASE_BADGES,
    features: [...privacyFeatures("audio files"), ...FILE_FEATURES],
    howItWorks: fileSteps("audio file", "Set the range and settings"),
  },
  spreadsheet: {
    ioMode: "file",
    subject: "spreadsheet",
    subjectPlural: "spreadsheets",
    badges: BASE_BADGES,
    features: [...privacyFeatures("spreadsheets"), ...FILE_FEATURES],
    howItWorks: fileSteps("spreadsheet", "Pick the sheet and columns"),
  },
  archive: {
    ioMode: "file",
    subject: "archive",
    subjectPlural: "archives",
    badges: BASE_BADGES,
    features: [...privacyFeatures("archives"), ...FILE_FEATURES],
    howItWorks: fileSteps("ZIP file", "Inspect the contents"),
  },
  csv: {
    ioMode: "text",
    subject: "CSV",
    subjectPlural: "CSV data",
    badges: BASE_BADGES,
    features: [...privacyFeatures("CSV data"), ...TEXT_FEATURES],
    howItWorks: textSteps("CSV", "Convert or validate", "result"),
  },
  compression: {
    ioMode: "text",
    subject: "text",
    subjectPlural: "data",
    badges: BASE_BADGES,
    features: [...privacyFeatures("data"), ...TEXT_FEATURES],
    howItWorks: textSteps("data", "Compress or decompress", "output"),
  },
  converter: {
    ioMode: "text",
    subject: "input",
    subjectPlural: "data",
    badges: BASE_BADGES,
    features: [...privacyFeatures("data"), ...TEXT_FEATURES],
    howItWorks: textSteps("input", "Convert", "output"),
  },
};
