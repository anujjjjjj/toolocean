import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CidrInfo {
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  subnetMask: string;
  wildcardMask: string;
  totalHosts: number;
  usableHosts: number;
  prefix: number;
  ipClass: string;
}

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

function intToIp(n: number): string {
  return [24, 16, 8, 0].map((shift) => (n >>> shift) & 0xff).join(".");
}

function getClass(firstOctet: number): string {
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D (Multicast)";
  return "E (Reserved)";
}

function calculateCidr(cidr: string): CidrInfo | string {
  const match = cidr.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (!match) return "Invalid CIDR notation (e.g. 192.168.1.0/24)";

  const ip = match[1];
  const prefix = parseInt(match[2], 10);
  if (prefix < 0 || prefix > 32) return "Prefix must be 0–32";

  const octets = ip.split(".").map(Number);
  if (octets.some((o) => o < 0 || o > 255)) return "Invalid IP address";

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const ipInt = ipToInt(ip);
  const network = (ipInt & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;

  return {
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    firstHost: prefix >= 31 ? intToIp(network) : intToIp(network + 1),
    lastHost: prefix >= 31 ? intToIp(broadcast) : intToIp(broadcast - 1),
    subnetMask: intToIp(mask),
    wildcardMask: intToIp(~mask >>> 0),
    totalHosts: Math.pow(2, 32 - prefix),
    usableHosts: prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.max(0, Math.pow(2, 32 - prefix) - 2),
    prefix,
    ipClass: getClass(octets[0]),
  };
}

export function IpCidrCalculatorTool() {
  const [input, setInput] = useState("192.168.1.0/24");
  const [result, setResult] = useState<CidrInfo | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const calculate = () => {
    const res = calculateCidr(input);
    if (typeof res === "string") { setError(res); setResult(null); }
    else { setResult(res); setError(""); }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <code className="font-mono text-sm">{value}</code>
        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copy(value)}>
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>IP / CIDR Calculator</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>CIDR Notation</Label>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(""); setResult(null); }}
                placeholder="192.168.1.0/24"
                className="font-mono"
                onKeyDown={(e) => e.key === "Enter" && calculate()}
              />
              <Button onClick={calculate}>Calculate</Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {result && (
            <div className="rounded-md border">
              <Row label="Network Address" value={result.network} />
              <Row label="Broadcast Address" value={result.broadcast} />
              <Row label="First Usable Host" value={result.firstHost} />
              <Row label="Last Usable Host" value={result.lastHost} />
              <Row label="Subnet Mask" value={result.subnetMask} />
              <Row label="Wildcard Mask" value={result.wildcardMask} />
              <Row label="Total Hosts" value={result.totalHosts.toLocaleString()} />
              <Row label="Usable Hosts" value={result.usableHosts.toLocaleString()} />
              <Row label="CIDR Prefix" value={`/${result.prefix}`} />
              <Row label="IP Class" value={result.ipClass} />
            </div>
          )}

          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Common CIDR blocks</p>
            {[
              ["10.0.0.0/8", "Private Class A"],
              ["172.16.0.0/12", "Private Class B"],
              ["192.168.0.0/16", "Private Class C"],
              ["127.0.0.0/8", "Loopback"],
            ].map(([cidr, desc]) => (
              <button
                key={cidr}
                className="flex gap-3 w-full text-left hover:text-primary"
                onClick={() => { setInput(cidr); setError(""); setResult(null); }}
              >
                <code className="font-mono text-primary">{cidr}</code>
                <span>{desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
