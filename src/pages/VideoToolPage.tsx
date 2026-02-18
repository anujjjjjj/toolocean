import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { videoComponentRegistry } from "@/lib/videoToolRegistry";

const videoToolsData = [
  { id: "video-trimmer", name: "Video Trimmer", description: "Trim video by selecting start and end time" },
  { id: "video-to-gif", name: "Video to GIF", description: "Convert video to animated GIF" },
  { id: "video-thumbnail", name: "Thumbnail Extractor", description: "Capture a frame as image at any timestamp" },
  { id: "video-metadata", name: "Metadata Viewer", description: "View duration, dimensions, codec info" },
];

const VideoToolPage = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const tool = videoToolsData.find((t) => t.id === toolId);

  useEffect(() => {
    if (!tool) navigate("/video-tools");
  }, [tool, navigate]);

  if (!tool) return null;

  const ToolComponent = videoComponentRegistry[tool.id];

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={setSearchQuery} searchQuery={searchQuery} />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/video-tools")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Video Tools
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

export default VideoToolPage;
