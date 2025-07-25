
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Trash2, ArrowDown, Save, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/useHistory";
import { toolRegistry } from "@/lib/toolRegistry";

interface WorkflowStep {
  id: string;
  toolId: string;
  toolName: string;
  input: string;
  output?: string;
  error?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdAt: Date;
}

// Available tools organized by category
const toolCategories = {
  "Data & Format Converters": [
    { id: "json-formatter", name: "JSON Formatter" },
    { id: "csv-json-converter", name: "CSV to JSON" },
    { id: "yaml-json-converter", name: "YAML to JSON" },
    { id: "xml-json-converter", name: "XML to JSON" },
    { id: "json-stringify", name: "JSON Stringify" },
    { id: "json-parse", name: "JSON Parse" },
    { id: "json-fixer", name: "JSON Fixer" },
    { id: "json-merger", name: "JSON Merger" },
    { id: "json-flattener", name: "JSON Flattener" },
    { id: "json-schema-validator", name: "JSON Schema Validator" }
  ],
  "Text Processing": [
    { id: "case-converter", name: "Case Converter" },
    { id: "word-counter", name: "Word Counter" },
    { id: "text-diff", name: "Text Diff" },
    { id: "duplicate-remover", name: "Duplicate Remover" },
    { id: "line-break-remover", name: "Line Break Remover" },
    { id: "text-replacer", name: "Text Replacer" },
    { id: "slug-converter", name: "Slug Converter" }
  ],
  "Code Formatters": [
    { id: "html-formatter", name: "HTML Formatter" },
    { id: "css-minifier", name: "CSS Formatter" },
    { id: "sql-formatter", name: "SQL Formatter" },
    { id: "yaml-formatter", name: "YAML Formatter" },
    { id: "dockerfile-formatter", name: "Dockerfile Formatter" }
  ],
  "Frontend & Styling": [
    { id: "html-jsx-converter", name: "HTML to JSX" },
    { id: "color-converter", name: "Color Converter" },
    { id: "gradient-generator", name: "Gradient Generator" },
    { id: "box-shadow-generator", name: "Box Shadow Generator" }
  ],
  "Security & Hash": [
    { id: "encryption-tool", name: "Encryption Tool" },
    { id: "hash-generator", name: "Hash Generator" },
    { id: "password-generator", name: "Password Generator" },
    { id: "uuid-generator", name: "UUID Generator" },
    { id: "jwt-decoder", name: "JWT Decoder" }
  ],
  "Testing & API": [
    { id: "regex-tester", name: "Regex Tester" },
    { id: "fake-data-generator", name: "Fake Data Generator" },
    { id: "http-request-composer", name: "HTTP Request Composer" },
    { id: "user-agent-generator", name: "User Agent Generator" },
    { id: "timestamp-converter", name: "Timestamp Converter" },
    { id: "ip-address-tool", name: "IP Address Tool" }
  ],
  "DevOps & Config": [
    { id: "env-formatter", name: "ENV Formatter" },
    { id: "gitignore-generator", name: "Gitignore Generator" },
    { id: "nginx-config-generator", name: "NGINX Config Generator" },
    { id: "cron-expression-builder", name: "Cron Expression Builder" }
  ],
  "AI & Advanced": [
    { id: "regex-generator", name: "Regex Generator" },
    { id: "code-explainer", name: "Code Explainer" },
    { id: "prompt-optimizer", name: "Prompt Optimizer" },
    { id: "markdown-summarizer", name: "Markdown Summarizer" }
  ]
};

