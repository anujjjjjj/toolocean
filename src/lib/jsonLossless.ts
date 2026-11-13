/**
 * A lossless JSON parser and pretty-printer.
 *
 * JSON.parse turns 12345678901234567890 into 12345678901234567000 because it
 * stores numbers as IEEE floats. This parser keeps each number's original
 * source text and writes that text back when formatting or minifying.
 *
 * No dependencies. node --test can import this file directly.
 */

export type JsonAst =
  | { kind: "null" }
  | { kind: "boolean"; value: boolean }
  | { kind: "number"; raw: string }
  | { kind: "string"; value: string }
  | { kind: "array"; elements: JsonAst[] }
  | { kind: "object"; properties: { key: string; value: JsonAst }[] };

export interface JsonLosslessFailure {
  message: string;
  line: number;
  column: number;
  position: number;
}

export type JsonLosslessResult =
  | { status: "ok"; ast: JsonAst }
  | { status: "error"; error: JsonLosslessFailure };

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

class JsonSyntaxError extends Error {
  position: number;
  constructor(message: string, position: number) {
    super(message);
    this.position = position;
  }
}

class Parser {
  i = 0;
  text: string;
  constructor(text: string) {
    this.text = text;
  }

  parse(): JsonAst {
    this.skip();
    if (this.i >= this.text.length) throw new JsonSyntaxError("Unexpected end of JSON input", this.i);
    const value = this.value();
    this.skip();
    if (this.i < this.text.length) {
      throw new JsonSyntaxError(`Unexpected token ${this.tokenPreview()}`, this.i);
    }
    return value;
  }

  private value(): JsonAst {
    this.skip();
    if (this.i >= this.text.length) throw new JsonSyntaxError("Unexpected end of JSON input", this.i);
    const c = this.text[this.i];
    if (c === "{") return this.object();
    if (c === "[") return this.array();
    if (c === "\"") return { kind: "string", value: this.string() };
    if (c === "t" || c === "f") return { kind: "boolean", value: this.literal(c === "t" ? "true" : "false") === "true" };
    if (c === "n") {
      this.literal("null");
      return { kind: "null" };
    }
    if (c === "-" || (c >= "0" && c <= "9")) return { kind: "number", raw: this.number() };
    throw new JsonSyntaxError(`Unexpected token ${this.tokenPreview()}`, this.i);
  }

  private object(): JsonAst {
    this.eat("{");
    this.skip();
    const properties: { key: string; value: JsonAst }[] = [];
    if (this.peek() === "}") {
      this.eat("}");
      return { kind: "object", properties };
    }
    for (;;) {
      this.skip();
      if (this.i >= this.text.length) throw new JsonSyntaxError("Unexpected end of JSON input", this.i);
      if (this.text[this.i] !== "\"") {
        throw new JsonSyntaxError("Expected property name or '}'", this.i);
      }
      const key = this.string();
      this.skip();
      if (this.peek() !== ":") throw new JsonSyntaxError("Expected ':' after property name", this.i);
      this.eat(":");
      properties.push({ key, value: this.value() });
      this.skip();
      const next = this.peek();
      if (next === ",") {
        this.eat(",");
        this.skip();
        if (this.peek() === "}") throw new JsonSyntaxError("Trailing comma", this.i);
        continue;
      }
      if (next === "}") {
        this.eat("}");
        return { kind: "object", properties };
      }
      throw new JsonSyntaxError("Expected ',' or '}' after property value", this.i);
    }
  }

  private array(): JsonAst {
    this.eat("[");
    this.skip();
    const elements: JsonAst[] = [];
    if (this.peek() === "]") {
      this.eat("]");
      return { kind: "array", elements };
    }
    for (;;) {
      elements.push(this.value());
      this.skip();
      const next = this.peek();
      if (next === ",") {
        this.eat(",");
        this.skip();
        if (this.peek() === "]") throw new JsonSyntaxError("Trailing comma", this.i);
        continue;
      }
      if (next === "]") {
        this.eat("]");
        return { kind: "array", elements };
      }
      throw new JsonSyntaxError("Expected ',' or ']' after array element", this.i);
    }
  }

