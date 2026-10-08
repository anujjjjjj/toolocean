import type { ToolPageContent } from "@/types/toolContent";

/**
 * Direction-specific notes for the consolidated converters.
 * No tier: these are not full essays. They exist so each address says something
 * the opposite direction, and the shared category template, does not say.
 */
export const csvToJsonContent: Partial<ToolPageContent> = {
  intro: {
    heading: "What CSV to JSON writes",
    paragraphs: [
      "This address starts in CSV-to-JSON. A header switch decides whether row one becomes property names. Turn it off for a file that is only values and the keys are column_1, column_2, and the rest. The delimiter can be a comma, a semicolon, a tab, a pipe, or one character you type, which is the usual fix when a European spreadsheet used semicolons and a comma-only parser split every decimal.",
      "Open a file from the device or paste. The read stays in the tab. Quoted cells that contain the delimiter stay one cell. The download is a JSON array. It is not an xlsx workbook; that job is CSV to Excel. Nested structure is not invented from flat cells. If you arrived with JSON, the swap control flips the boxes without changing this address, and JSON to CSV is the bookmark for the other way.",
      "A cell's surrounding quote marks are removed, and a newline inside quotes is not preserved as one field. A short row still becomes an object: keys with no cell are empty strings. The saved name is converted.json. This page never opens an xlsx workbook.",
    ],
  },
};

export const jsonToCsvContent: Partial<ToolPageContent> = {
  intro: {
    heading: "What JSON to CSV expects",
    paragraphs: [
      "This address starts in JSON-to-CSV. The input that works is an array of objects. Keys on the first object become the header line, so a later object that introduces a new key loses that field. Put every column on the first object, even when the value is an empty string, if you need the column to exist. A value that contains the delimiter is wrapped in quotes.",
      "Nested objects do not become extra columns. Flatten them first, then come back. Opening a .json file uses the local file reader. The swap control will accept CSV if that is what you pasted, and the canonical page for that direction is CSV to JSON. Nothing here writes an Excel workbook or guesses a delimiter you did not choose.",
      "Anything other than a non-empty array of objects is rejected as invalid JSON format, including one bare object. The number zero and the boolean false become empty cells, because a value that looks missing is replaced before it is written. Only a string that contains the chosen delimiter is wrapped in quotes, and a quote already inside that string is left untouched. The download is named converted.csv and stays plain text, so a spreadsheet formula is not calculated.",
    ],
  },
};

export const yamlToJsonContent: Partial<ToolPageContent> = {
  intro: {
    heading: "What YAML to JSON checks",
    paragraphs: [
      "This address starts in YAML-to-JSON. Paste a manifest or open a .yaml file. If the document parses, the badge says so and the other box fills with pretty-printed JSON. A tab used as indentation stops the parse. The message on the page is the parser's own text, not a rewritten hint. Comments in the YAML are dropped because JSON has nowhere to store them. Keep the original file when those notes matter.",
      "Kubernetes, Compose, and GitHub Actions files are the usual inputs. The page does not apply the YAML to a cluster and it does not sort keys. The swap control still accepts JSON. JSON to YAML is the address that opens already facing that direction. A file that is only JSON should start there so the canonical URL matches the search.",
      "The loader reads a single document. A file that stacks several documents behind lines of three dashes contributes only the first one. Anchors and aliases are expanded, so a shared subtree is copied into the JSON rather than kept as a reference. Pretty printing uses two spaces. The download name is converted.json. No schema is checked and nothing is sent to a cluster.",
    ],
  },
};

export const jsonToYamlContent: Partial<ToolPageContent> = {
  intro: {
    heading: "What JSON to YAML emits",
    paragraphs: [
      "This address starts in JSON-to-YAML. The dump uses two-space indentation, a wide line, and the key order of the JSON object. Keys are not sorted. A JSON string stays a quoted or plain scalar according to the dumper. If you later edit the YAML in a tool that still speaks YAML 1.1, an unquoted yes or no can become a boolean. Quote those words yourself if that tool is in the path.",
      "No comments are added on the way out. The page is for a config you would rather read than a minified object. The swap control accepts YAML again. YAML to JSON is the address that opens facing a manifest. This page does not deploy anything and does not validate against a Kubernetes schema. A parse error is the only failure it reports.",
      "Cycles are refused because the dumper is called with references disabled. A date that arrived as a string stays a string. The output box is that dump, and the file you save is named converted.yaml. The writer does not emit several documents or a leading document-start marker on every block. One JSON value becomes one YAML document.",
    ],
  },
};

export const xmlToJsonContent: Partial<ToolPageContent> = {
  intro: {
    heading: "What XML to JSON keeps",
    paragraphs: [
      "This address starts in XML-to-JSON. Two switches matter. Attributes can be kept as their own keys so a name on a tag does not collapse into the element's text. Explicit arrays force a single child into a list, so a later second sibling does not change the shape from an object to an array. Leave that off if you want the smaller tree and you know the document never repeats a tag.",
      "Open an XML file locally or paste. A document that does not parse shows the parser error and writes nothing. Namespaces and attribute order are not promised back. JSON to XML is the other address, and it writes elements rather than restoring attributes. Use this page when the file you have is markup. The swap control remains if you already have JSON in the box.",
      "Parsing uses the browser DOMParser. A parsererror element becomes the message, usually the first line of that browser text. The JSON object is keyed by the document element, so the root tag is kept. Processing instructions and the XML declaration are not copied across. The saved file is named converted.json.",
    ],
  },
};

export const jsonToXmlContent: Partial<ToolPageContent> = {
  intro: {
    heading: "What JSON to XML writes",
    paragraphs: [
      "This address starts in JSON-to-XML. Objects become elements. Arrays become repeated tags with the same name. Attributes are not invented from key names, including keys that begin with @. If you need attributes preserved, you were going the other way: XML to JSON has the switch for that, and a round trip will still not be byte-identical.",
      "Paste JSON or open a file. The result is XML text you can copy. It is not a schema-validated document and it is not a feed with a generated declaration beyond what the writer emits. The swap control will read XML. The canonical URL for that direction is XML to JSON. Start here when the thing in your clipboard is JSON and the consumer asked for elements.",
      "Every result starts with an XML declaration for version 1.0 and UTF-8. An object with exactly one key uses that key as the document element. Several keys, an array, or null are wrapped in an element named root. A key that begins with a digit or contains a space is rewritten into a legal tag. Ampersands and angle brackets inside text are escaped. The download name is converted.xml.",
    ],
  },
};

export const jsonToTomlContent: Partial<ToolPageContent> = {
  intro: {
    heading: "One page, JSON toward TOML",
    paragraphs: [
      "There is no second address for TOML. This page opens in JSON-to-TOML, which matches Cargo.toml, pyproject.toml, and the other config files people convert from a JSON blob. The swap button flips the boxes to TOML-to-JSON and leaves the URL alone, so bookmarks and the canonical tag stay on one page. Nested objects become [table] headers. Arrays of objects become [[table]] blocks. That is smol-toml's ordinary output.",
      "TOML comments have nowhere to go once the value has been JSON, so they disappear on a round trip. Convert a copy when the comments still matter. The page does not talk to crates.io or to a Python installer. It rewrites text in the tab. If the JSON is not an object the TOML writer can represent, the error toast is the library's message and the output box stays empty.",
      "smol-toml is the only writer on this page. A JSON array sitting at the top level is not a TOML document, and that case shows the library error. There is no file picker and no download button: paste, convert, then copy. Swap clears both boxes so a half-converted buffer is not reused as the next input.",
    ],
  },
};
