import { Link } from "react-router-dom";
import { Section } from "./Section";
import { findToolBySlug, toolPath } from "@/data/toolCatalog";
import type { ToolLimitation } from "@/types/toolContent";

/**
 * What this tool cannot do.
 *
 * Nobody in this market publishes limitations, which is precisely the argument
 * for publishing them: a page that admits where it falls short is more credible
 * about everything else on it, and these are the questions people arrive with
 * anyway ("why didn't my PDF get smaller?").
 *
 * `alternative` may be a slug on this site or a plain sentence naming someone
 * else's product. Recommending a competitor when they genuinely do the job
 * better costs one click and buys the reader's trust permanently.
 */
function Alternative({ alternative }: { alternative: string }) {
  const tool = findToolBySlug(alternative);

  if (tool) {
    return (
      <p className="mt-2 text-sm">
        <Link to={toolPath(tool)} className="font-medium text-primary hover:underline">
          Use {tool.name} instead →
        </Link>
      </p>
    );
  }

  return <p className="mt-2 text-sm text-muted-foreground">{alternative}</p>;
}

export function ToolLimitations({
  limitations,
  heading,
  lede,
}: {
  limitations: { heading?: string; lede?: string; items: ToolLimitation[] };
  heading: string;
  lede?: string;
}) {
  if (limitations.items.length === 0) return null;

  return (
    <Section id="limitations" heading={limitations.heading ?? heading} lede={limitations.lede ?? lede} muted>
      <div className="grid gap-6 sm:grid-cols-2">
        {limitations.items.map((item) => (
          <div key={item.title}>
            <h3 className="font-heading text-base font-semibold text-foreground">{item.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            {item.alternative && <Alternative alternative={item.alternative} />}
          </div>
        ))}
      </div>
    </Section>
  );
}
