
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { ArrowLeft, Play, Plus, Trash2, Save, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Workflow, WorkflowStep } from "@/types/workflow";
import { toolRegistry } from "@/lib/toolRegistry";
import { useHistory } from "@/hooks/useHistory";

const WorkflowBuilderPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToHistory } = useHistory();
  const [searchQuery, setSearchQuery] = useState("");
  const [workflowName, setWorkflowName] = useState("");
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState<Workflow[]>(() => {
    const saved = localStorage.getItem("toolOcean.workflows");
    return saved ? JSON.parse(saved) : [];
  });

  const availableTools = [
    // Text Processing
    { slug: "case-converter", name: "Case Converter", category: "text" },
    { slug: "word-counter", name: "Word Counter", category: "text" },
    { slug: "text-diff", name: "Text Diff Viewer", category: "text" },
    { slug: "duplicate-remover", name: "Duplicate Lines Remover", category: "text" },
    { slug: "line-break-remover", name: "Line Break Remover", category: "text" },
    { slug: "text-replacer", name: "Text Replacer", category: "text" },
    { slug: "slug-converter", name: "Text to Slug Converter", category: "text" },
    
    // Code Formatting
    { slug: "json-formatter", name: "JSON Formatter", category: "formatting" },
    { slug: "json-stringify", name: "JSON.stringify", category: "formatting" },
    { slug: "json-parse", name: "JSON.parse", category: "formatting" },
    { slug: "html-formatter", name: "HTML Formatter", category: "formatting" },
    { slug: "sql-formatter", name: "SQL Formatter", category: "formatting" },
    
    // Development
    { slug: "regex-tester", name: "Regex Tester", category: "development" },
    
    // Security
    { slug: "encryption-tool", name: "Encryption/Decryption", category: "security" },
    { slug: "hash-generator", name: "Hash Generator", category: "security" },
    { slug: "password-generator", name: "Password Generator", category: "security" },
    { slug: "uuid-generator", name: "UUID Generator", category: "security" },
    { slug: "env-formatter", name: ".env File Formatter", category: "security" },
    { slug: "jwt-decoder", name: "JWT Decoder", category: "security" },
    
    // Data & Format Converters
    { slug: "csv-json-converter", name: "CSV ⇄ JSON Converter", category: "data-converters" },
    { slug: "yaml-json-converter", name: "YAML ⇄ JSON Converter", category: "data-converters" },
    { slug: "xml-json-converter", name: "XML ⇄ JSON Converter", category: "data-converters" },
    { slug: "json-schema-validator", name: "JSON Schema Validator", category: "data-converters" },
    { slug: "json-merger", name: "JSON Merger", category: "data-converters" },
    { slug: "json-flattener", name: "JSON Flattener/Unflattener", category: "data-converters" },
    
    // Frontend & Styling
    { slug: "css-minifier", name: "CSS Minifier/Beautifier", category: "frontend" },
    { slug: "html-jsx-converter", name: "HTML to JSX Converter", category: "frontend" },
    { slug: "color-converter", name: "Color Picker/Converter", category: "frontend" },
    { slug: "gradient-generator", name: "Gradient Generator", category: "frontend" },
    { slug: "box-shadow-generator", name: "Box Shadow Generator", category: "frontend" },
    
    // Testing & API Tools
    { slug: "fake-data-generator", name: "Fake Data Generator", category: "testing" },
    { slug: "http-request-composer", name: "HTTP Request Composer", category: "testing" },
    { slug: "user-agent-generator", name: "User-Agent Generator", category: "testing" },
    { slug: "timestamp-converter", name: "Epoch/Timestamp Converter", category: "testing" },
    { slug: "ip-address-tool", name: "IP Address Tool", category: "testing" },
    
    // DevOps & Infrastructure
    { slug: "gitignore-generator", name: ".gitignore Generator", category: "devops" },
    { slug: "dockerfile-formatter", name: "Dockerfile Formatter/Linter", category: "devops" },
    { slug: "yaml-formatter", name: "YAML Formatter", category: "devops" },
    { slug: "nginx-config-generator", name: "NGINX Config Generator", category: "devops" },
    { slug: "cron-expression-builder", name: "Cron Expression Builder", category: "devops" },
    
    // AI-Powered Tools
    { slug: "regex-generator", name: "Regex Generator", category: "ai-tools" },
    { slug: "code-explainer", name: "Code Explainer", category: "ai-tools" },
    { slug: "prompt-optimizer", name: "GPT Prompt Optimizer", category: "ai-tools" },
    { slug: "markdown-summarizer", name: "AI Markdown Summarizer", category: "ai-tools" },
    { slug: "json-fixer", name: "Fix my JSON", category: "ai-tools" },
    
    // Basic Tools
    { slug: "base64-encode", name: "Base64 Encode", category: "basic" },
    { slug: "base64-decode", name: "Base64 Decode", category: "basic" },
    { slug: "text-uppercase", name: "Uppercase", category: "basic" },
    { slug: "text-lowercase", name: "Lowercase", category: "basic" },
  ];

  const addStep = (toolSlug: string) => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      toolSlug,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    const index = steps.findIndex(step => step.id === stepId);
    if (index === -1) return;
    
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newSteps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      setSteps(newSteps);
    }
  };

  const runWorkflow = async () => {
    if (!input.trim()) {
      toast({
        title: "Error",
        description: "Please provide input text",
        variant: "destructive",
      });
      return;
    }

    if (steps.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one step",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    const stepOutputs: string[] = [];
    let currentOutput = input;

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const tool = toolRegistry[step.toolSlug];
        
        if (!tool) {
          throw new Error(`Tool ${step.toolSlug} not found`);
        }

        currentOutput = await tool.run(currentOutput);
        stepOutputs.push(currentOutput);
      }

      setOutputs(stepOutputs);
      
      // Add to history
      addToHistory({
        toolId: 'workflow-builder',
        input,
        output: stepOutputs[stepOutputs.length - 1],
        timestamp: new Date(),
        metadata: {
          workflowName: workflowName || 'Untitled Workflow',
          steps: steps.map(step => availableTools.find(t => t.slug === step.toolSlug)?.name || step.toolSlug)
        }
      });

      toast({
        title: "Success",
        description: "Workflow executed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Workflow failed",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const saveWorkflow = () => {
    if (!workflowName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workflow name",
        variant: "destructive",
      });
      return;
    }

    const workflow: Workflow = {
      id: Date.now().toString(),
      name: workflowName,
      description: `Workflow with ${steps.length} steps`,
      steps,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedWorkflows = [...savedWorkflows, workflow];
    setSavedWorkflows(updatedWorkflows);
    localStorage.setItem("toolOcean.workflows", JSON.stringify(updatedWorkflows));

    toast({
      title: "Success",
      description: "Workflow saved successfully",
    });
  };

  const loadWorkflow = (workflow: Workflow) => {
    setWorkflowName(workflow.name);
    setSteps(workflow.steps);
    setOutputs([]);
    
    toast({
      title: "Success",
      description: `Loaded workflow: ${workflow.name}`,
    });
  };

  const exportWorkflow = () => {
    if (!workflowName.trim() || steps.length === 0) {
      toast({
        title: "Error",
        description: "Please create a workflow first",
        variant: "destructive",
      });
      return;
    }

    const workflow = {
      name: workflowName,
      steps: steps.map(step => ({
        toolSlug: step.toolSlug,
        toolName: availableTools.find(t => t.slug === step.toolSlug)?.name || step.toolSlug
      })),
      createdAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/[^a-zA-Z0-9]/g, '_')}_workflow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Workflow exported successfully",
    });
  };

  const groupedTools = availableTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof availableTools>);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onSearch={setSearchQuery} searchQuery={searchQuery} />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 hover:bg-muted/80"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tools
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Workflow Builder */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Workflow name"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={saveWorkflow} variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={exportWorkflow} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Input</label>
                  <Textarea
                    placeholder="Enter your input data..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="h-32"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Workflow Steps ({steps.length})</h3>
                    <Select onValueChange={addStep}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Add tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(groupedTools).map(([category, tools]) => (
                          <div key={category}>
                            <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                              {category.replace('-', ' ')}
                            </div>
                            {tools.map((tool) => (
                              <SelectItem key={tool.slug} value={tool.slug}>
                                {tool.name}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-2 p-3 bg-muted rounded">
                      <span className="text-sm font-medium">{index + 1}.</span>
                      <span className="flex-1">
                        {availableTools.find(t => t.slug === step.toolSlug)?.name || step.toolSlug}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => moveStep(step.id, 'up')}
                          variant="ghost"
                          size="sm"
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          onClick={() => moveStep(step.id, 'down')}
                          variant="ghost"
                          size="sm"
                          disabled={index === steps.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          onClick={() => removeStep(step.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={runWorkflow} 
                  disabled={isRunning}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isRunning ? "Running..." : "Run Workflow"}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {outputs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {outputs.map((output, index) => (
                    <div key={index} className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Step {index + 1} Output: {availableTools.find(t => t.slug === steps[index]?.toolSlug)?.name}
                      </label>
                      <Textarea
                        value={output}
                        readOnly
                        className="h-24 font-mono text-xs"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Saved Workflows & Tool Library */}
          <div className="space-y-6">
            {/* Saved Workflows */}
            {savedWorkflows.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Saved Workflows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {savedWorkflows.map((workflow) => (
                      <Button
                        key={workflow.id}
                        onClick={() => loadWorkflow(workflow)}
                        variant="outline"
                        className="w-full justify-start text-left"
                        size="sm"
                      >
                        <div>
                          <div className="font-medium">{workflow.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {workflow.steps.length} steps
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tool Library */}
            <Card>
              <CardHeader>
                <CardTitle>Tool Library ({availableTools.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(groupedTools).map(([category, tools]) => (
                    <div key={category}>
                      <h3 className="text-sm font-medium mb-2 capitalize">
                        {category.replace('-', ' ')} ({tools.length})
                      </h3>
                      <div className="space-y-1">
                        {tools.map((tool) => (
                          <Button
                            key={tool.slug}
                            onClick={() => addStep(tool.slug)}
                            variant="outline"
                            className="w-full justify-start text-xs"
                            size="sm"
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            {tool.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilderPage;
