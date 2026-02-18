import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { audioComponentRegistry } from "@/lib/audioToolRegistry";

const audioToolsData = [
  { id: "audio-cutter", name: "Audio Cutter", description: "Trim audio by selecting start and end time", icon: "Scissors" },
  { id: "audio-merge", name: "Audio Merger", description: "Combine multiple audio files into one", icon: "Merge" },
];

const AudioToolPage = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const tool = audioToolsData.find((t) => t.id === toolId);

  useEffect(() => {
    if (!tool) {
      navigate("/audio-tools");
    }
  }, [tool, navigate]);

  if (!tool) {
    return null;
  }

  const renderToolComponent = () => {
    const ToolComponent = audioComponentRegistry[tool.id];

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
      <Header onSearch={setSearchQuery} searchQuery={searchQuery} />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/audio-tools")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Audio Tools
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

export default AudioToolPage;
