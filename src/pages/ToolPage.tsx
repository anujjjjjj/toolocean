import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ToolRunner } from "@/components/tools/ToolRunner";
import { Header } from "@/components/layout/Header";
import toolsData from "@/data/tools.json";

// Import tool components
import { JsonFormatterTool } from "@/components/tools/implementations/JsonFormatterTool";
import { CaseConverterTool } from "@/components/tools/implementations/CaseConverterTool";
import { CsvJsonConverterTool } from "@/components/tools/implementations/CsvJsonConverterTool";
import { YamlJsonConverterTool } from "@/components/tools/implementations/YamlJsonConverterTool";
import { XmlJsonConverterTool } from "@/components/tools/implementations/XmlJsonConverterTool";
import { JsonSchemaValidatorTool } from "@/components/tools/implementations/JsonSchemaValidatorTool";
import { JsonMergerTool } from "@/components/tools/implementations/JsonMergerTool";
import { JsonFlattenerTool } from "@/components/tools/implementations/JsonFlattenerTool";

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
    switch (tool.id) {
      case "json-formatter":
        return <JsonFormatterTool />;
      case "case-converter":
        return <CaseConverterTool />;
      case "csv-json-converter":
        return <CsvJsonConverterTool />;
      case "yaml-json-converter":
        return <YamlJsonConverterTool />;
      case "xml-json-converter":
        return <XmlJsonConverterTool />;
      case "json-schema-validator":
        return <JsonSchemaValidatorTool />;
      case "json-merger":
        return <JsonMergerTool />;
      case "json-flattener":
        return <JsonFlattenerTool />;
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Tool Coming Soon</h3>
            <p className="text-muted-foreground">
              {tool.name} is not yet implemented. Check back later!
            </p>
          </div>
        );
    }
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