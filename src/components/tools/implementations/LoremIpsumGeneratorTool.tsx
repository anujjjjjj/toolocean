import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WORDS = [
  "lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do",
  "eiusmod","tempor","incididunt","ut","labore","et","dolore","magna","aliqua","enim",
  "ad","minim","veniam","quis","nostrud","exercitation","ullamco","laboris","nisi",
  "aliquip","ex","ea","commodo","consequat","duis","aute","irure","in","reprehenderit",
  "voluptate","velit","esse","cillum","fugiat","nulla","pariatur","excepteur","sint",
  "occaecat","cupidatat","non","proident","sunt","culpa","qui","officia","deserunt",
  "mollit","anim","id","est","laborum","praesent","varius","interdum","metus","erat",
  "blandit","condimentum","viverra","nam","libero","justo","laoreet","sit","aliquam",
  "faucibus","ornare","suspendisse","sed","nisi","lacus","sed","viverra","tellus","in",
  "hac","habitasse","platea","dictumst","vestibulum","rhoncus","est","pellentesque"
];

function rndWord() { return WORDS[Math.floor(Math.random() * WORDS.length)]; }

function rndSentence(minW = 6, maxW = 14) {
  const count = minW + Math.floor(Math.random() * (maxW - minW));
  const words = Array.from({ length: count }, rndWord);
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(" ") + ".";
}

function rndParagraph(minS = 4, maxS = 8) {
  const count = minS + Math.floor(Math.random() * (maxS - minS));
  return Array.from({ length: count }, rndSentence).join(" ");
}

export function LoremIpsumGeneratorTool() {
  const [type, setType] = useState<"words" | "sentences" | "paragraphs">("paragraphs");
  const [count, setCount] = useState("3");
  const [output, setOutput] = useState("");
  const { toast } = useToast();

  const generate = () => {
    const n = Math.max(1, parseInt(count) || 1);
    let result = "";
    if (type === "words") {
      result = Array.from({ length: n }, rndWord).join(" ");
      result = result.charAt(0).toUpperCase() + result.slice(1) + ".";
    } else if (type === "sentences") {
      result = Array.from({ length: n }, rndSentence).join(" ");
    } else {
      result = Array.from({ length: n }, rndParagraph).join("\n\n");
    }
    setOutput(result);
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Lorem Ipsum Generator</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="words">Words</SelectItem>
                  <SelectItem value="sentences">Sentences</SelectItem>
                  <SelectItem value="paragraphs">Paragraphs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-28 space-y-2">
              <Label>Count</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
            <Button onClick={generate}>Generate</Button>
          </div>

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Generated Text</span>
                <Button variant="outline" size="sm" onClick={copy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={output}
                readOnly
                className="min-h-[300px] bg-muted/50"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
