import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function base64url(data: string): string {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const fixed = pad ? padded + "=".repeat(4 - pad) : padded;
  return atob(fixed);
}

async function hmacSha256(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", keyMaterial, enc.encode(data));
  let binary = "";
  new Uint8Array(signature).forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeJwt(token: string): { header: object; payload: object } | null {
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3) return null;
    const header = JSON.parse(base64urlDecode(parts[0]));
    const payload = JSON.parse(base64urlDecode(parts[1]));
    return { header, payload };
  } catch {
    return null;
  }
}

const DEFAULT_PAYLOAD = `{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": ${Math.floor(Date.now() / 1000)},
  "exp": ${Math.floor(Date.now() / 1000) + 3600}
}`;

export function JwtGeneratorTool() {
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [showSecret, setShowSecret] = useState(false);
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [token, setToken] = useState("");
  const [decodeInput, setDecodeInput] = useState("");
  const [decoded, setDecoded] = useState<{ header: object; payload: object } | null>(null);
  const [decodeError, setDecodeError] = useState("");
  const [payloadError, setPayloadError] = useState("");
  const { toast } = useToast();

  const generate = async () => {
    try {
      const parsedPayload = JSON.parse(payload);
      setPayloadError("");
      const header = { alg: "HS256", typ: "JWT" };
      const headerB64 = base64url(JSON.stringify(header));
      const payloadB64 = base64url(JSON.stringify(parsedPayload));
      const sig = await hmacSha256(secret, `${headerB64}.${payloadB64}`);
      setToken(`${headerB64}.${payloadB64}.${sig}`);
    } catch {
      setPayloadError("Invalid JSON payload");
    }
  };

  const decode = () => {
    if (!decodeInput.trim()) { setDecoded(null); setDecodeError(""); return; }
    const result = decodeJwt(decodeInput);
    if (!result) { setDecodeError("Invalid JWT format"); setDecoded(null); return; }
    setDecoded(result);
    setDecodeError("");
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>JWT Generator / Decoder</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="generate">
            <TabsList className="mb-4">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="decode">Decode</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="space-y-2">
                <Label>Secret Key (HMAC HS256)</Label>
                <div className="flex gap-2">
                  <Input
                    type={showSecret ? "text" : "password"}
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    className="font-mono"
                  />
                  <Button variant="outline" size="sm" onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payload (JSON)</Label>
                <Textarea
                  value={payload}
                  onChange={(e) => { setPayload(e.target.value); setPayloadError(""); }}
                  className="min-h-[160px] font-mono text-sm"
                />
                {payloadError && <p className="text-xs text-destructive">{payloadError}</p>}
              </div>

              <Button onClick={generate} className="w-full">Generate JWT</Button>

              {token && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">JWT Token</span>
                    <Button variant="outline" size="sm" onClick={() => copy(token)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3 font-mono text-xs break-all">
                    {token.split(".").map((part, i) => (
                      <span key={i} className={["text-red-500 dark:text-red-400", "text-purple-500 dark:text-purple-400", "text-blue-500 dark:text-blue-400"][i]}>
                        {part}{i < 2 ? "." : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="decode" className="space-y-4">
              <div className="space-y-2">
                <Label>JWT Token</Label>
                <Textarea
                  placeholder="Paste a JWT token here..."
                  value={decodeInput}
                  onChange={(e) => { setDecodeInput(e.target.value); setDecoded(null); setDecodeError(""); }}
                  className="min-h-[80px] font-mono text-sm"
                />
                {decodeError && <p className="text-xs text-destructive">{decodeError}</p>}
              </div>

              <Button onClick={decode} className="w-full">Decode JWT</Button>

              {decoded && (
                <div className="space-y-3">
                  {(["header", "payload"] as const).map((section) => (
                    <div key={section} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{section}</span>
                        <Button variant="outline" size="sm" onClick={() => copy(JSON.stringify(decoded[section], null, 2))}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <Textarea
                        value={JSON.stringify(decoded[section], null, 2)}
                        readOnly
                        className="min-h-[80px] font-mono text-sm bg-muted/50"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Signature is not verified client-side. This tool only decodes the payload.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
