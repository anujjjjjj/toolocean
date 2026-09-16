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
  /** Appended after a tool's own authored cards, never replacing them. */
  sharedFeatures: ToolFeature[];
  howItWorks: ToolStep[];
}

/*
 * Shared by every category — the privacy architecture does not vary.
 *
 * Cut from five cards to two. The other three ("no queue wait", "keeps working
 * offline", "safe for confidential files") were 169 words repeated byte-for-byte
 * on every page in a category, and they say things the hero badges already say
 * and the per-tool FAQs can say better with specifics. What is left is the pair
 * of claims that are structural facts about the site rather than marketing, so
 * repeating them identically is correct: they are boilerplate because the fact
 * is boilerplate.
 */
function sharedFeatures(subjectPlural: string): ToolFeature[] {
  return [
    {
      icon: "CloudOff",
      title: "Your data never leaves the tab",
      body: `There is no upload step and no server to receive one. The page loads once, then all work on your ${subjectPlural} happens in local JavaScript.`,
    },
    {
      icon: "Infinity",
      title: "No caps or paywalls",
      body: "No daily limits, no per-file ceilings imposed by a server tier, no watermarks, and no account. The practical limit is your own device's memory.",
    },
  ];
}

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
    sharedFeatures: sharedFeatures("input"),
    howItWorks: textSteps("input", "Run the tool", "result"),
  },
  pdf: {
    ioMode: "file",
    subject: "PDF",
    subjectPlural: "PDFs",
    badges: BASE_BADGES,
    sharedFeatures: sharedFeatures("PDFs"),
    howItWorks: fileSteps("PDF", "Set your options"),
  },
  image: {
    ioMode: "file",
    subject: "image",
    subjectPlural: "images",
    badges: BASE_BADGES,
    sharedFeatures: sharedFeatures("images"),
    howItWorks: fileSteps("image", "Adjust and preview"),
  },
  video: {
    ioMode: "file",
    subject: "video",
    subjectPlural: "videos",
    badges: BASE_BADGES,
    sharedFeatures: sharedFeatures("videos"),
    howItWorks: fileSteps("video", "Choose the range and settings"),
  },
  audio: {
    ioMode: "file",
    subject: "audio file",
    subjectPlural: "audio files",
    badges: BASE_BADGES,
    sharedFeatures: sharedFeatures("audio files"),
    howItWorks: fileSteps("audio file", "Set the range and settings"),
  },
  spreadsheet: {
    ioMode: "file",
    subject: "spreadsheet",
    subjectPlural: "spreadsheets",
    badges: BASE_BADGES,
    sharedFeatures: sharedFeatures("spreadsheets"),
    howItWorks: fileSteps("spreadsheet", "Pick the sheet and columns"),
  },
  archive: {
    ioMode: "file",
    subject: "archive",
    subjectPlural: "archives",
    badges: BASE_BADGES,
    sharedFeatures: sharedFeatures("archives"),
    howItWorks: fileSteps("ZIP file", "Inspect the contents"),
  },
  csv: {
    ioMode: "text",
    subject: "CSV",
    subjectPlural: "CSV data",
    badges: BASE_BADGES,
    sharedFeatures: sharedFeatures("CSV data"),
    howItWorks: textSteps("CSV", "Convert or validate", "result"),
  },
  compression: {
    ioMode: "text",
    subject: "text",
    subjectPlural: "data",
    badges: BASE_BADGES,
    sharedFeatures: sharedFeatures("data"),
    howItWorks: textSteps("data", "Compress or decompress", "output"),
  },
  converter: {
    ioMode: "text",
    subject: "input",
    subjectPlural: "data",
    badges: BASE_BADGES,
    sharedFeatures: sharedFeatures("data"),
    howItWorks: textSteps("input", "Convert", "output"),
  },
};
