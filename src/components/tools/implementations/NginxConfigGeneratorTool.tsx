import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Server } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function NginxConfigGeneratorTool() {
  const [serverName, setServerName] = useState("example.com");
  const [port, setPort] = useState("80");
  const [root, setRoot] = useState("/var/www/html");
  const [index, setIndex] = useState("index.html index.htm");
  const [configType, setConfigType] = useState("basic");
  const [enableSSL, setEnableSSL] = useState(false);
  const [sslCert, setSslCert] = useState("/path/to/cert.pem");
  const [sslKey, setSslKey] = useState("/path/to/private.key");
  const [proxyPass, setProxyPass] = useState("http://localhost:3000");
  const [output, setOutput] = useState("");
  const { toast } = useToast();

  const generateBasicConfig = () => {
    return `server {
    listen ${port};
    ${enableSSL ? `listen 443 ssl;` : ''}
    server_name ${serverName};
    root ${root};
    index ${index};

    ${enableSSL ? `
    ssl_certificate ${sslCert};
    ssl_certificate_key ${sslKey};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ` : ''}

    location / {
        try_files $uri $uri/ =404;
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}`;
  };

  const generateProxyConfig = () => {
    return `server {
    listen ${port};
    ${enableSSL ? `listen 443 ssl;` : ''}
    server_name ${serverName};

    ${enableSSL ? `
    ssl_certificate ${sslCert};
    ssl_certificate_key ${sslKey};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ` : ''}

    location / {
        proxy_pass ${proxyPass};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}`;
  };

  const generateSpaConfig = () => {
    return `server {
    listen ${port};
    ${enableSSL ? `listen 443 ssl;` : ''}
    server_name ${serverName};
    root ${root};
    index index.html;

    ${enableSSL ? `
    ssl_certificate ${sslCert};
    ssl_certificate_key ${sslKey};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ` : ''}

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API routes (adjust as needed)
    location /api {
        proxy_pass ${proxyPass};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets caching
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}`;
  };

  const generateLoadBalancerConfig = () => {
    return `upstream backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen ${port};
    ${enableSSL ? `listen 443 ssl;` : ''}
    server_name ${serverName};

    ${enableSSL ? `
    ssl_certificate ${sslCert};
    ssl_certificate_key ${sslKey};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ` : ''}

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}`;
  };

  const generateConfig = () => {
    let config = "";
    
    switch (configType) {
      case "basic":
        config = generateBasicConfig();
        break;
      case "proxy":
        config = generateProxyConfig();
        break;
      case "spa":
        config = generateSpaConfig();
        break;
      case "loadbalancer":
        config = generateLoadBalancerConfig();
        break;
      default:
        config = generateBasicConfig();
    }

    setOutput(config);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({
        title: "Copied to clipboard",
        description: "NGINX config has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadConfig = () => {
    if (!output) return;
    
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${serverName}.conf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            NGINX Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Configuration Type</Label>
            <Select value={configType} onValueChange={setConfigType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Static Site</SelectItem>
                <SelectItem value="proxy">Reverse Proxy</SelectItem>
                <SelectItem value="spa">Single Page Application</SelectItem>
                <SelectItem value="loadbalancer">Load Balancer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Server Name</Label>
              <Input
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="80"
              />
            </div>
          </div>

          {(configType === "basic" || configType === "spa") && (
            <>
              <div className="space-y-2">
                <Label>Document Root</Label>
                <Input
                  value={root}
                  onChange={(e) => setRoot(e.target.value)}
                  placeholder="/var/www/html"
                />
              </div>
              <div className="space-y-2">
                <Label>Index Files</Label>
                <Input
                  value={index}
                  onChange={(e) => setIndex(e.target.value)}
                  placeholder="index.html index.htm"
                />
              </div>
            </>
          )}

          {(configType === "proxy" || configType === "spa") && (
            <div className="space-y-2">
              <Label>Proxy Pass URL</Label>
              <Input
                value={proxyPass}
                onChange={(e) => setProxyPass(e.target.value)}
                placeholder="http://localhost:3000"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="ssl"
              checked={enableSSL}
              onCheckedChange={setEnableSSL}
            />
            <Label htmlFor="ssl">Enable SSL</Label>
          </div>

          {enableSSL && (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>SSL Certificate Path</Label>
                <Input
                  value={sslCert}
                  onChange={(e) => setSslCert(e.target.value)}
                  placeholder="/path/to/cert.pem"
                />
              </div>
              <div className="space-y-2">
                <Label>SSL Private Key Path</Label>
                <Input
                  value={sslKey}
                  onChange={(e) => setSslKey(e.target.value)}
                  placeholder="/path/to/private.key"
                />
              </div>
            </div>
          )}

          <Button onClick={generateConfig} className="w-full">
            Generate Configuration
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Generated Config
            {output && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadConfig}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={output}
            readOnly
            placeholder="Generated NGINX configuration will appear here..."
            className="min-h-[500px] font-mono text-sm bg-muted/50"
          />
          
          {output && (
            <div className="flex gap-2">
              <Badge variant="outline">{output.length} characters</Badge>
              <Badge variant="outline">{output.split('\n').length} lines</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}