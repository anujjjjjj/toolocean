import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PERMS = [
  { label: "Owner Read",    bit: 0o400, row: "owner",  col: "r" },
  { label: "Owner Write",   bit: 0o200, row: "owner",  col: "w" },
  { label: "Owner Execute", bit: 0o100, row: "owner",  col: "x" },
  { label: "Group Read",    bit: 0o040, row: "group",  col: "r" },
  { label: "Group Write",   bit: 0o020, row: "group",  col: "w" },
  { label: "Group Execute", bit: 0o010, row: "group",  col: "x" },
  { label: "Other Read",    bit: 0o004, row: "other",  col: "r" },
  { label: "Other Write",   bit: 0o002, row: "other",  col: "w" },
  { label: "Other Execute", bit: 0o001, row: "other",  col: "x" },
];

function toSymbolic(value: number): string {
  const map = (r: number, w: number, x: number) =>
    ((value & r) ? "r" : "-") + ((value & w) ? "w" : "-") + ((value & x) ? "x" : "-");
  return map(0o400, 0o200, 0o100) + map(0o040, 0o020, 0o010) + map(0o004, 0o002, 0o001);
}

export function ChmodCalculatorTool() {
  const [value, setValue] = useState(0o644);
  const [octalInput, setOctalInput] = useState("644");
  const { toast } = useToast();

  const toggle = (bit: number) => {
    const next = value ^ bit;
    setValue(next);
    setOctalInput(next.toString(8).padStart(3, "0"));
  };

  const handleOctalInput = (raw: string) => {
    setOctalInput(raw);
    const n = parseInt(raw, 8);
    if (!isNaN(n) && n >= 0 && n <= 0o777) setValue(n);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  const rows = ["owner", "group", "other"] as const;
  const cols = [
    { col: "r" as const, label: "Read" },
    { col: "w" as const, label: "Write" },
    { col: "x" as const, label: "Execute" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>chmod Permission Calculator</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left pb-2 pr-4 font-medium text-muted-foreground">Entity</th>
                  {cols.map((c) => (
                    <th key={c.col} className="text-center pb-2 px-4 font-medium text-muted-foreground">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row} className="border-t">
                    <td className="py-3 pr-4 font-medium capitalize">{row}</td>
                    {cols.map(({ col }) => {
                      const perm = PERMS.find((p) => p.row === row && p.col === col)!;
                      return (
                        <td key={col} className="py-3 px-4 text-center">
                          <Checkbox
                            checked={!!(value & perm.bit)}
                            onCheckedChange={() => toggle(perm.bit)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Octal</Label>
              <div className="flex gap-2">
                <Input
                  value={octalInput}
                  onChange={(e) => handleOctalInput(e.target.value)}
                  className="font-mono text-lg"
                  maxLength={3}
                  placeholder="644"
                />
                <Button variant="outline" size="sm" onClick={() => copy(octalInput)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Symbolic</Label>
              <div className="flex gap-2">
                <Input value={toSymbolic(value)} readOnly className="font-mono text-lg bg-muted/50" />
                <Button variant="outline" size="sm" onClick={() => copy(toSymbolic(value))}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
            <p className="font-medium">Common permissions</p>
            {[
              ["644", "Files: owner read/write, others read-only"],
              ["755", "Directories / executables: owner all, others read+execute"],
              ["600", "Private files: owner read/write only"],
              ["777", "Full access (avoid in production)"],
            ].map(([oct, desc]) => (
              <button
                key={oct}
                className="flex gap-3 w-full text-left hover:text-primary"
                onClick={() => { setValue(parseInt(oct, 8)); setOctalInput(oct); }}
              >
                <code className="font-mono text-primary">{oct}</code>
                <span className="text-muted-foreground">{desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
