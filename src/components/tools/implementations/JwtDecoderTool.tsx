import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface JwtDecoderToolProps {
  onOutputChange?: (output: string) => void;
}

export const JwtDecoderTool = ({ onOutputChange }: JwtDecoderToolProps) => {
  const [input, setInput] = useState("");
  const [header, setHeader] = useState("");
  const [payload, setPayload] = useState("");
  const [signature, setSignature] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const { toast } = useToast();

  const base64UrlDecode = (str: string): string => {
    // Replace URL-safe characters
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if necessary
    while (str.length % 4) {
      str += '=';
    }
    
    try {
      return atob(str);
    } catch (error) {
      throw new Error('Invalid base64 encoding');
    }
  };

  const decodeJWT = () => {
    if (!input.trim()) {
      toast({
        title: "Error",
        description: "Please enter a JWT token",
        variant: "destructive",
      });
      return;
    }

    try {
      const parts = input.trim().split('.');
      
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format. JWT should have 3 parts separated by dots.');
      }

      // Decode header
      const decodedHeader = base64UrlDecode(parts[0]);
      const headerObj = JSON.parse(decodedHeader);
      setHeader(JSON.stringify(headerObj, null, 2));

      // Decode payload
      const decodedPayload = base64UrlDecode(parts[1]);
      const payloadObj = JSON.parse(decodedPayload);
      setPayload(JSON.stringify(payloadObj, null, 2));

      // Store signature (can't decode without secret)
      setSignature(parts[2]);

      // Validate expiration
      const now = Math.floor(Date.now() / 1000);
      const isExpired = payloadObj.exp && payloadObj.exp < now;
      const isNotYetValid = payloadObj.nbf && payloadObj.nbf > now;
      
      setIsValid(!isExpired && !isNotYetValid);

      const output = `HEADER:\n${JSON.stringify(headerObj, null, 2)}\n\nPAYLOAD:\n${JSON.stringify(payloadObj, null, 2)}\n\nSIGNATURE:\n${parts[2]}`;
      onOutputChange?.(output);

      toast({
        title: "Success",
        description: "JWT decoded successfully",
      });

      if (isExpired) {
        toast({
          title: "Warning",
          description: "This JWT token has expired",
          variant: "destructive",
        });
      }

      if (isNotYetValid) {
        toast({
          title: "Warning",
          description: "This JWT token is not yet valid",
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to decode JWT",
        variant: "destructive",
      });
      
      setHeader("");
      setPayload("");
      setSignature("");
      setIsValid(null);
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const parsePayloadForDisplay = (payloadStr: string) => {
    try {
      const payload = JSON.parse(payloadStr);
      const claims = [];

      if (payload.iss) claims.push({ label: "Issuer (iss)", value: payload.iss });
      if (payload.sub) claims.push({ label: "Subject (sub)", value: payload.sub });
      if (payload.aud) claims.push({ label: "Audience (aud)", value: Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud });
      if (payload.exp) claims.push({ label: "Expires (exp)", value: `${formatTimestamp(payload.exp)} (${payload.exp})` });
      if (payload.nbf) claims.push({ label: "Not Before (nbf)", value: `${formatTimestamp(payload.nbf)} (${payload.nbf})` });
      if (payload.iat) claims.push({ label: "Issued At (iat)", value: `${formatTimestamp(payload.iat)} (${payload.iat})` });
      if (payload.jti) claims.push({ label: "JWT ID (jti)", value: payload.jti });

      return claims;
    } catch {
      return [];
    }
  };

  const claims = payload ? parsePayloadForDisplay(payload) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>JWT Decoder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="jwt-input" className="block text-sm font-medium mb-2">
              JWT Token
            </label>
            <Textarea
              id="jwt-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
              className="h-32 font-mono text-xs"
            />
          </div>

          <Button onClick={decodeJWT} className="w-full">
            Decode JWT
          </Button>

          {isValid !== null && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Token Status:</span>
              <Badge variant={isValid ? "default" : "destructive"}>
                {isValid ? "Valid" : "Invalid/Expired"}
              </Badge>
            </div>
          )}

          {claims.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Standard Claims</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {claims.map((claim, index) => (
                    <div key={index} className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        {claim.label}
                      </span>
                      <span className="text-sm font-mono bg-muted p-2 rounded">
                        {claim.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {header && (
            <div>
              <label htmlFor="jwt-header" className="block text-sm font-medium mb-2">
                Header
              </label>
              <Textarea
                id="jwt-header"
                value={header}
                readOnly
                className="h-32 font-mono text-xs"
              />
            </div>
          )}

          {payload && (
            <div>
              <label htmlFor="jwt-payload" className="block text-sm font-medium mb-2">
                Payload
              </label>
              <Textarea
                id="jwt-payload"
                value={payload}
                readOnly
                className="h-40 font-mono text-xs"
              />
            </div>
          )}

          {signature && (
            <div>
              <label htmlFor="jwt-signature" className="block text-sm font-medium mb-2">
                Signature
              </label>
              <Textarea
                id="jwt-signature"
                value={signature}
                readOnly
                className="h-20 font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Note: Signature verification requires the secret key
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};