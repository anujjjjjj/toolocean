import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ColorFormat = "hex" | "rgb" | "hsl" | "cmyk";

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

export function ColorConverterTool() {
  const [inputFormat, setInputFormat] = useState<ColorFormat>("hex");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { toast } = useToast();

  const hexToRgb = (hex: string): RGB | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  };

  const rgbToHsl = (r: number, g: number, b: number): HSL => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const hslToRgb = (h: number, s: number, l: number): RGB => {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  };

  const rgbToCmyk = (r: number, g: number, b: number): CMYK => {
    r /= 255;
    g /= 255;
    b /= 255;
    const k = 1 - Math.max(r, g, b);
    const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
    const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
    const y = k === 1 ? 0 : (1 - b - k) / (1 - k);

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100),
    };
  };

  const cmykToRgb = (c: number, m: number, y: number, k: number): RGB => {
    const r = 255 * (1 - c / 100) * (1 - k / 100);
    const g = 255 * (1 - m / 100) * (1 - k / 100);
    const b = 255 * (1 - y / 100) * (1 - k / 100);

    return {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b),
    };
  };

  const convert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      let rgb: RGB | null = null;

      // Parse input based on format
      if (inputFormat === "hex") {
        rgb = hexToRgb(input);
        if (!rgb) throw new Error("Invalid HEX color");
      } else if (inputFormat === "rgb") {
        const match = input.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) throw new Error("Invalid RGB format. Use: rgb(255, 0, 0)");
        rgb = { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
      } else if (inputFormat === "hsl") {
        const match = input.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) throw new Error("Invalid HSL format. Use: hsl(0, 100%, 50%)");
        rgb = hslToRgb(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
      } else if (inputFormat === "cmyk") {
        const match = input.match(/cmyk\((\d+)%,\s*(\d+)%,\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) throw new Error("Invalid CMYK format. Use: cmyk(0%, 100%, 100%, 0%)");
        rgb = cmykToRgb(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseInt(match[4]));
      }

      if (!rgb) throw new Error("Failed to parse color");

      // Generate all formats
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
      const cmykStr = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;

      setOutput(`HEX: ${hex}\nRGB: ${rgbStr}\nHSL: ${hslStr}\nCMYK: ${cmykStr}`);
    } catch (error) {
      toast({
        title: "Conversion Error",
        description: error instanceof Error ? error.message : "Failed to convert color",
        variant: "destructive",
      });
      setOutput("");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard", description: "Color values have been copied" });
    } catch {
      toast({ title: "Failed to copy", description: "Could not copy to clipboard", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Color Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Input Format</Label>
            <Select value={inputFormat} onValueChange={(v) => setInputFormat(v as ColorFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hex">HEX</SelectItem>
                <SelectItem value="rgb">RGB</SelectItem>
                <SelectItem value="hsl">HSL</SelectItem>
                <SelectItem value="cmyk">CMYK</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Color Input ({inputFormat === "hex" ? "#FF0000" : inputFormat === "rgb" ? "rgb(255, 0, 0)" : inputFormat === "hsl" ? "hsl(0, 100%, 50%)" : "cmyk(0%, 100%, 100%, 0%)"})
            </Label>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                inputFormat === "hex"
                  ? "#FF0000"
                  : inputFormat === "rgb"
                    ? "rgb(255, 0, 0)"
                    : inputFormat === "hsl"
                      ? "hsl(0, 100%, 50%)"
                      : "cmyk(0%, 100%, 100%, 0%)"
              }
            />
          </div>

          <Button onClick={convert} className="w-full" disabled={!input.trim()}>
            Convert Color
          </Button>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              All Color Formats
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(output)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              {output.split("\n").map((line, i) => (
                <div key={i} className="p-2 bg-muted/50 rounded">
                  {line}
                </div>
              ))}
            </div>
            {inputFormat === "hex" && (
              <div className="mt-4 w-full h-20 rounded border" style={{ backgroundColor: input }} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
