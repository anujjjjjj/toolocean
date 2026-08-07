import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "./Section";
import { emitToolAction } from "@/lib/toolActions";
import type { ToolExample } from "@/types/toolContent";

function CodePane({ label, code, language }: { label: string; code: string; language: string }) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="font-mono text-[0.6875rem] text-muted-foreground/70">{language}</span>
      </figcaption>
      {/* overflow-x-auto on the pre itself keeps long lines from widening the page body. */}
      <pre className="overflow-x-auto rounded-lg border border-border/70 bg-muted/40 p-4 text-[0.8125rem] leading-relaxed">
        <code className={`language-${language} font-mono`}>{code}</code>
      </pre>
    </figure>
  );
}

export function ToolExamples({ examples, heading, lede }: { examples: ToolExample[]; heading: string; lede?: string }) {
  if (examples.length === 0) return null;

  return (
    <Section id="examples" heading={heading} lede={lede}>
      <div className="space-y-12">
        {examples.map((example) => (
          <article key={example.title}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground">{example.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{example.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => emitToolAction({ type: "load", payload: example.input })}
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                Try this example
              </Button>
            </div>

            <div className="mt-5 grid items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
              <CodePane label="Input" code={example.input} language={example.language} />
              <ArrowRight
                className="mx-auto hidden h-5 w-5 shrink-0 self-center text-muted-foreground/50 md:block"
                aria-hidden="true"
              />
              <CodePane label="Output" code={example.output} language={example.language} />
            </div>

            <p className="mt-4 border-l-2 border-primary/40 pl-4 text-sm leading-relaxed text-muted-foreground">
              {example.explanation}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
