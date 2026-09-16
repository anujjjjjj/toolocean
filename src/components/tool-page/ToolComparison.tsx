import { Section } from "./Section";
import { DataTable } from "./DataTable";
import type { ToolComparison as ToolComparisonContent } from "@/types/toolContent";

/**
 * A scoped comparison against one named incumbent.
 *
 * Used on a handful of pages, not all of them. Every row has to be verifiable
 * from the competitor's own public documentation — hence the required source
 * note — and every table has to concede at least one row they win. A comparison
 * that the named party would call unfair is worth less than no comparison.
 */
export function ToolComparison({
  comparison,
  heading,
  lede,
}: {
  comparison: ToolComparisonContent;
  heading: string;
  lede?: string;
}) {
  if (comparison.rows.length === 0) return null;

  return (
    <Section id="comparison" heading={comparison.heading ?? heading} lede={lede}>
      <DataTable
        columns={["Capability", comparison.competitor, "This site"]}
        rows={comparison.rows.map((row) => [row.capability, row.them, row.us])}
      />
      <p className="mt-4 text-sm text-muted-foreground">{comparison.sourceNote}</p>
    </Section>
  );
}
