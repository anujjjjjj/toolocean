import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PickedColor {
  hex: string;
  rgb: string;
  hsl: string;
}

function rgbToHsl(r: number, g: number, b: number): string {
  const rf = r / 255, gf = g / 255, bf = b / 255;
  const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;
  if (max === min) return `hsl(0, 0%, ${Math.round(l * 100)}%)`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rf) h = ((gf - bf) / d + (gf < bf ? 6 : 0)) / 6;
  else if (max === gf) h = ((bf - rf) / d + 2) / 6;
  else h = ((rf - gf) / d + 4) / 6;
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export function ImageColorPickerTool() {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [picked, setPicked] = useState<PickedColor | null>(null);
  const [history, setHistory] = useState<PickedColor[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  /*
   * Decodes the File directly, with no object URL and no <img> in between.
   *
   * The original reached for canvasRef.current inside a detached `new Image()`
   * onload, but the canvas is only rendered once there is an image, so the ref was
   * always null there and every upload threw "Cannot set properties of null (setting
   * 'width')". Rebuilding it around a rendered <img> fixed that and exposed a second
   * problem: the input is cleared straight after (so the same file can be picked
   * twice), and clearing it invalidates the object URL before the image finishes
   * decoding, leaving naturalWidth at 0 and the canvas blank.
   *
   * createImageBitmap takes the File itself, so neither failure mode exists. There is
   * also no URL lifetime to manage, which removes the leak this tool used to have.
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const bitmap = await createImageBitmap(file);
      bitmapRef.current?.close();
      bitmapRef.current = bitmap;
      setPicked(null);
      setDimensions({ width: bitmap.width, height: bitmap.height });
    } catch {
      toast({
        title: "Could not read that image",
        description: "The file may be corrupt or in a format this browser cannot decode.",
        variant: "destructive",
      });
    }
  };

  // Draw once the canvas exists, which is the render after dimensions are set.
  useEffect(() => {
    const bitmap = bitmapRef.current;
    const canvas = canvasRef.current;
    if (!dimensions || !bitmap || !canvas) return;

    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
  }, [dimensions]);

  // Bitmaps hold decoded pixels; without this each upload keeps the previous one.
  useEffect(() => () => bitmapRef.current?.close(), []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    const [r, g, b] = canvas.getContext("2d")!.getImageData(x, y, 1, 1).data;
    const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
    const color: PickedColor = {
      hex,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: rgbToHsl(r, g, b),
    };
    setPicked(color);
    setHistory((h) => [color, ...h.slice(0, 19)]);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Color Picker from Image</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />Upload Image
            </Button>
          </div>

          {dimensions && (
            <>
              <p className="text-sm text-muted-foreground">
                Click anywhere on the image to pick a color. ({dimensions.width} × {dimensions.height})
              </p>
              <div className="overflow-auto border rounded-md">
                <canvas
                  ref={canvasRef}
                  style={{ maxWidth: "100%", cursor: "crosshair", display: "block" }}
                  onClick={handleClick}
                />
              </div>
            </>
          )}

          {picked && (
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md border" style={{ backgroundColor: picked.hex }} />
                <div className="flex-1 space-y-1">
                  {[picked.hex, picked.rgb, picked.hsl].map((val) => (
                    <div key={val} className="flex items-center gap-2">
                      <code className="text-sm font-mono flex-1">{val}</code>
                      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copy(val)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">History</p>
              <div className="flex flex-wrap gap-2">
                {history.map((c, i) => (
                  <button
                    key={i}
                    title={c.hex}
                    className="w-8 h-8 rounded-md border hover:ring-2 hover:ring-primary"
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setPicked(c)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
