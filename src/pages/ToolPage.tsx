
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ToolRunner } from "@/components/tools/ToolRunner";
import { Header } from "@/components/layout/Header";
import { componentRegistry } from "@/lib/toolRegistry";
import toolsData from "@/data/tools.json";

const ToolPage = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const tool = toolsData.tools.find(t => t.id === toolId);

  useEffect(() => {
    if (!tool) {
      navigate("/");
    }
  }, [tool, navigate]);

  if (!tool) {
    return null;
  }

  const renderToolComponent = () => {
    const ToolComponent = componentRegistry[tool.id];
    
    if (ToolComponent) {
      return <ToolComponent />;
    }

    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Tool Coming Soon</h3>
        <p className="text-muted-foreground">
          {tool.name} is not yet implemented. Check back later!
        </p>
      </div>
    );
  };

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

        {/* Tool Runner */}
        <ToolRunner tool={tool}>
          {renderToolComponent()}
        </ToolRunner>
      </div>
    </div>
  );
};

export default ToolPage;
