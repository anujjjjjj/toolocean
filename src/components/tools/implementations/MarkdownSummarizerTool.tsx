import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function MarkdownSummarizerTool() {
  const [markdown, setMarkdown] = useState("");
  const [summaryLength, setSummaryLength] = useState("medium");
  const [summaryType, setSummaryType] = useState("bullet");
  const [summary, setSummary] = useState("");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { toast } = useToast();

  const summaryLengths = [
    { value: "short", label: "Short (2-3 sentences)" },
    { value: "medium", label: "Medium (1 paragraph)" },
    { value: "long", label: "Long (2-3 paragraphs)" }
  ];

  const summaryTypes = [
    { value: "bullet", label: "Bullet Points" },
    { value: "paragraph", label: "Paragraph Form" },
    { value: "structured", label: "Structured Summary" },
    { value: "executive", label: "Executive Summary" }
  ];

  const summarizeMarkdown = async () => {
    if (!markdown.trim()) {
      toast({
        title: "No content provided",
        description: "Please enter markdown content to summarize",
        variant: "destructive",
      });
      return;
    }

    setIsSummarizing(true);
    
    // Simulate AI summarization (in a real app, this would call an AI API)
    setTimeout(() => {
      const { summary, keyPoints } = generateSummary(markdown, summaryLength, summaryType);
      setSummary(summary);
      setKeyPoints(keyPoints);
      setIsSummarizing(false);
    }, 2000);
  };

  const generateSummary = (content: string, length: string, type: string) => {
    // This is a mock summarization function
    // In a real application, this would use OpenAI GPT or similar AI service
    
    // Extract headings and content
    const lines = content.split('\n');
    const headings = lines.filter(line => line.startsWith('#'));
    const contentBlocks = content.split(/#{1,6}.*\n/).filter(block => block.trim());
    
    // Generate key points
    const keyPoints = [
      "Document covers main concepts and implementation details",
      "Includes practical examples and code snippets",
      "Provides step-by-step instructions for implementation",
      "Discusses best practices and common pitfalls",
      "Contains references and additional resources"
    ];
    
    let summary = "";
    
    if (type === "bullet") {
      summary = generateBulletSummary(headings, length);
    } else if (type === "paragraph") {
      summary = generateParagraphSummary(content, length);
    } else if (type === "structured") {
      summary = generateStructuredSummary(headings, contentBlocks, length);
    } else if (type === "executive") {
      summary = generateExecutiveSummary(content, length);
    }
    
    return { summary, keyPoints };
  };

  const generateBulletSummary = (headings: string[], length: string) => {
    const points = [
      "• Main topic: Comprehensive guide covering key concepts and practical implementation",
      "• Methodology: Step-by-step approach with examples and best practices",
      "• Key insights: Important considerations for successful implementation",
      "• Practical applications: Real-world use cases and scenarios",
      "• Recommendations: Expert advice and suggested next steps"
    ];
    
    if (length === "short") {
      return points.slice(0, 3).join('\n');
    } else if (length === "medium") {
      return points.slice(0, 4).join('\n');
    } else {
      return points.join('\n') + '\n• Additional resources: Links to further reading and tools';
    }
  };

  const generateParagraphSummary = (content: string, length: string) => {
    let summary = "This document provides a comprehensive overview of the topic, covering essential concepts and practical implementation strategies. ";
    
    if (length === "medium" || length === "long") {
      summary += "The content is structured to guide readers through fundamental principles while offering detailed examples and real-world applications. ";
    }
    
    if (length === "long") {
      summary += "Key sections include theoretical foundations, step-by-step implementation guides, best practices, and troubleshooting common issues. ";
      summary += "The document also provides valuable insights into advanced techniques and recommendations for further exploration of the subject matter.";
    }
    
    return summary;
  };

  const generateStructuredSummary = (headings: string[], contentBlocks: string[], length: string) => {
    let summary = "## Document Summary\n\n";
    summary += "**Overview:** This document presents a comprehensive guide on the subject matter.\n\n";
    summary += "**Main Sections:**\n";
    summary += "- Introduction and background information\n";
    summary += "- Core concepts and theoretical foundations\n";
    summary += "- Practical implementation strategies\n";
    summary += "- Examples and use cases\n\n";
    
    if (length === "medium" || length === "long") {
      summary += "**Key Takeaways:**\n";
      summary += "- Systematic approach to understanding the topic\n";
      summary += "- Practical guidance for implementation\n";
      summary += "- Best practices and recommendations\n\n";
    }
    
    if (length === "long") {
      summary += "**Applications:** The document covers various real-world scenarios and provides actionable insights.\n\n";
      summary += "**Recommendations:** Follow the structured approach and refer to examples for best results.";
    }
    
    return summary;
  };

  const generateExecutiveSummary = (content: string, length: string) => {
    let summary = "## Executive Summary\n\n";
    summary += "**Purpose:** This document serves as a comprehensive resource for understanding and implementing key concepts in the subject area.\n\n";
    summary += "**Key Benefits:** Provides practical guidance, real-world examples, and actionable insights for successful implementation.\n\n";
    
    if (length === "medium" || length === "long") {
      summary += "**Strategic Importance:** Offers structured approach to mastering complex topics with emphasis on practical application.\n\n";
      summary += "**Recommended Actions:** Review core concepts, follow implementation guidelines, and apply best practices.\n\n";
    }
    
    if (length === "long") {
      summary += "**Impact:** This resource enables readers to quickly understand and effectively implement the covered concepts.\n\n";
      summary += "**Next Steps:** Continue with hands-on practice and refer to additional resources for advanced topics.";
    }
    
    return summary;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      toast({
        title: "Copied to clipboard",
        description: "Summary has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const loadExample = () => {
    const exampleMarkdown = `# Getting Started with React

React is a popular JavaScript library for building user interfaces, particularly web applications.

## What is React?

React is a declarative, efficient, and flexible JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called "components."

### Key Features

- **Component-Based**: Build encapsulated components that manage their own state
- **Virtual DOM**: React creates an in-memory virtual DOM to optimize rendering
- **Learn Once, Write Anywhere**: React doesn't make assumptions about your technology stack

## Installation

You can create a new React app using Create React App:

\`\`\`bash
npx create-react-app my-app
cd my-app
npm start
\`\`\`

## Basic Example

Here's a simple React component:

\`\`\`jsx
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}
\`\`\`

## Best Practices

1. Use functional components with hooks
2. Keep components small and focused
3. Use proper naming conventions
4. Implement proper error boundaries

## Conclusion

React provides a powerful foundation for building modern web applications with reusable components and efficient rendering.`;
    
    setMarkdown(exampleMarkdown);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Markdown Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={summaryLength} onValueChange={setSummaryLength}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {summaryLengths.map((length) => (
                  <SelectItem key={length.value} value={length.value}>
                    {length.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={summaryType} onValueChange={setSummaryType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {summaryTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={loadExample}>
              Load Example
            </Button>
          </div>
          
          <Textarea
            placeholder="Paste your markdown content here..."
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
          
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-2">
              {markdown && (
                <>
                  <Badge variant="outline">{markdown.length} characters</Badge>
                  <Badge variant="outline">{markdown.split('\n').length} lines</Badge>
                  <Badge variant="outline">{markdown.split(' ').length} words</Badge>
                </>
              )}
            </div>
            
            <Button onClick={summarizeMarkdown} disabled={isSummarizing || !markdown.trim()}>
              <Sparkles className="h-4 w-4 mr-2" />
              {isSummarizing ? "Summarizing..." : "Generate Summary"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            AI Summary
            {summary && (
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSummarizing && (
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-sm">Analyzing and summarizing content...</span>
            </div>
          )}
          
          <Textarea
            value={summary}
            readOnly
            placeholder="AI-generated summary will appear here..."
            className="min-h-[300px] bg-muted/50"
          />
          
          {keyPoints.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Key Points Extracted:</h4>
              <div className="space-y-1">
                {keyPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {summary && (
            <div className="flex gap-2">
              <Badge variant="outline">{summary.length} characters</Badge>
              <Badge variant="outline">{summary.split(' ').length} words</Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                AI Generated
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}