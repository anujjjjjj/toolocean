import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sl = s / 100, ll = l / 100;
  const c = (1 - Math.abs(2 * ll - 1)) * sl;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ll - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function generatePalette(hex: string): { name: string; hex: string }[] {
  const [h, s, l] = hexToHsl(hex);
  return [
    { name: "Complementary", hex: hslToHex((h + 180) % 360, s, l) },
    { name: "Analogous 1",   hex: hslToHex((h + 30) % 360, s, l) },
    { name: "Analogous 2",   hex: hslToHex((h - 30 + 360) % 360, s, l) },
    { name: "Triadic 1",     hex: hslToHex((h + 120) % 360, s, l) },
    { name: "Triadic 2",     hex: hslToHex((h + 240) % 360, s, l) },
    { name: "Tint",          hex: hslToHex(h, s, Math.min(95, l + 20)) },
    { name: "Shade",         hex: hslToHex(h, s, Math.max(5, l - 20)) },
    { name: "Desaturated",   hex: hslToHex(h, Math.max(0, s - 40), l) },
  ];
}

export function ColorPaletteGeneratorTool() {
  const [color, setColor] = useState("#3b82f6");
  const { toast } = useToast();

  const [h, s, l] = hexToHsl(color);
  const palette = generatePalette(color);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  const ColorSwatch = ({ hex, label }: { hex: string; label: string }) => (
    <div className="space-y-2">
      <div
        className="w-full h-16 rounded-md border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        style={{ backgroundColor: hex }}
        title={hex}
        onClick={() => copy(hex)}
      />
      <div className="text-xs space-y-0.5">
        <p className="font-medium">{label}</p>
        <div className="flex items-center gap-1">
          <code className="text-muted-foreground flex-1 truncate">{hex}</code>
          <Button variant="ghost" size="sm" className="h-5 px-1" onClick={() => copy(hex)}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <code className="text-muted-foreground text-[10px]">{hexToRgb(hex)}</code>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Color Palette Generator</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Base Color</Label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-16 rounded-md border cursor-pointer"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Hex</Label>
              <Input
                value={color}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v);
                }}
                className="font-mono uppercase"
                maxLength={7}
              />
            </div>
            <div className="text-sm text-muted-foreground pb-2">
              HSL: {h}° {s}% {l}%
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Base Color</p>
            </div>
            <ColorSwatch hex={color} label="Selected" />
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Generated Palette</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {palette.map((item) => (
                <ColorSwatch key={item.name} hex={item.hex} label={item.name} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
