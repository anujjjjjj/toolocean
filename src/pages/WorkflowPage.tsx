import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WorkflowPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header onSearch={setSearchQuery} searchQuery={searchQuery} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 hover:bg-muted/80"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tools
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