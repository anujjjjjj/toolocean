import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import CryptoJS from "crypto-js";

interface HashGeneratorToolProps {
  onOutputChange?: (output: string) => void;
}

export const HashGeneratorTool = ({ onOutputChange }: HashGeneratorToolProps) => {
  const [input, setInput] = useState("");
  const [algorithm, setAlgorithm] = useState("MD5");
  const [output, setOutput] = useState("");
  const { toast } = useToast();

  const generateHash = () => {
    if (!input.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to hash",
        variant: "destructive",
      });
      return;
    }

    try {
      let hash = "";
      
      switch (algorithm) {
        case "MD5":
          hash = CryptoJS.MD5(input).toString();
          break;
        case "SHA1":
          hash = CryptoJS.SHA1(input).toString();
          break;
        case "SHA256":
          hash = CryptoJS.SHA256(input).toString();
          break;
        case "SHA512":
          hash = CryptoJS.SHA512(input).toString();
          break;
        case "SHA3":
          hash = CryptoJS.SHA3(input).toString();
          break;
        default:
          throw new Error("Unsupported algorithm");
      }

      setOutput(hash);
      onOutputChange?.(hash);
      
      toast({
        title: "Success",
        description: `${algorithm} hash generated successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate hash",
        variant: "destructive",
      });
    }
  };

  const algorithms = [
    { value: "MD5", label: "MD5" },
    { value: "SHA1", label: "SHA-1" },
    { value: "SHA256", label: "SHA-256" },
    { value: "SHA512", label: "SHA-512" },
    { value: "SHA3", label: "SHA-3" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hash Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="algorithm-select" className="block text-sm font-medium mb-2">
              Hash Algorithm
            </label>
            <Select value={algorithm} onValueChange={setAlgorithm}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {algorithms.map((algo) => (
                  <SelectItem key={algo.value} value={algo.value}>
                    {algo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="text-input" className="block text-sm font-medium mb-2">
              Text to Hash
            </label>
            <Textarea
              id="text-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to generate hash..."
              className="h-32"
            />
          </div>

          <Button onClick={generateHash} className="w-full">
            Generate Hash
          </Button>

          {output && (
            <div>
              <label htmlFor="hash-output" className="block text-sm font-medium mb-2">
                {algorithm} Hash
              </label>
              <Textarea
                id="hash-output"
                value={output}
                readOnly
                className="h-24 font-mono"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};