  private string(): string {
    this.eat("\"");
    let out = "";
    while (this.i < this.text.length) {
      const c = this.text[this.i];
      if (c === "\"") {
        this.i++;
        return out;
      }
      if (c === "\\") {
        this.i++;
        if (this.i >= this.text.length) throw new JsonSyntaxError("Unterminated string", this.i);
        const e = this.text[this.i++];
        const map: Record<string, string> = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };
        if (e in map) {
          out += map[e];
          continue;
        }
        if (e === "u") {
          const hex = this.text.slice(this.i, this.i + 4);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new JsonSyntaxError("Bad Unicode escape", this.i);
          out += String.fromCharCode(parseInt(hex, 16));
          this.i += 4;
          continue;
        }
        throw new JsonSyntaxError(`Bad escape \\${e}`, this.i - 1);
      }
      const code = c.charCodeAt(0);
      if (code < 0x20) throw new JsonSyntaxError("Unescaped control character in string", this.i);
      out += c;
      this.i++;
    }
    throw new JsonSyntaxError("Unterminated string", this.i);
  }

  private number(): string {
    const start = this.i;
    if (this.peek() === "-") this.i++;
    if (this.peek() === "0") {
      this.i++;
      if (this.peek() >= "0" && this.peek() <= "9") {
        throw new JsonSyntaxError("Leading zero is not allowed", start);
      }
    } else if (this.peek() >= "1" && this.peek() <= "9") {
      this.i++;
      while (this.peek() >= "0" && this.peek() <= "9") this.i++;
    } else {
      throw new JsonSyntaxError("Invalid number", start);
    }
    if (this.peek() === ".") {
      this.i++;
      if (!(this.peek() >= "0" && this.peek() <= "9")) throw new JsonSyntaxError("Invalid number", start);
      while (this.peek() >= "0" && this.peek() <= "9") this.i++;
    }
    const exp = this.peek();
    if (exp === "e" || exp === "E") {
      this.i++;
      const sign = this.peek();
      if (sign === "+" || sign === "-") this.i++;
      if (!(this.peek() >= "0" && this.peek() <= "9")) throw new JsonSyntaxError("Invalid number", start);
      while (this.peek() >= "0" && this.peek() <= "9") this.i++;
    }
    return this.text.slice(start, this.i);
  }

  private literal(expected: string): string {
    if (this.text.slice(this.i, this.i + expected.length) !== expected) {
      throw new JsonSyntaxError(`Unexpected token ${this.tokenPreview()}`, this.i);
    }
    this.i += expected.length;
    const next = this.peek();
    if (next && /[A-Za-z0-9_]/.test(next)) {
      throw new JsonSyntaxError(`Unexpected token ${this.tokenPreview(this.i - expected.length)}`, this.i - expected.length);
    }
    return expected;
  }

  private skip() {
    const text = this.text;
    while (this.i < text.length) {
      const c = text.charCodeAt(this.i);
      if (c === 32 || c === 9 || c === 10 || c === 13) this.i++;
      else break;
    }
  }

  private peek(): string {
    return this.text[this.i] ?? "";
  }

  private eat(c: string) {
    if (this.peek() !== c) throw new JsonSyntaxError(`Expected '${c}'`, this.i);
    this.i++;
  }

  private tokenPreview(at = this.i): string {
    const c = this.text[at];
    if (c === undefined) return "end of input";
    return `'${c}'`;
  }
}

export function parseJsonAst(text: string): JsonLosslessResult {
  try {
    return { status: "ok", ast: new Parser(text).parse() };
  } catch (error) {
    if (error instanceof JsonSyntaxError) {
      const { line, column } = offsetToLineColumn(text, error.position);
      return { status: "error", error: { message: error.message, line, column, position: error.position } };
    }
    const { line, column } = offsetToLineColumn(text, 0);
    return { status: "error", error: { message: "Invalid JSON", line, column, position: 0 } };
  }
}

/**
 * Recursively sorts object keys. Arrays keep their order.
 */
export function sortKeysDeepAst(ast: JsonAst): JsonAst {
  if (ast.kind === "array") return { kind: "array", elements: ast.elements.map(sortKeysDeepAst) };
  if (ast.kind !== "object") return ast;
  const properties = [...ast.properties]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((property) => ({ key: property.key, value: sortKeysDeepAst(property.value) }));
  return { kind: "object", properties };
}

/**
 * Serialise an AST. `space` matches JSON.stringify: a number of spaces, a
 * string such as "\\t", or 0 / "" for a minified document. Number tokens are
 * written exactly as they appeared in the source.
 */
export function stringifyJsonAst(ast: JsonAst, space: string | number = 0): string {
  const gap = typeof space === "number" ? (space > 0 ? " ".repeat(space) : "") : space;
  const colon = gap ? ": " : ":";

  const write = (node: JsonAst, level: number): string => {
    switch (node.kind) {
      case "null":
        return "null";
      case "boolean":
        return node.value ? "true" : "false";
      case "number":
        return node.raw;
      case "string":
        return JSON.stringify(node.value);
      case "array": {
        if (node.elements.length === 0) return "[]";
        if (!gap) return `[${node.elements.map((element) => write(element, 0)).join(",")}]`;
        const inner = node.elements.map((element) => gap.repeat(level + 1) + write(element, level + 1)).join(",\n");
        return `[\n${inner}\n${gap.repeat(level)}]`;
      }
      case "object": {
        if (node.properties.length === 0) return "{}";
        if (!gap) {
          return `{${node.properties.map((property) => `${JSON.stringify(property.key)}${colon}${write(property.value, 0)}`).join(",")}}`;
        }
        const inner = node.properties
          .map((property) => `${gap.repeat(level + 1)}${JSON.stringify(property.key)}${colon}${write(property.value, level + 1)}`)
          .join(",\n");
        return `{\n${inner}\n${gap.repeat(level)}}`;
      }
    }
  };

  return write(ast, 0);
}

export function astDepthAndKeys(ast: JsonAst): { keys: number; depth: number } {
  let keys = 0;
  let depth = 0;
  const stack: Array<{ node: JsonAst; level: number }> = [{ node: ast, level: 1 }];
  while (stack.length > 0) {
    const { node, level } = stack.pop()!;
    if (level > depth) depth = level;
    if (node.kind === "array") {
      for (const child of node.elements) {
        if (child.kind === "array" || child.kind === "object") stack.push({ node: child, level: level + 1 });
      }
    } else if (node.kind === "object") {
      for (const property of node.properties) {
        keys++;
        if (property.value.kind === "array" || property.value.kind === "object") {
          stack.push({ node: property.value, level: level + 1 });
        }
      }
    }
  }
  return { keys, depth };
}
