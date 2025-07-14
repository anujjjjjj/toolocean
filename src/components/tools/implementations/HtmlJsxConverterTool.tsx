import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface HtmlJsxConverterToolProps {
  onOutputChange?: (output: string) => void;
}

export const HtmlJsxConverterTool = ({ onOutputChange }: HtmlJsxConverterToolProps) => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const { toast } = useToast();

  const convertHtmlToJsx = (html: string): string => {
    let jsx = html;

    // Convert HTML attributes to JSX
    jsx = jsx.replace(/class=/g, 'className=');
    jsx = jsx.replace(/for=/g, 'htmlFor=');
    jsx = jsx.replace(/tabindex=/g, 'tabIndex=');
    jsx = jsx.replace(/readonly=/g, 'readOnly=');
    jsx = jsx.replace(/maxlength=/g, 'maxLength=');
    jsx = jsx.replace(/cellpadding=/g, 'cellPadding=');
    jsx = jsx.replace(/cellspacing=/g, 'cellSpacing=');
    jsx = jsx.replace(/rowspan=/g, 'rowSpan=');
    jsx = jsx.replace(/colspan=/g, 'colSpan=');
    jsx = jsx.replace(/usemap=/g, 'useMap=');
    jsx = jsx.replace(/frameborder=/g, 'frameBorder=');
    jsx = jsx.replace(/contenteditable=/g, 'contentEditable=');
    jsx = jsx.replace(/crossorigin=/g, 'crossOrigin=');
    jsx = jsx.replace(/datetime=/g, 'dateTime=');
    jsx = jsx.replace(/formaction=/g, 'formAction=');
    jsx = jsx.replace(/formenctype=/g, 'formEncType=');
    jsx = jsx.replace(/formmethod=/g, 'formMethod=');
    jsx = jsx.replace(/formnovalidate=/g, 'formNoValidate=');
    jsx = jsx.replace(/formtarget=/g, 'formTarget=');

    // Convert self-closing tags
    jsx = jsx.replace(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)([^>]*?)>/g, '<$1$2 />');

    // Convert style attribute to object
    jsx = jsx.replace(/style="([^"]*?)"/g, (match, styles) => {
      const styleObj = styles
        .split(';')
        .filter((style: string) => style.trim())
        .map((style: string) => {
          const [prop, value] = style.split(':').map((s: string) => s.trim());
          if (prop && value) {
            // Convert kebab-case to camelCase
            const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            return `${camelProp}: "${value}"`;
          }
          return '';
        })
        .filter(Boolean)
        .join(', ');

      return `style={{${styleObj}}}`;
    });

    // Convert data-* and aria-* attributes to camelCase
    jsx = jsx.replace(/data-([a-z-]+)=/g, (match, attr) => {
      const camelAttr = attr.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
      return `data${camelAttr.charAt(0).toUpperCase() + camelAttr.slice(1)}=`;
    });

    jsx = jsx.replace(/aria-([a-z-]+)=/g, (match, attr) => {
      const camelAttr = attr.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
      return `aria${camelAttr.charAt(0).toUpperCase() + camelAttr.slice(1)}=`;
    });

    return jsx;
  };

  const handleConvert = () => {
    if (!input.trim()) {
      toast({
        title: "Error",
        description: "Please enter some HTML to convert",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = convertHtmlToJsx(input);
      setOutput(result);
      onOutputChange?.(result);
      
      toast({
        title: "Success",
        description: "HTML converted to JSX successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to convert HTML to JSX",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>HTML to JSX Converter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="html-input" className="block text-sm font-medium mb-2">
              HTML Input
            </label>
            <Textarea
              id="html-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter HTML code here..."
              className="h-40 font-mono"
            />
          </div>

          <Button onClick={handleConvert} className="w-full">
            Convert to JSX
          </Button>

          {output && (
            <div>
              <label htmlFor="jsx-output" className="block text-sm font-medium mb-2">
                JSX Output
              </label>
              <Textarea
                id="jsx-output"
                value={output}
                readOnly
                className="h-40 font-mono"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};