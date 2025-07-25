
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useHistory } from "@/hooks/useHistory";

export function WordCounterTool() {
  const [input, setInput] = useState("");
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    paragraphs: 0,
    sentences: 0,
    readingTime: 0
  });
  const { addToHistory } = useHistory();

  useEffect(() => {
    const calculateStats = () => {
      const text = input.trim();
      
      if (!text) {
        setStats({
          words: 0,
          characters: 0,
          charactersNoSpaces: 0,
          paragraphs: 0,
          sentences: 0,
          readingTime: 0
        });
        return;
      }

      const words = text.split(/\s+/).filter(word => word.length > 0);
      const characters = input.length;
      const charactersNoSpaces = input.replace(/\s/g, '').length;
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
      const readingTime = Math.ceil(words.length / 200); // Average reading speed

      const newStats = {
        words: words.length,
        characters,
        charactersNoSpaces,
        paragraphs,
        sentences,
        readingTime
      };

      setStats(newStats);

      // Add to history
      if (text) {
        addToHistory({
          toolId: 'word-counter',
          input: text,
          output: `${newStats.words} words, ${newStats.characters} characters`,
          timestamp: new Date(),
          metadata: { stats: newStats }
        });
      }
    };

    const timeoutId = setTimeout(calculateStats, 300);
    return () => clearTimeout(timeoutId);
  }, [input, addToHistory]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Text Input</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter your text here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded">
              <div className="text-2xl font-bold text-primary">{stats.words}</div>
              <div className="text-sm text-muted-foreground">Words</div>
            </div>
            <div className="text-center p-4 bg-muted rounded">
              <div className="text-2xl font-bold text-primary">{stats.characters}</div>
              <div className="text-sm text-muted-foreground">Characters</div>
            </div>
            <div className="text-center p-4 bg-muted rounded">
              <div className="text-2xl font-bold text-primary">{stats.charactersNoSpaces}</div>
              <div className="text-sm text-muted-foreground">Characters (no spaces)</div>
            </div>
            <div className="text-center p-4 bg-muted rounded">
              <div className="text-2xl font-bold text-primary">{stats.paragraphs}</div>
              <div className="text-sm text-muted-foreground">Paragraphs</div>
            </div>
            <div className="text-center p-4 bg-muted rounded">
              <div className="text-2xl font-bold text-primary">{stats.sentences}</div>
              <div className="text-sm text-muted-foreground">Sentences</div>
            </div>
            <div className="text-center p-4 bg-muted rounded">
              <div className="text-2xl font-bold text-primary">{stats.readingTime}</div>
              <div className="text-sm text-muted-foreground">Min read</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline">Average words per sentence: {stats.sentences > 0 ? Math.round(stats.words / stats.sentences) : 0}</Badge>
            <Badge variant="outline">Average characters per word: {stats.words > 0 ? Math.round(stats.charactersNoSpaces / stats.words) : 0}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
