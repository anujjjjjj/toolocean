import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download, FileText, ListChecks, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadPdf, pdfDownloadName } from "@/lib/pdf/downloadPdf";
import { fillPdfForm, inspectPdfForm, type FormFieldInfo, type FormValues } from "@/lib/pdf/fillPdfForm";

export function PdfFormFillTool() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [bytes, setBytes] = useState<Uint8Array | null>(null);
    const [fields, setFields] = useState<FormFieldInfo[]>([]);
    const [values, setValues] = useState<FormValues>({});
    const [flatten, setFlatten] = useState(true);
    const [busy, setBusy] = useState(false);

    const onPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.files?.[0];
        event.target.value = "";
        if (!next) return;
        try {
            const data = new Uint8Array(await next.arrayBuffer());
            const found = await inspectPdfForm(data);
            setFile(next);
            setBytes(data);
            setFields(found);
            setValues(Object.fromEntries(found.map((field) => [field.name, field.value])));
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not read that PDF.";
            toast({
                title: message.includes("encrypted") ? "This PDF is encrypted" : "Could not read the form",
                description: message.includes("encrypted")
                    ? "Unlock it first if you know the password, then fill the unlocked copy."
                    : message,
                variant: "destructive",
            });
        }
    };

    const setValue = (name: string, value: string) => {
        setValues((current) => ({ ...current, [name]: value }));
    };

    const save = async () => {
        if (!file || !bytes) return;
        setBusy(true);
        try {
            const filled = await fillPdfForm(bytes, values, flatten);
            downloadPdf(filled, pdfDownloadName(file.name, flatten ? "filled-flat" : "filled"));
            toast({
                title: flatten ? "Form filled and flattened" : "Form filled",
                description: flatten
                    ? "The values are drawn into the page and the fields are no longer editable."
                    : "The fields still exist, with the values you entered.",
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not fill the form.";
            toast({
                title: "Could not fill this form",
                description: message.includes("WinAnsi") || message.includes("encode")
                    ? "One of the values uses a character the standard PDF font cannot draw. Try letters and numbers from the Latin alphabet."
                    : message,
                variant: "destructive",
            });
        } finally {
            setBusy(false);
        }
    };

    const fillable = fields.filter((field) => field.kind !== "unsupported");

    return (
        <div className="space-y-6">
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onPdf} />
            {!file && (
                <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="pt-6">
                        <button type="button" className="flex w-full flex-col items-center py-10" onClick={() => fileInputRef.current?.click()}>
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">Choose a PDF form</h3>
                            <p className="text-center text-sm text-muted-foreground">AcroForm fields are read in this tab. The file is not uploaded.</p>
                        </button>
                    </CardContent>
                </Card>
            )}

            {file && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="flex-1 truncate text-base font-medium">{file.name}</span>
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Change file</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {fillable.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No AcroForm text, checkbox, radio, or dropdown fields were found. A form built as XFA, or a page that only looks like a form because someone drew lines on it, cannot be filled here.
                            </p>
                        ) : (
                            fillable.map((field) => (
                                <FieldControl key={field.name} field={field} value={values[field.name] ?? ""} onChange={(value) => setValue(field.name, value)} />
                            ))
                        )}

                        {fields.some((field) => field.kind === "unsupported") && (
                            <p className="text-sm text-muted-foreground">
                                {fields.filter((field) => field.kind === "unsupported").length} other field
                                {fields.filter((field) => field.kind === "unsupported").length === 1 ? "" : "s"}
                                {" "}(usually a button or a signature field) left unchanged. A visual mark belongs on the sign tool, and it is still not a certified signature.
                            </p>
                        )}

                        <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-3">
                            <div>
                                <Label htmlFor="flatten-form">Flatten after filling</Label>
                                <p className="text-sm text-muted-foreground">Draws the values into the page and removes the fields, so the next person cannot edit them.</p>
                            </div>
                            <Switch id="flatten-form" checked={flatten} onCheckedChange={setFlatten} />
                        </div>

                        <Button type="button" onClick={save} disabled={busy || fillable.length === 0} data-analytics-label="download-filled-pdf">
                            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : flatten ? <Download className="mr-2 h-4 w-4" /> : <ListChecks className="mr-2 h-4 w-4" />}
                            {flatten ? "Download filled, flat PDF" : "Download filled PDF"}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function FieldControl({
    field,
    value,
    onChange,
}: {
    field: FormFieldInfo;
    value: string;
    onChange: (value: string) => void;
}) {
    const disabled = field.readOnly;
    return (
        <div className="space-y-2">
            <Label htmlFor={`field-${field.name}`}>
                {field.name}
                {disabled ? " (read only)" : ""}
            </Label>
            {field.kind === "text" && field.multiline && (
                <Textarea id={`field-${field.name}`} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
            )}
            {field.kind === "text" && !field.multiline && (
                <Input
                    id={`field-${field.name}`}
                    value={value}
                    disabled={disabled}
                    maxLength={field.maxLength}
                    onChange={(event) => onChange(event.target.value)}
                />
            )}
            {field.kind === "checkbox" && (
                <div className="flex items-center gap-2">
                    <Checkbox
                        id={`field-${field.name}`}
                        checked={value === "true"}
                        disabled={disabled}
                        onCheckedChange={(checked) => onChange(checked === true ? "true" : "false")}
                    />
                    <span className="text-sm text-muted-foreground">Checked</span>
                </div>
            )}
            {(field.kind === "radio" || field.kind === "dropdown") && (
                <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
                    <SelectTrigger id={`field-${field.name}`}><SelectValue placeholder="Choose" /></SelectTrigger>
                    <SelectContent>
                        {field.options.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            {field.kind === "option-list" && (
                <div className="space-y-2">
                    {field.options.map((option) => {
                        const selected = value.split(",").map((part) => part.trim()).filter(Boolean);
                        const on = selected.includes(option);
                        return (
                            <div key={option} className="flex items-center gap-2">
                                <Checkbox
                                    id={`field-${field.name}-${option}`}
                                    checked={on}
                                    disabled={disabled}
                                    onCheckedChange={(checked) => {
                                        const next = new Set(selected);
                                        if (checked === true) next.add(option);
                                        else next.delete(option);
                                        onChange([...next].join(", "));
                                    }}
                                />
                                <Label htmlFor={`field-${field.name}-${option}`} className="font-normal">{option}</Label>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
