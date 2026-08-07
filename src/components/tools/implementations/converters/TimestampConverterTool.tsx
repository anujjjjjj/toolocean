import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TimestampFormat = "unix" | "iso" | "locale";

export function TimestampConverterTool() {
  const [inputFormat, setInputFormat] = useState<TimestampFormat>("unix");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { toast } = useToast();

  const convert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      let date: Date;

      if (inputFormat === "unix") {
        const timestamp = input.includes(".") ? parseFloat(input) * 1000 : parseInt(input) * 1000;
        date = new Date(timestamp);
        if (isNaN(date.getTime())) throw new Error("Invalid Unix timestamp");
      } else if (inputFormat === "iso") {
        date = new Date(input);
        if (isNaN(date.getTime())) throw new Error("Invalid ISO date string");
      } else {
        date = new Date(input);
        if (isNaN(date.getTime())) throw new Error("Invalid date string");
      }

      const unixSeconds = Math.floor(date.getTime() / 1000);
      const unixMilliseconds = date.getTime();
      const iso = date.toISOString();
      const locale = date.toLocaleString();
      const localeDate = date.toLocaleDateString();
      const localeTime = date.toLocaleTimeString();
      const utc = date.toUTCString();

      setOutput(
        `Unix (seconds): ${unixSeconds}\nUnix (milliseconds): ${unixMilliseconds}\nISO 8601: ${iso}\nLocale: ${locale}\nDate: ${localeDate}\nTime: ${localeTime}\nUTC: ${utc}`
      );
    } catch (error) {
      toast({
        title: "Conversion Error",
        description: error instanceof Error ? error.message : "Failed to convert timestamp",
        variant: "destructive",
      });
      setOutput("");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard", description: "Timestamp values have been copied" });
    } catch {
      toast({ title: "Failed to copy", description: "Could not copy to clipboard", variant: "destructive" });
    }
  };

  const useCurrentTime = () => {
    const now = new Date();
    if (inputFormat === "unix") {
      setInput(Math.floor(now.getTime() / 1000).toString());
    } else if (inputFormat === "iso") {
      setInput(now.toISOString());
    } else {
      setInput(now.toLocaleString());
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Timestamp Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Input Format</Label>
            <Select value={inputFormat} onValueChange={(v) => setInputFormat(v as TimestampFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unix">Unix Timestamp (seconds)</SelectItem>
                <SelectItem value="iso">ISO 8601</SelectItem>
                <SelectItem value="locale">Locale String</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Timestamp Input ({inputFormat === "unix" ? "e.g., 1640995200" : inputFormat === "iso" ? "e.g., 2022-01-01T00:00:00Z" : "e.g., 1/1/2022, 12:00:00 AM"})
            </Label>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                inputFormat === "unix"
                  ? "1640995200"
                  : inputFormat === "iso"
                    ? "2022-01-01T00:00:00Z"
                    : "1/1/2022, 12:00:00 AM"
              }
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={convert} className="flex-1" disabled={!input.trim()}>
              Convert Timestamp
            </Button>
            <Button onClick={useCurrentTime} variant="outline">
              Use Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              All Timestamp Formats
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(output)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              {output.split("\n").map((line, i) => (
                <div key={i} className="p-2 bg-muted/50 rounded">
                  {line}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
