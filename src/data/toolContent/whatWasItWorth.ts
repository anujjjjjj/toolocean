import type { ToolPageContent } from "@/types/toolContent";

/**
 * Route-specific copy for /what-was-it-worth.
 *
 * This is a calculator, not a file tool, so the category profile's
 * paste/drop/convert steps and its "Open a file" CTA do not apply.
 */
export const whatWasItWorthContent: Partial<ToolPageContent> = {
  hero: {
    h1: "Then vs Now Money Machine: Inflation Calculator",
    subtitle:
      "See what past money is worth with CPI inflation data for INR and USD, from 1990–2025. Compare purchasing power, download a PNG, or share a result link.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Enter an amount", action: "scroll" },
    // Explicitly none: there is no file to open on a calculator.
    secondaryCta: undefined,
  },
  howItWorks: [
    {
      title: "Enter an amount",
      body: "Type the sum you want to compare, such as a salary, a price or a monthly rent from back then.",
    },
    {
      title: "Pick a currency and year",
      body: "Choose INR or USD, then the starting year between 1990 and 2025. The result updates as you change either.",
    },
    {
      title: "Read or share the result",
      body: "See what that amount is worth in today's money and the average annual inflation in between. Copy a link that keeps your amount, currency and year, or download the result as a PNG.",
    },
  ],
};