const WorkflowBuilderPage = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();
  const { addToHistory } = useHistory();

  const createNewWorkflow = () => {
    if (!workflowName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workflow name",
        variant: "destructive",
      });
      return;
    }

    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: workflowName,
      description: workflowDescription,
      steps: [],
      createdAt: new Date()
    };

    setCurrentWorkflow(newWorkflow);
    setWorkflowName("");
    setWorkflowDescription("");
    toast({
      title: "Workflow created",
      description: `Created workflow "${newWorkflow.name}"`,
    });
  };

  const addStep = (toolId: string, toolName: string) => {
    if (!currentWorkflow) return;

    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      toolId,
      toolName,
      input: "",
      output: undefined,
      error: undefined
    };

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: [...currentWorkflow.steps, newStep]
    });
  };

  const updateStepInput = (stepId: string, input: string) => {
    if (!currentWorkflow) return;

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: currentWorkflow.steps.map(step =>
        step.id === stepId ? { ...step, input } : step
      )
    });
  };

  const removeStep = (stepId: string) => {
    if (!currentWorkflow) return;

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: currentWorkflow.steps.filter(step => step.id !== stepId)
    });
  };

  const executeWorkflow = async () => {
    if (!currentWorkflow || currentWorkflow.steps.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one step to the workflow",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    let previousOutput = "";

    const updatedSteps = [...currentWorkflow.steps];

    for (let i = 0; i < updatedSteps.length; i++) {
      const step = updatedSteps[i];
      const input = step.input || previousOutput;

      if (!input.trim()) {
        step.error = "No input provided";
        continue;
      }

      try {
        const tool = toolRegistry[step.toolId];
        if (!tool) {
          step.error = `Tool "${step.toolId}" not found`;
          continue;
        }

        const result = await tool.run(input);
        step.output = result;
        step.error = undefined;
        previousOutput = result;
      } catch (error) {
        step.error = error instanceof Error ? error.message : "Unknown error";
        step.output = undefined;
        break; // Stop execution on error
      }
    }

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: updatedSteps
    });

    setIsExecuting(false);
    addToHistory('execute', 'workflow-builder', { 
      workflowName: currentWorkflow.name, 
      stepCount: currentWorkflow.steps.length 
    });
    
    toast({
      title: "Workflow executed",
      description: "Check the results in each step",
    });
  };

  const saveWorkflow = () => {
    if (!currentWorkflow) return;

    const existingIndex = workflows.findIndex(w => w.id === currentWorkflow.id);
    if (existingIndex >= 0) {
      const updatedWorkflows = [...workflows];
      updatedWorkflows[existingIndex] = currentWorkflow;
      setWorkflows(updatedWorkflows);
    } else {
      setWorkflows([...workflows, currentWorkflow]);
    }

    toast({
      title: "Workflow saved",
      description: `Saved workflow "${currentWorkflow.name}"`,
    });
  };

  const exportWorkflow = () => {
    if (!currentWorkflow) return;

    const dataStr = JSON.stringify(currentWorkflow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `workflow-${currentWorkflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Workflow Builder</h1>
        {currentWorkflow && (
          <div className="flex gap-2">
            <Button onClick={saveWorkflow} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={exportWorkflow} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={executeWorkflow} disabled={isExecuting}>
              <Play className="h-4 w-4 mr-2" />
              {isExecuting ? "Executing..." : "Execute"}
            </Button>
          </div>
        )}
      </div>

      {!currentWorkflow ? (
        <Card>
          <CardHeader>
            <CardTitle>Create New Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                placeholder="Enter workflow name..."
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workflow-description">Description (optional)</Label>
              <Textarea
                id="workflow-description"
                placeholder="Enter workflow description..."
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
              />
            </div>
            
            <Button onClick={createNewWorkflow} className="w-full">
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Tool Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Available Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(toolCategories).map(([category, tools]) => (
                <div key={category} className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">{category}</h3>
                  <div className="space-y-1">
                    {tools.map(tool => (
                      <Button
                        key={tool.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => addStep(tool.id, tool.name)}
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        {tool.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Workflow Steps */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {currentWorkflow.name}
                  <Badge variant="outline">{currentWorkflow.steps.length} steps</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentWorkflow.description && (
                  <p className="text-muted-foreground mb-4">{currentWorkflow.description}</p>
                )}
                
                {currentWorkflow.steps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No steps added yet. Select tools from the left panel to add steps.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="relative">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{index + 1}</Badge>
                                {step.toolName}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStep(step.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <Label>Input</Label>
                              <Textarea
                                placeholder={index === 0 ? "Enter initial input..." : "Will use output from previous step"}
                                value={step.input}
                                onChange={(e) => updateStepInput(step.id, e.target.value)}
                                className="text-sm"
                                rows={3}
                              />
                            </div>
                            
                            {step.output && (
                              <div className="space-y-2">
                                <Label>Output</Label>
                                <Textarea
                                  value={step.output}
                                  readOnly
                                  className="text-sm bg-muted/50"
                                  rows={3}
                                />
                              </div>
                            )}
                            
                            {step.error && (
                              <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
                                Error: {step.error}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        {index < currentWorkflow.steps.length - 1 && (
                          <div className="flex justify-center py-2">
                            <ArrowDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilderPage;
