import { Section } from "./Section";
import { resolveIcon } from "./icons";
import type { ToolFeature } from "@/types/toolContent";

export function ToolFeatures({ features, heading, lede }: { features: ToolFeature[]; heading: string; lede?: string }) {
  if (features.length === 0) return null;

  return (
    <Section id="features" heading={heading} lede={lede}>
      <ul className="grid gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = resolveIcon(feature.icon);
          return (
            <li key={feature.title} className="bg-card p-6">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-heading text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
