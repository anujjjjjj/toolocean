import type { ToolFaqEntry } from "@/types/toolContent";

// Central per-tool SEO metadata.
//
// Keys are tool ids. Two ids exist in more than one category (color-converter and
// timestamp-converter live under both /tools/ and /converter-tools/), so entries may
// also be keyed "<route-prefix>/<tool-id>" — a scoped key wins over the bare id.
// Category pages pass their prefix as the second argument to getToolSeo().
//
//   - title: overrides the auto-generated "<Tool Name> - Free Online Tool"
//            ("| ToolOcean" is appended by useSEO, so leave it out here)
//   - description: meta description — aim for 140-160 characters
//   - keywords: meta keywords, and the phrases each page is written to rank for
//   - faqs: rendered as a visible FAQ accordion on the tool page AND emitted as
//           FAQPage JSON-LD
//
// Entries are optional — any tool without one falls back to its name/description
// from the page's own tool metadata.
/*
 * Re-exported from the page content contract rather than redeclared.
 *
 * The two shapes had drifted the moment FAQ entries gained a `topic`, and a
 * baseline FAQ here is the same thing as an authored one in a content module —
 * it just lives in the file that covers every tool rather than one file per tool.
 */
export type ToolFaq = ToolFaqEntry;


export interface ToolSeoEntry {
  title?: string;
  description?: string;
  keywords?: string[];
  faqs?: ToolFaq[];
}

// Every tool is client-side, so this answer is reused verbatim in many entries.
const PRIVACY_ANSWER =
  "No. Everything runs locally in your browser using JavaScript — your data is never uploaded to a server, and nothing is stored or logged.";

/**
 * Subjects that are grammatically plural, so the question needs "Are my" not "Is my".
 *
 * These are listed rather than detected from a trailing "s", because half the
 * subjects here are acronyms and mass nouns that end in one anyway — "CSS", "CSV",
 * "SVG", "address". Getting that wrong in the other direction ("Are my CSS
 * uploaded") is no better than the bug being fixed.
 */
const PLURAL_SUBJECTS = new Set([
  "audio files",
  "colour values",
  "files",
  "generated strings",
  "generated UUIDs",
  "images",
]);

/*
 * These questions render as <h3> inside FAQPage structured data, so "Is my images
 * uploaded to a server?" was not just visible on the page — it was eligible to show
 * up verbatim in a Google rich result. Roughly twenty pages carried one.
 */
const privacyFaq = (subject: string): ToolFaq => ({
  // Tagged so the generated category privacy FAQ stands down. Without it both
  // rendered, asking the same question in two phrasings on ~108 pages.
  topic: "privacy",
  question: PLURAL_SUBJECTS.has(subject)
    ? `Are my ${subject} uploaded to a server?`
    : `Is my ${subject} uploaded to a server?`,
  answer: PRIVACY_ANSWER,
});

/**
 * Strings that are deliberately identical across many tools.
 *
 * scripts/check-content.mjs fails any phrase shared between two pages, which is
 * what stops the authoring programme from turning into one template with the
 * nouns swapped. These are the exceptions: statements about the architecture
 * that are true in the same way everywhere, where writing 114 variations would
 * add words without adding information — and inventing differences would make
 * the claim sound less certain than it is.
 */
export const SHARED_STRINGS: string[] = [PRIVACY_ANSWER];

