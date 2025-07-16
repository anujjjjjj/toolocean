import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FakeDataGeneratorTool = () => {
  const [dataType, setDataType] = useState("person");
  const [count, setCount] = useState(5);
  const [output, setOutput] = useState("");
  const { toast } = useToast();

  const generateFakeData = () => {
    const data = [];
    
    for (let i = 0; i < count; i++) {
      switch (dataType) {
        case "person":
          data.push({
            id: Math.floor(Math.random() * 10000),
            firstName: getRandomName(),
            lastName: getRandomLastName(),
            email: `${getRandomName().toLowerCase()}@${getRandomDomain()}`,
            phone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            age: Math.floor(Math.random() * 60) + 18,
            address: {
              street: `${Math.floor(Math.random() * 9999) + 1} ${getRandomStreet()}`,
              city: getRandomCity(),
              country: getRandomCountry(),
              zipCode: Math.floor(Math.random() * 90000) + 10000
            }
          });
          break;
        case "company":
          data.push({
            id: Math.floor(Math.random() * 10000),
            name: `${getRandomCompanyPrefix()} ${getRandomCompanySuffix()}`,
            industry: getRandomIndustry(),
            employees: Math.floor(Math.random() * 10000) + 10,
            revenue: Math.floor(Math.random() * 10000000) + 100000,
            website: `https://www.${getRandomName().toLowerCase()}corp.com`,
            founded: Math.floor(Math.random() * 50) + 1970
          });
          break;
        case "product":
          data.push({
            id: Math.floor(Math.random() * 10000),
            name: `${getRandomAdjective()} ${getRandomProduct()}`,
            price: (Math.random() * 1000 + 10).toFixed(2),
            category: getRandomCategory(),
            inStock: Math.random() > 0.2,
            rating: (Math.random() * 2 + 3).toFixed(1),
            description: `High-quality ${getRandomAdjective().toLowerCase()} ${getRandomProduct().toLowerCase()} for all your needs.`
          });
          break;
      }
    }
    
    setOutput(JSON.stringify(data, null, 2));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard!" });
  };

  // Helper functions for random data
  const getRandomName = () => {
    const names = ["Alex", "Jordan", "Taylor", "Casey", "Riley", "Morgan", "Avery", "Quinn", "Cameron", "Sage"];
    return names[Math.floor(Math.random() * names.length)];
  };

  const getRandomLastName = () => {
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
    return lastNames[Math.floor(Math.random() * lastNames.length)];
  };

  const getRandomDomain = () => {
    const domains = ["example.com", "test.org", "demo.net", "sample.co", "fake.io"];
    return domains[Math.floor(Math.random() * domains.length)];
  };

  const getRandomStreet = () => {
    const streets = ["Main St", "Oak Ave", "Pine Rd", "Elm Dr", "Cedar Ln", "Maple Ct", "Birch Way"];
    return streets[Math.floor(Math.random() * streets.length)];
  };

  const getRandomCity = () => {
    const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio"];
    return cities[Math.floor(Math.random() * cities.length)];
  };

  const getRandomCountry = () => {
    const countries = ["USA", "Canada", "UK", "Germany", "France", "Australia", "Japan"];
    return countries[Math.floor(Math.random() * countries.length)];
  };

  const getRandomCompanyPrefix = () => {
    const prefixes = ["Tech", "Global", "Advanced", "Pro", "Smart", "Digital", "Innovative"];
    return prefixes[Math.floor(Math.random() * prefixes.length)];
  };

  const getRandomCompanySuffix = () => {
    const suffixes = ["Solutions", "Corp", "Industries", "Systems", "Technologies", "Services", "Group"];
    return suffixes[Math.floor(Math.random() * suffixes.length)];
  };

  const getRandomIndustry = () => {
    const industries = ["Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Education", "Consulting"];
    return industries[Math.floor(Math.random() * industries.length)];
  };

  const getRandomAdjective = () => {
    const adjectives = ["Premium", "Ultra", "Super", "Mega", "Pro", "Elite", "Advanced"];
    return adjectives[Math.floor(Math.random() * adjectives.length)];
  };

  const getRandomProduct = () => {
    const products = ["Widget", "Gadget", "Device", "Tool", "System", "Solution", "Platform"];
    return products[Math.floor(Math.random() * products.length)];
  };

  const getRandomCategory = () => {
    const categories = ["Electronics", "Clothing", "Books", "Home", "Sports", "Beauty", "Toys"];
    return categories[Math.floor(Math.random() * categories.length)];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fake Data Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Data Type</Label>
              <Select value={dataType} onValueChange={setDataType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Count</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>

          <Button onClick={generateFakeData} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Data
          </Button>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Data</CardTitle>
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={output}
              readOnly
              className="h-96 font-mono text-xs"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FakeDataGeneratorTool;