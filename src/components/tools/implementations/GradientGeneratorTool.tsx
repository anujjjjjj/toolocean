import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface GradientGeneratorToolProps {
  onOutputChange?: (output: string) => void;
}

export const GradientGeneratorTool = ({ onOutputChange }: GradientGeneratorToolProps) => {
  const [color1, setColor1] = useState("#3b82f6");
  const [color2, setColor2] = useState("#8b5cf6");
  const [direction, setDirection] = useState("to right");
  const [angle, setAngle] = useState("45");
  const [type, setType] = useState("linear");
  const { toast } = useToast();

  const generateGradient = () => {
    if (type === "linear") {
      if (direction === "custom") {
        return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
      }
      return `linear-gradient(${direction}, ${color1}, ${color2})`;
    } else {
      return `radial-gradient(circle, ${color1}, ${color2})`;
    }
  };

  const gradientCSS = generateGradient();

  useEffect(() => {
    onOutputChange?.(gradientCSS);
  }, [color1, color2, direction, angle, type, gradientCSS, onOutputChange]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(gradientCSS);
    toast({
      title: "Copied!",
      description: "Gradient CSS copied to clipboard",
    });
  };

  const directions = [
    { value: "to right", label: "To Right" },
    { value: "to left", label: "To Left" },
    { value: "to bottom", label: "To Bottom" },
    { value: "to top", label: "To Top" },
    { value: "to bottom right", label: "To Bottom Right" },
    { value: "to bottom left", label: "To Bottom Left" },
    { value: "to top right", label: "To Top Right" },
    { value: "to top left", label: "To Top Left" },
    { value: "custom", label: "Custom Angle" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gradient Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="color1" className="block text-sm font-medium mb-2">
                Start Color
              </label>
              <div className="flex space-x-2">
                <Input
                  id="color1"
                  type="color"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="flex-1 font-mono"
                />
              </div>
            </div>

            <div>
              <label htmlFor="color2" className="block text-sm font-medium mb-2">
                End Color
              </label>
              <div className="flex space-x-2">
                <Input
                  id="color2"
                  type="color"
                  value={color2}
                  onChange={(e) => setColor2(e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={color2}
                  onChange={(e) => setColor2(e.target.value)}
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-2">
              Gradient Type
            </label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "linear" && (
            <div>
              <label htmlFor="direction" className="block text-sm font-medium mb-2">
                Direction
              </label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {directions.map((dir) => (
                    <SelectItem key={dir.value} value={dir.value}>
                      {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {direction === "custom" && type === "linear" && (
            <div>
              <label htmlFor="angle" className="block text-sm font-medium mb-2">
                Angle (degrees)
              </label>
              <Input
                id="angle"
                type="number"
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                min="0"
                max="360"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Preview
            </label>
            <div
              className="w-full h-32 rounded border-2 border-border"
              style={{ background: gradientCSS }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              CSS Code
            </label>
            <div className="p-3 bg-muted rounded font-mono text-sm">
              <code>background: {gradientCSS};</code>
            </div>
          </div>

          <Button onClick={copyToClipboard} className="w-full">
            Copy CSS
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};