/**
 * XML <-> JSON conversion built on the browser's own parser.
 *
 * Replaces xml2js, which never worked here at all. xml2js depends on `sax`, which
 * assumes Node's EventEmitter, so the tool threw `this.removeAllListeners is not a
 * function` on every conversion and rendered an empty output box, while still
 * pulling a 104 KB chunk into the bundle for the privilege.
 *
 * DOMParser and XMLSerializer are native, already loaded, and cost nothing.
 */

export interface XmlToJsonOptions {
  /** Keep attributes, under an "@" key. When false they are merged in as siblings. */
  preserveAttributes: boolean;
  /** Always emit arrays for child elements, even when there is only one. */
  explicitArray: boolean;
}

const TEXT_KEY = "#text";
const ATTR_KEY = "@";

/** Numbers and booleans come out of XML as strings; this restores the obvious ones. */
function coerce(value: string): string | number | boolean {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  // Guard against "007" and "1e999" turning into something the user did not write.
  if (/^-?\d+(\.\d+)?$/.test(trimmed) && String(Number(trimmed)) === trimmed) return Number(trimmed);
  return value;
}

function elementToValue(el: Element, options: XmlToJsonOptions): unknown {
  const children = Array.from(el.children);
  const attributes = Array.from(el.attributes);

  const text = Array.from(el.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE)
    .map((node) => node.nodeValue ?? "")
    .join("")
    .trim();

  // Leaf with no attributes collapses to a scalar, which is what makes the output
  // readable rather than a tree of {"#text": ...} wrappers.
  if (!children.length && !attributes.length) return text ? coerce(text) : "";

  const result: Record<string, unknown> = {};

  if (attributes.length) {
    if (options.preserveAttributes) {
      result[ATTR_KEY] = Object.fromEntries(attributes.map((a) => [a.name, coerce(a.value)]));
    } else {
      for (const a of attributes) result[a.name] = coerce(a.value);
    }
  }

  if (text) result[TEXT_KEY] = coerce(text);

  for (const child of children) {
    const value = elementToValue(child, options);
    const existing = result[child.tagName];

    if (existing === undefined) {
      result[child.tagName] = options.explicitArray ? [value] : value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      // Second sibling with the same tag turns the entry into an array. This is why
      // explicitArray exists: without it the shape depends on the data.
      result[child.tagName] = [existing, value];
    }
  }

  return result;
}

export function xmlToJson(xml: string, options: XmlToJsonOptions): unknown {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  // DOMParser reports failures as a <parsererror> element rather than throwing.
  const failure = doc.querySelector("parsererror");
  if (failure) throw new Error(failure.textContent?.trim().split("\n")[0] || "Invalid XML");

  const root = doc.documentElement;
  if (!root) throw new Error("Invalid XML: no root element");

  return { [root.tagName]: elementToValue(root, options) };
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

/** XML element names cannot start with a digit or contain spaces. */
function safeTag(name: string): string {
  const cleaned = name.replace(/[^\w.\-:]/g, "_");
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

function valueToXml(name: string, value: unknown, indent: string): string {
  const tag = safeTag(name);

  if (value === null || value === undefined) return `${indent}<${tag}/>`;

  if (Array.isArray(value)) {
    return value.map((item) => valueToXml(name, item, indent)).join("\n");
  }

  if (typeof value !== "object") {
    return `${indent}<${tag}>${escapeText(String(value))}</${tag}>`;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const attrs = entries.find(([key]) => key === ATTR_KEY)?.[1] as Record<string, unknown> | undefined;
  const text = entries.find(([key]) => key === TEXT_KEY)?.[1];
  const children = entries.filter(([key]) => key !== ATTR_KEY && key !== TEXT_KEY);

  const attrString = attrs
    ? Object.entries(attrs)
        .map(([key, val]) => ` ${safeTag(key)}="${escapeAttr(String(val))}"`)
        .join("")
    : "";

  if (!children.length) {
    const inner = text === undefined ? "" : escapeText(String(text));
    return inner
      ? `${indent}<${tag}${attrString}>${inner}</${tag}>`
      : `${indent}<${tag}${attrString}/>`;
  }

  const body = children.map(([key, val]) => valueToXml(key, val, indent + "  ")).join("\n");
  const textLine = text === undefined ? "" : `\n${indent}  ${escapeText(String(text))}`;
  return `${indent}<${tag}${attrString}>${textLine}\n${body}\n${indent}</${tag}>`;
}

export function jsonToXml(json: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(error instanceof Error ? `Invalid JSON: ${error.message}` : "Invalid JSON");
  }

  const declaration = '<?xml version="1.0" encoding="UTF-8"?>';

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return `${declaration}\n${valueToXml("root", parsed, "")}`;
  }

  const entries = Object.entries(parsed as Record<string, unknown>);
  // A single top-level key is already a valid root; anything else needs wrapping,
  // because XML permits exactly one root element.
  if (entries.length === 1) {
    return `${declaration}\n${valueToXml(entries[0][0], entries[0][1], "")}`;
  }

  return `${declaration}\n${valueToXml("root", parsed, "")}`;
}
