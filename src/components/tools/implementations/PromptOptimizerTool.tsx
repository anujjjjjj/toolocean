import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Lightbulb, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PromptOptimizerTool() {
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [promptType, setPromptType] = useState("general");
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  const [improvements, setImprovements] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const promptTypes = [
    { value: "general", label: "General Purpose" },
    { value: "creative", label: "Creative Writing" },
    { value: "technical", label: "Technical Explanation" },
    { value: "analysis", label: "Data Analysis" },
    { value: "coding", label: "Code Generation" },
    { value: "research", label: "Research & Summary" },
    { value: "marketing", label: "Marketing Copy" },
    { value: "education", label: "Educational Content" }
  ];

  const optimizePrompt = async () => {
    if (!originalPrompt.trim()) {
      toast({
        title: "No prompt provided",
        description: "Please enter a prompt to optimize",
        variant: "destructive",
      });
      return;
    }

    setIsOptimizing(true);
    
    // Simulate AI optimization (in a real app, this would call an AI API)
    setTimeout(() => {
      const { optimized, improvements } = generateOptimizedPrompt(originalPrompt, promptType);
      setOptimizedPrompt(optimized);
      setImprovements(improvements);
      setIsOptimizing(false);
    }, 2000);
  };

  const generateOptimizedPrompt = (prompt: string, type: string) => {
    // This is a mock optimization function
    // In a real application, this would use OpenAI GPT or similar AI service
    
    let optimized = prompt;
    const improvements: string[] = [];
    
    // Add context and role clarity
    if (!prompt.toLowerCase().includes("you are") && !prompt.toLowerCase().includes("act as")) {
      const rolePrefix = getRolePrefix(type);
      optimized = `${rolePrefix}\n\n${optimized}`;
      improvements.push("Added role definition for better context");
    }
    
    // Add specificity requirements
    if (!prompt.includes("specific") && !prompt.includes("detailed")) {
      optimized += "\n\nPlease provide specific, detailed examples in your response.";
      improvements.push("Added requirement for specific details");
    }
    
    // Add output format specification
    if (!prompt.includes("format") && !prompt.includes("structure")) {
      const formatInstructions = getFormatInstructions(type);
      optimized += `\n\n${formatInstructions}`;
      improvements.push("Added output format specifications");
    }
    
    // Add constraints and guidelines
    if (type === "creative" && !prompt.includes("creative")) {
      optimized += "\n\nFocus on creativity, originality, and engaging storytelling.";
      improvements.push("Added creativity emphasis for creative tasks");
    }
    
    if (type === "technical" && !prompt.includes("technical")) {
      optimized += "\n\nExplain technical concepts clearly with examples and avoid jargon when possible.";
      improvements.push("Added technical clarity requirements");
    }
    
    if (type === "coding" && !prompt.includes("code")) {
      optimized += "\n\nProvide clean, well-commented code with explanations of key concepts.";
      improvements.push("Added code quality requirements");
    }
    
    // Add error handling and edge cases
    if (!prompt.includes("consider") && !prompt.includes("account for")) {
      optimized += "\n\nConsider edge cases and potential limitations in your response.";
      improvements.push("Added consideration for edge cases");
    }
    
    // Add length guidance
    if (!prompt.includes("length") && !prompt.includes("words") && !prompt.includes("brief")) {
      const lengthGuidance = getLengthGuidance(type);
      optimized += `\n\n${lengthGuidance}`;
      improvements.push("Added length guidance");
    }
    
    return { optimized, improvements };
  };

  const getRolePrefix = (type: string) => {
    const rolePrefixes = {
      general: "You are an AI assistant helping users with various tasks.",
      creative: "You are a creative writing expert with extensive experience in storytelling and literary techniques.",
      technical: "You are a technical expert capable of explaining complex concepts in clear, accessible language.",
      analysis: "You are a data analyst with expertise in interpreting and explaining data insights.",
      coding: "You are an experienced software developer with expertise in multiple programming languages and best practices.",
      research: "You are a research specialist skilled at gathering, analyzing, and summarizing information from multiple sources.",
      marketing: "You are a marketing professional with expertise in creating compelling copy and understanding target audiences.",
      education: "You are an educational expert skilled at creating clear, engaging learning materials for various audiences."
    };
    
    return rolePrefixes[type as keyof typeof rolePrefixes] || rolePrefixes.general;
  };

  const getFormatInstructions = (type: string) => {
    const formatInstructions = {
      general: "Structure your response with clear headings and bullet points where appropriate.",
      creative: "Format your creative content with proper paragraphs and engaging structure.",
      technical: "Use numbered steps, code blocks, and clear section headers for technical explanations.",
      analysis: "Present findings with clear conclusions, supporting data, and actionable insights.",
      coding: "Provide code examples with comments and step-by-step explanations.",
      research: "Include citations, key findings, and a summary of main points.",
      marketing: "Use persuasive language with clear calls-to-action and benefit-focused messaging.",
      education: "Structure content with learning objectives, examples, and check-for-understanding elements."
    };
    
    return formatInstructions[type as keyof typeof formatInstructions] || formatInstructions.general;
  };

  const getLengthGuidance = (type: string) => {
    const lengthGuidance = {
      general: "Aim for a comprehensive response of 200-500 words.",
      creative: "Develop your creative piece with appropriate length for the format (story, poem, etc.).",
      technical: "Provide detailed explanations with examples, approximately 300-600 words.",
      analysis: "Present a thorough analysis in 400-800 words with supporting evidence.",
      coding: "Include well-commented code examples with explanations of 200-400 words.",
      research: "Provide a comprehensive summary of 500-1000 words covering key findings.",
      marketing: "Create concise, impactful copy appropriate for the marketing format (50-300 words).",
      education: "Develop educational content of 300-600 words with clear learning progression."
    };
    
    return lengthGuidance[type as keyof typeof lengthGuidance] || lengthGuidance.general;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(optimizedPrompt);
      toast({
        title: "Copied to clipboard",
        description: "Optimized prompt has been copied to your clipboard",
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
    const examples = {
      general: "Write about artificial intelligence",
      creative: "Write a story about a time traveler",
      technical: "Explain how machine learning works",
      analysis: "Analyze the impact of social media on society",
      coding: "Create a function to sort an array",
      research: "Research the benefits of renewable energy",
      marketing: "Write ad copy for a new smartphone",
      education: "Teach about photosynthesis"
    };
    
    setOriginalPrompt(examples[promptType as keyof typeof examples] || examples.general);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Original Prompt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={promptType} onValueChange={setPromptType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {promptTypes.map((type) => (
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
            placeholder="Enter your AI prompt here..."
            value={originalPrompt}
            onChange={(e) => setOriginalPrompt(e.target.value)}
            className="min-h-[300px]"
          />
          
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-2">
              {originalPrompt && (
                <>
                  <Badge variant="outline">{originalPrompt.length} characters</Badge>
                  <Badge variant="outline">{originalPrompt.split(' ').length} words</Badge>
                </>
              )}
            </div>
            
            <Button onClick={optimizePrompt} disabled={isOptimizing || !originalPrompt.trim()}>
              <Wand2 className="h-4 w-4 mr-2" />
              {isOptimizing ? "Optimizing..." : "Optimize Prompt"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Optimized Prompt
            {optimizedPrompt && (
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOptimizing && (
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-sm">Optimizing your prompt...</span>
            </div>
          )}
          
          <Textarea
            value={optimizedPrompt}
            readOnly
            placeholder="Optimized prompt will appear here..."
            className="min-h-[300px] bg-muted/50"
          />
          
          {improvements.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Improvements Made:</h4>
              <div className="space-y-1">
                {improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{improvement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {optimizedPrompt && (
            <div className="flex gap-2">
              <Badge variant="outline">{optimizedPrompt.length} characters</Badge>
              <Badge variant="outline">{optimizedPrompt.split(' ').length} words</Badge>
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Optimized
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}