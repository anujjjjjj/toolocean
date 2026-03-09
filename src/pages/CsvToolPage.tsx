import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { csvComponentRegistry } from "@/lib/csvToolRegistry";

const csvToolsData = [
  { id: "csv-converter", name: "CSV ⇄ JSON Converter", description: "Convert between CSV and JSON with customizable delimiters", icon: "ArrowUpDown" },
  { id: "csv-validator", name: "CSV Validator", description: "Validate CSV format, headers, and row consistency", icon: "CheckCircle" },
  { id: "csv-merge", name: "CSV Merge", description: "Combine multiple CSV files into one", icon: "Merge" },
];

const CsvToolPage = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();

  const tool = csvToolsData.find((t) => t.id === toolId);

  useEffect(() => {
    if (!tool) {
      navigate("/csv-tools");
    }
  }, [tool, navigate]);

  if (!tool) {
    return null;
  }

  const renderToolComponent = () => {
    const ToolComponent = csvComponentRegistry[tool.id];

    if (ToolComponent) {
      return <ToolComponent />;
    }

    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Tool Coming Soon</h3>
        <p className="text-muted-foreground">{tool.name} is being implemented. Check back shortly!</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/csv-tools")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to CSV Tools
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-heading">{tool.name}</CardTitle>
            <CardDescription className="text-base">{tool.description}</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="pt-6">{renderToolComponent()}</CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CsvToolPage;
