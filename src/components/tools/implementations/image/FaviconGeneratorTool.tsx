import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
// Aliased: an unaliased `Image` import shadows the global Image constructor, so
// the `new Image()` calls below were invoking a React component and throwing.
import { Upload, Download, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { readImageFiles } from "@/lib/image/readImageFiles";
import JSZip from "jszip";

const SIZES = [16, 32, 48, 64, 128, 192, 256];

export function FaviconGeneratorTool() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    const { accepted, errors } = await readImageFiles([file]);
    if (!accepted[0]) {
      toast({ title: "Could not read that image", description: errors[0] ?? "Please select an image file", variant: "destructive" });
      return;
    }
    const chosen = accepted[0];
    const reader = new FileReader();
    reader.onload = (ev) => setSourceImage(ev.target?.result as string);
    reader.readAsDataURL(chosen);
  };

  const generateFavicons = async () => {
    if (!sourceImage) return;
    setGenerating(true);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = sourceImage;
      });

      const zip = new JSZip();

      for (const size of SIZES) {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, size, size);
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/png")
        );
        zip.file(`favicon-${size}x${size}.png`, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = "favicons.zip";
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: "Downloaded", description: "All favicon sizes saved in favicons.zip" });
    } catch {
      toast({ title: "Error", description: "Failed to generate favicons", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const downloadSingle = (size: number) => {
    if (!sourceImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas.getContext("2d")!.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `favicon-${size}x${size}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
    };
    img.src = sourceImage;
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {!sourceImage ? (
        <div
          className="border-2 border-dashed border-muted rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click to choose an image (PNG, JPEG, SVG, WebP)</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <img
              src={sourceImage}
              alt="Source"
              className="h-24 w-24 object-contain border rounded bg-checkerboard"
            />
            <div>
              <p className="font-medium text-sm mb-1">Source image loaded</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Change image
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Preview at favicon sizes</p>
            <div className="flex gap-4 items-end flex-wrap">
              {[16, 32, 48, 64].map((size) => (
                <button
                  key={size}
                  onClick={() => downloadSingle(size)}
                  className="text-center group"
                  title={`Download ${size}×${size}`}
                >
                  <div className="border rounded p-1 group-hover:border-primary transition-colors">
                    <img
                      src={sourceImage}
                      alt={`${size}px`}
                      style={{ width: size, height: size, imageRendering: "pixelated" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{size}px</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Click a size to download individually</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button onClick={generateFavicons} disabled={generating}>
              <Download className="h-4 w-4 mr-2" />
              {generating ? "Generating…" : "Download All Sizes (ZIP)"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Generates: {SIZES.join(", ")} px, all exported as PNG
          </p>
        </div>
      )}
    </div>
  );
}
