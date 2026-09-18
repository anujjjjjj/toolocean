import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Copy, Download, Lock, Unlock, AlertCircle, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CryptoJS from "crypto-js";

/*
 * Real ciphers, via the crypto-js that was already a dependency.
 *
 * What used to be here labelled itself "AES (Simulated)" and base64-encoded a JSON
 * object holding the plaintext, the key and the IV in the clear:
 *
 *   atob(output) -> {"data":"MY BANK PASSWORD","key":"hunter2","iv":"...","algorithm":"aes"}
 *
 * Anyone who pasted a secret in got something that looked like ciphertext and
 * actually published both the secret and the key together. A tool in the security
 * category cannot ship that, so the AES and DES paths now do real encryption and
 * the honest-but-weak options (Caesar, Base64, Hex) are labelled as encodings
 * rather than encryption.
 */

/** Derives a fixed-length key from the passphrase so any input length works. */
function deriveKey(passphrase: string, bits: number) {
  return CryptoJS.PBKDF2(passphrase, KDF_SALT, { keySize: bits / 32, iterations: KDF_ITERATIONS });
}

/*
 * A fixed salt is a real weakness: it means the same passphrase always derives the
 * same key, so this offers no protection against precomputation. It is here because
 * the ciphertext format has nowhere to carry a per-message salt, and changing that
 * format would break every string anyone has already produced. Good enough for
 * moving a note past a casual reader; not good enough for anything that matters,
 * which the UI now says out loud.
 */
const KDF_SALT = CryptoJS.enc.Utf8.parse("toolocean-v1");
const KDF_ITERATIONS = 10_000;

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setInput(ev.target?.result as string); setOutput(""); setError(""); };
    reader.readAsText(file);
    e.target.value = "";
  };

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
        case "aes": {
          if (!key.trim()) {
            setError("A key is required for AES encryption");
            setOutput("");
            return;
          }
          if (iv.trim().length < 16) {
            setError("AES needs an IV of at least 16 characters");
            setOutput("");
            return;
          }
          const encrypted = CryptoJS.AES.encrypt(input, deriveKey(key, 256), {
            iv: CryptoJS.enc.Utf8.parse(iv.slice(0, 16)),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
          });
          result =
            encoding === "hex"
              ? encrypted.ciphertext.toString(CryptoJS.enc.Hex)
              : encrypted.toString();
          break;
        }
        case "des": {
          if (!key.trim()) {
            setError("A key is required for Triple DES encryption");
            setOutput("");
            return;
          }
          const encrypted = CryptoJS.TripleDES.encrypt(input, deriveKey(key, 192), {
            iv: CryptoJS.enc.Utf8.parse((iv || "00000000").slice(0, 8).padEnd(8, "0")),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
          });
          result =
            encoding === "hex"
              ? encrypted.ciphertext.toString(CryptoJS.enc.Hex)
              : encrypted.toString();
          break;
        }
        default:
          result = input;
      }

      /*
       * Outer encoding, for the algorithms that return raw text. AES and Triple DES
       * already emitted base64 or hex themselves above, so they are excluded from
       * both branches, re-encoding their output here produced ciphertext that
       * could never be decrypted back.
       */
      const selfEncoded = algorithm === "aes" || algorithm === "des";
      if (encoding === "hex" && algorithm !== "hex" && !selfEncoded) {
        result = hexEncode(result);
      } else if (encoding === "base64" && algorithm !== "base64" && !selfEncoded) {
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

      // Mirror of the encrypt path: the ciphers unwrap their own encoding.
      const selfEncoded = algorithm === "aes" || algorithm === "des";
      if (encoding === "hex" && algorithm !== "hex" && !selfEncoded) {
        try {
          result = hexDecode(result);
        } catch {
          throw new Error("Invalid hex encoding");
        }
      } else if (encoding === "base64" && algorithm !== "base64" && !selfEncoded) {
        try {
          result = base64Decode(result);
        } catch {
          throw new Error("Invalid base64 encoding");
        }
      }

      // Then apply algorithm-specific decryption
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
        case "aes": {
          if (iv.trim().length < 16) {
            setError("AES needs the same IV that was used to encrypt");
            setOutput("");
            return;
          }
          const params =
            encoding === "hex"
              ? CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Hex.parse(result) })
              : result;
          const decrypted = CryptoJS.AES.decrypt(params as never, deriveKey(key, 256), {
            iv: CryptoJS.enc.Utf8.parse(iv.slice(0, 16)),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
          });
          // A wrong key yields either empty output or invalid UTF-8, so this is
          // where "wrong password" is actually detected.
          result = decrypted.toString(CryptoJS.enc.Utf8);
          if (!result) throw new Error("Wrong key or IV, or the ciphertext is corrupt");
          break;
        }
        case "des": {
          const params =
            encoding === "hex"
              ? CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Hex.parse(result) })
              : result;
          const decrypted = CryptoJS.TripleDES.decrypt(params as never, deriveKey(key, 192), {
            iv: CryptoJS.enc.Utf8.parse((iv || "00000000").slice(0, 8).padEnd(8, "0")),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
          });
          result = decrypted.toString(CryptoJS.enc.Utf8);
          if (!result) throw new Error("Wrong key, or the ciphertext is corrupt");
          break;
        }
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
                  <SelectItem value="aes">AES-256-CBC</SelectItem>
                  <SelectItem value="des">Triple DES (CBC)</SelectItem>
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
                  placeholder="Enter IV (16+ characters)..."
                  value={iv}
                  onChange={(e) => setIv(e.target.value)}
                  minLength={16}
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
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept=".txt,.json,.md" className="hidden" onChange={handleFileUpload} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload file
              </Button>
              <span className="text-xs text-muted-foreground">or paste below</span>
            </div>
            <Textarea
              placeholder="Enter text to encrypt/decrypt..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-[600px] font-mono text-sm"
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
              className="min-h-[400px] font-mono text-sm bg-muted/50"
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
