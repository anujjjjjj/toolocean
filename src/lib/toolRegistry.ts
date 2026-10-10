
import FakeDataGeneratorTool from "@/components/tools/implementations/FakeDataGeneratorTool";
import HttpRequestComposerTool from "@/components/tools/implementations/HttpRequestComposerTool";
import UserAgentGeneratorTool from "@/components/tools/implementations/UserAgentGeneratorTool";
import TimestampConverterTool from "@/components/tools/implementations/TimestampConverterTool";
import GitignoreGeneratorTool from "@/components/tools/implementations/GitignoreGeneratorTool";
import DockerfileFormatterTool from "@/components/tools/implementations/DockerfileFormatterTool";
import IpAddressTool from "@/components/tools/implementations/IpAddressTool";

// Tool registry for workflow execution
export const toolRegistry: Record<string, { run: (input: string) => Promise<string> }> = {
  "json-formatter": {
    run: async (input: string) => {
      try {
        const parsed = JSON.parse(input);
        return JSON.stringify(parsed, null, 2);
      } catch {
        throw new Error("Invalid JSON");
      }
    }
  },
  "case-converter": {
    run: async (input: string) => input.toUpperCase()
  },
  "word-counter": {
    run: async (input: string) => {
      const words = input.trim().split(/\s+/).filter(word => word.length > 0);
      const chars = input.length;
      const lines = input.split('\n').length;
      return `Words: ${words.length}, Characters: ${chars}, Lines: ${lines}`;
    }
  },
  "text-diff": {
    run: async (input: string) => {
      const lines = input.split('\n');
      return `Text has ${lines.length} lines`;
    }
  },
  "duplicate-remover": {
    run: async (input: string) => {
      const lines = input.split('\n');
      const unique = [...new Set(lines)];
      return unique.join('\n');
    }
  },
  "line-break-remover": {
    run: async (input: string) => {
      return input.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    }
  },
  "text-replacer": {
    run: async (input: string) => {
      return input.replace(/\s+/g, ' ').trim();
    }
  },
  "slug-converter": {
    run: async (input: string) => {
      return input.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    }
  },
  "json-stringify": {
    run: async (input: string) => {
      try {
        const parsed = JSON.parse(input);
        return JSON.stringify(parsed);
      } catch {
        throw new Error("Invalid JSON");
      }
    }
  },
  "json-parse": {
    run: async (input: string) => {
      try {
        let cleanInput = input.trim();
        if (cleanInput.startsWith('"') && cleanInput.endsWith('"')) {
          cleanInput = cleanInput.slice(1, -1).replace(/\\"/g, '"');
        }
        const parsed = JSON.parse(cleanInput);
        return JSON.stringify(parsed, null, 2);
      } catch {
        throw new Error("Invalid JSON string");
      }
    }
  },
  "html-formatter": {
    run: async (input: string) => {
      return input.replace(/>\s*</g, '>\n<').replace(/^\s+|\s+$/g, '');
    }
  },
  "sql-formatter": {
    run: async (input: string) => {
      return input.replace(/\b(SELECT|FROM|WHERE|ORDER BY|GROUP BY)\b/gi, '\n$1').trim();
    }
  },
  "regex-tester": {
    run: async (input: string) => {
      return `Pattern tested against: ${input}`;
    }
  },
  "encryption-tool": {
    run: async (input: string) => {
      return btoa(input); // Simple base64 encoding as example
    }
  },
  "csv-json-converter": {
    run: async (input: string) => {
      try {
        const { csvToRecords } = await import("@/lib/csv/parseCsv");
        return JSON.stringify(csvToRecords(input, ",", true), null, 2);
      } catch {
        throw new Error("Invalid CSV format");
      }
    }
  },
  "yaml-json-converter": {
    run: async (input: string) => {
      try {
        const yaml = await import('js-yaml');
        const parsed = yaml.load(input);
        return JSON.stringify(parsed, null, 2);
      } catch {
        throw new Error("Invalid YAML format");
      }
    }
  },
  "xml-json-converter": {
    run: async (input: string) => {
      try {
        const { xmlToJson } = await import('@/lib/xmlJson');
        const result = xmlToJson(input, { preserveAttributes: true, explicitArray: false });
        return JSON.stringify(result, null, 2);
      } catch {
        throw new Error("Invalid XML format");
      }
    }
  },
  "json-schema-validator": {
    run: async (input: string) => {
      try {
        JSON.parse(input);
        return "Valid JSON";
      } catch {
        return "Invalid JSON";
      }
    }
  },
  "json-merger": {
    run: async (input: string) => {
      try {
        const objects = input.split('\n---\n').map(obj => JSON.parse(obj));
        const merged = Object.assign({}, ...objects);
        return JSON.stringify(merged, null, 2);
      } catch {
        throw new Error("Invalid JSON objects to merge");
      }
    }
  },
  "json-flattener": {
    run: async (input: string) => {
      try {
        const obj = JSON.parse(input);
        const flatten = (obj: any, prefix = ''): any => {
          const result: any = {};
          for (const key in obj) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              Object.assign(result, flatten(obj[key], newKey));
            } else {
              result[newKey] = obj[key];
            }
          }
          return result;
        };
        return JSON.stringify(flatten(obj), null, 2);
      } catch {
        throw new Error("Invalid JSON");
      }
    }
  },
  "css-minifier": {
    run: async (input: string) => {
      return input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/;\s*}/g, '}').replace(/\s*{\s*/g, '{').replace(/;\s*/g, ';').replace(/\s*}\s*/g, '}').replace(/,\s*/g, ',').replace(/:\s*/g, ':').trim();
    }
  },
  "html-jsx-converter": {
    run: async (input: string) => {
      return input.replace(/class=/g, 'className=').replace(/for=/g, 'htmlFor=').replace(/style="([^"]*)"/g, 'style={{$1}}');
    }
  },
  "color-converter": {
    run: async (input: string) => {
      return `Color: ${input}`;
    }
  },
  "gradient-generator": {
    run: async (input: string) => {
      return `linear-gradient(45deg, ${input}, #ffffff)`;
    }
  },
  "box-shadow-generator": {
    run: async (input: string) => {
      return `box-shadow: 0 4px 8px ${input}`;
    }
  },
  "hash-generator": {
    run: async (input: string) => {
      const crypto = await import('crypto-js');
      return `MD5: ${crypto.MD5(input).toString()}\nSHA1: ${crypto.SHA1(input).toString()}\nSHA256: ${crypto.SHA256(input).toString()}`;
    }
  },
  "password-generator": {
    run: async (input: string) => {
      const length = parseInt(input) || 12;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
  },
  "uuid-generator": {
    run: async (input: string) => {
      return crypto.randomUUID();
    }
  },
  "env-formatter": {
    run: async (input: string) => {
      return input.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#')).join('\n');
    }
  },
  "jwt-decoder": {
    run: async (input: string) => {
      try {
        const parts = input.split('.');
        if (parts.length !== 3) throw new Error('Invalid JWT');
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        return `Header: ${JSON.stringify(header, null, 2)}\nPayload: ${JSON.stringify(payload, null, 2)}`;
      } catch {
        throw new Error("Invalid JWT token");
      }
    }
  },
  "fake-data-generator": {
    run: async (input: string) => {
      const names = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown'];
      const emails = ['john@example.com', 'jane@example.com', 'bob@example.com', 'alice@example.com'];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomEmail = emails[Math.floor(Math.random() * emails.length)];
      return `Name: ${randomName}\nEmail: ${randomEmail}`;
    }
  },
  "http-request-composer": {
    run: async (input: string) => {
      return `HTTP Request composed for: ${input}`;
    }
  },
  "user-agent-generator": {
    run: async (input: string) => {
      return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    }
  },
  "timestamp-converter": {
    run: async (input: string) => {
      const timestamp = parseInt(input) || Date.now();
      const date = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
      return `${date.toISOString()}\n${date.toLocaleString()}`;
    }
  },
  "gitignore-generator": {
    run: async (input: string) => {
      return `# ${input} .gitignore\nnode_modules/\n.env\n*.log\ndist/\nbuild/`;
    }
  },
  "dockerfile-formatter": {
    run: async (input: string) => {
      return input.split('\n').map(line => line.trim()).filter(line => line).join('\n');
    }
  },
  "yaml-formatter": {
    run: async (input: string) => {
      try {
        const yaml = await import('js-yaml');
        const parsed = yaml.load(input);
        return yaml.dump(parsed, { indent: 2 });
      } catch {
        throw new Error("Invalid YAML format");
      }
    }
  },
  "nginx-config-generator": {
    run: async (input: string) => {
      return `server {\n  listen 80;\n  server_name ${input};\n  root /var/www/html;\n  index index.html;\n}`;
    }
  },
  "cron-expression-builder": {
    run: async (input: string) => {
      return `0 0 * * * # ${input}`;
    }
  },
  "base64-encode": {
    run: async (input: string) => btoa(input)
  },
  "base64-decode": {
    run: async (input: string) => {
      try {
        return atob(input);
      } catch {
        throw new Error("Invalid Base64");
      }
    }
  },
  "text-uppercase": {
    run: async (input: string) => input.toUpperCase()
  },
  "text-lowercase": {
    run: async (input: string) => input.toLowerCase()
  },
  // Unregistered existing tools
  "code-explainer": { run: async (input: string) => `Code analysis requested for:\n${input.slice(0, 200)}` },
  "json-fixer": {
    run: async (input: string) => {
      try { return JSON.stringify(JSON.parse(input), null, 2); } catch { throw new Error("Could not fix JSON"); }
    }
  },
  "ip-address": { run: async () => { const r = await fetch("https://api.ipify.org?format=json"); const d = await r.json(); return d.ip; } },
  "regex-generator": { run: async (input: string) => `Regex for "${input}": /[pattern]/g` },
  // New Phase 2 tools
  "url-encoder": {
    run: async (input: string) => encodeURIComponent(input)
  },
  "base64-tool": {
    run: async (input: string) => btoa(unescape(encodeURIComponent(input)))
  },
  "html-entity-encoder": {
    run: async (input: string) => input.replace(/[&<>"'`=/]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "`": "&#x60;", "=": "&#x3D;", "/": "&#x2F;" }[c] || c))
  },
  "number-base-converter": {
    run: async (input: string) => {
      const n = parseInt(input.trim(), 10);
      if (isNaN(n)) throw new Error("Invalid decimal number");
      return `dec: ${n}\nhex: ${n.toString(16).toUpperCase()}\nbin: ${n.toString(2)}\noct: ${n.toString(8)}`;
    }
  },
  "markdown-preview": {
    run: async (input: string) => {
      const { marked } = await import("marked");
      return marked(input) as string;
    }
  },
  "lorem-ipsum-generator": {
    run: async (input: string) => {
      const n = parseInt(input) || 1;
      const words = ["lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do","eiusmod","tempor"];
      return Array.from({ length: n * 8 }, () => words[Math.floor(Math.random() * words.length)]).join(" ") + ".";
    }
  },
  "string-escape": {
    run: async (input: string) => JSON.stringify(input).slice(1, -1)
  },
  "toml-formatter": {
    run: async (input: string) => {
      const toml = await import("smol-toml");
      return toml.stringify(toml.parse(input));
    }
  },
  "xml-formatter": {
    run: async (input: string) => input.replace(/>\s*</g, ">\n<").trim()
  },
  "csv-formatter": {
    run: async (input: string) => input.split("\n").filter(Boolean).join("\n")
  },
  "css-unit-converter": { run: async (input: string) => `${parseFloat(input) / 16}rem` },
  "chmod-calculator": {
    run: async (input: string) => {
      const n = parseInt(input.trim(), 8);
      if (isNaN(n)) throw new Error("Invalid octal");
      const sym = (r: number, w: number, x: number) => ((n & r) ? "r" : "-") + ((n & w) ? "w" : "-") + ((n & x) ? "x" : "-");
      return `${sym(0o400,0o200,0o100)}${sym(0o040,0o020,0o010)}${sym(0o004,0o002,0o001)}`;
    }
  },
  "mime-type-lookup": {
    run: async (input: string) => {
      const map: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", svg: "image/svg+xml", webp: "image/webp", mp4: "video/mp4", mp3: "audio/mpeg", pdf: "application/pdf", json: "application/json", xml: "text/xml", html: "text/html", css: "text/css", js: "text/javascript", txt: "text/plain", csv: "text/csv", zip: "application/zip" };
      const ext = input.trim().toLowerCase().replace(/^\./, "");
      return map[ext] || "application/octet-stream";
    }
  },
  "unicode-inspector": {
    run: async (input: string) => [...input].map(c => `${c} U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4,"0")}`).join("\n")
  },
  "jwt-generator": {
    run: async (input: string) => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
      const payload = btoa(input).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
      return `${header}.${payload}.signature_not_verified`;
    }
  },
  "qr-code-generator": { run: async (input: string) => `QR code generated for: ${input}` },
  "text-sorter": {
    run: async (input: string) => input.split("\n").filter(Boolean).sort((a, b) => a.localeCompare(b)).join("\n")
  },
  "json-minifier": {
    run: async (input: string) => {
      try { return JSON.stringify(JSON.parse(input)); } catch { throw new Error("Invalid JSON"); }
    }
  },
  "color-palette-generator": { run: async (input: string) => `Palette generated for: ${input}` },
  "text-to-binary": {
    run: async (input: string) => [...new TextEncoder().encode(input)].map(b => b.toString(2).padStart(8,"0")).join(" ")
  },
  "ip-cidr-calculator": {
    run: async (input: string) => {
      const [ip, prefix] = input.trim().split("/");
      if (!ip || !prefix) throw new Error("Use CIDR notation e.g. 192.168.1.0/24");
      const p = parseInt(prefix, 10);
      const mask = p === 0 ? 0 : (~0 << (32 - p)) >>> 0;
      const ipInt = ip.split(".").reduce((a, o) => (a << 8) | parseInt(o, 10), 0) >>> 0;
      const net = (ipInt & mask) >>> 0;
      const bcast = (net | (~mask >>> 0)) >>> 0;
      const toIp = (n: number) => [24,16,8,0].map(s => (n >>> s) & 0xff).join(".");
      return `Network: ${toIp(net)}\nBroadcast: ${toIp(bcast)}\nHosts: ${Math.pow(2, 32 - p) - 2}`;
    }
  },
  "number-formatter": {
    run: async (input: string) => new Intl.NumberFormat("en-US").format(parseFloat(input.replace(/,/g,"")))
  },
  "dns-lookup": { run: async (input: string) => `DNS lookup requires browser fetch. Domain: ${input}` },
  // Compression (text-based, workflow-compatible)
  "gzip-compress": {
    run: async (input: string) => {
      const pako = await import("pako");
      const encoded = new TextEncoder().encode(input);
      const compressed = pako.gzip(encoded);
      return btoa(String.fromCharCode(...compressed));
    }
  },
  "gzip-decompress": {
    run: async (input: string) => {
      const pako = await import("pako");
      const binary = atob(input.replace(/\s/g, ""));
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const decompressed = pako.ungzip(bytes);
      return new TextDecoder().decode(decompressed);
    }
  },
  // File-based tools - require file input, use standalone tools
  "pdf-merge": { run: async () => { throw new Error("This tool requires file input. Use it from PDF tools."); } },
  "pdf-split": { run: async () => { throw new Error("This tool requires file input. Use it from PDF tools."); } },
  "pdf-compress": { run: async () => { throw new Error("This tool requires file input. Use it from PDF tools."); } },
  "pdf-to-images": { run: async () => { throw new Error("This tool requires file input. Use it from PDF tools."); } },
  "images-to-pdf": { run: async () => { throw new Error("This tool requires file input. Use it from PDF tools."); } },
  "pdf-rotate": { run: async () => { throw new Error("This tool requires file input. Use it from PDF tools."); } },
  "pdf-watermark": { run: async () => { throw new Error("This tool requires file input. Use it from PDF tools."); } },
  "pdf-reorder": { run: async () => { throw new Error("This tool requires file input. Use it from PDF tools."); } },
  "pdf-sign": { run: async () => { throw new Error("This tool requires file input. Use it from PDF tools."); } },
  "pdf-encrypt": { run: async () => { throw new Error("This tool requires file input. Use it from PDF tools."); } },
  "pdf-unlock": { run: async () => { throw new Error("This tool requires file input. Use it from PDF tools."); } },
  "pdf-metadata": { run: async () => { throw new Error("This tool requires file input. Use it from PDF tools."); } },
  "pdf-form-fill": { run: async () => { throw new Error("This tool requires file input. Use it from PDF tools."); } },
  "csv-converter": { run: async () => { throw new Error("This tool requires file input. Use it from CSV tools."); } },
  "csv-validator": { run: async () => { throw new Error("This tool requires file input. Use it from CSV tools."); } },
  "csv-merge": { run: async () => { throw new Error("This tool requires file input. Use it from CSV tools."); } },
  "audio-cutter": { run: async () => { throw new Error("This tool requires file input. Use it from Audio tools."); } },
  "audio-merge": { run: async () => { throw new Error("This tool requires file input. Use it from Audio tools."); } },
  "image-resizer": { run: async () => { throw new Error("This tool requires file input. Use it from Image tools."); } },
  "image-compressor": { run: async () => { throw new Error("This tool requires file input. Use it from Image tools."); } },
  "image-format-converter": { run: async () => { throw new Error("This tool requires file input. Use it from Image tools."); } },
  "image-to-base64": { run: async () => { throw new Error("This tool requires file input. Use it from Image tools."); } },
  "video-thumbnail": { run: async () => { throw new Error("This tool requires file input. Use it from Video tools."); } },
  "video-trimmer": { run: async () => { throw new Error("This tool requires file input. Use it from Video tools."); } },
  "video-to-gif": { run: async () => { throw new Error("This tool requires file input. Use it from Video tools."); } },
  "excel-reader": { run: async () => { throw new Error("This tool requires file input. Use it from Spreadsheet tools."); } },
  "csv-to-excel": { run: async () => { throw new Error("This tool requires file input. Use it from Spreadsheet tools."); } },
  "excel-to-csv": { run: async () => { throw new Error("This tool requires file input. Use it from Spreadsheet tools."); } },
  "zip-extractor": { run: async () => { throw new Error("This tool requires file input. Use it from Archive tools."); } },
  "zip-creator": { run: async () => { throw new Error("This tool requires file input. Use it from Archive tools."); } },
  "zip-preview": { run: async () => { throw new Error("This tool requires file input. Use it from Archive tools."); } },
};

// Directional ids share the run that the old combined tool used. Saved workflows
// still name csv-json-converter, yaml-json-converter, and xml-json-converter.
toolRegistry["csv-to-json"] = toolRegistry["csv-json-converter"];
toolRegistry["yaml-to-json"] = toolRegistry["yaml-json-converter"];
toolRegistry["xml-to-json"] = toolRegistry["xml-json-converter"];
toolRegistry["json-to-csv"] = {
  run: async (input: string) => {
    const data = JSON.parse(input);
    if (!Array.isArray(data) || data.length === 0) throw new Error("JSON must be an array of objects");
    const headers = Object.keys(data[0] as Record<string, unknown>);
    const rows = data.map((row) =>
      headers
        .map((header) => {
          const value = String((row as Record<string, unknown>)[header] ?? "");
          return value.includes(",") ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  },
};
toolRegistry["json-to-yaml"] = {
  run: async (input: string) => {
    const yaml = await import("js-yaml");
    return yaml.dump(JSON.parse(input), { indent: 2, lineWidth: 120, noRefs: true, sortKeys: false });
  },
};
toolRegistry["json-to-xml"] = {
  run: async (input: string) => {
    const { jsonToXml } = await import("@/lib/xmlJson");
    return jsonToXml(input);
  },
};
toolRegistry["json-to-toml"] = {
  run: async (input: string) => {
    const { stringify } = await import("smol-toml");
    return stringify(JSON.parse(input));
  },
};

// Component registry for tool page rendering

