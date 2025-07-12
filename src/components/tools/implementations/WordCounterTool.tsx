import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export function WordCounterTool() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmedText = text.trim();
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const words = trimmedText ? trimmedText.split(/\s+/).length : 0;
    const paragraphs = trimmedText ? trimmedText.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
    const lines = text ? text.split('\n').length : 0;
    const sentences = trimmedText ? (trimmedText.match(/[.!?]+/g) || []).length : 0;
    
    // Average reading speed: 200-250 words per minute
    const readingTime = Math.ceil(words / 225);

    return {
      characters,
      charactersNoSpaces,
      words,
      paragraphs,
      lines,
      sentences,
      readingTime
    };
  }, [text]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Text Input</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter or paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Stats Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Text Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Characters:</span>
                <Badge variant="secondary">{stats.characters.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Characters (no spaces):</span>
                <Badge variant="secondary">{stats.charactersNoSpaces.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Words:</span>
                <Badge variant="secondary">{stats.words.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sentences:</span>
                <Badge variant="secondary">{stats.sentences.toLocaleString()}</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Paragraphs:</span>
                <Badge variant="secondary">{stats.paragraphs.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lines:</span>
                <Badge variant="secondary">{stats.lines.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reading time:</span>
                <Badge variant="secondary">
                  {stats.readingTime} {stats.readingTime === 1 ? 'minute' : 'minutes'}
                </Badge>
              </div>
            </div>
          </div>
          
          {text && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Quick Summary</h3>
              <p className="text-sm text-muted-foreground">
                Your text contains <strong>{stats.words}</strong> words and <strong>{stats.characters}</strong> characters.
                It would take approximately <strong>{stats.readingTime} {stats.readingTime === 1 ? 'minute' : 'minutes'}</strong> to read.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}