
import { JsonFormatterTool } from "@/components/tools/implementations/JsonFormatterTool";
import { CaseConverterTool } from "@/components/tools/implementations/CaseConverterTool";
import { WordCounterTool } from "@/components/tools/implementations/WordCounterTool";
import { TextDiffTool } from "@/components/tools/implementations/TextDiffTool";
import { DuplicateRemoverTool } from "@/components/tools/implementations/DuplicateRemoverTool";
import { LineBreakRemoverTool } from "@/components/tools/implementations/LineBreakRemoverTool";
import { TextReplacerTool } from "@/components/tools/implementations/TextReplacerTool";
import { SlugConverterTool } from "@/components/tools/implementations/SlugConverterTool";
import { JsonStringifyTool } from "@/components/tools/implementations/JsonStringifyTool";
import { JsonParseTool } from "@/components/tools/implementations/JsonParseTool";
import { HtmlFormatterTool } from "@/components/tools/implementations/HtmlFormatterTool";
import { SqlFormatterTool } from "@/components/tools/implementations/SqlFormatterTool";
import { RegexTesterTool } from "@/components/tools/implementations/RegexTesterTool";
import { EncryptionTool } from "@/components/tools/implementations/EncryptionTool";
import { CsvJsonConverterTool } from "@/components/tools/implementations/CsvJsonConverterTool";
import { YamlJsonConverterTool } from "@/components/tools/implementations/YamlJsonConverterTool";
import { XmlJsonConverterTool } from "@/components/tools/implementations/XmlJsonConverterTool";
import { JsonSchemaValidatorTool } from "@/components/tools/implementations/JsonSchemaValidatorTool";
import { JsonMergerTool } from "@/components/tools/implementations/JsonMergerTool";
import { JsonFlattenerTool } from "@/components/tools/implementations/JsonFlattenerTool";
import { CssFormatterTool } from "@/components/tools/implementations/CssFormatterTool";
import { HtmlJsxConverterTool } from "@/components/tools/implementations/HtmlJsxConverterTool";
import { ColorConverterTool } from "@/components/tools/implementations/ColorConverterTool";
import { GradientGeneratorTool } from "@/components/tools/implementations/GradientGeneratorTool";
import { BoxShadowGeneratorTool } from "@/components/tools/implementations/BoxShadowGeneratorTool";
import { HashGeneratorTool } from "@/components/tools/implementations/HashGeneratorTool";
import { PasswordGeneratorTool } from "@/components/tools/implementations/PasswordGeneratorTool";
import { UuidGeneratorTool } from "@/components/tools/implementations/UuidGeneratorTool";
import { EnvFormatterTool } from "@/components/tools/implementations/EnvFormatterTool";
import { JwtDecoderTool } from "@/components/tools/implementations/JwtDecoderTool";
import { FakeDataGeneratorTool } from "@/components/tools/implementations/FakeDataGeneratorTool";
import { HttpRequestComposerTool } from "@/components/tools/implementations/HttpRequestComposerTool";
import { UserAgentGeneratorTool } from "@/components/tools/implementations/UserAgentGeneratorTool";
import { TimestampConverterTool } from "@/components/tools/implementations/TimestampConverterTool";
import { IpAddressTool } from "@/components/tools/implementations/IpAddressTool";
import { GitignoreGeneratorTool } from "@/components/tools/implementations/GitignoreGeneratorTool";
import { DockerfileFormatterTool } from "@/components/tools/implementations/DockerfileFormatterTool";
import { YamlFormatterTool } from "@/components/tools/implementations/YamlFormatterTool";
import { NginxConfigGeneratorTool } from "@/components/tools/implementations/NginxConfigGeneratorTool";
import { CronExpressionBuilderTool } from "@/components/tools/implementations/CronExpressionBuilderTool";
import { RegexGeneratorTool } from "@/components/tools/implementations/RegexGeneratorTool";
import { CodeExplainerTool } from "@/components/tools/implementations/CodeExplainerTool";
import { PromptOptimizerTool } from "@/components/tools/implementations/PromptOptimizerTool";
import { MarkdownSummarizerTool } from "@/components/tools/implementations/MarkdownSummarizerTool";
import { JsonFixerTool } from "@/components/tools/implementations/JsonFixerTool";

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
        const lines = input.trim().split('\n');
        const headers = lines[0].split(',');
        const result = lines.slice(1).map(line => {
          const values = line.split(',');
          return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index]?.trim() || '';
            return obj;
          }, {} as any);
        });
        return JSON.stringify(result, null, 2);
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
        const xml2js = await import('xml2js');
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(input);
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
      return Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
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
  "ip-address-tool": {
    run: async (input: string) => {
      return `IP Information for: ${input}`;
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
  "regex-generator": {
    run: async (input: string) => {
      return `Generated regex for: ${input}`;
    }
  },
  "code-explainer": {
    run: async (input: string) => {
      return `Code explanation for: ${input.substring(0, 50)}...`;
    }
  },
  "prompt-optimizer": {
    run: async (input: string) => {
      return `Optimized prompt: ${input}`;
    }
  },
  "markdown-summarizer": {
    run: async (input: string) => {
      const lines = input.split('\n').filter(line => line.trim());
      return `Summary: ${lines.length} lines processed`;
    }
  },
  "json-fixer": {
    run: async (input: string) => {
      try {
        const fixed = input.replace(/'/g, '"').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        JSON.parse(fixed);
        return fixed;
      } catch {
        throw new Error("Could not fix JSON");
      }
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
  }
};

// Component registry for tool page rendering
export const componentRegistry: Record<string, React.ComponentType<any>> = {
  "json-formatter": JsonFormatterTool,
  "case-converter": CaseConverterTool,
  "word-counter": WordCounterTool,
  "text-diff": TextDiffTool,
  "duplicate-remover": DuplicateRemoverTool,
  "line-break-remover": LineBreakRemoverTool,
  "text-replacer": TextReplacerTool,
  "slug-converter": SlugConverterTool,
  "json-stringify": JsonStringifyTool,
  "json-parse": JsonParseTool,
  "html-formatter": HtmlFormatterTool,
  "sql-formatter": SqlFormatterTool,
  "regex-tester": RegexTesterTool,
  "encryption-tool": EncryptionTool,
  "csv-json-converter": CsvJsonConverterTool,
  "yaml-json-converter": YamlJsonConverterTool,
  "xml-json-converter": XmlJsonConverterTool,
  "json-schema-validator": JsonSchemaValidatorTool,
  "json-merger": JsonMergerTool,
  "json-flattener": JsonFlattenerTool,
  "css-minifier": CssFormatterTool,
  "html-jsx-converter": HtmlJsxConverterTool,
  "color-converter": ColorConverterTool,
  "gradient-generator": GradientGeneratorTool,
  "box-shadow-generator": BoxShadowGeneratorTool,
  "hash-generator": HashGeneratorTool,
  "password-generator": PasswordGeneratorTool,
  "uuid-generator": UuidGeneratorTool,
  "env-formatter": EnvFormatterTool,
  "jwt-decoder": JwtDecoderTool,
  "fake-data-generator": FakeDataGeneratorTool,
  "http-request-composer": HttpRequestComposerTool,
  "user-agent-generator": UserAgentGeneratorTool,
  "timestamp-converter": TimestampConverterTool,
  "ip-address-tool": IpAddressTool,
  "gitignore-generator": GitignoreGeneratorTool,
  "dockerfile-formatter": DockerfileFormatterTool,
  "yaml-formatter": YamlFormatterTool,
  "nginx-config-generator": NginxConfigGeneratorTool,
  "cron-expression-builder": CronExpressionBuilderTool,
  "regex-generator": RegexGeneratorTool,
  "code-explainer": CodeExplainerTool,
  "prompt-optimizer": PromptOptimizerTool,
  "markdown-summarizer": MarkdownSummarizerTool,
  "json-fixer": JsonFixerTool
};
