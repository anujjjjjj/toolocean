import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface PasswordGeneratorToolProps {
  onOutputChange?: (output: string) => void;
}

export const PasswordGeneratorTool = ({ onOutputChange }: PasswordGeneratorToolProps) => {
  const [length, setLength] = useState([12]);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(false);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const similar = "il1Lo0O";

    let chars = "";
    
    if (includeUppercase) chars += uppercase;
    if (includeLowercase) chars += lowercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    if (!chars) {
      toast({
        title: "Error",
        description: "Please select at least one character type",
        variant: "destructive",
      });
      return;
    }

    if (excludeSimilar) {
      chars = chars.split('').filter(char => !similar.includes(char)).join('');
    }

    let result = "";
    for (let i = 0; i < length[0]; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setPassword(result);
    onOutputChange?.(result);
    
    toast({
      title: "Success",
      description: "Password generated successfully",
    });
  };

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    let feedback = [];

    if (password.length >= 8) score++;
    else feedback.push("Use at least 8 characters");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("Include lowercase letters");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("Include uppercase letters");

    if (/[0-9]/.test(password)) score++;
    else feedback.push("Include numbers");

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push("Include special characters");

    const strength = score <= 1 ? "Very Weak" : 
                    score === 2 ? "Weak" : 
                    score === 3 ? "Medium" : 
                    score === 4 ? "Strong" : "Very Strong";

    const color = score <= 1 ? "text-red-500" : 
                 score === 2 ? "text-orange-500" : 
                 score === 3 ? "text-yellow-500" : 
                 score === 4 ? "text-blue-500" : "text-green-500";

    return { strength, color, feedback, score };
  };

  const strength = password ? checkPasswordStrength(password) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Password Length: {length[0]}
            </label>
            <Slider
              value={length}
              onValueChange={setLength}
              min={4}
              max={128}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Character Types</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="uppercase"
                checked={includeUppercase}
                onCheckedChange={(checked) => setIncludeUppercase(checked === true)}
              />
              <label htmlFor="uppercase" className="text-sm">
                Uppercase Letters (A-Z)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lowercase"
                checked={includeLowercase}
                onCheckedChange={(checked) => setIncludeLowercase(checked === true)}
              />
              <label htmlFor="lowercase" className="text-sm">
                Lowercase Letters (a-z)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="numbers"
                checked={includeNumbers}
                onCheckedChange={(checked) => setIncludeNumbers(checked === true)}
              />
              <label htmlFor="numbers" className="text-sm">
                Numbers (0-9)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="symbols"
                checked={includeSymbols}
                onCheckedChange={(checked) => setIncludeSymbols(checked === true)}
              />
              <label htmlFor="symbols" className="text-sm">
                Symbols (!@#$%^&*...)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="exclude-similar"
                checked={excludeSimilar}
                onCheckedChange={(checked) => setExcludeSimilar(checked === true)}
              />
              <label htmlFor="exclude-similar" className="text-sm">
                Exclude Similar Characters (i, l, 1, L, o, 0, O)
              </label>
            </div>
          </div>

          <Button onClick={generatePassword} className="w-full">
            Generate Password
          </Button>

          {password && (
            <div className="space-y-3">
              <div>
                <label htmlFor="generated-password" className="block text-sm font-medium mb-2">
                  Generated Password
                </label>
                <Input
                  id="generated-password"
                  value={password}
                  readOnly
                  className="font-mono"
                />
              </div>

              {strength && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Password Strength:</span>
                    <span className={`text-sm font-medium ${strength.color}`}>
                      {strength.strength}
                    </span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        strength.score <= 1 ? "bg-red-500" : 
                        strength.score === 2 ? "bg-orange-500" : 
                        strength.score === 3 ? "bg-yellow-500" : 
                        strength.score === 4 ? "bg-blue-500" : "bg-green-500"
                      }`}
                      style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                  </div>

                  {strength.feedback.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Suggestions:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {strength.feedback.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};