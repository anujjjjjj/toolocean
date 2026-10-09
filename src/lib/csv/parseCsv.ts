/**
 * RFC 4180 CSV parser.
 *
 * Quoted fields stay one field when they contain the delimiter, a newline, or
 * a doubled quote (""). CRLF and LF both end a record. A leading UTF-8 BOM is
 * ignored. A trailing record separator does not invent an extra empty row, and
 * a trailing delimiter does keep an empty field.
 */

export function resolveDelimiter(delimiter: string, custom = ""): string {
  const chosen = delimiter === "custom" ? custom : delimiter;
  if (chosen === "\\t") return "\t";
  if (chosen.length !== 1) {
    throw new Error("Delimiter must be a single character");
  }
  return chosen;
}

export function parseCsv(text: string, delimiter = ","): string[][] {
  const sep = resolveDelimiter(delimiter);
  let source = text;
  if (source.charCodeAt(0) === 0xfeff) source = source.slice(1);
  if (source.length === 0) return [];

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const endRecord = () => {
    row.push(field);
    rows.push(row);
    row = [];
    field = "";
  };

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === sep) {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      endRecord();
      if (ch === "\r" && source[i + 1] === "\n") i++;
      continue;
    }
    field += ch;
  }

  if (inQuotes) throw new Error("CSV has an unclosed quote");

  const endsWithBreak = source.endsWith("\n") || source.endsWith("\r");
  if (!endsWithBreak) endRecord();

  return rows;
}

export function csvToRecords(text: string, delimiter: string, hasHeader: boolean): Record<string, string>[] {
  const rows = parseCsv(text, delimiter).filter((row) => row.some((cell) => cell.trim() !== ""));
  if (rows.length === 0) return [];

  if (!hasHeader) {
    return rows.map((row) => {
      const record: Record<string, string> = {};
      row.forEach((value, index) => {
        record[`column_${index + 1}`] = value.trim();
      });
      return record;
    });
  }

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = (row[index] ?? "").trim();
    });
    return record;
  });
}

/** Quote a field when it contains the delimiter, a quote, or a line break. */
export function escapeCsvField(value: string, delimiter: string): string {
  if (value.includes(delimiter) || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function serializeCsv(rows: string[][], delimiter: string): string {
  const sep = resolveDelimiter(delimiter);
  return rows.map((row) => row.map((cell) => escapeCsvField(cell, sep)).join(sep)).join("\n");
}
