import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  /** Used for the aria-labelledby association and as an in-page anchor target. */
  id: string;
  heading: string;
  /** Optional deck under the H2. One sentence, not a keyword restatement. */
  lede?: string;
  children: ReactNode;
  className?: string;
  /** Alternating background keeps a long page readable without extra chrome. */
  muted?: boolean;
}

/**
 * Every content section on a tool page goes through here so heading order stays
 * strictly H1 → H2 → H3, and each <section> is programmatically labelled for
 * screen readers and for Google's section-level content extraction.
 */
export function Section({ id, heading, lede, children, className, muted }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("border-b border-border/60 py-14 sm:py-20", muted && "bg-muted/30", className)}
    >
      <div className="container mx-auto max-w-5xl px-4">
        <h2
          id={headingId}
          className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          {heading}
        </h2>
        {lede && <p className="mt-3 max-w-2xl text-muted-foreground">{lede}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
