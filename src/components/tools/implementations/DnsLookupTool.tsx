import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

const DNS_TYPES: Record<number, string> = {
  1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 15: "MX",
  16: "TXT", 28: "AAAA", 33: "SRV", 257: "CAA",
};

const TYPE_OPTIONS = [
  "A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA", "SRV", "CAA",
];

export function DnsLookupTool() {
  const [domain, setDomain] = useState("");
  const [type, setType] = useState("A");
  const [results, setResults] = useState<DnsAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const lookup = async () => {
    const d = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!d) { setError("Enter a domain name"); return; }
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(d)}&type=${type}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.Status !== 0) {
        const codes: Record<number, string> = { 1: "FORMERR", 2: "SERVFAIL", 3: "NXDOMAIN", 4: "NOTIMP", 5: "REFUSED" };
        setError(`DNS error: ${codes[data.Status] || `Status ${data.Status}`}`);
      } else {
        setResults(data.Answer || []);
        if (!data.Answer?.length) setError("No records found");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    }
    setLoading(false);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>DNS Lookup</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Uses Google DNS-over-HTTPS — queries are sent to Google's servers.
          </p>

          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label>Domain</Label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className="font-mono"
                onKeyDown={(e) => e.key === "Enter" && lookup()}
              />
            </div>
            <div className="w-28 space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={lookup} disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup"}
            </Button>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="text-left p-2 font-medium">TTL</th>
                    <th className="text-left p-2 font-medium">Data</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-t border-border hover:bg-muted/30">
                      <td className="p-2 font-mono text-xs">{r.name}</td>
                      <td className="p-2 font-mono text-xs">{DNS_TYPES[r.type] || r.type}</td>
                      <td className="p-2 font-mono text-xs">{r.TTL}s</td>
                      <td className="p-2 font-mono text-xs break-all">{r.data}</td>
                      <td className="p-2">
                        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copy(r.data)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
