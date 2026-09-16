import { Section } from "./Section";
import { DataTable } from "./DataTable";
import type { ToolMeasurementTable } from "@/types/toolContent";

/**
 * Real numbers from real runs.
 *
 * The method line is not decoration. A measurement without a device, a browser
 * and a date is a marketing claim, and the whole point of this section is that
 * it is the one thing on the page an upload-based competitor cannot copy without
 * publishing their own figures.
 */
export function ToolMeasurements({
  measurements,
  heading,
  lede,
}: {
  measurements: ToolMeasurementTable;
  heading: string;
  lede?: string;
}) {
  if (measurements.rows.length === 0) return null;

  const showTiming = measurements.rows.some((row) => row.timing);
  const showNote = measurements.rows.some((row) => row.note);

  const columns = ["Scenario", "Input", "Output", ...(showTiming ? ["Time"] : []), ...(showNote ? ["Notes"] : [])];
  const rows = measurements.rows.map((row) => [
    row.scenario,
    row.input,
    row.output,
    ...(showTiming ? [row.timing ?? "—"] : []),
    ...(showNote ? [row.note ?? "—"] : []),
  ]);

  return (
    <Section id="measurements" heading={measurements.heading ?? heading} lede={measurements.lede ?? lede}>
      <DataTable columns={columns} rows={rows} minWidth="42rem" />
      <p className="mt-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">How this was measured: </span>
        {measurements.method}
      </p>
    </Section>
  );
}
