export interface WorkflowStep {
  id: string;
  toolSlug: string;
  config?: Record<string, any>;
  output?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tool {
  slug: string;
  name: string;
  run: (input: string, config?: Record<string, any>) => Promise<string>;
  component: React.ComponentType<any>;
}