import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function NumberBaseConverterTool() {
  const [decimal, setDecimal] = useState("");
  const [hex, setHex] = useState("");
  const [binary, setBinary] = useState("");
  const [octal, setOctal] = useState("");
  const { toast } = useToast();

  const updateAll = (value: number) => {
    if (isNaN(value)) { setDecimal(""); setHex(""); setBinary(""); setOctal(""); return; }
    setDecimal(String(value));
    setHex(value.toString(16).toUpperCase());
    setBinary(value.toString(2));
    setOctal(value.toString(8));
  };

  const fromDecimal = (v: string) => { setDecimal(v); updateAll(parseInt(v, 10)); };
  const fromHex = (v: string) => { setHex(v); updateAll(parseInt(v, 16)); };
  const fromBinary = (v: string) => { setBinary(v); updateAll(parseInt(v, 2)); };
  const fromOctal = (v: string) => { setOctal(v); updateAll(parseInt(v, 8)); };

  const copy = (val: string) => {
    navigator.clipboard.writeText(val);
    toast({ title: "Copied!" });
  };

  const field = (label: string, value: string, onChange: (v: string) => void, prefix: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <span className="flex items-center px-3 rounded-md border bg-muted text-sm font-mono text-muted-foreground min-w-[2.5rem]">
          {prefix}
        </span>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
          placeholder="0"
        />
        <Button variant="outline" size="sm" onClick={() => copy(value)} disabled={!value}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Number Base Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">Type a number in any field to convert between all bases.</p>
          {field("Decimal (Base 10)", decimal, fromDecimal, "dec")}
          {field("Hexadecimal (Base 16)", hex, fromHex, "0x")}
          {field("Binary (Base 2)", binary, fromBinary, "0b")}
          {field("Octal (Base 8)", octal, fromOctal, "0o")}
        </CardContent>
      </Card>
    </div>
  );
}
