import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface BoxShadowGeneratorToolProps {
  onOutputChange?: (output: string) => void;
}

export const BoxShadowGeneratorTool = ({ onOutputChange }: BoxShadowGeneratorToolProps) => {
  const [offsetX, setOffsetX] = useState([0]);
  const [offsetY, setOffsetY] = useState([4]);
  const [blurRadius, setBlurRadius] = useState([8]);
  const [spreadRadius, setSpreadRadius] = useState([0]);
  const [color, setColor] = useState("#000000");
  const [opacity, setOpacity] = useState([25]);
  const [inset, setInset] = useState(false);
  const { toast } = useToast();

  const generateBoxShadow = () => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const rgb = hexToRgb(color);
    const alpha = opacity[0] / 100;
    const colorWithOpacity = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    
    const shadow = `${inset ? 'inset ' : ''}${offsetX[0]}px ${offsetY[0]}px ${blurRadius[0]}px ${spreadRadius[0]}px ${colorWithOpacity}`;
    return shadow;
  };

  const boxShadowCSS = generateBoxShadow();

  useEffect(() => {
    onOutputChange?.(boxShadowCSS);
  }, [offsetX, offsetY, blurRadius, spreadRadius, color, opacity, inset, boxShadowCSS, onOutputChange]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`box-shadow: ${boxShadowCSS};`);
    toast({
      title: "Copied!",
      description: "Box shadow CSS copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Box Shadow Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Horizontal Offset: {offsetX[0]}px
                </label>
                <Slider
                  value={offsetX}
                  onValueChange={setOffsetX}
                  min={-50}
                  max={50}
                  step={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Vertical Offset: {offsetY[0]}px
                </label>
                <Slider
                  value={offsetY}
                  onValueChange={setOffsetY}
                  min={-50}
                  max={50}
                  step={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Blur Radius: {blurRadius[0]}px
                </label>
                <Slider
                  value={blurRadius}
                  onValueChange={setBlurRadius}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Spread Radius: {spreadRadius[0]}px
                </label>
                <Slider
                  value={spreadRadius}
                  onValueChange={setSpreadRadius}
                  min={-50}
                  max={50}
                  step={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Opacity: {opacity[0]}%
                </label>
                <Slider
                  value={opacity}
                  onValueChange={setOpacity}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              <div>
                <label htmlFor="shadow-color" className="block text-sm font-medium mb-2">
                  Shadow Color
                </label>
                <div className="flex space-x-2">
                  <Input
                    id="shadow-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="inset"
                  checked={inset}
                  onCheckedChange={setInset}
                />
                <label htmlFor="inset" className="text-sm font-medium">
                  Inset Shadow
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preview
                </label>
                <div className="flex items-center justify-center h-64 bg-muted rounded">
                  <div
                    className="w-32 h-32 bg-background rounded"
                    style={{ boxShadow: boxShadowCSS }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  CSS Code
                </label>
                <div className="p-3 bg-muted rounded font-mono text-sm break-all">
                  <code>box-shadow: {boxShadowCSS};</code>
                </div>
              </div>

              <Button onClick={copyToClipboard} className="w-full">
                Copy CSS
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};