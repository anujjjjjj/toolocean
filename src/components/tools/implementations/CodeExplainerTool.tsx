import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, MessageCircle, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CodeExplainerTool() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [explanation, setExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const { toast } = useToast();

  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "csharp", label: "C#" },
    { value: "cpp", label: "C++" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "php", label: "PHP" },
    { value: "ruby", label: "Ruby" },
    { value: "swift", label: "Swift" },
    { value: "kotlin", label: "Kotlin" },
    { value: "sql", label: "SQL" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "bash", label: "Bash" },
    { value: "other", label: "Other" }
  ];

  const explainCode = async () => {
    if (!code.trim()) {
      toast({
        title: "No code provided",
        description: "Please enter some code to explain",
        variant: "destructive",
      });
      return;
    }

    setIsExplaining(true);
    
    // Simulate AI explanation (in a real app, this would call an AI API)
    setTimeout(() => {
      const mockExplanation = generateMockExplanation(code, language);
      setExplanation(mockExplanation);
      setIsExplaining(false);
    }, 2000);
  };

  const generateMockExplanation = (code: string, lang: string) => {
    // This is a mock explanation generator
    // In a real application, this would use OpenAI GPT or similar AI service
    
    let explanation = `## Code Explanation (${languages.find(l => l.value === lang)?.label})\n\n`;
    
    if (code.includes("function") || code.includes("def") || code.includes("func")) {
      explanation += "This code defines a function that:\n";
      explanation += "- Takes parameters as input\n";
      explanation += "- Performs specific operations\n";
      explanation += "- Returns a result\n\n";
    }
    
    if (code.includes("for") || code.includes("while")) {
      explanation += "The code contains a loop structure that:\n";
      explanation += "- Iterates over a collection or range\n";
      explanation += "- Performs repeated operations\n";
      explanation += "- May have conditional logic inside\n\n";
    }
    
    if (code.includes("if") || code.includes("else")) {
      explanation += "There are conditional statements that:\n";
      explanation += "- Check specific conditions\n";
      explanation += "- Execute different code paths based on the conditions\n";
      explanation += "- Handle various scenarios\n\n";
    }
    
    if (code.includes("class") || code.includes("interface")) {
      explanation += "This defines a class or interface that:\n";
      explanation += "- Encapsulates data and behavior\n";
      explanation += "- Provides a blueprint for objects\n";
      explanation += "- Implements object-oriented principles\n\n";
    }
    
    if (code.includes("async") || code.includes("await") || code.includes("Promise")) {
      explanation += "The code uses asynchronous programming:\n";
      explanation += "- Handles operations that take time to complete\n";
      explanation += "- Uses promises or async/await syntax\n";
      explanation += "- Prevents blocking the main thread\n\n";
    }
    
    explanation += "### Key Components:\n\n";
    
    // Analyze common patterns
    if (code.includes("console.log") || code.includes("print")) {
      explanation += "- **Logging/Output**: Displays information to the console\n";
    }
    
    if (code.includes("return")) {
      explanation += "- **Return Statement**: Sends a value back from the function\n";
    }
    
    if (code.includes("try") || code.includes("catch") || code.includes("except")) {
      explanation += "- **Error Handling**: Manages potential errors gracefully\n";
    }
    
    if (code.includes("import") || code.includes("require") || code.includes("#include")) {
      explanation += "- **Dependencies**: Imports external libraries or modules\n";
    }
    
    explanation += "\n### Purpose:\n";
    explanation += "This code appears to be designed for processing data, implementing business logic, or providing functionality within a larger application.\n\n";
    
    explanation += "### Best Practices Observed:\n";
    explanation += "- Structured programming approach\n";
    explanation += "- Clear variable and function naming\n";
    explanation += "- Appropriate use of control structures\n\n";
    
    explanation += "*Note: This is an AI-generated explanation. For complex code, consider consulting documentation or senior developers.*";
    
    return explanation;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(explanation);
      toast({
        title: "Copied to clipboard",
        description: "Explanation has been copied to your clipboard",
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
      javascript: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(result);`,
      python: `def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quick_sort(left) + middle + quick_sort(right)`,
      java: `public class BinarySearch {
    public static int search(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        
        while (left <= right) {
            int mid = left + (right - left) / 2;
            
            if (arr[mid] == target) {
                return mid;
            } else if (arr[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return -1;
    }
}`
    };
    
    setCode(examples[language as keyof typeof examples] || examples.javascript);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Code Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={loadExample}>
              Load Example
            </Button>
          </div>
          
          <Textarea
            placeholder="Paste your code here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
          />
          
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-2">
              {code && (
                <>
                  <Badge variant="outline">{code.length} characters</Badge>
                  <Badge variant="outline">{code.split('\n').length} lines</Badge>
                </>
              )}
            </div>
            
            <Button onClick={explainCode} disabled={isExplaining || !code.trim()}>
              <MessageCircle className="h-4 w-4 mr-2" />
              {isExplaining ? "Explaining..." : "Explain Code"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            AI Explanation
            {explanation && (
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isExplaining && (
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-sm">Analyzing your code...</span>
            </div>
          )}
          
          <Textarea
            value={explanation}
            readOnly
            placeholder="Code explanation will appear here after analysis..."
            className="min-h-[400px] text-sm bg-muted/50"
          />
          
          {explanation && (
            <div className="text-xs text-muted-foreground p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
              <strong>Disclaimer:</strong> This is an AI-generated explanation for educational purposes. 
              Always verify complex logic and consult documentation for production code.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}