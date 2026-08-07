import { Section } from "./Section";
import { resolveIcon } from "./icons";
import type { ToolUseCase } from "@/types/toolContent";

export function ToolUseCases({ useCases, heading, lede }: { useCases: ToolUseCase[]; heading: string; lede?: string }) {
  if (useCases.length === 0) return null;

  return (
    <Section id="use-cases" heading={heading} lede={lede} muted>
      <div className="grid gap-6 sm:grid-cols-2">
        {useCases.map((useCase) => {
          const Icon = resolveIcon(useCase.icon);
          return (
            <div key={useCase.audience} className="flex gap-4 rounded-xl border border-border/70 bg-card p-6">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">{useCase.audience}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{useCase.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
