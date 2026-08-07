import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";

const WorkflowPage = () => {
  const navigate = useNavigate();

  useSEO({
    title: "Workflow Builder",
    description: "Chain multiple tools together to create powerful automated workflows.",
    path: "/workflows",
    noindex: true,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Tools
        </Button>

        {/* Workflow Builder - Coming Soon */}
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Workflow Builder</h1>
          <p className="text-muted-foreground mb-8">
            Create powerful tool chains and save custom workflows. Coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowPage;