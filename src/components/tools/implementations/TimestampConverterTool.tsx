import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TimestampConverterTool = () => {
  const [timestamp, setTimestamp] = useState("");
  const [dateString, setDateString] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const convertFromTimestamp = () => {
    try {
      const ts = parseInt(timestamp);
      if (isNaN(ts)) {
        toast({ title: "Error", description: "Invalid timestamp", variant: "destructive" });
        return;
      }
      
      // Handle both seconds and milliseconds
      const date = new Date(ts > 10000000000 ? ts : ts * 1000);
      const formatted = `${date.toISOString()}\n${date.toUTCString()}\n${date.toLocaleString()}`;
      setDateString(formatted);
    } catch (error) {
      toast({ title: "Error", description: "Invalid timestamp", variant: "destructive" });
    }
  };

  const convertToTimestamp = () => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        toast({ title: "Error", description: "Invalid date string", variant: "destructive" });
        return;
      }
      
      const unixSeconds = Math.floor(date.getTime() / 1000);
      const unixMilliseconds = date.getTime();
      setTimestamp(`Seconds: ${unixSeconds}\nMilliseconds: ${unixMilliseconds}`);
    } catch (error) {
      toast({ title: "Error", description: "Invalid date string", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const getCurrentTimestamp = () => {
    const now = Date.now();
    setTimestamp(`Seconds: ${Math.floor(now / 1000)}\nMilliseconds: ${now}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label>Current Timestamp (seconds)</Label>
              <div className="font-mono p-2 bg-muted rounded">
                {Math.floor(currentTime.getTime() / 1000)}
              </div>
            </div>
            <div>
              <Label>Current Timestamp (milliseconds)</Label>
              <div className="font-mono p-2 bg-muted rounded">
                {currentTime.getTime()}
              </div>
            </div>
            <div>
              <Label>ISO String</Label>
              <div className="font-mono p-2 bg-muted rounded text-xs">
                {currentTime.toISOString()}
              </div>
            </div>
            <div>
              <Label>Local Time</Label>
              <div className="font-mono p-2 bg-muted rounded text-xs">
                {currentTime.toLocaleString()}
              </div>
            </div>
          </div>
          <Button onClick={getCurrentTimestamp} variant="outline" size="sm">
            Use Current Timestamp
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Timestamp to Date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Unix Timestamp</Label>
              <Input
                placeholder="Enter timestamp (seconds or milliseconds)"
                value={timestamp.split('\n')[0]?.replace(/\D/g, '') || timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
              />
            </div>
            
            <Button onClick={convertFromTimestamp} className="w-full">
              Convert to Date
            </Button>
            
            {dateString && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Converted Date</Label>
                  <Button onClick={() => copyToClipboard(dateString)} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={dateString}
                  readOnly
                  className="h-24 font-mono text-xs"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Date to Timestamp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Date String</Label>
              <Input
                placeholder="Enter date (YYYY-MM-DD HH:mm:ss or ISO format)"
                value={dateString.split('\n')[0] || ""}
                onChange={(e) => setDateString(e.target.value)}
              />
            </div>
            
            <Button onClick={convertToTimestamp} className="w-full">
              Convert to Timestamp
            </Button>
            
            {timestamp.includes('Seconds:') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Converted Timestamp</Label>
                  <Button onClick={() => copyToClipboard(timestamp)} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={timestamp}
                  readOnly
                  className="h-16 font-mono text-xs"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimestampConverterTool;