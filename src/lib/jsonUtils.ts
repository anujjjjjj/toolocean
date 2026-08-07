/**
 * JSON parsing helpers shared by the formatter and its sibling JSON tools.
 *
 * The interesting problem here is error reporting. Every engine words its
 * SyntaxError differently and exposes a different subset of position data:
 *
 *   V8 (Chrome/Edge, newer)  Expected ',' or '}' after property value in JSON
 *                            at position 42 (line 3 column 5)
 *   V8 (older)               Unexpected token } in JSON at position 42
 *   SpiderMonkey (Firefox)   JSON.parse: expected property name or '}'
 *                            at line 3 column 5 of the JSON data
 *   JavaScriptCore (Safari)  JSON Parse error: Expected '}'   ← no position at all
 *
 * Telling a user *where* their JSON broke is the single most useful thing this
 * tool does, so we extract whatever the engine gave us and derive the rest.
 */

export interface JsonParseFailure {
  /** Cleaned-up message with engine boilerplate stripped. */
  message: string;
  /** 1-based line, when the engine gave us enough to work it out. */
  line: number | null;
  /** 1-based column. */
  column: number | null;
  /** 0-based character offset. */
  position: number | null;
}

/**
 * String discriminant rather than an `ok: boolean` flag.
 *
 * This project compiles with `strictNullChecks: false`, and under that setting
 * TypeScript will not narrow a union on a boolean literal discriminant — the
 * `error` branch stays unreachable to the checker. String literals narrow
 * correctly either way, so the discriminant is `status`.
 */
export type JsonParseResult =
  | { status: "ok"; value: unknown }
  | { status: "error"; error: JsonParseFailure };

/** Converts a 0-based character offset into a 1-based line/column pair. */
export function offsetToLineColumn(text: string, offset: number): { line: number; column: number } {
  const clamped = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let lastNewline = -1;

  for (let i = 0; i < clamped; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      lastNewline = i;
    }
  }

  return { line, column: clamped - lastNewline };
}

function describeFailure(error: unknown, text: string): JsonParseFailure {
  const raw = error instanceof Error ? error.message : "Invalid JSON";

  // Prefer an explicit line/column pair — Firefox and newer V8 both provide one
  // and it is authoritative.
  const lineCol = raw.match(/line (\d+) column (\d+)/i);
  if (lineCol) {
    return {
      message: cleanMessage(raw),
      line: Number(lineCol[1]),
      column: Number(lineCol[2]),
      position: null,
    };
  }

  // Otherwise derive it from the character offset.
  const positionMatch = raw.match(/at position (\d+)/i);
  if (positionMatch) {
    const position = Number(positionMatch[1]);
    const { line, column } = offsetToLineColumn(text, position);
    return { message: cleanMessage(raw), line, column, position };
  }

  // Safari path: no position information exists, so don't invent one.
  return { message: cleanMessage(raw), line: null, column: null, position: null };
}

function cleanMessage(raw: string): string {
  return (
    raw
      .replace(/^JSON\.parse:\s*/i, "")
      .replace(/^JSON Parse error:\s*/i, "")
      .replace(/\s*in JSON at position \d+.*$/i, "")
      .replace(/\s*of the JSON data$/i, "")
      // Firefox embeds the position in the prose. The UI renders line/column
      // separately, so leaving it here would print it twice.
      .replace(/\s*at line \d+ column \d+\s*$/i, "")
      /*
       * Newer V8 drops the position for some errors and inlines a snippet of the
       * offending source instead, e.g.
       *   Unexpected token ']', ..."s": [1, 2,]\n}" is not valid JSON
       * That snippet is noise next to an editor already showing the document, and
       * it can contain the user's own data, so it is stripped.
       */
      .replace(/,?\s*\.\.\.[\s\S]*?is not valid JSON$/i, "")
      .replace(/\s*is not valid JSON$/i, "")
      .trim()
      .replace(/[,\s]+$/, "")
      .replace(/^./, (c) => c.toUpperCase())
  );
}

export function parseJson(text: string): JsonParseResult {
  try {
    return { status: "ok", value: JSON.parse(text) };
  } catch (error) {
    return { status: "error", error: describeFailure(error, text) };
  }
}

export type IndentStyle = "2" | "3" | "4" | "tab";

export function indentToken(style: IndentStyle): string | number {
  return style === "tab" ? "\t" : Number(style);
}

/**
 * Recursively sorts object keys. Arrays keep their order — reordering them would
 * change the document's meaning, not just its presentation.
 */
export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value === null || typeof value !== "object") return value;

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return Object.fromEntries(entries.map(([key, val]) => [key, sortKeysDeep(val)]));
}

export interface JsonStats {
  bytes: number;
  lines: number;
  /** Total number of object keys, counted across the whole document. */
  keys: number;
  /** Deepest nesting level. */
  depth: number;
}

export function computeStats(text: string, parsed: unknown): JsonStats {
  let keys = 0;
  let depth = 0;

  // Iterative walk — a recursive one blows the stack on deeply nested documents,
  // which is exactly the kind of file people bring to a formatter.
  const stack: Array<{ node: unknown; level: number }> = [{ node: parsed, level: 1 }];
  while (stack.length > 0) {
    const { node, level } = stack.pop()!;
    if (level > depth) depth = level;

    if (Array.isArray(node)) {
      for (const child of node) {
        if (child !== null && typeof child === "object") stack.push({ node: child, level: level + 1 });
      }
    } else if (node !== null && typeof node === "object") {
      for (const [, child] of Object.entries(node as Record<string, unknown>)) {
        keys++;
        if (child !== null && typeof child === "object") stack.push({ node: child, level: level + 1 });
      }
    }
  }

  return {
    // Byte length, not character length — a multi-byte document is bigger on
    // disk than its .length suggests.
    bytes: new TextEncoder().encode(text).length,
    lines: text.length === 0 ? 0 : text.split("\n").length,
    keys,
    depth,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
