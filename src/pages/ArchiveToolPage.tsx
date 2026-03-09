import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { archiveComponentRegistry } from "@/lib/archiveToolRegistry";

const archiveToolsData = [
  { id: "zip-extractor", name: "ZIP Extractor", description: "Extract and download files from ZIP" },
  { id: "zip-creator", name: "ZIP Creator", description: "Create ZIP from multiple files" },
  { id: "zip-preview", name: "ZIP Preview", description: "List contents without extracting" },
];

const ArchiveToolPage = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();

  const tool = archiveToolsData.find((t) => t.id === toolId);

  useEffect(() => {
    if (!tool) navigate("/archive-tools");
  }, [tool, navigate]);

  if (!tool) return null;

  const ToolComponent = archiveComponentRegistry[tool.id];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/archive-tools")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Archive Tools
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-heading">{tool.name}</CardTitle>
            <CardDescription className="text-base">{tool.description}</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {ToolComponent ? (
              <ToolComponent name={tool.name} description={tool.description} />
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Tool Coming Soon</h3>
                <p className="text-muted-foreground">{tool.name} is being implemented.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArchiveToolPage;
