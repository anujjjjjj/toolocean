import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Send, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Header {
  key: string;
  value: string;
}

const HttpRequestComposerTool = () => {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState<Header[]>([{ key: "Content-Type", value: "application/json" }]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const { toast } = useToast();

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const sendRequest = async () => {
    if (!url) {
      toast({ title: "Error", description: "Please enter a URL", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResponse("");
    setResponseStatus(null);

    try {
      const requestHeaders: Record<string, string> = {};
      headers.forEach(header => {
        if (header.key && header.value) {
          requestHeaders[header.key] = header.value;
        }
      });

      const requestConfig: RequestInit = {
        method,
        headers: requestHeaders,
      };

      if (method !== "GET" && method !== "HEAD" && body) {
        requestConfig.body = body;
      }

      const startTime = Date.now();
      const res = await fetch(url, requestConfig);
      const endTime = Date.now();
      
      setResponseStatus(res.status);
      
      const contentType = res.headers.get("content-type");
      let responseData;
      
      if (contentType?.includes("application/json")) {
        responseData = await res.json();
        setResponse(JSON.stringify(responseData, null, 2));
      } else {
        responseData = await res.text();
        setResponse(responseData);
      }

      toast({ 
        title: "Request completed", 
        description: `${res.status} ${res.statusText} (${endTime - startTime}ms)` 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Request failed";
      setResponse(`Error: ${errorMessage}`);
      toast({ title: "Request failed", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!responseStatus) return "secondary";
    if (responseStatus >= 200 && responseStatus < 300) return "default";
    if (responseStatus >= 400) return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>HTTP Request Composer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="HEAD">HEAD</SelectItem>
                <SelectItem value="OPTIONS">OPTIONS</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Enter URL (https://api.example.com/data)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            
            <Button onClick={sendRequest} disabled={loading || !url}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send"}
            </Button>
          </div>

          <Tabs defaultValue="headers">
            <TabsList>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
            </TabsList>
            
            <TabsContent value="headers" className="space-y-2">
              {headers.map((header, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Header value"
                    value={header.value}
                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => removeHeader(index)}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button onClick={addHeader} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Header
              </Button>
            </TabsContent>
            
            <TabsContent value="body">
              <div className="space-y-2">
                <Label>Request Body</Label>
                <Textarea
                  placeholder="Enter request body (JSON, XML, etc.)"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="h-32"
                  disabled={method === "GET" || method === "HEAD"}
                />
                {(method === "GET" || method === "HEAD") && (
                  <p className="text-sm text-muted-foreground">
                    Request body is not supported for {method} requests
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {(response || responseStatus) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Response</CardTitle>
              {responseStatus && (
                <Badge variant={getStatusColor()}>
                  {responseStatus}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={response}
              readOnly
              className="h-64 font-mono text-xs"
              placeholder="Response will appear here..."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HttpRequestComposerTool;