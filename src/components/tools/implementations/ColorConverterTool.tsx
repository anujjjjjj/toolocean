import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ColorConverterToolProps {
  onOutputChange?: (output: string) => void;
}

export const ColorConverterTool = ({ onOutputChange }: ColorConverterToolProps) => {
  const [hex, setHex] = useState("#3b82f6");
  const [rgb, setRgb] = useState("59, 130, 246");
  const [hsl, setHsl] = useState("217, 91%, 60%");
  const { toast } = useToast();

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  const updateFromHex = (hexValue: string) => {
    const rgbColor = hexToRgb(hexValue);
    if (rgbColor) {
      setRgb(`${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}`);
      const hslColor = rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b);
      setHsl(`${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%`);
    }
  };

  const updateFromRgb = (rgbValue: string) => {
    const match = rgbValue.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      
      if (r <= 255 && g <= 255 && b <= 255) {
        setHex(rgbToHex(r, g, b));
        const hslColor = rgbToHsl(r, g, b);
        setHsl(`${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%`);
      }
    }
  };

  const updateFromHsl = (hslValue: string) => {
    const match = hslValue.match(/(\d+),\s*(\d+)%,\s*(\d+)%/);
    if (match) {
      const h = parseInt(match[1]);
      const s = parseInt(match[2]);
      const l = parseInt(match[3]);
      
      if (h <= 360 && s <= 100 && l <= 100) {
        const rgbColor = hslToRgb(h, s, l);
        setRgb(`${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}`);
        setHex(rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b));
      }
    }
  };

  useEffect(() => {
    const output = `HEX: ${hex}\nRGB: rgb(${rgb})\nHSL: hsl(${hsl})`;
    onOutputChange?.(output);
  }, [hex, rgb, hsl, onOutputChange]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Color Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div
              className="w-20 h-20 rounded border-2 border-border"
              style={{ backgroundColor: hex }}
            />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Color Preview</p>
              <p className="font-mono text-sm">{hex}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="hex-input" className="block text-sm font-medium mb-2">
                HEX Color
              </label>
              <Input
                id="hex-input"
                type="color"
                value={hex}
                onChange={(e) => {
                  setHex(e.target.value);
                  updateFromHex(e.target.value);
                }}
                className="h-12"
              />
              <Input
                value={hex}
                onChange={(e) => {
                  setHex(e.target.value);
                  updateFromHex(e.target.value);
                }}
                placeholder="#3b82f6"
                className="mt-2 font-mono"
              />
            </div>

            <div>
              <label htmlFor="rgb-input" className="block text-sm font-medium mb-2">
                RGB Color
              </label>
              <Input
                id="rgb-input"
                value={rgb}
                onChange={(e) => {
                  setRgb(e.target.value);
                  updateFromRgb(e.target.value);
                }}
                placeholder="59, 130, 246"
                className="font-mono"
              />
            </div>

            <div>
              <label htmlFor="hsl-input" className="block text-sm font-medium mb-2">
                HSL Color
              </label>
              <Input
                id="hsl-input"
                value={hsl}
                onChange={(e) => {
                  setHsl(e.target.value);
                  updateFromHsl(e.target.value);
                }}
                placeholder="217, 91%, 60%"
                className="font-mono"
              />
            </div>
          </div>

          <div className="p-4 bg-muted rounded">
            <h3 className="font-medium mb-2">Color Values:</h3>
            <div className="space-y-1 font-mono text-sm">
              <p>HEX: {hex}</p>
              <p>RGB: rgb({rgb})</p>
              <p>HSL: hsl({hsl})</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};