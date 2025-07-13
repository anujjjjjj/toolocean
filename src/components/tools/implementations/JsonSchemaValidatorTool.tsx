import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Ajv from 'ajv';

interface ValidationError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: any;
  message?: string;
}

export function JsonSchemaValidatorTool() {
  const [jsonData, setJsonData] = useState("");
  const [schema, setSchema] = useState("");
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: ValidationError[];
  } | null>(null);
  const { toast } = useToast();

  const validateJson = () => {
    if (!jsonData.trim() || !schema.trim()) {
      toast({
        title: "Missing input",
        description: "Please provide both JSON data and schema",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsedData = JSON.parse(jsonData);
      const parsedSchema = JSON.parse(schema);
      
      const ajv = new Ajv({ allErrors: true, verbose: true });
      const validate = ajv.compile(parsedSchema);
      const isValid = validate(parsedData);
      
      setValidationResult({
        isValid,
        errors: validate.errors || []
      });

      toast({
        title: isValid ? "Validation passed" : "Validation failed",
        description: isValid 
          ? "JSON data is valid according to the schema" 
          : `Found ${validate.errors?.length || 0} validation errors`,
        variant: isValid ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Parsing error",
        description: error instanceof Error ? error.message : "Invalid JSON format",
        variant: "destructive",
      });
      setValidationResult(null);
    }
  };

  const loadSampleData = () => {
    const sampleSchema = {
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 1
        },
        age: {
          type: "integer",
          minimum: 0,
          maximum: 150
        },
        email: {
          type: "string",
          format: "email"
        },
        address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
            zipCode: {
              type: "string",
              pattern: "^[0-9]{5}$"
            }
          },
          required: ["street", "city", "zipCode"]
        },
        hobbies: {
          type: "array",
          items: { type: "string" },
          minItems: 1
        }
      },
      required: ["name", "age", "email"]
    };

    const sampleData = {
      name: "John Doe",
      age: 30,
      email: "john.doe@example.com",
      address: {
        street: "123 Main St",
        city: "New York",
        zipCode: "10001"
      },
      hobbies: ["reading", "swimming", "coding"]
    };

    setSchema(JSON.stringify(sampleSchema, null, 2));
    setJsonData(JSON.stringify(sampleData, null, 2));
    setValidationResult(null);
  };

  const clearAll = () => {
    setJsonData("");
    setSchema("");
    setValidationResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>JSON Schema Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={validateJson} className="flex-1">
              Validate JSON
            </Button>
            <Button onClick={loadSampleData} variant="outline">
              Load Sample
            </Button>
            <Button onClick={clearAll} variant="outline">
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* JSON Data Input */}
        <Card>
          <CardHeader>
            <CardTitle>JSON Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste your JSON data here..."
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* JSON Schema Input */}
        <Card>
          <CardHeader>
            <CardTitle>JSON Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste your JSON Schema here..."
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Validation Results
              {validationResult.isValid ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Invalid
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validationResult.isValid ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span>JSON data is valid according to the schema!</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span>Found {validationResult.errors.length} validation error(s):</span>
                </div>
                
                <div className="space-y-2">
                  {validationResult.errors.map((error, index) => (
                    <div key={index} className="p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/20">
                      <div className="font-mono text-sm">
                        <div className="text-red-600 dark:text-red-400 font-medium">
                          Path: {error.instancePath || "(root)"}
                        </div>
                        <div className="text-muted-foreground">
                          Schema: {error.schemaPath}
                        </div>
                        <div className="text-muted-foreground">
                          Keyword: {error.keyword}
                        </div>
                        {error.message && (
                          <div className="mt-1 text-red-600 dark:text-red-400">
                            {error.message}
                          </div>
                        )}
                        {error.params && Object.keys(error.params).length > 0 && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Params: {JSON.stringify(error.params)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}