import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { ToolFaqEntry } from "@/types/toolContent";

function FaqAnswer({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(/\[([^\]]+)\]\((\/[^)\s]+)\)/g)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(text.slice(cursor, index));
    nodes.push(
      <Link key={`${match[2]}-${index}`} to={match[2]} className="font-medium text-foreground underline decoration-[var(--line-strong)] underline-offset-2">
        {match[1]}
      </Link>,
    );
    cursor = index + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}

/** Closed native details so the answers stay in the prerendered HTML. */
export function NativeFaq({ faqs, heading, lede }: { faqs: ToolFaqEntry[]; heading: string; lede?: string }) {
  if (faqs.length === 0) return null;
  return (
    <div className="paper-acc">
      <details id="faq">
        <summary><h2>{heading}</h2></summary>
        <div className="acc-body">
          {lede && <p>{lede}</p>}
          {faqs.map((faq) => (
            <div
              key={faq.question}
              {...(faq.topic && ["privacy", "size", "offline", "account"].includes(faq.topic)
                ? { "data-seo-chrome": "true" }
                : {})}
            >
              <h3>{faq.question}</h3>
              <p><FaqAnswer text={faq.answer} /></p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
