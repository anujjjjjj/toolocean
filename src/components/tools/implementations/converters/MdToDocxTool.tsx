import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { marked } from "marked";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export function MdToDocxTool() {
  const [input, setInput] = useState("");
  const { toast } = useToast();

  const convertToDocx = async () => {
    if (!input.trim()) {
      toast({
        title: "Error",
        description: "Please enter some Markdown content",
        variant: "destructive",
      });
      return;
    }

    try {
      // Parse markdown to HTML
      const html = marked.parse(input) as string;

      // Convert HTML to DOCX paragraphs
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      const paragraphs: Paragraph[] = [];

      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (text) {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun(text)],
              })
            );
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName.toLowerCase();

          if (tagName === "h1") {
            paragraphs.push(
              new Paragraph({
                text: element.textContent || "",
                heading: HeadingLevel.HEADING_1,
              })
            );
          } else if (tagName === "h2") {
            paragraphs.push(
              new Paragraph({
                text: element.textContent || "",
                heading: HeadingLevel.HEADING_2,
              })
            );
          } else if (tagName === "h3") {
            paragraphs.push(
              new Paragraph({
                text: element.textContent || "",
                heading: HeadingLevel.HEADING_3,
              })
            );
          } else if (tagName === "p") {
            const text = element.textContent?.trim();
            if (text) {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun(text)],
                })
              );
            }
          } else if (tagName === "ul" || tagName === "ol") {
            element.querySelectorAll("li").forEach((li) => {
              paragraphs.push(
                new Paragraph({
                  text: `• ${li.textContent || ""}`,
                })
              );
            });
          } else {
            // Process children
            Array.from(element.childNodes).forEach(processNode);
          }
        }
      };

      Array.from(tempDiv.childNodes).forEach(processNode);

      if (paragraphs.length === 0) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun("Empty document")],
          })
        );
      }

      // Create DOCX document
      const doc = new Document({
        sections: [
          {
            children: paragraphs,
          },
        ],
      });

      // Generate blob and download
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "document.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "DOCX file downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Conversion Error",
        description: error instanceof Error ? error.message : "Failed to convert Markdown to DOCX",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Markdown to DOCX Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Convert your Markdown content to a DOCX file. Supports headings, paragraphs, lists, and basic formatting.
          </p>
          <Button onClick={convertToDocx} className="w-full" disabled={!input.trim()}>
            <Download className="h-4 w-4 mr-2" />
            Convert & Download DOCX
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Markdown Input</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="# Heading 1&#10;&#10;This is a paragraph with **bold** and *italic* text.&#10;&#10;## Heading 2&#10;&#10;- List item 1&#10;- List item 2&#10;&#10;Another paragraph here."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[600px] font-mono text-sm"
          />
          {input && <div className="mt-4 text-sm text-muted-foreground">Characters: {input.length.toLocaleString()}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
