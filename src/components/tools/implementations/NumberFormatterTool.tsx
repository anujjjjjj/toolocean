import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LOCALES = [
  { value: "en-US", label: "en-US (1,234,567.89)" },
  { value: "de-DE", label: "de-DE (1.234.567,89)" },
  { value: "fr-FR", label: "fr-FR (1 234 567,89)" },
  { value: "ja-JP", label: "ja-JP" },
  { value: "zh-CN", label: "zh-CN" },
  { value: "ar-SA", label: "ar-SA (Arabic-Indic)" },
  { value: "hi-IN", label: "hi-IN (Devanagari)" },
];

const STYLES = [
  { value: "decimal", label: "Decimal" },
  { value: "currency", label: "Currency" },
  { value: "percent", label: "Percent" },
  { value: "unit", label: "Unit" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "INR", "CNY", "AED", "BRL", "CAD"];
const UNITS = ["byte", "kilobyte", "megabyte", "gigabyte", "kilometer", "meter", "centimeter", "kilogram", "gram", "liter", "milliliter"];

export function NumberFormatterTool() {
  const [input, setInput] = useState("1234567.89");
  const [locale, setLocale] = useState("en-US");
  const [style, setStyle] = useState("decimal");
  const [currency, setCurrency] = useState("USD");
  const [unit, setUnit] = useState("byte");
  const [decimals, setDecimals] = useState("2");
  const [batchInput, setBatchInput] = useState("");
  const [batchOutput, setBatchOutput] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getOptions = (): Intl.NumberFormatOptions => {
    const opts: Intl.NumberFormatOptions = { style: style as Intl.NumberFormatOptions["style"] };
    const d = parseInt(decimals);
    if (!isNaN(d)) { opts.minimumFractionDigits = d; opts.maximumFractionDigits = d; }
    if (style === "currency") opts.currency = currency;
    if (style === "unit") { opts.unit = unit; opts.unitDisplay = "short"; }
    return opts;
  };

  const format = (n: string): string => {
    const num = parseFloat(n.replace(/,/g, ""));
    if (isNaN(num)) return ", ";
    try {
      return new Intl.NumberFormat(locale, getOptions()).format(num);
    } catch {
      return "Error";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setBatchInput(ev.target?.result as string); setBatchOutput(""); };
    reader.readAsText(file);
    e.target.value = "";
  };

  const formatBatch = () => {
    if (!batchInput.trim()) { setBatchOutput(""); return; }
    const lines = batchInput.split("\n");
    setBatchOutput(lines.map((l) => {
      const trimmed = l.trim();
      if (!trimmed) return "";
      return `${trimmed} → ${format(trimmed)}`;
    }).join("\n"));
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  const formatted = format(input);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Number Formatter</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Locale</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {style === "currency" && (
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {style === "unit" && (
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Decimal places</Label>
              <Input
                type="number"
                value={decimals}
                onChange={(e) => setDecimals(e.target.value)}
                min={0} max={20}
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Number</Label>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="font-mono text-lg"
                placeholder="1234567.89"
              />
            </div>
          </div>

          <div className="rounded-md bg-muted/50 p-4 flex items-center justify-between">
            <span className="font-mono text-xl">{formatted}</span>
            <Button variant="outline" size="sm" onClick={() => copy(formatted)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Batch Format (one number per line)</p>
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept=".txt,.csv" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload file
              </Button>
            </div>
            <Textarea
              placeholder="1000&#10;2500000&#10;0.005"
              value={batchInput}
              onChange={(e) => { setBatchInput(e.target.value); setBatchOutput(""); }}
              className="min-h-[100px] font-mono text-sm"
            />
            <Button onClick={formatBatch} variant="outline" className="w-full">Format All</Button>
            {batchOutput && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Output</span>
                  <Button variant="outline" size="sm" onClick={() => copy(batchOutput)}>
                    <Copy className="h-4 w-4 mr-2" />Copy
                  </Button>
                </div>
                <Textarea value={batchOutput} readOnly className="min-h-[100px] font-mono text-sm bg-muted/50" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
