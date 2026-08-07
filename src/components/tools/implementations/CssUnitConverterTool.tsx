import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE_FONT_SIZE = 16; // px
const DPI = 96;

interface UnitDef {
  label: string;
  toPx: (v: number, baseFontPx: number) => number;
  fromPx: (v: number, baseFontPx: number) => number;
}

const UNITS: Record<string, UnitDef> = {
  px:   { label: "px",  toPx: (v) => v, fromPx: (v) => v },
  rem:  { label: "rem", toPx: (v, b) => v * b, fromPx: (v, b) => v / b },
  em:   { label: "em",  toPx: (v, b) => v * b, fromPx: (v, b) => v / b },
  pt:   { label: "pt",  toPx: (v) => v * (DPI / 72), fromPx: (v) => v / (DPI / 72) },
  pc:   { label: "pc",  toPx: (v) => v * (DPI / 6),  fromPx: (v) => v / (DPI / 6) },
  cm:   { label: "cm",  toPx: (v) => v * (DPI / 2.54), fromPx: (v) => v / (DPI / 2.54) },
  mm:   { label: "mm",  toPx: (v) => v * (DPI / 25.4), fromPx: (v) => v / (DPI / 25.4) },
  inch: { label: "in",  toPx: (v) => v * DPI, fromPx: (v) => v / DPI },
  vw:   { label: "vw",  toPx: (v) => (v / 100) * window.innerWidth, fromPx: (v) => (v / window.innerWidth) * 100 },
  vh:   { label: "vh",  toPx: (v) => (v / 100) * window.innerHeight, fromPx: (v) => (v / window.innerHeight) * 100 },
};

const UNIT_KEYS = Object.keys(UNITS);

export function CssUnitConverterTool() {
  const [baseFontPx, setBaseFontPx] = useState(BASE_FONT_SIZE.toString());
  const [values, setValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const base = parseFloat(baseFontPx) || BASE_FONT_SIZE;

  const handleChange = (unit: string, raw: string) => {
    setValues((prev) => ({ ...prev, [unit]: raw }));
    const num = parseFloat(raw);
    if (isNaN(num)) return;
    const px = UNITS[unit].toPx(num, base);
    const next: Record<string, string> = { [unit]: raw };
    for (const u of UNIT_KEYS) {
      if (u === unit) continue;
      const converted = UNITS[u].fromPx(px, base);
      next[u] = parseFloat(converted.toFixed(6)).toString();
    }
    setValues(next);
  };

  const copy = (unit: string) => {
    const val = values[unit];
    if (val === undefined) return;
    navigator.clipboard.writeText(`${val}${UNITS[unit].label}`);
    toast({ title: "Copied!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>CSS Unit Converter</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="w-40 space-y-2">
              <Label>Base font size (px)</Label>
              <Input
                type="number"
                value={baseFontPx}
                onChange={(e) => {
                  setBaseFontPx(e.target.value);
                  setValues({});
                }}
                min={1}
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground pb-2">Used for rem/em conversions. vw/vh use current window size.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {UNIT_KEYS.map((unit) => (
              <div key={unit} className="space-y-1">
                <Label>{UNITS[unit].label}</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={values[unit] ?? ""}
                    onChange={(e) => handleChange(unit, e.target.value)}
                    className="font-mono"
                  />
                  <Button variant="outline" size="sm" onClick={() => copy(unit)} disabled={!values[unit]}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
