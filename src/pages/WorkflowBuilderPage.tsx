import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { ArrowLeft, Play, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Workflow, WorkflowStep } from "@/types/workflow";
import { toolRegistry } from "@/lib/toolRegistry";

const WorkflowBuilderPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [workflowName, setWorkflowName] = useState("");
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const availableTools = [
    { slug: "json-formatter", name: "JSON Formatter" },
    { slug: "base64-encode", name: "Base64 Encode" },
    { slug: "base64-decode", name: "Base64 Decode" },
    { slug: "text-uppercase", name: "Uppercase" },
    { slug: "text-lowercase", name: "Lowercase" },
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Builder */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Workflow name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                />

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
                    <h3 className="text-sm font-medium">Workflow Steps</h3>
                    <Select onValueChange={addStep}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Add tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTools.map((tool) => (
                          <SelectItem key={tool.slug} value={tool.slug}>
                            {tool.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-2 p-3 bg-muted rounded">
                      <span className="text-sm font-medium">{index + 1}.</span>
                      <span className="flex-1">
                        {availableTools.find(t => t.slug === step.toolSlug)?.name}
                      </span>
                      <Button
                        onClick={() => removeStep(step.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                        Step {index + 1} Output
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

          {/* Tool Library */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Available Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableTools.map((tool) => (
                    <Button
                      key={tool.slug}
                      onClick={() => addStep(tool.slug)}
                      variant="outline"
                      className="w-full justify-start"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {tool.name}
                    </Button>
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