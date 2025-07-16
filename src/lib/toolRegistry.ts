// Basic tool registry for workflow execution
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
  "hash-generator": {
    run: async (input: string) => {
      const crypto = await import('crypto-js');
      return `MD5: ${crypto.MD5(input).toString()}\nSHA1: ${crypto.SHA1(input).toString()}\nSHA256: ${crypto.SHA256(input).toString()}`;
    }
  },
  "uuid-generator": {
    run: async (input: string) => {
      return crypto.randomUUID();
    }
  }
};