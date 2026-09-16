import type { ReactNode } from "react";

/**
 * The one table on the site.
 *
 * Extracted from the comparison table that was inlined in LandingRoutePage, so
 * the measurement tables, the competitor comparisons and the category pages all
 * scroll and wrap the same way. The overflow box matters: without it a table
 * pushes the whole document sideways on a phone, which was a real defect on nine
 * tool pages and is also a mobile-usability failure in Search Console.
 *
 * The first cell of each row is a `<th scope="row">` so the table is navigable
 * rather than a grid of anonymous cells.
 */
export function DataTable({
  columns,
  rows,
  minWidth = "36rem",
}: {
  columns: string[];
  rows: ReactNode[][];
  minWidth?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/70">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="bg-muted/50">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-border/60">
              <th scope="row" className="px-4 py-3 font-normal align-top">
                {row[0]}
              </th>
              {row.slice(1).map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-muted-foreground align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
