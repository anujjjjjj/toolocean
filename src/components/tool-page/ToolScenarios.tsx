import { Section } from "./Section";
import type { ToolScenario } from "@/types/toolContent";

/**
 * Specific jobs people arrive wanting to do.
 *
 * "Open a password-protected ZIP", "extract one subfolder without downloading
 * the whole archive", "unzip on a Chromebook". These are separate from the FAQ
 * because they are tasks rather than questions about the tool, and they are the
 * section the strongest page in this niche (ezyZip, for "unzip online") is
 * really built out of.
 *
 * Rendered as plain headed prose rather than an accordion: these are meant to be
 * skimmed and read, and collapsing them hides the substance from a reader
 * scrolling for exactly one of them.
 */
export function ToolScenarios({
  scenarios,
  heading,
  lede,
}: {
  scenarios: { heading?: string; lede?: string; items: ToolScenario[] };
  heading: string;
  lede?: string;
}) {
  if (scenarios.items.length === 0) return null;

  return (
    <Section id="scenarios" heading={scenarios.heading ?? heading} lede={scenarios.lede ?? lede}>
      <div className="grid gap-7 sm:grid-cols-2">
        {scenarios.items.map((item) => (
          <div key={item.question}>
            <h3 className="font-heading text-base font-semibold text-foreground">{item.question}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
