import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Copy, Download, Lock, Unlock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function EncryptionTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [key, setKey] = useState("");
  const [iv, setIv] = useState("");
  const [algorithm, setAlgorithm] = useState("aes");
  const [encoding, setEncoding] = useState("base64");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("encrypt");
  const { toast } = useToast();

  // Simple encryption/decryption functions (for demo purposes)
  const caesarCipher = (text: string, shift: number, decrypt: boolean = false): string => {
    const actualShift = decrypt ? -shift : shift;
    return text.replace(/[a-zA-Z]/g, (char) => {
      const start = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - start + actualShift + 26) % 26) + start);
    });
  };

  const base64Encode = (text: string): string => {
    return btoa(unescape(encodeURIComponent(text)));
  };

  const base64Decode = (text: string): string => {
    try {
      return decodeURIComponent(escape(atob(text)));
    } catch {
      throw new Error("Invalid base64 string");
    }
  };

  const hexEncode = (text: string): string => {
    return Array.from(text)
      .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  };

  const hexDecode = (hex: string): string => {
    if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
    return hex.match(/.{2}/g)!
      .map(byte => String.fromCharCode(parseInt(byte, 16)))
      .join('');
  };

  const encrypt = () => {
    if (!input.trim()) {
      setOutput("");
      setError("");
      return;
    }

    try {
      let result = input;
      
      switch (algorithm) {
        case "caesar":
          const shift = key ? parseInt(key) || 3 : 3;
          result = caesarCipher(input, shift);
          break;
        case "base64":
          result = base64Encode(input);
          break;
        case "hex":
          result = hexEncode(input);
          break;
        case "aes":
          // Check if IV is provided for AES
          if (!iv.trim()) {
            setError("IV (Initialization Vector) is required for AES encryption");
            setOutput("");
            return;
          }
          // Simulated AES encryption with IV
          result = base64Encode(input + "_aes_encrypted_key_" + key + "_iv_" + iv);
          break;
        case "des":
          // Simulated encryption
          result = base64Encode(input + "_encrypted_with_" + algorithm + "_key_" + key);
          break;
        default:
          result = input;
      }

      if (encoding === "hex" && algorithm !== "hex") {
        result = hexEncode(result);
      } else if (encoding === "base64" && algorithm !== "base64") {
        result = base64Encode(result);
      }

      setOutput(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Encryption failed");
      setOutput("");
    }
  };

  const decrypt = () => {
    if (!input.trim()) {
      setOutput("");
      setError("");
      return;
    }

    try {
      let result = input;

      // First decode if needed
      if (encoding === "hex" && algorithm !== "hex") {
        result = hexDecode(result);
      } else if (encoding === "base64" && algorithm !== "base64") {
        result = base64Decode(result);
      }

      switch (algorithm) {
        case "caesar":
          const shift = key ? parseInt(key) || 3 : 3;
          result = caesarCipher(result, shift, true);
          break;
        case "base64":
          result = base64Decode(result);
          break;
        case "hex":
          result = hexDecode(result);
          break;
        case "aes":
          // Check if IV is provided for AES
          if (!iv.trim()) {
            setError("IV (Initialization Vector) is required for AES decryption");
            setOutput("");
            return;
          }
          // Simulated AES decryption
          if (result.includes("_aes_encrypted_key_" + key + "_iv_" + iv)) {
            result = base64Decode(result).split("_aes_encrypted_key_")[0];
          } else {
            throw new Error("Invalid encrypted data, wrong key, or wrong IV");
          }
          break;
        case "des":
          // Simulated decryption
          if (result.includes("_encrypted_with_" + algorithm)) {
            result = base64Decode(result).split("_encrypted_with_")[0];
          } else {
            throw new Error("Invalid encrypted data or wrong key");
          }
          break;
        default:
          result = input;
      }

      setOutput(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decryption failed");
      setOutput("");
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied to clipboard",
        description: "Result has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadText = () => {
    if (!output) return;
    
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}ed.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setKey(result);
  };

  const generateRandomIV = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setIv(result);
  };

  return (
    <div className="space-y-6">
      {/* Algorithm and Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Encryption Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Algorithm</Label>
              <Select value={algorithm} onValueChange={setAlgorithm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caesar">Caesar Cipher</SelectItem>
                  <SelectItem value="base64">Base64</SelectItem>
                  <SelectItem value="hex">Hexadecimal</SelectItem>
                  <SelectItem value="aes">AES (Simulated)</SelectItem>
                  <SelectItem value="des">DES (Simulated)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Output Encoding</Label>
              <Select value={encoding} onValueChange={setEncoding}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain">Plain Text</SelectItem>
                  <SelectItem value="base64">Base64</SelectItem>
                  <SelectItem value="hex">Hexadecimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>
                Key {algorithm === "caesar" ? "(Shift)" : ""}
                {(algorithm === "aes" || algorithm === "des") && " (Required)"}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder={algorithm === "caesar" ? "3" : "Enter encryption key..."}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  type={algorithm === "caesar" ? "number" : "text"}
                />
                {(algorithm === "aes" || algorithm === "des") && (
                  <Button variant="outline" size="sm" onClick={generateRandomKey}>
                    Random
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* IV Field for AES */}
          {algorithm === "aes" && (
            <div className="space-y-2">
              <Label>IV (Initialization Vector) - Required for AES</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter 16-character IV..."
                  value={iv}
                  onChange={(e) => setIv(e.target.value)}
                  maxLength={16}
                />
                <Button variant="outline" size="sm" onClick={generateRandomIV}>
                  Random IV
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                IV should be exactly 16 characters for AES encryption
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Input and Output */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Input Text</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter text to encrypt/decrypt..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
            
            {input && (
              <div className="mt-4 text-sm text-muted-foreground">
                <Badge variant="outline">{input.length} characters</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Output
              {output && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadText}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="encrypt" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Encrypt
                </TabsTrigger>
                <TabsTrigger value="decrypt" className="flex items-center gap-2">
                  <Unlock className="h-4 w-4" />
                  Decrypt
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="encrypt">
                <Button 
                  onClick={encrypt} 
                  className="w-full mb-4"
                  disabled={(algorithm === "aes" || algorithm === "des") && !key}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Encrypt Text
                </Button>
              </TabsContent>
              
              <TabsContent value="decrypt">
                <Button 
                  onClick={decrypt} 
                  className="w-full mb-4"
                  disabled={(algorithm === "aes" || algorithm === "des") && !key}
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Decrypt Text
                </Button>
              </TabsContent>
            </Tabs>

            <Textarea
              value={output}
              readOnly
              placeholder="Result will appear here..."
              className="min-h-[200px] font-mono text-sm bg-muted/50"
            />
            
            {output && (
              <div className="text-sm text-muted-foreground">
                <Badge variant="outline">{output.length} characters</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
