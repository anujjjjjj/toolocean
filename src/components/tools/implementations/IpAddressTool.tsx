import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IpInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
}

const IpAddressTool = () => {
  const [inputIp, setInputIp] = useState("");
  const [currentIp, setCurrentIp] = useState<IpInfo | null>(null);
  const [lookupResult, setLookupResult] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentIp();
  }, []);

  const getCurrentIp = async () => {
    setLoadingCurrent(true);
    try {
      // Using a free IP geolocation service
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      setCurrentIp({
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        timezone: data.timezone,
        isp: data.org,
        org: data.org,
        as: data.asn
      });
    } catch (error) {
      // Fallback to simpler service
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setCurrentIp({ ip: data.ip });
      } catch (fallbackError) {
        toast({ 
          title: "Error", 
          description: "Could not detect your IP address", 
          variant: "destructive" 
        });
      }
    } finally {
      setLoadingCurrent(false);
    }
  };

  const lookupIp = async () => {
    if (!inputIp) {
      toast({ title: "Error", description: "Please enter an IP address", variant: "destructive" });
      return;
    }

    if (!isValidIp(inputIp)) {
      toast({ title: "Error", description: "Please enter a valid IP address", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://ipapi.co/${inputIp}/json/`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.reason || 'Invalid IP address');
      }

      setLookupResult({
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        timezone: data.timezone,
        isp: data.org,
        org: data.org,
        as: data.asn
      });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to lookup IP", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const isValidIp = (ip: string) => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  };

  const IpInfoCard = ({ ipInfo, title, icon }: { ipInfo: IpInfo; title: string; icon: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>IP Address</Label>
          <div className="font-mono text-lg font-semibold">{ipInfo.ip}</div>
        </div>
        
        {ipInfo.country && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Country</Label>
              <div>{ipInfo.country}</div>
            </div>
            <div>
              <Label>Region</Label>
              <div>{ipInfo.region || 'N/A'}</div>
            </div>
          </div>
        )}
        
        {ipInfo.city && (
          <div>
            <Label>City</Label>
            <div>{ipInfo.city}</div>
          </div>
        )}
        
        {ipInfo.timezone && (
          <div>
            <Label>Timezone</Label>
            <Badge variant="secondary">{ipInfo.timezone}</Badge>
          </div>
        )}
        
        {ipInfo.isp && (
          <div>
            <Label>ISP / Organization</Label>
            <div className="text-sm">{ipInfo.isp}</div>
          </div>
        )}
        
        {ipInfo.as && (
          <div>
            <Label>AS Number</Label>
            <div className="text-sm font-mono">{ipInfo.as}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>IP Address Lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address (e.g., 8.8.8.8)"
              value={inputIp}
              onChange={(e) => setInputIp(e.target.value)}
              className="flex-1"
            />
            <Button onClick={lookupIp} disabled={loading}>
              {loading ? "Looking up..." : "Lookup"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {currentIp && !loadingCurrent && (
          <IpInfoCard 
            ipInfo={currentIp} 
            title="Your IP Address" 
            icon={<Wifi className="h-5 w-5" />} 
          />
        )}
        
        {loadingCurrent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Your IP Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse">Loading your IP information...</div>
            </CardContent>
          </Card>
        )}

        {lookupResult && (
          <IpInfoCard 
            ipInfo={lookupResult} 
            title="Lookup Result" 
            icon={<Globe className="h-5 w-5" />} 
          />
        )}
      </div>
    </div>
  );
};

export default IpAddressTool;