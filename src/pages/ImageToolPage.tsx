import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { imageComponentRegistry } from "@/lib/imageToolRegistry";

const imageToolsData = [
  { id: "image-resizer", name: "Image Resizer", description: "Resize images with width, height, or aspect ratio" },
  { id: "image-compressor", name: "Image Compressor", description: "Reduce file size with quality slider" },
  { id: "image-format-converter", name: "Format Converter", description: "Convert between PNG, JPEG, and WebP" },
  { id: "image-crop", name: "Image Crop", description: "Crop and export selected region" },
  { id: "color-picker", name: "Color Picker from Image", description: "Click on image to get pixel color" },
  { id: "favicon-generator", name: "Favicon Generator", description: "Generate favicon sizes from image" },
  { id: "image-to-base64", name: "Image to Base64", description: "Convert image to data URL or raw Base64" },
];

const ImageToolPage = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const tool = imageToolsData.find((t) => t.id === toolId);

  useEffect(() => {
    if (!tool) navigate("/image-tools");
  }, [tool, navigate]);

  if (!tool) return null;

  const ToolComponent = imageComponentRegistry[tool.id];

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={setSearchQuery} searchQuery={searchQuery} />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/image-tools")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Image Tools
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

export default ImageToolPage;
