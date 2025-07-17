import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CronExpressionBuilderTool() {
  const [minute, setMinute] = useState("0");
  const [hour, setHour] = useState("0");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("*");
  const [cronExpression, setCronExpression] = useState("0 0 * * *");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const presets = [
    { name: "Every minute", cron: "* * * * *", desc: "Runs every minute" },
    { name: "Every hour", cron: "0 * * * *", desc: "Runs at the top of every hour" },
    { name: "Daily at midnight", cron: "0 0 * * *", desc: "Runs once a day at midnight" },
    { name: "Daily at 6 AM", cron: "0 6 * * *", desc: "Runs once a day at 6:00 AM" },
    { name: "Weekly on Sunday", cron: "0 0 * * 0", desc: "Runs once a week on Sunday at midnight" },
    { name: "Monthly on 1st", cron: "0 0 1 * *", desc: "Runs once a month on the 1st at midnight" },
    { name: "Yearly on Jan 1st", cron: "0 0 1 1 *", desc: "Runs once a year on January 1st at midnight" },
    { name: "Weekdays at 9 AM", cron: "0 9 * * 1-5", desc: "Runs Monday through Friday at 9:00 AM" },
    { name: "Every 15 minutes", cron: "*/15 * * * *", desc: "Runs every 15 minutes" },
    { name: "Every 30 minutes", cron: "*/30 * * * *", desc: "Runs every 30 minutes" },
  ];

  const generateCronExpression = () => {
    const expression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    setCronExpression(expression);
    generateDescription(expression);
  };

  const generateDescription = (cron: string) => {
    const parts = cron.split(' ');
    const [min, hr, dom, mon, dow] = parts;
    
    let desc = "Runs ";
    
    // Minute
    if (min === "*") {
      desc += "every minute ";
    } else if (min.includes("/")) {
      const interval = min.split("/")[1];
      desc += `every ${interval} minutes `;
    } else {
      desc += `at minute ${min} `;
    }
    
    // Hour
    if (hr === "*") {
      desc += "of every hour ";
    } else if (hr.includes("/")) {
      const interval = hr.split("/")[1];
      desc += `every ${interval} hours `;
    } else {
      const hour12 = parseInt(hr) === 0 ? 12 : parseInt(hr) > 12 ? parseInt(hr) - 12 : parseInt(hr);
      const ampm = parseInt(hr) >= 12 ? "PM" : "AM";
      desc += `at ${hour12}:${min.padStart(2, '0')} ${ampm} `;
    }
    
    // Day of month
    if (dom === "*") {
      desc += "on every day ";
    } else if (dom.includes("/")) {
      const interval = dom.split("/")[1];
      desc += `every ${interval} days `;
    } else {
      desc += `on day ${dom} `;
    }
    
    // Month
    if (mon !== "*") {
      const months = ["", "January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November", "December"];
      if (mon.includes(",")) {
        const monthList = mon.split(",").map(m => months[parseInt(m)]).join(", ");
        desc += `in ${monthList} `;
      } else {
        desc += `in ${months[parseInt(mon)]} `;
      }
    } else {
      desc += "of every month ";
    }
    
    // Day of week
    if (dow !== "*") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      if (dow.includes("-")) {
        const range = dow.split("-");
        desc += `on ${days[parseInt(range[0])]} through ${days[parseInt(range[1])]}`;
      } else if (dow.includes(",")) {
        const dayList = dow.split(",").map(d => days[parseInt(d)]).join(", ");
        desc += `on ${dayList}`;
      } else {
        desc += `on ${days[parseInt(dow)]}`;
      }
    }
    
    setDescription(desc.trim());
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setCronExpression(preset.cron);
    setDescription(preset.desc);
    
    // Parse preset back to form fields
    const parts = preset.cron.split(' ');
    setMinute(parts[0] || "0");
    setHour(parts[1] || "0");
    setDayOfMonth(parts[2] || "*");
    setMonth(parts[3] || "*");
    setDayOfWeek(parts[4] || "*");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(cronExpression);
      toast({
        title: "Copied to clipboard",
        description: "Cron expression has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const parseCronExpression = (cron: string) => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length === 5) {
      setMinute(parts[0]);
      setHour(parts[1]);
      setDayOfMonth(parts[2]);
      setMonth(parts[3]);
      setDayOfWeek(parts[4]);
      generateDescription(cron);
    }
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quick Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {presets.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => applyPreset(preset)}
                className="justify-start h-auto p-3"
              >
                <div className="text-left">
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{preset.cron}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cron Expression Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-5 gap-2 text-center text-xs text-muted-foreground">
              <div>Minute</div>
              <div>Hour</div>
              <div>Day</div>
              <div>Month</div>
              <div>DOW</div>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              <Input
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                placeholder="0-59"
                className="text-center font-mono"
              />
              <Input
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                placeholder="0-23"
                className="text-center font-mono"
              />
              <Input
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                placeholder="1-31"
                className="text-center font-mono"
              />
              <Input
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="1-12"
                className="text-center font-mono"
              />
              <Input
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                placeholder="0-7"
                className="text-center font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Common Values</Label>
              <div className="text-xs text-muted-foreground space-y-1">
                <div><code>*</code> - Any value</div>
                <div><code>,</code> - List separator (e.g., 1,3,5)</div>
                <div><code>-</code> - Range (e.g., 1-5)</div>
                <div><code>/</code> - Step values (e.g., */5)</div>
                <div><code>0-6</code> - Sunday to Saturday</div>
              </div>
            </div>

            <Button onClick={generateCronExpression} className="w-full">
              Generate Expression
            </Button>

            <div className="space-y-2">
              <Label>Or paste existing cron expression:</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="0 0 * * *"
                  onChange={(e) => parseCronExpression(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Expression
              {cronExpression && (
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cron Expression</Label>
              <div className="p-3 bg-muted rounded font-mono text-lg text-center">
                {cronExpression}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Human Readable</Label>
              <div className="p-3 bg-muted/50 rounded text-sm">
                {description || "Generate an expression to see description"}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Next Executions (Approximate)</Label>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Today at next scheduled time</div>
                <div>• Tomorrow at scheduled time</div>
                <div>• Every occurrence based on pattern</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Usage Examples</Label>
              <div className="text-xs text-muted-foreground space-y-1">
                <div><strong>Linux/Unix:</strong> Add to crontab with <code>crontab -e</code></div>
                <div><strong>Node.js:</strong> Use with node-cron package</div>
                <div><strong>Docker:</strong> Add to Docker container scheduling</div>
                <div><strong>GitHub Actions:</strong> Use in workflow schedule</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}