export const toolSeoData: Record<string, ToolSeoEntry> = {
  // ---------------------------------------------------------------------------
  // Developer tools — Text Processing (/tools/)
  // ---------------------------------------------------------------------------
  "case-converter": {
    title: "Case Converter — camelCase, snake_case & More",
    description:
      "Convert text between uppercase, lowercase, camelCase, PascalCase, snake_case, kebab-case, and Title Case instantly in your browser. Free, no signup.",
    keywords: ["case converter", "camelcase converter", "snake case converter", "pascalcase", "kebab case", "text case changer", "uppercase to lowercase"],
    faqs: [
      privacyFaq("text"),
      {
        question: "What is the difference between camelCase and PascalCase?",
        answer:
          "camelCase starts with a lowercase letter and capitalises each following word (userName), while PascalCase capitalises the first letter too (UserName). camelCase is common for variables, PascalCase for class and component names.",
      },
      {
        question: "Does it handle acronyms and punctuation?",
        answer:
          "Yes. Word boundaries are detected from spaces, underscores, hyphens, and existing capitalisation, so strings like parseHTMLResponse or api_base_url convert cleanly.",
      },
    ],
  },
  "word-counter": {
    title: "Word Counter — Count Words, Characters & Reading Time",
    description:
      "Free online word counter. Count words, characters with and without spaces, sentences, paragraphs, and estimated reading time as you type. Nothing is uploaded.",
    keywords: ["word counter", "character counter", "word count tool", "letter count", "reading time calculator", "paragraph counter"],
    faqs: [
      privacyFaq("text"),
      {
        question: "How is reading time calculated?",
        answer:
          "Reading time uses an average of about 200 words per minute, which is typical for adult silent reading of general-purpose prose. Technical text usually reads slower.",
      },
      {
        question: "Are spaces counted as characters?",
        answer:
          "Both figures are shown — characters including spaces and characters excluding spaces — because social platforms and form limits differ in which one they enforce.",
      },
    ],
  },
  "text-diff": {
    title: "Text Diff Checker — Compare Two Texts Online",
    description:
      "Compare two blocks of text and highlight every addition, deletion, and change line by line. A free, private diff checker that runs entirely in your browser.",
    keywords: ["text diff", "diff checker", "compare text online", "text comparison tool", "file diff", "find differences between two texts"],
    faqs: [
      privacyFaq("text"),
      {
        question: "Can I compare code with this?",
        answer:
          "Yes. The diff is line-based and language-agnostic, so source code, config files, logs, and JSON all compare correctly. Paste both versions and the changed lines are highlighted.",
      },
      {
        question: "Does it detect changes within a line?",
        answer:
          "Lines that differ are highlighted as changed so you can see exactly which rows moved, were added, or were removed between the two versions.",
      },
    ],
  },
  "duplicate-remover": {
    title: "Remove Duplicate Lines Online — Free & Instant",
    description:
      "Remove duplicate lines from any list while preserving the original order. Free online duplicate line remover for emails, IDs, keywords, and log files.",
    keywords: ["remove duplicate lines", "duplicate line remover", "deduplicate list", "unique lines online", "remove repeated lines"],
    faqs: [
      privacyFaq("list"),
      {
        question: "Is the original order preserved?",
        answer:
          "Yes. The first occurrence of each line stays exactly where it was and later repeats are dropped, so you do not need to re-sort the result afterwards.",
      },
      {
        question: "Is the comparison case-sensitive?",
        answer:
          "Lines are compared exactly as written, so Apple and apple count as two different lines. Normalise the case first with the Case Converter if you want them treated as duplicates.",
      },
    ],
  },
  "line-break-remover": {
    title: "Line Break Remover — Join Text Into One Line",
    description:
      "Strip line breaks and newlines from pasted text to join it into a single clean line. Useful for fixing text copied out of PDFs, emails, and terminals.",
    keywords: ["line break remover", "remove newlines", "join lines", "remove line breaks from text", "strip carriage returns"],
    faqs: [
      privacyFaq("text"),
      {
        question: "Why does text copied from a PDF have broken lines?",
        answer:
          "PDFs store text laid out per visual line, so copying preserves a hard line break at the end of every printed row. Removing those breaks restores the text to flowing paragraphs.",
      },
      {
        question: "Does it handle Windows and Unix line endings?",
        answer:
          "Yes. Both CRLF (Windows) and LF (Unix/macOS) line endings are recognised and removed, so it works regardless of where the text came from.",
      },
    ],
  },
  "text-replacer": {
    title: "Find and Replace Text Online — With Regex Support",
    description:
      "Find and replace text in bulk, with plain-text or regular expression matching and capture groups. A free online search-and-replace tool with no upload.",
    keywords: ["find and replace online", "text replacer", "regex replace", "bulk replace text", "search and replace tool"],
    faqs: [
      privacyFaq("text"),
      {
        question: "Can I use regular expressions?",
        answer:
          "Yes. Enable regex mode to match with patterns, and reference capture groups in the replacement using $1, $2, and so on.",
      },
      {
        question: "How do I replace only the first match?",
        answer:
          "Turn off the global flag. With global matching enabled every occurrence is replaced; with it disabled only the first match in the text is changed.",
      },
    ],
  },
  "slug-converter": {
    title: "Slug Generator — Convert Text to URL-Friendly Slugs",
    description:
      "Turn any title into a clean, lowercase, hyphenated URL slug. Strips accents, punctuation, and extra spaces so your links stay readable and SEO-friendly.",
    keywords: ["slug generator", "url slug converter", "seo slug", "permalink generator", "text to slug", "slugify online"],
    faqs: [
      privacyFaq("text"),
      {
        question: "What makes a good URL slug?",
        answer:
          "Short, lowercase, hyphen-separated, and made of real keywords from the page title. Avoid stop words, dates, and IDs where you can — slugs are read by both people and search engines.",
      },
      {
        question: "How are accented and non-English characters handled?",
        answer:
          "Accented Latin characters are transliterated to their closest ASCII equivalent (é becomes e) and unsupported symbols are dropped, leaving a slug that is safe in any URL.",
      },
    ],
  },
  "html-entity-encoder": {
    title: "HTML Entity Encoder & Decoder Online",
    description:
      "Encode special characters such as &, <, >, and quotes into HTML entities, or decode entities back into plain text. Free, instant, and fully client-side.",
    keywords: ["html entity encoder", "html entity decoder", "escape html", "html special characters", "encode ampersand", "unescape html"],
    faqs: [
      privacyFaq("input"),
      {
        question: "Why do I need to escape HTML entities?",
        answer:
          "Characters like < and & have structural meaning in HTML. Escaping them ensures they render as text instead of being parsed as markup, which also prevents a common class of XSS injection.",
      },
      {
        question: "Which characters get encoded?",
        answer:
          "The reserved characters &, <, >, double quote, and single quote are always encoded. Other characters can be emitted as named or numeric entities depending on the mode you pick.",
      },
    ],
  },
  "lorem-ipsum-generator": {
    title: "Lorem Ipsum Generator — Placeholder Text for Mockups",
    description:
      "Generate lorem ipsum placeholder text by words, sentences, or paragraphs for design mockups and wireframes. Copy it in one click, free and without signup.",
    keywords: ["lorem ipsum generator", "placeholder text", "dummy text generator", "filler text", "lipsum", "mockup text"],
    faqs: [
      {
        question: "What is lorem ipsum?",
        answer:
          "Lorem ipsum is scrambled Latin used as placeholder copy since the 1500s. Because it is not readable prose, reviewers look at the layout and typography instead of reading the words.",
      },
      {
        question: "How much text should I generate?",
        answer:
          "Match the real content length you expect. Placeholder text that is far shorter or longer than the final copy hides layout problems that only appear once real content lands.",
      },
      privacyFaq("generated text"),
    ],
  },
  "string-escape": {
    title: "String Escape & Unescape — JSON, JavaScript, HTML, URL",
    description:
      "Escape or unescape strings for JSON, JavaScript, HTML, and URL contexts. Handles quotes, backslashes, newlines, and percent-encoding in one free online tool.",
    keywords: ["string escape", "unescape string", "escape json string", "javascript escape", "backslash escape", "escape quotes online"],
    faqs: [
      privacyFaq("string"),
      {
        question: "Which escaping rules does each mode use?",
        answer:
          "JSON mode escapes quotes, backslashes, and control characters per RFC 8259. JavaScript mode adds string-literal escapes, HTML mode uses entities, and URL mode applies percent-encoding.",
      },
      {
        question: "Why does my JSON break when I paste a string into it?",
        answer:
          "Unescaped double quotes, backslashes, or literal newlines inside a value terminate the string early. Escaping the value first makes it safe to embed in a JSON document.",
      },
    ],
  },
  "unicode-inspector": {
    title: "Unicode Character Inspector — Codepoints & Hex",
    description:
      "Inspect any string character by character: Unicode codepoint, character name, hex, decimal, HTML entity, and binary. Ideal for debugging invisible characters.",
    keywords: ["unicode inspector", "character codepoint lookup", "unicode hex", "invisible character detector", "utf-8 inspector", "html entity lookup"],
    faqs: [
      privacyFaq("text"),
      {
        question: "How do I find invisible or zero-width characters?",
        answer:
          "Paste the string and inspect the per-character breakdown. Zero-width spaces, non-breaking spaces, and directional marks appear as their own rows with a visible codepoint such as U+200B.",
      },
      {
        question: "What is the difference between a codepoint and a byte?",
        answer:
          "A codepoint is the abstract Unicode number for a character (U+1F600). Its byte length depends on the encoding — in UTF-8 a character can take between one and four bytes.",
      },
    ],
  },
  "text-sorter": {
    title: "Sort Lines Online — Alphabetical, Numeric & Random",
    description:
      "Sort text lines alphabetically, numerically, by length, in reverse, or shuffle them randomly. A fast, free line sorter that never uploads your list.",
    keywords: ["sort lines online", "alphabetical sorter", "sort list", "numeric sort", "shuffle lines", "reverse sort text"],
    faqs: [
      privacyFaq("list"),
      {
        question: "Why do my numbers sort in the wrong order?",
        answer:
          "Alphabetical sorting compares character by character, so 10 lands before 9. Switch to numeric sort to compare the values as numbers instead of as strings.",
      },
      {
        question: "Can I sort while keeping duplicates?",
        answer:
          "Yes. Sorting leaves duplicates in place. Run the Duplicate Lines Remover afterwards if you want a sorted, unique list.",
      },
    ],
  },
  "text-to-binary": {
    title: "Text to Binary Converter — Binary, Hex & Decimal",
    description:
      "Convert text to binary, hexadecimal, or decimal and convert it back to readable text. A free two-way ASCII and Unicode converter that runs in your browser.",
    keywords: ["text to binary", "binary to text", "text to hex", "ascii converter", "binary translator", "text to decimal"],
    faqs: [
      privacyFaq("text"),
      {
        question: "How is text turned into binary?",
        answer:
          "Each character is encoded to its UTF-8 byte values, and each byte is written as eight binary digits. ASCII characters produce one byte; accented and emoji characters produce two to four.",
      },
      {
        question: "Why does my binary fail to convert back?",
        answer:
          "Binary input must be a whole number of 8-bit groups. Missing digits or stray characters break byte alignment — separate each byte with a space to be safe.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Developer tools — Code Formatting (/tools/)
  // ---------------------------------------------------------------------------
  "json-formatter": {
    title: "JSON Formatter & Validator — Beautify JSON Online",
    description:
      "Format, validate, and beautify JSON with proper indentation and syntax highlighting. Catch errors instantly with a free JSON formatter that never uploads data.",
    keywords: ["json formatter", "json beautifier", "json validator", "pretty print json", "format json online", "json viewer"],
    faqs: [
      privacyFaq("JSON"),
      {
        question: "What does the validator check?",
        answer:
          "The input is parsed as strict JSON, so trailing commas, single quotes, unquoted keys, and comments are all reported as errors with the position where parsing failed.",
      },
      {
        question: "My JSON is invalid — can it be fixed automatically?",
        answer:
          "Use the JSON Fixer tool. It repairs the most common problems — trailing commas, missing quotes around keys, and smart quotes — and hands back valid JSON to format here.",
      },
    ],
  },
  "json-stringify": {
    title: "JSON.stringify Online — Objects to JSON Strings",
    description:
      "Convert JavaScript objects and JSON into escaped JSON strings, ready to embed in code, config files, or API payloads. Free and entirely client-side.",
    keywords: ["json stringify", "object to json string", "escape json", "json to string online", "stringify javascript object"],
    faqs: [
      privacyFaq("input"),
      {
        question: "What is the difference between JSON.stringify and formatting?",
        answer:
          "Formatting pretty-prints a JSON document for reading. Stringify produces a single escaped string value that can itself be embedded inside another string, with quotes and newlines escaped.",
      },
      {
        question: "When would I need a stringified JSON payload?",
        answer:
          "Commonly when storing JSON inside another JSON field, in an environment variable, in a database text column, or when pasting a request body into a shell command.",
      },
    ],
  },
  "json-parse": {
    title: "JSON.parse Online — Parse JSON Strings to Readable Data",
    description:
      "Parse an escaped JSON string back into readable, formatted data. Paste stringified JSON from logs or env vars and see the real structure. Free, no upload.",
    keywords: ["json parse online", "parse json string", "unescape json", "json string to object", "decode json"],
    faqs: [
      privacyFaq("input"),
      {
        question: "Why does my log line fail to parse?",
        answer:
          "Log output is often double-escaped or truncated. Remove the surrounding quotes and any doubled backslashes first — the parser needs a complete, well-formed JSON document.",
      },
      {
        question: "Does it handle nested stringified JSON?",
        answer:
          "Yes, but one level at a time. Parse the outer string, then copy the inner string value and parse it again to unwrap the nested payload.",
      },
    ],
  },
  "html-formatter": {
    title: "HTML Formatter & Beautifier — Indent HTML Online",
    description:
      "Format and beautify messy or minified HTML with consistent indentation and readable nesting. A free HTML beautifier that processes markup in your browser.",
    keywords: ["html formatter", "html beautifier", "format html online", "indent html", "prettify html", "unminify html"],
    faqs: [
      privacyFaq("HTML"),
      {
        question: "Can it un-minify compressed HTML?",
        answer:
          "Yes. Minified markup on a single line is re-indented into a readable tree so you can inspect the structure of a built page or an email template.",
      },
      {
        question: "Does formatting change how the page renders?",
        answer:
          "Formatting only adds whitespace between tags. It does not alter attributes or element order, though whitespace-sensitive elements like pre and textarea are left untouched.",
      },
    ],
  },
  "sql-formatter": {
    title: "SQL Formatter — Beautify & Indent SQL Queries Online",
    description:
      "Format long or generated SQL into readable, consistently indented queries with keyword casing. A free SQL beautifier for SELECT, JOIN, CTE, and DDL statements.",
    keywords: ["sql formatter", "sql beautifier", "format sql online", "sql pretty print", "indent sql query", "sql prettifier"],
    faqs: [
      privacyFaq("SQL"),
      {
        question: "Which SQL dialects are supported?",
        answer:
          "Formatting is based on standard SQL syntax, so PostgreSQL, MySQL, SQLite, and SQL Server queries all format correctly. Vendor-specific keywords are preserved as written.",
      },
      {
        question: "Is it safe to paste production queries?",
        answer:
          "Yes. Formatting happens locally in your browser — the query is never transmitted, which matters when the SQL contains table names or literal values from a real system.",
      },
    ],
  },
  "json-fixer": {
    title: "JSON Fixer — Repair Broken or Invalid JSON Online",
    description:
      "Automatically repair invalid JSON: trailing commas, missing or single quotes, unquoted keys, and comments. Get valid, parseable JSON back in one click.",
    keywords: ["json fixer", "repair json", "fix invalid json", "json error fix", "trailing comma json", "json repair tool"],
    faqs: [
      privacyFaq("JSON"),
      {
        question: "What kinds of errors can it fix?",
        answer:
          "The common hand-editing mistakes: trailing commas, unquoted or single-quoted keys, single-quoted strings, smart quotes pasted from a document, and // or /* */ comments.",
      },
      {
        question: "Will it change my data?",
        answer:
          "It only repairs syntax. Keys, values, and ordering are preserved — always review the output before using it in place of the original document.",
      },
    ],
  },
  "toml-formatter": {
    title: "TOML Formatter & Validator Online",
    description:
      "Format and validate TOML configuration files with consistent spacing and clear error messages. Free online TOML linter for Cargo, pyproject, and app config.",
    keywords: ["toml formatter", "toml validator", "format toml online", "toml linter", "cargo toml formatter", "pyproject toml"],
    faqs: [
      privacyFaq("configuration"),
      {
        question: "Where is TOML typically used?",
        answer:
          "TOML is the config format for Rust's Cargo.toml, Python's pyproject.toml, Hugo, and many Go tools. It is designed to be unambiguous and easy to read by hand.",
      },
      {
        question: "What are the most common TOML mistakes?",
        answer:
          "Duplicate table headers, mixing inline tables with sectioned tables, and unquoted string values containing special characters. The validator reports the offending line.",
      },
    ],
  },
  "xml-formatter": {
    title: "XML Formatter & Minifier — Beautify XML Online",
    description:
      "Format XML with proper indentation or minify it to save space, with syntax validation on the way. A free XML beautifier that keeps documents on your machine.",
    keywords: ["xml formatter", "xml beautifier", "format xml online", "xml minifier", "pretty print xml", "xml validator"],
    faqs: [
      privacyFaq("XML"),
      {
        question: "Does it validate the document?",
        answer:
          "The XML is parsed before formatting, so malformed markup — unclosed tags, mismatched nesting, invalid characters — is reported rather than silently reformatted.",
      },
      {
        question: "Can it format SOAP or RSS payloads?",
        answer:
          "Yes. Any well-formed XML document works, including SOAP envelopes, RSS and Atom feeds, SVG, sitemaps, and Android or Maven configuration files.",
      },
    ],
  },
  "csv-formatter": {
    title: "CSV Formatter & Validator — Clean Up CSV Online",
    description:
      "Validate and reformat CSV files with custom delimiters, quoting, and a table preview. Spot ragged rows and bad quoting before importing your data anywhere.",
    keywords: ["csv formatter", "csv validator", "clean csv online", "csv delimiter", "fix csv file", "csv preview"],
    faqs: [
      privacyFaq("CSV"),
      {
        question: "What does the validator flag?",
        answer:
          "Rows with the wrong number of columns, unbalanced quotes, and inconsistent line endings — the three problems that most often break a spreadsheet or database import.",
      },
      {
        question: "Can I use semicolons or tabs as the delimiter?",
        answer:
          "Yes. The delimiter is configurable, which matters for European CSV exports that use semicolons and for tab-separated files exported from spreadsheets.",
      },
    ],
  },
  "markdown-preview": {
    title: "Markdown Preview — Live Markdown Editor & Renderer",
    description:
      "Write Markdown and see the rendered result live side by side, with GitHub Flavored Markdown support for tables, task lists, and fenced code blocks.",
    keywords: ["markdown preview", "markdown editor online", "md viewer", "github flavored markdown", "markdown renderer", "readme preview"],
    faqs: [
      privacyFaq("document"),
      {
        question: "Is GitHub Flavored Markdown supported?",
        answer:
          "Yes. Tables, task lists, strikethrough, autolinks, and fenced code blocks all render, so a README previewed here matches closely what GitHub will display.",
      },
      {
        question: "Can I export the rendered HTML?",
        answer:
          "Use the Markdown to HTML converter to get the raw HTML output, or the Markdown to DOCX converter if you need a Word document.",
      },
    ],
  },
  "json-minifier": {
    title: "JSON Minifier — Compress JSON by Removing Whitespace",
    description:
      "Minify JSON by stripping whitespace and line breaks to cut payload size for APIs and config files. See the byte savings instantly, free and client-side.",
    keywords: ["json minifier", "minify json online", "compress json", "json whitespace remover", "reduce json size"],
    faqs: [
      privacyFaq("JSON"),
      {
        question: "How much smaller does minified JSON get?",
        answer:
          "Pretty-printed JSON is typically 15-30% whitespace, so minifying an indented document usually cuts that much off before any gzip compression is applied on top.",
      },
      {
        question: "Does minifying change the data?",
        answer:
          "No. Only insignificant whitespace between tokens is removed. Keys, values, ordering, and numeric precision are all preserved exactly.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Developer tools — Development (/tools/)
  // ---------------------------------------------------------------------------
  "regex-tester": {
    title: "Regex Tester — Live Regular Expression Matching",
    description:
      "Test regular expressions against sample text with live highlighting, capture groups, and flag toggles. A free regex tester and debugger for JavaScript patterns.",
    keywords: ["regex tester", "regular expression tester", "regex online", "test regex", "regex debugger", "regex match highlighter"],
    faqs: [
      privacyFaq("pattern and test text"),
      {
        question: "Which regex flavour is used?",
        answer:
          "JavaScript's RegExp engine, so patterns behave exactly as they will in Node.js and the browser. PCRE features such as lookbehind work in modern browsers but recursion is unsupported.",
      },
      {
        question: "What do the g, i, and m flags do?",
        answer:
          "g finds every match instead of stopping at the first, i makes matching case-insensitive, and m makes ^ and $ match at each line break rather than only at the string boundaries.",
      },
    ],
  },
  "regex-generator": {
    title: "Regex Generator — Build Regex from Patterns",
    description:
      "Generate regular expressions from common patterns — email, URL, phone, date, IP — and test them against your own input with real-time matching. Free online.",
    keywords: ["regex generator", "build regex", "regex patterns", "email regex", "url regex", "regex builder online"],
    faqs: [
      privacyFaq("input"),
      {
        question: "Which common patterns are included?",
        answer:
          "Ready-made patterns for email addresses, URLs, phone numbers, dates, IP addresses, hex colours, and postcodes — each editable so you can adapt it to your own data.",
      },
      {
        question: "Should I validate emails with a regex?",
        answer:
          "Use a permissive pattern for a quick format check, but real validation means sending a confirmation email. Strict RFC-compliant email regexes are enormous and still reject valid addresses.",
      },
    ],
  },
  "code-explainer": {
    title: "Code Explainer — Code in Plain English",
    description:
      "Paste a code snippet and get a plain-English breakdown of what it does, step by step. Useful for reviewing unfamiliar code and legacy functions.",
    keywords: ["code explainer", "explain code online", "code to english", "understand code snippet", "code analysis tool"],
    faqs: [
      privacyFaq("code"),
      {
        question: "Which languages can it explain?",
        answer:
          "It handles mainstream languages including JavaScript, TypeScript, Python, Java, Go, C#, and SQL, plus shell scripts and configuration files.",
      },
      {
        question: "Should I paste proprietary code?",
        answer:
          "Follow your own organisation's policy. Treat any explanation as a starting point for review rather than an authoritative audit of what the code does.",
      },
    ],
  },
  "url-encoder": {
    title: "URL Encoder & Decoder — Percent-Encoding Online",
    description:
      "Encode and decode URLs and URL components with correct percent-encoding for query strings, paths, and form data. Free, instant, and fully client-side.",
    keywords: ["url encoder", "url decoder", "percent encoding", "encodeuricomponent online", "escape url", "query string encoder"],
    faqs: [
      privacyFaq("URL"),
      {
        question: "What is the difference between encoding a URL and a URL component?",
        answer:
          "Full-URL encoding leaves structural characters like / ? : & intact. Component encoding escapes them too, which is what you want for a value going inside a query parameter.",
      },
      {
        question: "Why does my query parameter break at the ampersand?",
        answer:
          "An unencoded & starts a new parameter. Encode the value as a component so the & becomes %26 and stays part of the value instead of splitting it.",
      },
    ],
  },
  "number-base-converter": {
    title: "Number Base Converter — Decimal, Hex, Binary & Octal",
    description:
      "Convert numbers between decimal, hexadecimal, binary, and octal, with all four bases updating together as you type. Free online base converter, no signup.",
    keywords: ["number base converter", "decimal to hex", "hex to binary", "binary converter", "octal converter", "base conversion tool"],
    faqs: [
      privacyFaq("input"),
      {
        question: "Why is hexadecimal used so widely in programming?",
        answer:
          "One hex digit maps to exactly four binary bits, so a byte is always two hex digits. That makes memory addresses, colour codes, and bitmasks far easier to read than raw binary.",
      },
      {
        question: "Can it convert negative numbers?",
        answer:
          "Negative decimals convert with a leading sign. For two's-complement representations, convert the unsigned value for the bit width you are working with.",
      },
    ],
  },
  "mime-type-lookup": {
    title: "MIME Type Lookup — Find Content-Type by File Extension",
    description:
      "Look up the MIME type for any file extension, or find which extensions map to a given content type. A quick reference for Content-Type headers and uploads.",
    keywords: ["mime type lookup", "content type by extension", "file extension mime", "media type list", "content-type header"],
    faqs: [
      {
        question: "Why does my file download instead of displaying?",
        answer:
          "Usually the wrong Content-Type header, or Content-Disposition set to attachment. Serving a PDF as application/octet-stream, for example, makes browsers download rather than render it.",
      },
      {
        question: "What MIME type should I use for an unknown file?",
        answer:
          "application/octet-stream is the generic fallback for arbitrary binary data. Use a specific type whenever you know it, so browsers and clients handle the file correctly.",
      },
      privacyFaq("lookup"),
    ],
  },
  "qr-code-generator": {
    title: "QR Code Generator — Free QR Codes from Text or URLs",
    description:
      "Generate a QR code from any text or URL and download it as a PNG. Free, unlimited, no watermark, no tracking, and no account — generated in your browser.",
    keywords: ["qr code generator", "create qr code", "free qr code", "url to qr code", "qr code png download", "qr generator no watermark"],
    faqs: [
      {
        question: "Do these QR codes expire?",
        answer:
          "No. The code encodes your content directly rather than pointing at a redirect service, so it keeps working forever and there is no tracking or scan limit attached.",
      },
      privacyFaq("QR content"),
      {
        question: "How much data fits in a QR code?",
        answer:
          "Up to roughly 4,000 characters, but density rises quickly with length. Keep URLs short so the code stays easy to scan at small print sizes and from a distance.",
      },
    ],
  },
  "number-formatter": {
    title: "Number Formatter — Commas, Currency, Ordinals & Locales",
    description:
      "Format numbers with thousands separators, currency symbols, percentages, scientific notation, ordinals, and locale rules. Free online number formatting tool.",
    keywords: ["number formatter", "add commas to numbers", "currency formatter", "thousands separator", "ordinal numbers", "locale number format"],
    faqs: [
      privacyFaq("input"),
      {
        question: "Why do formats differ between countries?",
        answer:
          "Locales disagree on separators: 1,234.56 in the US is 1.234,56 in Germany and 1 234,56 in France. Formatting with the right locale avoids off-by-a-thousand misreadings.",
      },
      {
        question: "How are very large numbers handled?",
        answer:
          "Large values can be shown with separators, in compact notation (1.2M), or in scientific notation. Note that JavaScript numbers lose precision beyond 2^53.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Developer tools — Security (/tools/)
  // ---------------------------------------------------------------------------
  "encryption-tool": {
    title: "Text Encryption & Decryption — AES & DES",
    description:
      "Encrypt and decrypt text with AES or DES using your own passphrase. Everything runs in your browser — neither the text nor the key leaves your device.",
    keywords: ["text encryption online", "aes encrypt decrypt", "encrypt text with password", "des encryption", "online cipher tool"],
    faqs: [
      {
        question: "Is my key or plaintext sent anywhere?",
        answer:
          "No. Encryption and decryption run entirely in your browser. Nothing — plaintext, ciphertext, or passphrase — is transmitted or stored.",
      },
      {
        question: "Should I use AES or DES?",
        answer:
          "AES. DES uses a 56-bit key and is considered broken for anything requiring real security; it is offered only for interoperability with legacy systems.",
      },
      {
        question: "Can I use this to protect production secrets?",
        answer:
          "It is fine for casual obfuscation and for learning, but production secrets belong in a dedicated secret manager with key rotation, access control, and audit logging.",
      },
    ],
  },
  "hash-generator": {
    title: "Hash Generator — MD5, SHA-1 & SHA-256 Online",
    description:
      "Generate MD5, SHA-1, and SHA-256 hashes from any text instantly. A free checksum and digest generator that hashes locally without uploading your input.",
    keywords: ["hash generator", "md5 generator", "sha256 online", "sha1 hash", "checksum calculator", "text to hash"],
    faqs: [
      privacyFaq("input"),
      {
        question: "Can a hash be reversed?",
        answer:
          "No. Hashing is one-way. Short or common inputs can still be recovered by brute force or rainbow tables, which is why passwords need a salted, slow algorithm rather than a bare hash.",
      },
      {
        question: "Is MD5 still safe to use?",
        answer:
          "Not for security. MD5 and SHA-1 have practical collision attacks and should only be used for non-adversarial checks like cache keys. Use SHA-256 for anything security-related.",
      },
    ],
  },
  "password-generator": {
    title: "Strong Password Generator — Random & Secure",
    description:
      "Generate strong random passwords with configurable length, symbols, numbers, and case. Created in your browser with a cryptographic RNG and never transmitted.",
    keywords: ["password generator", "strong password generator", "random password", "secure password creator", "passphrase generator"],
    faqs: [
      {
        question: "Are these passwords truly random?",
        answer:
          "They use the browser's cryptographic random number generator (crypto.getRandomValues), not Math.random, so the output is suitable for real credentials.",
      },
      {
        question: "Is the password sent anywhere?",
        answer:
          "No. Generation happens entirely on your device and nothing is logged or transmitted. Close the tab and the password is gone.",
      },
      {
        question: "How long should a password be?",
        answer:
          "At least 16 characters for important accounts. Length beats complexity — a long random password with mixed character types is far stronger than a short one with substitutions.",
      },
    ],
  },
  "uuid-generator": {
    title: "UUID Generator — Create v1 and v4 UUIDs in Bulk",
    description:
      "Generate UUID version 1 and version 4 identifiers, one at a time or in bulk. Free online GUID generator using the browser's cryptographic random source.",
    keywords: ["uuid generator", "guid generator", "uuid v4", "uuid v1", "bulk uuid", "unique identifier generator"],
    faqs: [
      privacyFaq("generated UUIDs"),
      {
        question: "What is the difference between UUID v1 and v4?",
        answer:
          "v1 derives from a timestamp and MAC address, so it sorts roughly by creation time but leaks host information. v4 is fully random, which is the safer default for public identifiers.",
      },
      {
        question: "Can two UUIDs collide?",
        answer:
          "In practice, no. A v4 UUID has 122 random bits — you would need to generate billions per second for a century before a collision became likely.",
      },
    ],
  },
  "env-formatter": {
    title: ".env File Formatter & Validator",
    description:
      "Format and validate .env files: consistent spacing, correct quoting, and warnings for duplicate or malformed keys. Your variables stay in the browser.",
    keywords: ["env file formatter", "dotenv validator", "format env file", "environment variables", "env syntax check"],
    faqs: [
      {
        question: "Are my environment variables uploaded?",
        answer:
          "No. The file is parsed locally in your browser and never transmitted — which matters, because .env files usually hold live credentials.",
      },
      {
        question: "When do .env values need quotes?",
        answer:
          "Quote any value containing spaces, #, or newlines. Unquoted values stop at the first space or comment marker, which silently truncates connection strings and keys.",
      },
      {
        question: "Should .env be committed to git?",
        answer:
          "No. Commit a .env.example with empty placeholder values and keep the real .env in .gitignore so secrets never reach the repository.",
      },
    ],
  },
  "jwt-decoder": {
    title: "JWT Decoder — Decode & Inspect JSON Web Tokens",
    description:
      "Decode a JWT to inspect its header, payload, claims, and expiry. A free online JWT debugger that decodes tokens locally without sending them to a server.",
    keywords: ["jwt decoder", "decode jwt online", "jwt debugger", "json web token viewer", "jwt payload decode", "jwt expiry check"],
    faqs: [
      {
        question: "Is my token sent to a server?",
        answer:
          "No. Decoding happens entirely in your browser. That matters because a JWT pasted into a hosted debugger is a live credential that could be replayed.",
      },
      {
        question: "Does decoding verify the signature?",
        answer:
          "Decoding only reads the base64url-encoded header and payload. Verifying authenticity requires the signing secret or public key and must happen on your server.",
      },
      {
        question: "Why is JWT payload data not secret?",
        answer:
          "The payload is base64-encoded, not encrypted — anyone holding the token can read every claim. Never put passwords or personal data you would not expose into a JWT.",
      },
    ],
  },
  "jwt-generator": {
    title: "JWT Generator — Create Signed JSON Web Tokens (HS256)",
    description:
      "Generate signed JSON Web Tokens with a custom header, payload, and HS256 secret for testing auth flows. Signing happens locally — your secret is never sent.",
    keywords: ["jwt generator", "create jwt token", "sign jwt hs256", "jwt builder", "generate json web token", "jwt for testing"],
    faqs: [
      {
        question: "Is my signing secret transmitted?",
        answer:
          "No. The token is signed in your browser using the Web Crypto API, so the secret never leaves your device.",
      },
      {
        question: "Which claims should I include?",
        answer:
          "At minimum an expiry (exp) and issued-at (iat). Add sub for the subject, iss for the issuer, and aud for the intended audience so your verifier can reject misdirected tokens.",
      },
      {
        question: "Are these tokens safe for production?",
        answer:
          "Use them for local testing only. Production tokens should be issued by your auth server with a strong secret or an asymmetric key that is rotated and never pasted into a browser.",
      },
    ],
  },
  "base64-tool": {
    title: "Base64 Encoder & Decoder — Text and Files",
    description:
      "Encode text or files to Base64 and decode Base64 back to plain text. A free, private Base64 converter that handles Unicode correctly and never uploads data.",
    keywords: ["base64 encoder", "base64 decoder", "base64 to text", "encode file to base64", "atob btoa online", "base64 converter"],
    faqs: [
      privacyFaq("input"),
      {
        question: "Is Base64 a form of encryption?",
        answer:
          "No. It is a reversible encoding with no key, designed to carry binary data through text-only channels. Anyone can decode it instantly, so it provides no confidentiality.",
      },
      {
        question: "Why does Base64 make files larger?",
        answer:
          "Base64 represents three bytes with four ASCII characters, so encoded data is about 33% larger than the original — the cost of being safe to embed in text.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Developer tools — Data & Format Converters (/tools/)
  // ---------------------------------------------------------------------------
  "csv-json-converter": {
    title: "CSV to JSON Converter — Two-Way, with Custom Delimiters",
    description:
      "Convert CSV to JSON and JSON back to CSV with configurable delimiters and header handling. Free, instant, and processed entirely inside your browser.",
    keywords: ["csv to json", "json to csv", "csv json converter", "convert csv online", "csv parser", "csv to json array"],
    faqs: [
      privacyFaq("data"),
      {
        question: "How are CSV headers handled?",
        answer:
          "The first row becomes the object keys, producing an array of objects. Converting back writes those keys as the header row, so a round trip preserves the structure.",
      },
      {
        question: "What happens to commas inside a value?",
        answer:
          "Values containing the delimiter, quotes, or newlines are wrapped in double quotes with internal quotes doubled, following RFC 4180 so spreadsheets read the file correctly.",
      },
    ],
  },
  "yaml-json-converter": {
    title: "YAML to JSON Converter — Two-Way with Validation",
    description:
      "Convert YAML to JSON and JSON to YAML with validation and clear error messages. Ideal for Kubernetes manifests, CI pipelines, and application config files.",
    keywords: ["yaml to json", "json to yaml", "yaml converter", "convert yaml online", "yaml parser", "kubernetes yaml to json"],
    faqs: [
      privacyFaq("configuration"),
      {
        question: "Why does my YAML indentation cause errors?",
        answer:
          "YAML forbids tabs for indentation and requires consistent spacing per nesting level. A single stray tab or misaligned key breaks the whole document.",
      },
      {
        question: "Do YAML comments survive the conversion?",
        answer:
          "No. JSON has no comment syntax, so comments are lost converting to JSON and cannot be recovered on the way back. Keep the original file if the comments matter.",
      },
    ],
  },
  "xml-json-converter": {
    title: "XML to JSON Converter — Two-Way with Attribute Handling",
    description:
      "Convert XML to JSON and JSON to XML, with control over how attributes and text nodes are mapped. Free online converter that keeps your documents local.",
    keywords: ["xml to json", "json to xml", "xml json converter", "convert xml online", "xml parser", "xml attributes to json"],
    faqs: [
      privacyFaq("document"),
      {
        question: "How are XML attributes represented in JSON?",
        answer:
          "Attributes are mapped to prefixed keys (commonly @name) so they stay distinguishable from child elements, and element text is placed in a dedicated text key.",
      },
      {
        question: "Why is XML to JSON not perfectly reversible?",
        answer:
          "XML distinguishes attributes, elements, ordering, and namespaces; JSON has only objects and arrays. Some structure is inevitably flattened, so a round trip may not be byte-identical.",
      },
    ],
  },
  "json-schema-validator": {
    title: "JSON Schema Validator — Validate JSON Against a Schema",
    description:
      "Validate a JSON document against a JSON Schema and get detailed, path-level error reporting. Free online schema validation that runs entirely in your browser.",
    keywords: ["json schema validator", "validate json against schema", "json schema online", "jsonschema check", "api contract validation"],
    faqs: [
      privacyFaq("JSON and schema"),
      {
        question: "What does the error output tell me?",
        answer:
          "Each failure reports the JSON path of the offending value, the keyword that failed (type, required, pattern, enum), and what was expected — enough to fix the document directly.",
      },
      {
        question: "Why use JSON Schema at all?",
        answer:
          "It turns an informal API contract into something machine-checkable, so malformed payloads are rejected at the boundary instead of causing errors deep inside your application.",
      },
    ],
  },
  "json-merger": {
    title: "JSON Merger — Combine JSON Objects Online",
    description:
      "Merge two or more JSON objects with control over how conflicting keys are resolved. Free online JSON merge tool for config layering and fixture assembly.",
    keywords: ["json merger", "merge json objects", "combine json online", "json deep merge", "json conflict resolution"],
    faqs: [
      privacyFaq("JSON"),
      {
        question: "What is the difference between shallow and deep merge?",
        answer:
          "A shallow merge replaces a whole nested object when keys collide. A deep merge walks into nested objects and combines them key by key, which is what config layering usually needs.",
      },
      {
        question: "How are arrays merged?",
        answer:
          "Arrays are treated as values rather than merged element by element, because element identity is ambiguous. Choose whether the later document replaces or appends to the earlier one.",
      },
    ],
  },
  "json-flattener": {
    title: "JSON Flattener & Unflattener — Dot Notation Converter",
    description:
      "Flatten nested JSON into dot-notation keys, or expand dot-notation objects back into nested structures. Useful for env vars, CSV exports, and feature flags.",
    keywords: ["json flattener", "flatten json online", "unflatten json", "dot notation json", "nested json to flat", "json to key value"],
    faqs: [
      privacyFaq("JSON"),
      {
        question: "How are arrays flattened?",
        answer:
          "Array elements become indexed keys such as items.0.name, so ordering is preserved and the structure can be rebuilt exactly when you unflatten it.",
      },
      {
        question: "When is a flattened structure useful?",
        answer:
          "For anything that only accepts key-value pairs: environment variables, CSV columns, translation files, analytics properties, and many feature-flag systems.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Developer tools — Frontend & Styling (/tools/)
  // ---------------------------------------------------------------------------
  "css-minifier": {
    title: "CSS Minifier & Beautifier — Compress or Format CSS",
    description:
      "Minify CSS to shrink stylesheets, or beautify compressed CSS back into readable rules. Free online CSS compressor and formatter with no upload.",
    keywords: ["css minifier", "css beautifier", "compress css online", "format css", "unminify css", "css optimizer"],
    faqs: [
      privacyFaq("CSS"),
      {
        question: "How much can minifying save?",
        answer:
          "Removing whitespace, comments, and redundant semicolons typically cuts 20-30% before gzip. The saving is largest on hand-written stylesheets with heavy commenting.",
      },
      {
        question: "Can minified CSS break my styles?",
        answer:
          "Only whitespace and comments are removed, so rendering is unaffected. Keep the unminified source for debugging, since minified CSS is very hard to read in devtools.",
      },
    ],
  },
  "html-jsx-converter": {
    title: "HTML to JSX Converter — Convert Markup for React",
    description:
      "Convert HTML into valid JSX with the right attribute names, self-closing tags, and inline style objects. Paste a snippet and get React-ready markup instantly.",
    keywords: ["html to jsx", "jsx converter", "html to react", "class to classname", "convert html for react", "jsx transformer"],
    faqs: [
      privacyFaq("markup"),
      {
        question: "Which attributes get renamed?",
        answer:
          "class becomes className, for becomes htmlFor, and hyphenated attributes become camelCase. Inline style strings are converted into JSX style objects.",
      },
      {
        question: "Why does raw HTML fail to compile in React?",
        answer:
          "JSX is stricter: every tag must be closed, attribute names follow the DOM property naming, and adjacent elements need a single parent or a fragment wrapper.",
      },
    ],
  },
  "color-converter": {
    title: "Color Picker & Converter — HEX, RGB & HSL",
    description:
      "Pick a colour and convert it between HEX, RGB, and HSL with a live preview. A free colour converter for CSS work that runs entirely in your browser.",
    keywords: ["color converter", "hex to rgb", "rgb to hex", "hsl converter", "color picker online", "css color tool"],
    faqs: [
      privacyFaq("colour values"),
      {
        question: "When should I use HSL instead of HEX?",
        answer:
          "HSL separates hue, saturation, and lightness, so building a consistent set of tints and shades is just a matter of adjusting lightness while keeping the hue fixed.",
      },
      {
        question: "How do I add transparency?",
        answer:
          "Use an 8-digit HEX where the final two digits are the alpha channel, or the rgba()/hsl() forms with an alpha value between 0 and 1.",
      },
    ],
  },
  "gradient-generator": {
    title: "CSS Gradient Generator — Linear & Radial with Preview",
    description:
      "Build CSS linear and radial gradients with multiple colour stops and a live preview, then copy the ready-to-use CSS. Free gradient generator, no signup.",
    keywords: ["css gradient generator", "linear gradient", "radial gradient", "gradient css code", "background gradient maker"],
    faqs: [
      privacyFaq("design"),
      {
        question: "How do I avoid grey bands in a gradient?",
        answer:
          "Blending complementary colours passes through a desaturated midpoint. Add an intermediate stop with a saturated colour, or pick hues closer together on the colour wheel.",
      },
      {
        question: "Can I use more than two colour stops?",
        answer:
          "Yes. Add as many stops as you need and position each one by percentage to control exactly where the transition happens.",
      },
    ],
  },
  "box-shadow-generator": {
    title: "CSS Box Shadow Generator — Live Preview & Code",
    description:
      "Design CSS box-shadows visually with offset, blur, spread, colour, and inset controls, and layer multiple shadows. Copy the generated CSS in one click.",
    keywords: ["box shadow generator", "css box shadow", "shadow css code", "inset shadow", "multiple box shadows", "css shadow maker"],
    faqs: [
      privacyFaq("design"),
      {
        question: "What do the four box-shadow values mean?",
        answer:
          "Horizontal offset, vertical offset, blur radius, and spread radius. Blur softens the edge; spread grows or shrinks the shadow before the blur is applied.",
      },
      {
        question: "How do I make a shadow look natural?",
        answer:
          "Layer two or three shadows: a tight, dark one for contact and a wider, softer one for ambient light. A single large shadow tends to look flat and artificial.",
      },
    ],
  },
  "css-unit-converter": {
    title: "CSS Unit Converter — px, rem, em, vw, vh & pt",
    description:
      "Convert between CSS units — px, rem, em, vw, vh, and pt — with a configurable base font size and viewport. Free online converter for responsive layouts.",
    keywords: ["css unit converter", "px to rem", "rem to px", "em converter", "vw vh calculator", "responsive css units"],
    faqs: [
      privacyFaq("input"),
      {
        question: "What is the difference between rem and em?",
        answer:
          "rem is always relative to the root font size, while em is relative to the parent element's font size and therefore compounds through nested elements.",
      },
      {
        question: "Why prefer rem over px for font sizes?",
        answer:
          "rem scales with the user's browser font-size setting, so text stays readable for people who increase it. Fixed px sizes ignore that preference entirely.",
      },
    ],
  },
  "color-palette-generator": {
    title: "Color Palette Generator — Shades, Tints & Harmonies",
    description:
      "Generate a colour palette from any base colour: shades, tints, complementary, analogous, and triadic harmonies, with copyable HEX values for each swatch.",
    keywords: ["color palette generator", "color scheme generator", "shades and tints", "complementary colors", "analogous palette", "brand color palette"],
    faqs: [
      privacyFaq("colour values"),
      {
        question: "What is the difference between a tint and a shade?",
        answer:
          "A tint is the base colour mixed with white and a shade is mixed with black. A ramp of both from one hue is the usual basis for a design system's colour scale.",
      },
      {
        question: "Which harmony should I choose?",
        answer:
          "Analogous colours feel calm and cohesive, complementary pairs give maximum contrast for calls to action, and triadic schemes stay vibrant while remaining balanced.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Developer tools — Testing & API Tools (/tools/)
  // ---------------------------------------------------------------------------
  "fake-data-generator": {
    title: "Fake Data Generator — Names, Emails & Test Records",
    description:
      "Generate realistic fake test data — names, emails, addresses, phone numbers, and more — in bulk for seeding databases, demos, and QA. Free and client-side.",
    keywords: ["fake data generator", "mock data generator", "test data online", "dummy data", "sample records", "seed data generator"],
    faqs: [
      privacyFaq("generated data"),
      {
        question: "Is any of this data real?",
        answer:
          "No. Values are synthesised from name and word lists, so they look plausible but do not correspond to real people, addresses, or accounts.",
      },
      {
        question: "Why not use production data for testing?",
        answer:
          "Copying production records into test environments spreads personal data into systems with weaker access controls, which is a common source of compliance breaches.",
      },
    ],
  },
  "http-request-composer": {
    title: "HTTP Request Composer — Build & Test API Requests",
    description:
      "Compose HTTP requests with custom methods, headers, and body, then send them and inspect the response. A lightweight in-browser client for quick API checks.",
    keywords: ["http request composer", "api testing tool", "online rest client", "postman alternative", "send http request", "api request builder"],
    faqs: [
      {
        question: "Why does my request fail with a CORS error?",
        answer:
          "Browsers block cross-origin requests unless the target server sends permissive CORS headers. That is a server-side policy — a desktop client or curl is unaffected by it.",
      },
      {
        question: "Are my requests proxied through a server?",
        answer:
          "No. Requests go directly from your browser to the target API, so credentials in headers are not seen by any intermediary of ours.",
      },
      {
        question: "Which methods are supported?",
        answer:
          "GET, POST, PUT, PATCH, DELETE, and HEAD, each with custom headers and a request body where the method allows one.",
      },
    ],
  },
  "user-agent-generator": {
    title: "User-Agent Generator — Browser & Device UA Strings",
    description:
      "Generate valid user-agent strings for major browsers, operating systems, and mobile devices. Useful for testing device detection and responsive behaviour.",
    keywords: ["user agent generator", "user agent string list", "browser ua string", "mobile user agent", "chrome user agent", "ua string generator"],
    faqs: [
      privacyFaq("generated strings"),
      {
        question: "Why is user-agent detection unreliable?",
        answer:
          "UA strings are freely spoofable and full of legacy tokens for compatibility. Feature detection is a far more reliable basis for deciding what a client supports.",
      },
      {
        question: "What is user-agent reduction?",
        answer:
          "Chrome and other browsers now freeze or truncate parts of the UA string for privacy, so minor version and detailed platform data are no longer available there.",
      },
    ],
  },
  "timestamp-converter": {
    title: "Epoch & Unix Timestamp Converter — To and From Dates",
    description:
      "Convert Unix epoch timestamps to human-readable dates and back, in seconds or milliseconds, across time zones. Free online timestamp converter, no upload.",
    keywords: ["epoch converter", "unix timestamp converter", "timestamp to date", "date to epoch", "milliseconds to date", "unix time"],
    faqs: [
      privacyFaq("input"),
      {
        question: "Is my timestamp in seconds or milliseconds?",
        answer:
          "A 10-digit value is seconds (the Unix convention); a 13-digit value is milliseconds (the JavaScript convention). Mixing them up shifts dates by decades.",
      },
      {
        question: "How are time zones handled?",
        answer:
          "Epoch time is always UTC. The human-readable output is shown in both UTC and your local time zone so you can see the offset applied.",
      },
    ],
  },
  "ip-address": {
    title: "IP Address Lookup — Find Your IP, Location & ISP",
    description:
      "Look up any IP address to see its approximate location, ISP, and network details, or check your own public IP. Free IP lookup with no account required.",
    keywords: ["ip address lookup", "what is my ip", "ip geolocation", "ip isp lookup", "public ip checker", "ip location finder"],
    faqs: [
      {
        question: "Does this tool call an external service?",
        answer:
          "Yes. Unlike most tools here, IP lookup needs a public geolocation API, so the address you ask about leaves your browser and goes to that service. Nothing else about you does.",
      },
      {
        question: "How accurate is IP geolocation?",
        answer:
          "Usually accurate to the country and often the city, but rarely to a street. VPNs, mobile carrier networks, and corporate proxies frequently report a distant location.",
      },
      {
        question: "What is the difference between my public and private IP?",
        answer:
          "Your public IP is what the internet sees, assigned by your ISP. Private addresses like 192.168.x.x identify devices inside your local network and are not routable externally.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Developer tools — DevOps & Infrastructure (/tools/)
  // ---------------------------------------------------------------------------
  "gitignore-generator": {
    title: ".gitignore Generator — Templates by Language",
    description:
      "Generate a .gitignore file for your stack — Node, Python, Java, Go, macOS, IDEs, and more — by combining ready-made templates. Free and instant.",
    keywords: ["gitignore generator", "gitignore template", "node gitignore", "python gitignore", "create gitignore file", "git ignore rules"],
    faqs: [
      privacyFaq("selection"),
      {
        question: "Why is my file still tracked after adding it to .gitignore?",
        answer:
          "gitignore only affects untracked files. Run git rm --cached <file> to stop tracking something that was already committed, then commit the removal.",
      },
      {
        question: "Should I ignore lock files?",
        answer:
          "No. Commit package-lock.json, yarn.lock, or poetry.lock so every environment installs identical dependency versions. Ignore node_modules, not the lock file.",
      },
    ],
  },
  "dockerfile-formatter": {
    title: "Dockerfile Formatter & Linter — Best Practice Checks",
    description:
      "Format Dockerfiles consistently and lint them for common problems: unpinned tags, missing users, and wasteful layer ordering. Free, runs in your browser.",
    keywords: ["dockerfile formatter", "dockerfile linter", "docker best practices", "format dockerfile online", "dockerfile validator"],
    faqs: [
      privacyFaq("Dockerfile"),
      {
        question: "How do I keep Docker layers cacheable?",
        answer:
          "Copy dependency manifests and install dependencies before copying the rest of the source. Application code changes far more often, so it belongs in the later, cheaper layers.",
      },
      {
        question: "Why avoid the latest tag?",
        answer:
          "latest moves, so the same Dockerfile can produce different images over time. Pinning an explicit version keeps builds reproducible and makes upgrades deliberate.",
      },
    ],
  },
  "yaml-formatter": {
    title: "YAML Formatter & Validator — Fix Indentation Online",
    description:
      "Format and validate YAML with consistent indentation and clear syntax errors. Built for Kubernetes manifests, GitHub Actions, Docker Compose, and app config.",
    keywords: ["yaml formatter", "yaml validator", "yaml linter online", "fix yaml indentation", "kubernetes yaml validator", "yaml syntax check"],
    faqs: [
      privacyFaq("configuration"),
      {
        question: "Why does YAML reject tab characters?",
        answer:
          "The YAML spec forbids tabs for indentation because their width is ambiguous. Use spaces consistently — most editors can be set to insert spaces automatically.",
      },
      {
        question: "Why did my value 'no' become false?",
        answer:
          "YAML 1.1 parsers coerce no, yes, on, and off to booleans. Quote the value when you mean the string — the same trap catches version numbers like 1.10.",
      },
    ],
  },
  "nginx-config-generator": {
    title: "NGINX Config Generator — Proxy, SSL & Static",
    description:
      "Generate NGINX configuration for common setups: static sites, reverse proxies, SSL redirects, and SPA fallbacks. Copy a working server block in seconds.",
    keywords: ["nginx config generator", "nginx reverse proxy config", "nginx ssl config", "nginx server block", "nginx spa fallback"],
    faqs: [
      privacyFaq("configuration"),
      {
        question: "How do I serve a single-page app correctly?",
        answer:
          "Use try_files $uri $uri/ /index.html so client-side routes fall back to the app shell instead of returning 404 for paths that only exist in the router.",
      },
      {
        question: "How do I test a config before reloading?",
        answer:
          "Run nginx -t to validate the syntax, then nginx -s reload. Reloading an invalid config leaves the old workers running rather than taking the site down.",
      },
    ],
  },
  "cron-expression-builder": {
    title: "Cron Expression Builder & Explainer",
    description:
      "Build cron expressions visually and read a plain-English explanation of when they run. Free cron generator and parser for crontab, CI, and schedulers.",
    keywords: ["cron expression builder", "cron generator", "crontab generator", "cron parser", "explain cron expression", "cron schedule"],
    faqs: [
      privacyFaq("schedule"),
      {
        question: "What do the five cron fields mean?",
        answer:
          "Minute, hour, day of month, month, and day of week, in that order. An asterisk means every value, and */5 in the minute field means every five minutes.",
      },
      {
        question: "Which time zone do cron jobs use?",
        answer:
          "The system time zone of the host, unless the scheduler lets you set one explicitly. This is a frequent source of jobs running an hour off after a daylight-saving change.",
      },
    ],
  },
  "chmod-calculator": {
    title: "chmod Calculator — Linux File Permissions to Octal",
    description:
      "Tick read, write, and execute boxes for owner, group, and others to get the octal and symbolic chmod notation. A free Unix file permission calculator.",
    keywords: ["chmod calculator", "file permissions calculator", "octal permissions", "linux chmod 755", "unix permission converter", "rwx calculator"],
    faqs: [
      privacyFaq("selection"),
      {
        question: "What does chmod 755 mean?",
        answer:
          "The owner can read, write, and execute (7), while group and others can read and execute (5). It is the usual mode for directories and executable scripts.",
      },
      {
        question: "Why is 777 a bad idea?",
        answer:
          "777 lets any user on the system modify the file. If you are using it to fix a permission error, the real fix is almost always correcting the file's owner or group instead.",
      },
    ],
  },
  "ip-cidr-calculator": {
    title: "CIDR Calculator — Subnet, Netmask & Host Range",
    description:
      "Calculate network address, broadcast address, subnet mask, host range, and usable host count from any CIDR block. Free online IP subnet calculator.",
    keywords: ["cidr calculator", "subnet calculator", "ip range calculator", "netmask calculator", "cidr to ip range", "subnet mask lookup"],
    faqs: [
      privacyFaq("input"),
      {
        question: "How many usable hosts does a /24 have?",
        answer:
          "254. A /24 contains 256 addresses, but the network address and the broadcast address are reserved, leaving 254 assignable to hosts.",
      },
      {
        question: "What does the number after the slash mean?",
        answer:
          "It is the count of leading bits fixed as the network portion. A larger prefix means a smaller network — /24 is 256 addresses, /25 is 128.",
      },
    ],
  },
  "dns-lookup": {
    title: "DNS Lookup — Check A, AAAA, MX, TXT & CNAME Records",
    description:
      "Look up DNS records for any domain — A, AAAA, MX, TXT, and CNAME — using DNS-over-HTTPS straight from your browser. Free, fast, and no account needed.",
    keywords: ["dns lookup", "dns record checker", "mx record lookup", "txt record check", "cname lookup", "dig online", "nslookup online"],
    faqs: [
      {
        question: "Does this tool make an external request?",
        answer:
          "Yes. DNS queries are resolved through a public DNS-over-HTTPS resolver, so the domain you look up is sent to that provider. No other data is shared.",
      },
      {
        question: "Why do I still see the old record after changing DNS?",
        answer:
          "Resolvers cache answers for the record's TTL. Lower the TTL before a planned change, and expect propagation to take up to the previous TTL afterwards.",
      },
      {
        question: "What are TXT records used for?",
        answer:
          "Mostly domain verification and email authentication — SPF, DKIM, and DMARC policies all live in TXT records, which is why mail deliverability debugging starts here.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // PDF tools (/pdf-tools/)
  // ---------------------------------------------------------------------------
  "pdf-merge": {
    title: "Merge PDF Files Online — Free & Private",
    description:
      "Combine multiple PDFs into one document in the order you choose. Free online PDF merger with no file size limit, no watermark, and no upload to any server.",
    keywords: ["merge pdf", "combine pdf files", "pdf merger online", "join pdf", "merge pdf free", "pdf combiner no upload"],
    faqs: [
      privacyFaq("PDF"),
      {
        question: "Is there a file size or page limit?",
        answer:
          "There is no imposed limit. Because merging happens in your browser, the practical ceiling is your device's available memory rather than a server quota.",
      },
      {
        question: "Can I control the order of the merged pages?",
        answer:
          "Yes. Files are merged in the order listed, and you can rearrange them before merging. Use the Page Reorder tool for finer control within a single document.",
      },
    ],
  },
  "pdf-split": {
    title: "Split PDF Online — Extract Pages from a PDF",
    description:
      "Split a PDF by page range or extract specific pages into a new document. Free online PDF splitter with no watermark that never uploads your file.",
    keywords: ["split pdf", "extract pdf pages", "pdf splitter online", "separate pdf pages", "pdf page extractor", "cut pdf"],
    faqs: [
      privacyFaq("PDF"),
      {
        question: "How do I specify which pages to extract?",
        answer:
          "Enter page numbers or ranges such as 1-3, 7, 10-12. Pages come out in the order you list them, so you can reorder while extracting.",
      },
      {
        question: "Does splitting reduce quality?",
        answer:
          "No. Pages are copied at their original resolution with no re-encoding, so extracted pages are byte-for-byte as sharp as the source.",
      },
    ],
  },
  "pdf-compress": {
    title: "Compress PDF Online — Reduce PDF File Size Free",
    description:
      "Shrink PDF file size so documents fit email and upload limits, with control over the quality trade-off. Free PDF compressor that works entirely offline.",
    keywords: ["compress pdf", "reduce pdf size", "pdf compressor online", "shrink pdf", "make pdf smaller", "pdf size reducer free"],
    faqs: [
      privacyFaq("PDF"),
      {
        question: "How much smaller will my PDF get?",
        answer:
          "It depends on the content. Scanned and image-heavy PDFs often shrink dramatically, while text-only documents are already compact and may barely change.",
      },
      {
        question: "Will compression blur my document?",
        answer:
          "Text stays sharp because it is vector data. Embedded images are re-encoded, so heavy compression can soften photos — check the preview before saving over the original.",
      },
    ],
  },
  "pdf-to-images": {
    title: "PDF to Image Converter — PDF to PNG & JPG",
    description:
      "Convert PDF pages into PNG or JPG images at your chosen resolution, and download them individually or all at once. Free, private, and browser-based.",
    keywords: ["pdf to image", "pdf to png", "pdf to jpg", "convert pdf to pictures", "extract images from pdf", "pdf page to image"],
    faqs: [
      privacyFaq("PDF"),
      {
        question: "Should I choose PNG or JPG?",
        answer:
          "PNG for pages with text, diagrams, or sharp lines because it is lossless. JPG for photographic pages where a smaller file matters more than perfect edges.",
      },
      {
        question: "Can I control the output resolution?",
        answer:
          "Yes. Higher DPI produces larger, sharper images — useful for printing or OCR, while screen use is usually fine at the default.",
      },
    ],
  },
  "images-to-pdf": {
    title: "Images to PDF Converter — JPG & PNG to PDF",
    description:
      "Combine JPG, PNG, and WebP images into a single PDF in the order you choose. Free image-to-PDF converter with no watermark and no upload.",
    keywords: ["images to pdf", "jpg to pdf", "png to pdf", "convert photos to pdf", "combine images into pdf", "picture to pdf free"],
    faqs: [
      privacyFaq("images"),
      {
        question: "Can I set the page size and orientation?",
        answer:
          "Yes. Pages can match each image's own dimensions or be fitted to a standard size such as A4 or Letter, with orientation chosen per document.",
      },
      {
        question: "Which image formats are supported?",
        answer:
          "JPG, PNG, and WebP. Images are embedded at their original resolution, so a scanned page stays as legible in the PDF as it was in the source file.",
      },
    ],
  },
  "pdf-rotate": {
    title: "Rotate PDF Online — Fix Page Orientation Free",
    description:
      "Rotate PDF pages 90, 180, or 270 degrees and save the corrected document. Fix sideways scans in seconds, free and without uploading the file anywhere.",
    keywords: ["rotate pdf", "pdf rotate online", "turn pdf pages", "fix pdf orientation", "rotate scanned pdf", "save rotated pdf"],
    faqs: [
      privacyFaq("PDF"),
      {
        question: "Why does my viewer forget the rotation?",
        answer:
          "Rotating in a viewer is often just a display setting. This tool writes the rotation into the file itself, so the correct orientation persists everywhere.",
      },
      {
        question: "Can I rotate only some pages?",
        answer:
          "Yes. Apply rotation to the whole document or to selected pages, which is what you need when a scan mixes portrait and landscape sheets.",
      },
    ],
  },
  "pdf-watermark": {
    title: "Add Watermark to PDF — Free Online Watermark Tool",
    description:
      "Stamp a text watermark across every page of a PDF, with control over position, size, rotation, and opacity. Free, no watermark of ours, no upload.",
    keywords: ["pdf watermark", "add watermark to pdf", "stamp pdf", "draft watermark pdf", "confidential watermark", "watermark pdf free"],
    faqs: [
      privacyFaq("PDF"),
      {
        question: "Can the watermark be removed afterwards?",
        answer:
          "The text is drawn into the page content, so it is not a layer that can be toggled off. It is a visible deterrent, not a security control — keep an unwatermarked original.",
      },
      {
        question: "Can I change the opacity and angle?",
        answer:
          "Yes. Opacity, rotation, font size, and placement are all adjustable, so the mark can sit diagonally behind the text or discreetly in a corner.",
      },
    ],
  },
  "pdf-reorder": {
    title: "Reorder PDF Pages Online — Rearrange & Delete Pages",
    description:
      "Rearrange, move, or delete pages in a PDF with a visual page list, then save the reordered document. Free, no watermark, and processed on your device.",
    keywords: ["reorder pdf pages", "rearrange pdf", "move pdf pages", "delete pdf pages", "organize pdf", "sort pdf pages"],
    faqs: [
      privacyFaq("PDF"),
      {
        question: "Can I delete pages as well as move them?",
        answer:
          "Yes. Remove unwanted pages and reorder the rest in the same pass, then export a single clean document.",
      },
      {
        question: "Are bookmarks and links preserved?",
        answer:
          "Page content is preserved exactly, but internal links and bookmarks that point at moved pages may no longer target the right destination after reordering.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // CSV tools (/csv-tools/)
  // ---------------------------------------------------------------------------
  "csv-converter": {
    title: "CSV to JSON Converter Online — Two-Way & Free",
    description:
      "Convert CSV to JSON or JSON back to CSV with custom delimiters and header handling. Free online converter that processes your file entirely in the browser.",
    keywords: ["csv to json converter", "json to csv online", "csv converter free", "convert csv file", "csv to json array"],
    faqs: [
      privacyFaq("CSV"),
      {
        question: "Which delimiters are supported?",
        answer:
          "Comma, semicolon, tab, and pipe. Semicolons matter for CSV exported by European spreadsheet locales, where the comma is the decimal separator.",
      },
      {
        question: "How are quoted fields handled?",
        answer:
          "Quoted fields containing commas, newlines, or escaped quotes are parsed per RFC 4180, so values are not split in the wrong place.",
      },
    ],
  },
  "csv-validator": {
    title: "CSV Validator — Check Format, Headers & Row Consistency",
    description:
      "Validate a CSV file before importing it: catch ragged rows, duplicate headers, unbalanced quotes, and encoding issues. Free and processed in your browser.",
    keywords: ["csv validator", "validate csv online", "check csv format", "csv error checker", "csv row consistency", "csv lint"],
    faqs: [
      privacyFaq("CSV"),
      {
        question: "What does the validator check?",
        answer:
          "Column count consistency across rows, duplicate or empty header names, unbalanced quotes, and inconsistent line endings — the failures that break most imports.",
      },
      {
        question: "Why does my import fail even though the CSV opens fine?",
        answer:
          "Spreadsheets silently repair malformed rows on open. A strict importer will not, so a file that looks correct in Excel can still be rejected by a database load.",
      },
    ],
  },
  "csv-merge": {
    title: "Merge CSV Files Online — Combine Multiple CSVs",
    description:
      "Combine several CSV files into one, matching headers and keeping rows in order. Free online CSV merger with no upload and no row limit.",
    keywords: ["merge csv files", "combine csv online", "csv merger", "join csv files", "concatenate csv", "append csv files"],
    faqs: [
      privacyFaq("CSV"),
      {
        question: "What if the files have different columns?",
        answer:
          "Headers are matched by name where they align. Review the output when column sets differ, since unmatched columns need a decision about whether to keep or drop them.",
      },
      {
        question: "Is the header row repeated in the output?",
        answer:
          "No. A single header row is written at the top and the data rows from each file follow, so the merged file imports cleanly.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Audio tools (/audio-tools/)
  // ---------------------------------------------------------------------------
  "audio-cutter": {
    title: "Audio Cutter — Trim MP3 & Audio Files Online Free",
    description:
      "Trim an audio file by selecting a start and end time, then download the clip. Free online audio cutter for MP3 and WAV that never uploads your recording.",
    keywords: ["audio cutter", "trim mp3 online", "cut audio file", "mp3 trimmer", "audio clip maker", "cut song online free"],
    faqs: [
      privacyFaq("audio file"),
      {
        question: "Which audio formats can I trim?",
        answer:
          "Any format your browser can decode, which covers MP3, WAV, OGG, M4A, and FLAC in current browsers. The trimmed clip is exported as WAV.",
      },
      {
        question: "Does trimming re-encode and lose quality?",
        answer:
          "The audio is decoded and re-exported as uncompressed WAV, so nothing is lost relative to the decoded source — the output file is simply larger than a compressed original.",
      },
    ],
  },
  "audio-merge": {
    title: "Audio Merger — Combine Audio Files Online Free",
    description:
      "Join multiple audio files into one continuous track in the order you choose. Free online audio merger that runs in your browser with no upload.",
    keywords: ["audio merger", "combine audio files", "join mp3 online", "merge audio tracks", "concatenate audio", "audio joiner free"],
    faqs: [
      privacyFaq("audio files"),
      {
        question: "Can I merge files with different formats or sample rates?",
        answer:
          "Yes. Each file is decoded first and resampled to a common rate before being joined, so mixed sources concatenate without pitch or speed artefacts.",
      },
      {
        question: "Can I crossfade between tracks?",
        answer:
          "Files are joined end to end without a crossfade. Trim silence from the ends with the Audio Cutter first if you want a tighter transition.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Image tools (/image-tools/)
  // ---------------------------------------------------------------------------
  "image-resizer": {
    title: "Image Resizer — Resize Photos Online Free",
    description:
      "Resize images by width, height, percentage, or aspect ratio and download the result instantly. Free online image resizer with no upload and no watermark.",
    keywords: ["image resizer", "resize image online", "photo resizer free", "change image dimensions", "resize jpg", "bulk image resize"],
    faqs: [
      privacyFaq("image"),
      {
        question: "Will resizing reduce image quality?",
        answer:
          "Scaling down is generally clean. Scaling up cannot invent detail, so enlarged images look soft — always start from the highest-resolution original you have.",
      },
      {
        question: "How do I keep the aspect ratio?",
        answer:
          "Lock the aspect ratio and set just one dimension; the other is calculated automatically so the image is not stretched.",
      },
    ],
  },
  "image-compressor": {
    title: "Image Compressor — Reduce Image File Size Online",
    description:
      "Compress JPG, PNG, and WebP images with a quality slider and see the size saving before you download. Free image compressor that works entirely offline.",
    keywords: ["image compressor", "compress jpg online", "reduce image size", "png compressor", "optimize images for web", "shrink photo file size"],
    faqs: [
      privacyFaq("image"),
      {
        question: "What quality setting should I use?",
        answer:
          "Around 80% is the usual sweet spot for photos on the web — a large size reduction with no visible difference. Go higher for images with text or fine detail.",
      },
      {
        question: "Why is my PNG barely getting smaller?",
        answer:
          "PNG is lossless, so savings come only from palette and metadata reduction. Converting a photographic PNG to JPG or WebP will shrink it far more.",
      },
    ],
  },
  "image-format-converter": {
    title: "Image Format Converter — PNG, JPG & WebP",
    description:
      "Convert images between PNG, JPEG, and WebP with quality control. A free format converter that runs in your browser, so photos never leave your device.",
    keywords: ["image format converter", "png to jpg", "jpg to webp", "webp converter", "convert image format online", "png to webp"],
    faqs: [
      privacyFaq("image"),
      {
        question: "Which format should I use on the web?",
        answer:
          "WebP for most cases — it is typically 25-35% smaller than JPEG at equivalent quality and supports transparency. Keep PNG for images that need lossless edges.",
      },
      {
        question: "What happens to transparency when converting to JPG?",
        answer:
          "JPEG has no alpha channel, so transparent areas are flattened onto a solid background. Convert to WebP or keep PNG if transparency matters.",
      },
    ],
  },
  "image-crop": {
    title: "Crop Image Online — Free Photo Cropper",
    description:
      "Crop an image to any region or fixed aspect ratio and export the result. Free online image cropper with no watermark that never uploads your photo.",
    keywords: ["crop image online", "photo cropper", "crop jpg", "image crop tool free", "cut image", "crop to aspect ratio"],
    faqs: [
      privacyFaq("image"),
      {
        question: "Can I crop to a fixed aspect ratio?",
        answer:
          "Yes. Lock a ratio such as 1:1, 4:3, or 16:9 so the selection stays proportional — useful for avatars, thumbnails, and social posts.",
      },
      {
        question: "Does cropping affect the rest of the image quality?",
        answer:
          "No. The selected region is exported at its original pixel resolution, so the kept area is exactly as sharp as it was in the source.",
      },
    ],
  },
  "color-picker": {
    title: "Color Picker from Image — Get HEX Codes from a Photo",
    description:
      "Upload an image and click anywhere to read the exact pixel colour as HEX and RGB. A free eyedropper tool for pulling palettes out of screenshots and photos.",
    keywords: ["color picker from image", "image eyedropper", "get hex from photo", "pixel color picker", "extract colors from image", "screenshot color picker"],
    faqs: [
      privacyFaq("image"),
      {
        question: "How do I match a brand colour from a screenshot?",
        answer:
          "Click a flat, well-lit area of the colour rather than an edge. Anti-aliasing and JPEG artefacts blend neighbouring pixels, which shifts the sampled value.",
      },
      {
        question: "Why does the same colour read differently in two spots?",
        answer:
          "Compression artefacts, gradients, and shadows all change pixel values. Sample several points in the region and use the value that repeats.",
      },
    ],
  },
  "favicon-generator": {
    title: "Favicon Generator — Create Favicons from an Image",
    description:
      "Generate favicon files at every size a site needs — 16x16 through 512x512 — from a single image. Free favicon generator that runs entirely in your browser.",
    keywords: ["favicon generator", "create favicon from image", "favicon ico", "apple touch icon", "site icon generator", "favicon sizes"],
    faqs: [
      privacyFaq("image"),
      {
        question: "Which favicon sizes do I actually need?",
        answer:
          "A 32x32 for browser tabs, 180x180 for Apple touch icons, and 192x192 plus 512x512 for Android and PWA manifests covers essentially every modern client.",
      },
      {
        question: "Should I use SVG or PNG?",
        answer:
          "An SVG favicon scales perfectly and supports dark mode via media queries, but PNG fallbacks are still worth shipping for older browsers and app manifests.",
      },
    ],
  },
  "image-to-base64": {
    title: "Image to Base64 Converter — Data URL Generator",
    description:
      "Convert an image into a Base64 data URL you can paste straight into CSS, HTML, or JSON. Free converter that encodes locally without uploading the file.",
    keywords: ["image to base64", "base64 image encoder", "data url generator", "png to base64", "embed image in css", "base64 image converter"],
    faqs: [
      privacyFaq("image"),
      {
        question: "When should I inline an image as Base64?",
        answer:
          "For tiny assets — icons, spinners, 1px gradients — where saving a network round trip beats caching. Large inlined images bloat the HTML or CSS and cannot be cached separately.",
      },
      {
        question: "How much larger is the Base64 version?",
        answer:
          "About 33% bigger than the binary file, because every three bytes become four characters. Factor that in before inlining anything sizeable.",
      },
    ],
  },
  "image-rotate-flip": {
    title: "Rotate & Flip Image Online — Free Image Rotator",
    description:
      "Rotate an image 90, 180, or 270 degrees, or flip it horizontally and vertically, then download the result. Free, no watermark, and fully client-side.",
    keywords: ["rotate image online", "flip image", "image rotator free", "mirror image online", "turn photo sideways", "rotate jpg"],
    faqs: [
      privacyFaq("image"),
      {
        question: "Why does my photo look rotated on one device but not another?",
        answer:
          "Cameras store an EXIF orientation flag that some viewers honour and others ignore. Rotating here bakes the correct orientation into the pixels so it looks right everywhere.",
      },
      {
        question: "Is quality lost when rotating?",
        answer:
          "Rotating by multiples of 90 degrees is a lossless pixel operation. Any small quality change comes from re-encoding the file, not from the rotation itself.",
      },
    ],
  },
  "image-watermark": {
    title: "Add Watermark to Image — Free Online Watermark Tool",
    description:
      "Add a text watermark to any image with custom position, font size, colour, and opacity. Free watermarking tool that keeps your photos on your own device.",
    keywords: ["image watermark", "add watermark to photo", "watermark tool free", "text watermark online", "copyright photo", "watermark jpg"],
    faqs: [
      privacyFaq("image"),
      {
        question: "Where should I place a watermark?",
        answer:
          "Across a busy central area if deterrence matters most, or discreetly in a corner if presentation does. Corner marks are trivial to crop out.",
      },
      {
        question: "Does watermarking protect my copyright?",
        answer:
          "It signals ownership and discourages casual reuse, but it is not legal protection and can be removed. Keep the unwatermarked original as your proof of authorship.",
      },
    ],
  },
  "image-filters": {
    title: "Image Filters Online — Brightness, Contrast & Blur",
    description:
      "Adjust brightness, contrast, saturation, grayscale, sepia, and blur with a live preview, then export the edited image. Free and processed in your browser.",
    keywords: ["image filters online", "adjust brightness contrast", "photo filter free", "grayscale image", "blur image online", "saturation editor"],
    faqs: [
      privacyFaq("image"),
      {
        question: "Are the filters applied non-destructively?",
        answer:
          "The preview is live and adjustable, and the original file is untouched until you export. Reload to start again from the source image at any point.",
      },
      {
        question: "Which filter fixes an underexposed photo?",
        answer:
          "Raise brightness a little, then add contrast to recover the punch that brightening flattens. Pushing brightness alone tends to look washed out.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Video tools (/video-tools/)
  // ---------------------------------------------------------------------------
  "video-trimmer": {
    title: "Video Trimmer — Cut Video Online Free, No Upload",
    description:
      "Trim a video by selecting a start and end time and export the clip. Free online video cutter that processes the file in your browser with no watermark.",
    keywords: ["video trimmer", "cut video online", "trim mp4", "video cutter free", "clip video no watermark", "shorten video"],
    faqs: [
      privacyFaq("video"),
      {
        question: "Which video formats are supported?",
        answer:
          "Formats your browser can decode, which in practice means MP4 (H.264) and WebM. Exotic codecs may not open without a desktop tool.",
      },
      {
        question: "Why does a large video take a while?",
        answer:
          "The file is decoded and re-encoded locally using your CPU rather than a server farm, so processing time scales with clip length and your machine's speed.",
      },
    ],
  },
  "video-to-gif": {
    title: "Video to GIF Converter — Free, No Upload",
    description:
      "Convert a video clip into an animated GIF with control over frame rate and dimensions. Free online video-to-GIF converter that runs in your browser.",
    keywords: ["video to gif", "mp4 to gif", "gif maker from video", "convert video to gif free", "animated gif converter", "video gif no watermark"],
    faqs: [
      privacyFaq("video"),
      {
        question: "Why is my GIF file so large?",
        answer:
          "GIF stores every frame as an indexed-colour image with no interframe compression. Cut the frame rate, reduce dimensions, and keep clips under a few seconds.",
      },
      {
        question: "What frame rate should I use?",
        answer:
          "10-15 fps is usually enough for a UI demo or reaction clip and keeps the file manageable. Higher rates multiply the size for little perceived gain.",
      },
    ],
  },
  "video-thumbnail": {
    title: "Video Thumbnail Extractor — Capture a Frame as an Image",
    description:
      "Scrub to any timestamp in a video and export that frame as a PNG or JPG. A free thumbnail grabber that never uploads your footage.",
    keywords: ["video thumbnail extractor", "capture frame from video", "video screenshot", "get thumbnail from mp4", "extract frame as image"],
    faqs: [
      privacyFaq("video"),
      {
        question: "What resolution is the captured frame?",
        answer:
          "The frame is exported at the video's native resolution, so a 1080p source produces a 1920x1080 image with no upscaling or loss.",
      },
      {
        question: "How do I pick a good thumbnail frame?",
        answer:
          "Avoid motion-blurred frames and transitions. Pause on a well-lit, static moment with a clear subject — those read best at small sizes in a feed.",
      },
    ],
  },
  "video-metadata": {
    title: "Video Metadata Viewer — Duration, Resolution & Codec",
    description:
      "Inspect a video file's duration, dimensions, aspect ratio, and available track information without uploading it anywhere. Free and instant in your browser.",
    keywords: ["video metadata viewer", "check video resolution", "video duration checker", "video codec info", "mp4 properties", "video file details"],
    faqs: [
      privacyFaq("video"),
      {
        question: "Which details can be read in the browser?",
        answer:
          "Duration, pixel dimensions, aspect ratio, and playability of the tracks. Container-level details like the exact encoder need a desktop tool such as ffprobe.",
      },
      {
        question: "Why does the duration read as infinity?",
        answer:
          "Some streamed or improperly finalised files lack duration metadata in the header. Playing through once usually lets the browser establish the real length.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Spreadsheet tools (/spreadsheet-tools/)
  // ---------------------------------------------------------------------------
  "excel-reader": {
    title: "Excel Viewer Online — Open XLSX Files in Your Browser",
    description:
      "Open and view Excel files as a sortable table without installing Excel. A free XLSX viewer that reads the file locally and never uploads your spreadsheet.",
    keywords: ["excel viewer online", "open xlsx in browser", "view excel file free", "xls reader", "spreadsheet viewer no upload"],
    faqs: [
      privacyFaq("spreadsheet"),
      {
        question: "Which spreadsheet formats can it open?",
        answer:
          "XLSX and XLS workbooks, plus CSV. Multi-sheet workbooks are supported — pick the sheet you want to view from the list.",
      },
      {
        question: "Are formulas shown or evaluated?",
        answer:
          "Cached cell values are displayed rather than recalculated formulas, which is what you want for reviewing data rather than editing the model.",
      },
    ],
  },
  "csv-to-excel": {
    title: "CSV to Excel Converter — Convert CSV to XLSX Free",
    description:
      "Convert a CSV file into a proper .xlsx workbook and download it. Free CSV-to-Excel converter that avoids the encoding and delimiter problems of a plain rename.",
    keywords: ["csv to excel", "convert csv to xlsx", "csv to spreadsheet", "csv to excel online free", "make xlsx from csv"],
    faqs: [
      privacyFaq("CSV"),
      {
        question: "Why not just rename the file to .xlsx?",
        answer:
          "They are different formats — CSV is plain text, XLSX is a zipped XML package. Renaming produces a file Excel refuses to open; a real conversion is required.",
      },
      {
        question: "Will long numbers keep their leading zeros?",
        answer:
          "Values that look numeric are written as numbers, so IDs and postcodes can lose leading zeros. Check those columns after converting if they matter.",
      },
    ],
  },
  "excel-to-csv": {
    title: "Excel to CSV Converter — Export XLSX Sheets to CSV",
    description:
      "Convert Excel worksheets into CSV files, one sheet at a time, straight from your browser. Free XLSX-to-CSV export with no upload and no account.",
    keywords: ["excel to csv", "xlsx to csv converter", "convert excel to csv online", "export sheet to csv", "excel csv free"],
    faqs: [
      privacyFaq("spreadsheet"),
      {
        question: "How are multiple sheets handled?",
        answer:
          "CSV holds a single table, so each worksheet is exported separately. Choose the sheet you want and repeat for the others.",
      },
      {
        question: "What happens to formatting and formulas?",
        answer:
          "CSV stores only values — colours, fonts, merged cells, and formulas are dropped, leaving the computed cell contents as plain text.",
      },
    ],
  },
  "column-extractor": {
    title: "Extract Columns from a Spreadsheet — CSV & Excel",
    description:
      "Select the columns you need from a CSV or Excel file and export just those, in the order you choose. Free column extractor that runs in your browser.",
    keywords: ["extract columns from csv", "select columns spreadsheet", "csv column filter", "remove columns from excel", "column extractor tool"],
    faqs: [
      privacyFaq("spreadsheet"),
      {
        question: "Can I reorder the columns as I extract them?",
        answer:
          "Yes. Output columns follow the order you select them in, so you can reshape a file to match an importer's expected layout in one step.",
      },
      {
        question: "Why extract columns before sharing a file?",
        answer:
          "It is the simplest way to strip personal or sensitive fields from an export before handing the data to someone who only needs a subset.",
      },
    ],
  },
  "json-to-excel": {
    title: "JSON to Excel Converter — JSON Array to XLSX",
    description:
      "Convert a JSON array of objects into a formatted Excel workbook with keys as column headers. Free JSON-to-XLSX converter with no upload required.",
    keywords: ["json to excel", "json to xlsx", "convert json to spreadsheet", "json array to excel", "export json as excel"],
    faqs: [
      privacyFaq("JSON"),
      {
        question: "What JSON shape does it expect?",
        answer:
          "An array of flat objects. Each object becomes a row and each key becomes a column, with the union of all keys forming the header row.",
      },
      {
        question: "How are nested objects handled?",
        answer:
          "A worksheet has rows and columns and nothing deeper, so nested objects need collapsing before they will fit. Run them through the JSON Flattener and bring the flat array back here.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Compression tools (/compression-tools/)
  // ---------------------------------------------------------------------------
  "gzip-compress": {
    title: "Gzip Compress Online — Compress Text with Gzip",
    description:
      "Compress text or JSON with gzip in your browser and see the exact byte savings. Free online gzip tool for checking payload sizes before shipping them.",
    keywords: ["gzip compress online", "gzip text", "compress json gzip", "gzip encoder", "check gzip size", "gzip tool free"],
    faqs: [
      privacyFaq("input"),
      {
        question: "How much does gzip shrink JSON?",
        answer:
          "Typically 70-90%, because JSON repeats key names constantly and gzip is very effective on repetitive text. Minifying first adds only a little on top.",
      },
      {
        question: "Should I compare gzip or brotli sizes?",
        answer:
          "Brotli usually wins by another 10-20% for static text assets, but gzip remains the universal baseline that every client supports.",
      },
    ],
  },
  "gzip-decompress": {
    title: "Gzip Decompress Online — Decode Gzipped Data",
    description:
      "Decompress gzip-encoded data back to readable text in your browser. Free gzip decoder for inspecting compressed API responses and stored payloads.",
    keywords: ["gzip decompress online", "ungzip text", "decode gzip", "gunzip tool", "decompress gzip data", "gzip decoder"],
    faqs: [
      privacyFaq("data"),
      {
        question: "Why does decompression fail on my input?",
        answer:
          "The data must be complete and correctly encoded. Copying a gzip stream through a text editor usually corrupts it — Base64-encode the bytes before pasting instead.",
      },
      {
        question: "Can I decompress a .gz file?",
        answer:
          "This tool works on gzip-encoded text payloads rather than archive files. For a .gz on disk, use gunzip locally or your operating system's archive utility.",
      },
    ],
  },
  "lz-string-compress": {
    title: "LZ-String Compress — For URLs & localStorage",
    description:
      "Compress strings with LZ-String into URL-safe or UTF-16 output for query parameters and localStorage. Free, two-way, and entirely browser-based.",
    keywords: ["lz-string compress", "compress string for url", "localstorage compression", "lzstring online", "url safe compression", "shorten query string"],
    faqs: [
      privacyFaq("input"),
      {
        question: "When is LZ-String better than gzip?",
        answer:
          "When the result must live inside a URL or localStorage. LZ-String produces valid string output directly, whereas gzip yields binary that needs Base64 on top.",
      },
      {
        question: "How much can I fit in a URL?",
        answer:
          "Keep URLs under about 2,000 characters for broad compatibility. Compressing state first often turns an unusable link into one that fits comfortably.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Archive tools (/archive-tools/)
  // ---------------------------------------------------------------------------
  "zip-extractor": {
    title: "ZIP Extractor Online — Unzip Files in Your Browser",
    description:
      "Open a ZIP archive and download individual files from it without installing anything. Free online unzip tool that extracts locally, with no upload.",
    keywords: ["zip extractor online", "unzip files browser", "open zip online", "extract zip free", "unzip without software", "zip opener"],
    faqs: [
      privacyFaq("archive"),
      {
        question: "Can it open password-protected archives?",
        answer:
          "Encrypted ZIP files are not supported. Use a desktop archive tool for password-protected archives.",
      },
      {
        question: "Is there a size limit?",
        answer:
          "No imposed limit, but the archive is held in memory while extracting, so very large files are constrained by your device's available RAM.",
      },
    ],
  },
  "zip-creator": {
    title: "Create ZIP Online — Zip Files in Your Browser Free",
    description:
      "Bundle multiple files into a single ZIP archive and download it. Free online ZIP creator that compresses on your device without uploading anything.",
    keywords: ["create zip online", "zip files in browser", "make zip archive", "compress files to zip", "online zip creator free"],
    faqs: [
      privacyFaq("files"),
      {
        question: "How much will my files compress?",
        answer:
          "Text, code, and documents often halve in size. Already-compressed formats like JPG, MP4, and PDF barely shrink, since their data is compressed already.",
      },
      {
        question: "Can I add a password to the archive?",
        answer:
          "Encryption is not supported here. Create the archive and then encrypt it with a desktop tool if the contents need password protection.",
      },
    ],
  },
  "zip-preview": {
    title: "ZIP Preview — List Archive Contents Without Extracting",
    description:
      "Inspect what is inside a ZIP file — names, sizes, and compression ratios — without extracting it. Free, fast, and processed entirely in your browser.",
    keywords: ["zip preview", "list zip contents", "view zip without extracting", "inspect zip file", "zip file contents online"],
    faqs: [
      privacyFaq("archive"),
      {
        question: "Why check contents before extracting?",
        answer:
          "To spot archives that dump dozens of files into your current folder, and to confirm the download contains what you expect before committing disk space to it.",
      },
      {
        question: "What does the listing show?",
        answer:
          "Each entry's path, original size, compressed size, and the resulting ratio, so you can see the directory structure at a glance.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Converter tools (/converter-tools/)
  // Two ids collide with dev tools, so those are scoped by route prefix.
  // ---------------------------------------------------------------------------
  "md-to-docx": {
    title: "Markdown to DOCX Converter — Markdown to Word Free",
    description:
      "Convert Markdown into a Microsoft Word .docx document with headings, lists, and formatting preserved. Free converter that runs entirely in your browser.",
    keywords: ["markdown to docx", "markdown to word", "md to docx converter", "convert markdown to word document", "markdown word export"],
    faqs: [
      privacyFaq("document"),
      {
        question: "Which Markdown features carry over?",
        answer:
          "Headings, bold and italic, lists, links, blockquotes, and code blocks map to Word equivalents. Complex HTML embedded in the Markdown may not translate.",
      },
      {
        question: "Can I apply my own Word template?",
        answer:
          "The output uses default Word styles. Apply your organisation's template in Word afterwards — since the content uses real heading styles, restyling is a single step.",
      },
    ],
  },
  "markdown-html": {
    title: "Markdown to HTML Converter — Two-Way & Free",
    description:
      "Convert Markdown to clean HTML and HTML back to Markdown, both directions in one tool. Free, immediate, and the conversion never leaves this tab.",
    keywords: ["markdown to html", "html to markdown", "md to html converter", "markdown html online", "convert readme to html"],
    faqs: [
      privacyFaq("content"),
      {
        question: "Is GitHub Flavored Markdown supported?",
        answer:
          "Yes. Tables, task lists, strikethrough, and fenced code blocks convert to their HTML equivalents rather than being left as literal text.",
      },
      {
        question: "Is the generated HTML safe to publish?",
        answer:
          "Markdown can contain raw HTML, which passes through. Sanitise the output before rendering anything that came from an untrusted author.",
      },
    ],
  },
  "json-toml": {
    title: "JSON to TOML Converter — Two-Way & Free Online",
    description:
      "Convert JSON to TOML and TOML back to JSON for Cargo, pyproject, and app configuration files. Free two-way converter with no upload.",
    keywords: ["json to toml", "toml to json", "toml converter online", "convert config to toml", "cargo toml converter"],
    faqs: [
      privacyFaq("configuration"),
      {
        question: "Do TOML comments survive a round trip?",
        answer:
          "No. TOML allows comments and JSON has nowhere to put them, so they are discarded in the conversion and there is no way to rebuild them afterwards. Convert a copy when the comments still matter.",
      },
      {
        question: "How are nested objects represented in TOML?",
        answer:
          "Nested objects become table headers such as [tool.poetry], and arrays of objects become [[array]] table blocks.",
      },
    ],
  },
  "json-yaml": {
    title: "JSON to YAML Converter — Two-Way & Free Online",
    description:
      "Convert JSON to YAML and YAML back to JSON with validation. Ideal for Kubernetes manifests, GitHub Actions workflows, and Docker Compose files.",
    keywords: ["json to yaml", "yaml to json converter", "convert yaml online", "kubernetes json to yaml", "yaml json two way"],
    faqs: [
      privacyFaq("configuration"),
      {
        question: "Why is YAML preferred for config files?",
        answer:
          "It supports comments, needs fewer punctuation characters, and reads more naturally for hand-edited files — which is why most infrastructure tooling standardised on it.",
      },
      {
        question: "What should I watch for converting to YAML?",
        answer:
          "Strings that look like booleans or numbers (no, yes, 1.10) can be coerced by YAML 1.1 parsers. Quote them explicitly to keep them as strings.",
      },
    ],
  },
  "json-xml": {
    title: "JSON to XML Converter — Two-Way & Free Online",
    description:
      "Convert JSON to XML and XML back to JSON, with sensible handling of attributes and text nodes. Free online converter that keeps documents on your device.",
    keywords: ["json to xml", "xml to json converter", "convert xml online free", "json xml two way", "xml data converter"],
    faqs: [
      privacyFaq("document"),
      {
        question: "How are JSON arrays written as XML?",
        answer:
          "Each array element becomes a repeated child element with the same tag name, which is the conventional XML representation of a list.",
      },
      {
        question: "Why can a round trip change the structure?",
        answer:
          "XML distinguishes attributes, elements, and ordering while JSON does not, so some of that detail is flattened in one direction and cannot be reconstructed in the other.",
      },
    ],
  },
  "json-csv": {
    title: "JSON to CSV Converter — Two-Way & Free Online",
    description:
      "Convert a JSON array of objects into CSV, or turn CSV rows back into JSON. Free two-way converter with RFC 4180 quoting and no upload.",
    keywords: ["json to csv", "csv to json converter", "json array to csv", "convert json to spreadsheet", "json csv online"],
    faqs: [
      privacyFaq("data"),
      {
        question: "What JSON shape is required?",
        answer:
          "An array of flat objects. Keys across all objects form the header row, and missing keys are written as empty cells.",
      },
      {
        question: "How do nested values convert?",
        answer:
          "CSV is flat, so flatten nested objects to dot-notation keys first with the JSON Flattener, then convert the result here.",
      },
    ],
  },
  "converter-tools/color-converter": {
    title: "Color Converter — HEX, RGB, HSL & CMYK",
    description:
      "Convert colours between HEX, RGB, HSL, and CMYK with a live swatch preview. Free colour format converter for web and print work, no signup required.",
    keywords: ["color converter", "hex to cmyk", "rgb to hsl", "cmyk converter online", "color format conversion", "hex rgb hsl cmyk"],
    faqs: [
      privacyFaq("colour values"),
      {
        question: "Why does CMYK not match my screen colour exactly?",
        answer:
          "RGB is additive light and CMYK is subtractive ink, and CMYK's gamut is smaller. Vivid screen colours have no exact ink equivalent, so conversion is always approximate.",
      },
      {
        question: "Which format should I use in CSS?",
        answer:
          "HEX for fixed brand colours, HSL when you need to derive tints and shades programmatically. CMYK is for print and has no place in a stylesheet.",
      },
    ],
  },
  "converter-tools/timestamp-converter": {
    title: "Timestamp Converter — Unix, ISO 8601 & Locale Dates",
    description:
      "Convert between Unix timestamps, ISO 8601 strings, and locale-formatted dates in seconds or milliseconds. Free timestamp converter that runs in the browser.",
    keywords: ["timestamp converter", "unix to iso 8601", "iso date converter", "epoch to date", "date format converter", "milliseconds to date"],
    faqs: [
      privacyFaq("input"),
      {
        question: "What is ISO 8601 format?",
        answer:
          "The international standard date format, such as 2026-03-14T09:30:00Z. It sorts correctly as plain text and is unambiguous across regions, unlike 03/14 versus 14/03.",
      },
      {
        question: "Seconds or milliseconds — how do I tell?",
        answer:
          "A 10-digit value is seconds (Unix convention) and a 13-digit value is milliseconds (JavaScript convention). Confusing the two shifts dates by decades.",
      },
    ],
  },
  "html-markdown": {
    title: "HTML to Markdown Converter — Clean Markdown Output",
    description:
      "Convert HTML into clean, readable Markdown, stripping presentational markup along the way. Free converter for migrating pages into docs and READMEs.",
    keywords: ["html to markdown", "convert html to md", "html markdown converter", "web page to markdown", "clean markdown from html"],
    faqs: [
      privacyFaq("HTML"),
      {
        question: "What happens to markup Markdown cannot express?",
        answer:
          "Elements without a Markdown equivalent — complex tables, iframes, styled spans — are either kept as inline HTML or simplified, since Markdown permits raw HTML.",
      },
      {
        question: "Is this useful for migrating a CMS?",
        answer:
          "Yes. Converting exported HTML into Markdown is the usual first step when moving content into a static site generator or a docs-as-code workflow.",
      },
    ],
  },
  "csv-markdown": {
    title: "CSV to Markdown Table Converter — Free Online",
    description:
      "Turn CSV data into a properly aligned Markdown table ready to paste into a README, wiki, or pull request. Free, instant, and fully client-side.",
    keywords: ["csv to markdown table", "markdown table generator", "csv to md", "make markdown table from csv", "excel to markdown table"],
    faqs: [
      privacyFaq("data"),
      {
        question: "Can I paste data straight from a spreadsheet?",
        answer:
          "Yes. Copied spreadsheet cells arrive as tab-separated values — set the delimiter to tab and the table converts directly.",
      },
      {
        question: "Does column alignment matter?",
        answer:
          "Only for readability of the raw Markdown. Renderers ignore padding, but the alignment row controls how each column displays.",
      },
    ],
  },
  "svg-png": {
    title: "SVG to PNG Converter — Render SVG at Any Resolution",
    description:
      "Render an SVG to a high-resolution PNG at whatever dimensions you need. Free SVG-to-PNG converter that rasterises in your browser with no upload.",
    keywords: ["svg to png", "convert svg to png online", "svg rasterizer", "svg to image free", "high resolution svg export"],
    faqs: [
      privacyFaq("SVG"),
      {
        question: "What resolution should I export at?",
        answer:
          "Export at two or three times the display size for retina screens. SVG is resolution-independent, so rasterising larger costs nothing but file size.",
      },
      {
        question: "Why did my fonts change in the PNG?",
        answer:
          "SVG references fonts by name and rasterising uses whatever is available locally. Convert text to paths before exporting to guarantee identical output.",
      },
    ],
  },
  "url-parser": {
    title: "URL Parser & Builder — Inspect Query Parameters Online",
    description:
      "Break a URL into protocol, host, path, query parameters, and fragment, or build one from parts. Free URL inspector and query string editor, all client-side.",
    keywords: ["url parser", "query string parser", "url builder online", "parse url parameters", "utm parameter builder", "inspect url"],
    faqs: [
      privacyFaq("URL"),
      {
        question: "How are repeated query parameters handled?",
        answer:
          "Each occurrence is listed separately, since repeated keys are valid and many APIs use them to express lists such as ?tag=a&tag=b.",
      },
      {
        question: "Can I build tracking URLs with it?",
        answer:
          "Yes. Add utm_source, utm_medium, and utm_campaign as parameters and the tool assembles a correctly encoded URL you can copy straight into a campaign.",
      },
    ],
  },
};

/**
 * Looks up SEO metadata for a tool. Ids are unique within a category but two
 * (color-converter, timestamp-converter) exist in more than one, so callers pass
 * their route prefix and a "<prefix>/<id>" entry wins over the bare id.
 */
export function getToolSeo(toolId: string, routePrefix?: string): ToolSeoEntry {
  if (routePrefix) {
    const scoped = toolSeoData[`${routePrefix}/${toolId}`];
    if (scoped) return scoped;
  }
  return toolSeoData[toolId] ?? {};
}
