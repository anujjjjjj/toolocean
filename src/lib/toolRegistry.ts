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
  }
};