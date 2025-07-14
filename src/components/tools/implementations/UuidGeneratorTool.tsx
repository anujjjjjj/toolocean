import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface UuidGeneratorToolProps {
  onOutputChange?: (output: string) => void;
}

export const UuidGeneratorTool = ({ onOutputChange }: UuidGeneratorToolProps) => {
  const [version, setVersion] = useState("4");
  const [count, setCount] = useState("1");
  const [format, setFormat] = useState("default");
  const [uuids, setUuids] = useState<string[]>([]);
  const { toast } = useToast();

  const generateUUID = () => {
    const generateV4 = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const generateV1 = () => {
      // Simplified UUID v1 implementation
      const timestamp = Date.now();
      const timestampHex = timestamp.toString(16).padStart(12, '0');
      const node = Array.from({length: 6}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
      const clockSeq = Math.floor(Math.random() * 16384).toString(16).padStart(4, '0');
      
      return `${timestampHex.slice(-8)}-${timestampHex.slice(-12, -8)}-1${timestampHex.slice(-15, -12)}-${clockSeq.slice(0, 1)}${clockSeq.slice(1, 4)}-${node}`;
    };

    const formatUUID = (uuid: string) => {
      switch (format) {
        case "uppercase":
          return uuid.toUpperCase();
        case "nohyphens":
          return uuid.replace(/-/g, '');
        case "braces":
          return `{${uuid}}`;
        case "csharp":
          return `new Guid("${uuid}")`;
        case "quotes":
          return `"${uuid}"`;
        default:
          return uuid;
      }
    };

    try {
      const numberOfUuids = parseInt(count);
      if (numberOfUuids < 1 || numberOfUuids > 1000) {
        toast({
          title: "Error",
          description: "Please enter a number between 1 and 1000",
          variant: "destructive",
        });
        return;
      }

      const generatedUuids: string[] = [];
      for (let i = 0; i < numberOfUuids; i++) {
        const uuid = version === "1" ? generateV1() : generateV4();
        generatedUuids.push(formatUUID(uuid));
      }

      setUuids(generatedUuids);
      onOutputChange?.(generatedUuids.join('\n'));
      
      toast({
        title: "Success",
        description: `Generated ${numberOfUuids} UUID${numberOfUuids > 1 ? 's' : ''}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate UUIDs",
        variant: "destructive",
      });
    }
  };

  const copyAll = () => {
    if (uuids.length > 0) {
      navigator.clipboard.writeText(uuids.join('\n'));
      toast({
        title: "Copied!",
        description: "All UUIDs copied to clipboard",
      });
    }
  };

  const copyOne = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    toast({
      title: "Copied!",
      description: "UUID copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>UUID Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="version-select" className="block text-sm font-medium mb-2">
                UUID Version
              </label>
              <Select value={version} onValueChange={setVersion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Version 1 (Timestamp)</SelectItem>
                  <SelectItem value="4">Version 4 (Random)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="count-input" className="block text-sm font-medium mb-2">
                Count
              </label>
              <Input
                id="count-input"
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                min="1"
                max="1000"
              />
            </div>

            <div>
              <label htmlFor="format-select" className="block text-sm font-medium mb-2">
                Format
              </label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="uppercase">Uppercase</SelectItem>
                  <SelectItem value="nohyphens">No Hyphens</SelectItem>
                  <SelectItem value="braces">With Braces</SelectItem>
                  <SelectItem value="csharp">C# Guid</SelectItem>
                  <SelectItem value="quotes">With Quotes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generateUUID} className="w-full">
            Generate UUID{parseInt(count) > 1 ? 's' : ''}
          </Button>

          {uuids.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Generated UUIDs</h3>
                <Button onClick={copyAll} variant="outline" size="sm">
                  Copy All
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uuids.map((uuid, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                    <Input
                      value={uuid}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={() => copyOne(uuid)}
                      variant="outline"
                      size="sm"
                    >
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};