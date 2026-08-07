import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Param { key: string; value: string }

export function UrlParserTool() {
  const [rawUrl, setRawUrl] = useState("https://example.com/path?foo=bar&baz=qux#section");
  const [parsed, setParsed] = useState<URL | null>(null);
  const [error, setError] = useState("");
  const [params, setParams] = useState<Param[]>([]);
  const [protocol, setProtocol] = useState("https:");
  const [host, setHost] = useState("example.com");
  const [pathname, setPathname] = useState("/path");
  const [hash, setHash] = useState("#section");
  const { toast } = useToast();

  const parse = () => {
    try {
      const url = new URL(rawUrl);
      setParsed(url);
      setError("");
      setProtocol(url.protocol);
      setHost(url.host);
      setPathname(url.pathname);
      setHash(url.hash);
      const p: Param[] = [];
      url.searchParams.forEach((v, k) => p.push({ key: k, value: v }));
      setParams(p);
    } catch {
      setError("Invalid URL");
      setParsed(null);
    }
  };

  const buildUrl = () => {
    try {
      const url = new URL(`${protocol}//${host}${pathname}${hash}`);
      params.forEach(({ key, value }) => { if (key) url.searchParams.append(key, value); });
      setRawUrl(url.toString());
      setParsed(url);
      setError("");
    } catch {
      setError("Could not build URL");
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  const addParam = () => setParams((p) => [...p, { key: "", value: "" }]);
  const removeParam = (i: number) => setParams((p) => p.filter((_, j) => j !== i));
  const updateParam = (i: number, field: "key" | "value", val: string) =>
    setParams((p) => p.map((item, j) => j === i ? { ...item, [field]: val } : item));

  const FIELDS: { label: string; key: keyof URL; show: boolean }[] = [
    { label: "Protocol", key: "protocol", show: !!parsed },
    { label: "Host", key: "host", show: !!parsed },
    { label: "Hostname", key: "hostname", show: !!parsed },
    { label: "Port", key: "port", show: !!parsed },
    { label: "Pathname", key: "pathname", show: !!parsed },
    { label: "Search", key: "search", show: !!parsed },
    { label: "Hash", key: "hash", show: !!parsed },
    { label: "Origin", key: "origin", show: !!parsed },
    { label: "href", key: "href", show: !!parsed },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>URL Parser / Builder</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>URL</Label>
            <div className="flex gap-2">
              <Input value={rawUrl} onChange={(e) => setRawUrl(e.target.value)} className="font-mono text-sm" placeholder="https://..." />
              <Button onClick={parse}>Parse</Button>
              <Button variant="outline" onClick={() => copy(rawUrl)}><Copy className="h-4 w-4" /></Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {parsed && (
            <div className="rounded-md border divide-y">
              {FIELDS.map(({ label, key }) => {
                const val = String(parsed[key] || "");
                if (!val) return null;
                return (
                  <div key={key} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
                    <code className="text-sm font-mono flex-1 break-all">{val}</code>
                    <Button variant="ghost" size="sm" className="h-6 px-2 ml-2" onClick={() => copy(val)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {parsed && parsed.searchParams.size > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Query Parameters</p>
              <div className="rounded-md border divide-y">
                {Array.from(parsed.searchParams.entries()).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-3 px-3 py-2">
                    <code className="text-sm font-mono text-primary w-1/3">{k}</code>
                    <code className="text-sm font-mono flex-1">{v}</code>
                    <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copy(v)}><Copy className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4 space-y-4">
            <p className="text-sm font-medium">Build URL</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Protocol", val: protocol, setter: setProtocol },
                { label: "Host", val: host, setter: setHost },
                { label: "Path", val: pathname, setter: setPathname },
                { label: "Hash", val: hash, setter: setHash },
              ].map(({ label, val, setter }) => (
                <div key={label} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Input value={val} onChange={(e) => setter(e.target.value)} className="font-mono text-sm h-8" />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Query Params</p>
                <Button variant="outline" size="sm" onClick={addParam}><Plus className="h-3 w-3 mr-1" />Add</Button>
              </div>
              {params.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="key" value={p.key} onChange={(e) => updateParam(i, "key", e.target.value)} className="font-mono text-sm h-8 flex-1" />
                  <Input placeholder="value" value={p.value} onChange={(e) => updateParam(i, "value", e.target.value)} className="font-mono text-sm h-8 flex-1" />
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => removeParam(i)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
            <Button onClick={buildUrl} className="w-full">Build URL</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
