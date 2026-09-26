import type { ToolPageContent } from "@/types/toolContent";

const MINIFIED_INPUT =
  '{"id":42,"name":"Ada Lovelace","active":true,"roles":["admin","editor"],"meta":{"created":"2024-01-15T09:30:00Z","score":98.5}}';

const FORMATTED_OUTPUT = `{
  "id": 42,
  "name": "Ada Lovelace",
  "active": true,
  "roles": [
    "admin",
    "editor"
  ],
  "meta": {
    "created": "2024-01-15T09:30:00Z",
    "score": 98.5
  }
}`;

/**
 * Verified against V8: this input yields
 *   "Expected double-quoted property name in JSON at position 48"
 * which the tool normalises to line 4, column 1. Keep the example and its stated
 * output in step if this string ever changes.
 */
const BROKEN_INPUT = `{
  "name": "checkout-service",
  "retries": 3,
}`;

/**
 * Hand-authored content for the JSON formatter, the flagship tool page.
 *
 * Everything below is specific to JSON. The generic privacy/offline copy comes
 * from the category profile, so nothing here repeats it.
 */
export const jsonFormatterContent: Partial<ToolPageContent> = {
  tier: "A",
  /*
   * Stated plainly because these are the things people discover ten minutes in,
   * and finding them here rather than the hard way is the difference between a
   * tool you trust and one you stop using. Each of these is a property of doing
   * the work in a browser tab, not a bug waiting to be fixed.
   */
  limitations: {
    items: [
      {
        title: "It is not a JSON Schema validator",
        body:
          "Valid JSON and correct JSON are different questions. This tool tells you the document parses; it has no opinion on whether a field is missing, a type is wrong, or an enum is out of range.",
        alternative: "json-schema-validator",
      },
      {
        title: "Very large documents run on the main thread",
        body:
          "Parsing and re-serialising happen in the page rather than a worker, so a document in the tens of megabytes will make the tab unresponsive while it works. A few megabytes is comfortable; a 200 MB export is not what this is for.",
      },
      {
        title: "Reformatting is not byte-preserving for numbers",
        body:
          "Values pass through JavaScript numbers, which are IEEE-754 doubles. An integer larger than 9,007,199,254,740,991. A Twitter-style ID, say, comes back rounded, and the output will be valid JSON that no longer says what the input said.",
      },
      {
        title: "No diffing, no querying, no streaming",
        body:
          "This formats one document at a time. Comparing two payloads, running a JSONPath expression over one, or reading a file too big to hold in memory are all different jobs that this page deliberately does not try to do.",
        alternative: "text-diff",
      },
    ],
  },

  seo: {
    title: "JSON Formatter: Free Online JSON Beautifier & Validator",
    description:
      "Format, validate and minify JSON in your browser. Get the exact line and column of any syntax error, sort keys, and copy or download the result. Nothing is uploaded.",
    keywords: [
      "json formatter",
      "json beautifier",
      "format json online",
      "json pretty print",
      "validate json",
      "browser json formatter",
      "online json formatter",
      "json minifier",
    ],
    datePublished: "2024-03-01",
    dateModified: "2026-08-03",
  },

  hero: {
    h1: "Free JSON Formatter Online",
    subtitle:
      "Paste messy or minified JSON and get it back properly indented and validated. Syntax errors are reported with the exact line and column, so you can fix them instead of hunting for them.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Format JSON", action: "scroll" },
    secondaryCta: { label: "Upload JSON File", action: "upload" },
  },

  intro: {
    heading: "What this formatter does differently",
    paragraphs: [
      "Most online JSON formatters post your document to a server, format it there, and send it back. That is a poor trade for something a browser can do natively in under a millisecond, and it means every API response you debug, tokens, customer records, internal IDs, lands in somebody else's request log. This page has no backend at all. The formatting runs in the tab you are reading, which is why it is safe to paste production data into.",
      "The other difference is error reporting. Browsers word their JSON syntax errors inconsistently and Safari does not report a position at all, so this tool normalises the message and derives a line and column number, then highlights that line in the gutter. For a 4,000-line config file, that is the difference between a five-second fix and a bisect.",
    ],
  },

  features: [
    {
      icon: "CloudOff",
      title: "Nothing is uploaded",
      body: "There is no server to send your JSON to. The page is a static bundle, and the formatting happens in local JavaScript, check your network panel while you use it.",
    },
    {
      icon: "AlertTriangle",
      title: "Errors with a line and column",
      body: "Invalid JSON gets a normalised message plus the exact position, highlighted in the gutter. Trailing commas, single quotes, unquoted keys and stray comments are all pinpointed.",
    },
    {
      icon: "Gauge",
      title: "Handles large documents",
      body: "The editor renders line numbers as a single text node rather than one element per line, so multi-megabyte files stay responsive. Format-as-you-type pauses above 512 KB to keep typing smooth.",
    },
    {
      icon: "Minimize2",
      title: "Beautify and minify",
      body: "Switch between 2, 3, 4-space and tab indentation, or strip every byte of whitespace for production. Live byte, line, key and depth counts show the effect.",
    },
    {
      icon: "ArrowDownWideNarrow",
      title: "Optional alphabetical key sort",
      body: "Sorting object keys makes two versions of the same config diffable. Array order is always preserved, because reordering an array changes what the document means.",
    },
    {
      icon: "Keyboard",
      title: "Keyboard driven",
      body: "⌘/Ctrl+Enter formats, ⌘/Ctrl+Shift+M minifies, ⌘/Ctrl+Shift+C copies the output and ⌘/Ctrl+S downloads it. Tab inserts spaces instead of leaving the editor.",
    },
  ],

  howItWorks: [
    {
      title: "Paste or open your JSON",
      body: 'Paste into the left editor, drag a .json file onto it, or press "Open file". Files are read locally with the FileReader API, picking a file is not an upload.',
    },
    {
      title: "Format, minify or validate",
      body: "Auto format runs as you type. Or press Beautify for indented output, Minify to strip whitespace, or Validate to check the document without changing it.",
    },
    {
      title: "Copy or download the result",
      body: "Copy to the clipboard in one click, or save it as formatted.json. The status bar reports size, line count, total keys and nesting depth.",
    },
  ],

  examples: [
    {
      title: "Beautify a minified API response",
      description: "The usual case: a single-line response body copied out of a network panel or a log.",
      input: MINIFIED_INPUT,
      output: FORMATTED_OUTPUT,
      language: "json",
      explanation:
        "The data is untouched, only whitespace changed. Nested objects and arrays each gain a level of indentation, which is what makes the structure scannable. Formatting is purely presentational, so you can safely paste the result back into the system it came from.",
    },
    {
      title: "Find a trailing comma",
      description: "Valid in JavaScript, invalid in JSON. The single most common reason a config file fails to parse.",
      input: BROKEN_INPUT,
      output: "Expected double-quoted property name, line 4, column 1",
      language: "json",
      explanation:
        "The comma after 3 on line 3 is the mistake, but the error points at line 4. That is not a bug: the parser accepts the comma, then expects another property name and instead finds the closing brace, so the first position it can definitively call invalid is line 4. When a reported line looks fine, the cause is almost always the line above it.",
    },
    {
      title: "Minify for production",
      description: "Strip every non-essential byte before embedding JSON in a bundle or a config value.",
      input: FORMATTED_OUTPUT,
      output: MINIFIED_INPUT,
      language: "json",
      explanation:
        "Minifying this example drops it from 176 bytes to 127, a 28% reduction, entirely from removing whitespace. The saving scales with nesting depth, so deeply structured documents benefit most. Over HTTP with gzip or brotli the real-world difference is smaller, since compression already handles repeated indentation well.",
    },
  ],

  useCases: [
    {
      icon: "Bug",
      audience: "Debugging an API",
      body: "Paste a response body straight from your browser's network panel or a curl call. Because nothing is transmitted, this works for authenticated endpoints and staging data that you could not paste into a hosted formatter.",
    },
    {
      icon: "Cog",
      audience: "Editing config files",
      body: "tsconfig.json, package.json, ESLint and CI configs all fail loudly on a stray comma. Validate before committing, and use key sorting to make a large config reviewable in a diff.",
    },
    {
      icon: "Server",
      audience: "Backend development",
      body: "Check the exact shape of a payload before writing a deserialiser, or confirm what your service actually emitted rather than what the schema says it should.",
    },
    {
      icon: "Code2",
      audience: "Frontend development",
      body: "Inspect fixture files and mock responses, and minify JSON that ships inside a bundle. The depth and key counts help spot a response that has grown heavier than intended.",
    },
    {
      icon: "GraduationCap",
      audience: "Learning JSON",
      body: "Indentation makes the relationship between objects and arrays visible. Deliberately breaking a document and reading the error is a fast way to internalise the strict rules that separate JSON from JavaScript.",
    },
    {
      icon: "ShieldCheck",
      audience: "Working with regulated data",
      body: "Where policy forbids pasting customer records into third-party sites, a formatter that provably makes no network requests is often the only compliant option available.",
    },
  ],

  faqs: [
    {
      question: "How do I format JSON?",
      answer:
        'Paste your JSON into the left editor. With auto format on it is indented immediately; otherwise press Beautify or ⌘/Ctrl+Enter. Pick your indentation, 2, 3 or 4 spaces, or tabs, then copy the result or download it as a file.',
    },
    {
      question: "Is my JSON uploaded to a server?",
      answer:
        "No. This page has no backend. The formatter is JavaScript that runs in your browser, so your JSON never leaves the tab. You can verify it by opening DevTools, switching to the Network tab, and formatting a document, no request is made.",
    },
    {
      question: "What is the difference between beautifying and minifying JSON?",
      answer:
        "Both keep the data identical and only change whitespace. Beautifying adds newlines and indentation so a human can read the structure. Minifying removes all optional whitespace to make the payload as small as possible, which suits anything that gets transmitted or embedded in code.",
    },
    {
      question: "Why is my JSON invalid when it looks like valid JavaScript?",
      answer:
        "JSON is much stricter than JavaScript object syntax. It forbids trailing commas, requires double quotes around both keys and string values, disallows comments, and rejects single quotes, unquoted keys, undefined, NaN and Infinity. A JavaScript object literal that works fine in code is frequently invalid JSON.",
    },
    {
      question: "Can I use comments in a JSON file?",
      answer:
        "Not in standard JSON. The specification has no comment syntax, so this validator rejects them. Some tools accept a superset called JSONC (used by tsconfig.json and VS Code settings) which does allow // and /* */. If you need comments, keep the file as JSONC and strip them before handing it to a strict parser.",
    },
    {
      question: "Can this tool fix invalid JSON automatically?",
      answer:
        "This page reports errors rather than guessing at repairs, because a wrong guess silently changes your data. For automatic repair of the common cases, trailing commas, unquoted keys, smart quotes, use the JSON Fixer, then bring the result back here to format it.",
    },
    {
      question: "How large a JSON file can I format?",
      answer:
        "There is no limit set by us. The constraint is your device's memory, since the whole document is held in RAM. Files in the low tens of megabytes are fine on a laptop; format-as-you-type switches off above 512 KB so typing stays responsive, and you press Beautify instead.",
    },
    {
      question: "Does it work offline?",
      answer:
        "Yes, once the page has loaded. The formatter is already on your machine at that point, so you can disconnect and keep working. Reloading while offline depends on the page still being in your browser cache.",
    },
    {
      question: "Will formatting change my data?",
      answer:
        "Formatting only alters whitespace, so the parsed value is identical. There are two things worth knowing, though: very large integers and duplicate keys are affected by the parse step itself, see the next two answers.",
    },
    {
      question: "Why did my very large numbers change?",
      answer:
        "JSON.parse produces JavaScript numbers, which are IEEE-754 doubles and can only represent integers exactly up to 9,007,199,254,740,991. An ID like 12345678901234567890 loses precision on the way in, and the formatted output will show the rounded value. If you handle large integers such as Twitter-style snowflake IDs or int64 database keys, transport them as strings.",
    },
    {
      question: "What happens to duplicate keys?",
      answer:
        'JSON technically permits repeated keys but does not define what they mean. JavaScript keeps the last one, so {"a":1,"a":2} formats to {"a": 2} and the first value is silently dropped. If a document surprises you by losing a field, duplicate keys are worth checking for.',
    },
    {
      question: "Does sorting keys change the meaning of my JSON?",
      answer:
        "No. Object key order is not significant in JSON, so sorting is safe and makes two versions of a config genuinely diffable. Array order is significant and is never touched. One caveat: JavaScript engines always place integer-like keys such as \"2\" and \"10\" first, in numeric order, regardless of sorting.",
    },
    {
      question: "Can I format JSON Lines or NDJSON?",
      answer:
        "Not directly. JSON Lines files contain one independent JSON document per line, so the file as a whole is not valid JSON and will fail validation. Format one line at a time, or wrap the lines in an array with commas between them first.",
    },
    {
      question: "What keyboard shortcuts are available?",
      answer:
        "⌘/Ctrl+Enter beautifies, ⌘/Ctrl+Shift+M minifies, ⌘/Ctrl+Shift+C copies the output and ⌘/Ctrl+S downloads it. Tab inserts two spaces inside the editor; Shift+Tab still moves focus out, so you are never trapped in the field.",
    },
    {
      question: "Do I need an account?",
      answer:
        "No. There is no sign-up, no email and no usage limit. Nothing about your session is stored beyond the tab you have open.",
    },
  ],

  related: [
    {
      name: "JSON Minifier",
      path: "/json-minifier",
      description: "Strip whitespace to shrink a JSON payload before shipping it.",
    },
    {
      name: "JSON Fixer",
      path: "/json-fixer",
      description: "Repair trailing commas, unquoted keys and smart quotes automatically.",
    },
    {
      name: "JSON Schema Validator",
      path: "/json-schema-validator",
      description: "Go beyond syntax and check a document against an expected schema.",
    },
    {
      name: "JSON ⇄ YAML Converter",
      path: "/yaml-json-converter",
      description: "Move config between JSON and the YAML that CI systems prefer.",
    },
    {
      name: "JSON Flattener",
      path: "/json-flattener",
      description: "Collapse nested objects to dot-notation keys, or expand them back.",
    },
    {
      name: "JSON ⇄ XML Converter",
      path: "/xml-json-converter",
      description: "Translate between JSON and XML when integrating with older APIs.",
    },
  ],

  headings: {
    features: {
      heading: "Why use this JSON formatter",
      lede: "What you get here that a server-side formatter cannot offer.",
    },
    howItWorks: { heading: "How to format JSON in three steps" },
    examples: {
      heading: "JSON formatting examples",
      lede: "Real input, real output, and what changed in between.",
    },
    useCases: { heading: "Who uses a JSON formatter" },
    faq: {
      heading: "JSON formatter FAQ",
      lede: "Common questions about formatting, validating and the strict rules JSON enforces.",
    },
    related: {
      heading: "Related JSON tools",
      lede: "Other browser-first tools for working with JSON.",
    },
  },
};
