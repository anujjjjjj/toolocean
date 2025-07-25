
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, FileText, Hash, Type, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/useHistory";

interface WordStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  paragraphs: number;
  sentences: number;
}

export function WordCounterTool() {
  const [input, setInput] = useState("");
  const [stats, setStats] = useState<WordStats>({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    lines: 0,
    paragraphs: 0,
    sentences: 0
  });
  const { toast } = useToast();
  const { addToHistory } = useHistory();

  const analyzeText = () => {
    if (!input.trim()) {
      setStats({
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        lines: 0,
        paragraphs: 0,
        sentences: 0
      });
      return;
    }

    const words = input.trim().split(/\s+/).filter(word => word.length > 0);
    const characters = input.length;
    const charactersNoSpaces = input.replace(/\s/g, '').length;
    const lines = input.split('\n').length;
    const paragraphs = input.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    const newStats = {
      words: words.length,
      characters,
      charactersNoSpaces,
      lines,
      paragraphs,
      sentences
    };

    setStats(newStats);
    addToHistory('analyze', 'word-counter', { input, stats: newStats });
  };

  const copyStats = () => {
    const statsText = `Words: ${stats.words}
Characters: ${stats.characters}
Characters (no spaces): ${stats.charactersNoSpaces}
Lines: ${stats.lines}
Paragraphs: ${stats.paragraphs}
Sentences: ${stats.sentences}`;
    
    navigator.clipboard.writeText(statsText);
    toast({ title: "Statistics copied to clipboard!" });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Text Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your text here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[300px]"
          />
          <Button onClick={analyzeText} className="w-full">
            Analyze Text
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Text Statistics
            <Button variant="outline" size="sm" onClick={copyStats}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Stats
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm text-muted-foreground">Words</div>
                <div className="text-2xl font-bold">{stats.words.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm text-muted-foreground">Characters</div>
                <div className="text-2xl font-bold">{stats.characters.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-sm text-muted-foreground">Characters (no spaces)</div>
                <div className="text-2xl font-bold">{stats.charactersNoSpaces.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-sm text-muted-foreground">Lines</div>
                <div className="text-2xl font-bold">{stats.lines.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-sm text-muted-foreground">Paragraphs</div>
                <div className="text-2xl font-bold">{stats.paragraphs.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-500" />
              <div>
                <div className="text-sm text-muted-foreground">Sentences</div>
                <div className="text-2xl font-bold">{stats.sentences.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
