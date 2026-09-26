import { Section } from "./Section";
import type { ToolStep } from "@/types/toolContent";

/**
 * Renders as an ordered list so the sequence survives CSS being stripped and so
 * the markup matches the HowTo JSON-LD emitted from the same `steps` array.
 * Keeping one source of truth is what stops the structured data from drifting
 * out of sync with the visible content. A manual-action risk if it does.
 */
export function ToolHowItWorks({ steps, heading, lede }: { steps: ToolStep[]; heading: string; lede?: string }) {
  if (steps.length === 0) return null;

  return (
    <Section id="how-it-works" heading={heading} lede={lede} muted>
      <ol className="grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="relative rounded-xl border border-border/70 bg-card p-6">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-semibold text-primary"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
              <span className="sr-only">{`Step ${index + 1}: `}</span>
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
