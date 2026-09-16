import { Section } from "./Section";
import type { ToolSpec } from "@/types/toolContent";

/**
 * "What happens to your data", as a spec rather than a paragraph.
 *
 * Short and near-identical between tools on purpose. Every competitor can write
 * the sentence "your files are safe"; far fewer will commit to a row-by-row
 * statement of what is read, what is held, what is stored and what is
 * transmitted — and the three tools here that do reach the network say so in the
 * same table rather than quietly matching the others.
 */
export function ToolSpecs({ specs, heading, lede }: { specs: ToolSpec[]; heading: string; lede?: string }) {
  if (specs.length === 0) return null;

  return (
    <Section id="specs" heading={heading} lede={lede} muted>
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {specs.map((spec) => (
          <div key={spec.label} className="flex flex-col border-b border-border/50 pb-3">
            <dt className="text-sm font-medium text-muted-foreground">{spec.label}</dt>
            <dd className="mt-1 text-foreground">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
