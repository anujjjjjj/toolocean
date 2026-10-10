import { Link } from "react-router-dom";
import { NativeFaq } from "@/components/tool-page/NativeFaq";
import { HUB_GUIDES } from "@/data/hubGuides";

/**
 * Unique guidance under a category grid. Replaces the three generic
 * "secure / fast / free" cards, which said the same thing on every hub.
 */
export function HubGuide({ path }: { path: string }) {
  const guide = HUB_GUIDES[path];
  if (!guide) return null;

  return (
    <section className="mx-auto max-w-3xl text-muted-foreground">
      <div className="paper-acc">
        <details>
          <summary><h2>{guide.heading}</h2></summary>
          <div className="acc-body">
            {guide.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {guide.rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="mb-3 text-left text-base font-semibold text-foreground">
                    {guide.tableCaption}
                  </caption>
                  <thead>
                    <tr className="border-b border-border text-foreground">
                      <th className="py-2 pr-4 font-medium">Job</th>
                      <th className="py-2 pr-4 font-medium">Tool</th>
                      <th className="py-2 font-medium">What it will not do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guide.rows.map((row) => (
                      <tr key={row.path} className="border-b border-border/60 align-top">
                        <td className="py-3 pr-4">{row.task}</td>
                        <td className="py-3 pr-4">
                          <Link to={row.path} className="font-medium text-foreground underline decoration-[var(--line-strong)] underline-offset-2">
                            {row.tool}
                          </Link>
                        </td>
                        <td className="py-3">{row.limit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </details>
      </div>

      <NativeFaq faqs={guide.faqs} heading={guide.faqHeading} />
    </section>
  );
}
