import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Eraser, FileSearch, FileText, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadPdf, pdfDownloadName } from "@/lib/pdf/downloadPdf";
import type { EditablePdfInfo, PdfMetadataReport } from "@/lib/pdf/pdfMetadata";

const EMPTY: EditablePdfInfo = {
    title: "",
    author: "",
    subject: "",
    keywords: "",
    creator: "",
    producer: "",
    creationDate: "",
    modificationDate: "",
};

export function PdfMetadataTool() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [bytes, setBytes] = useState<Uint8Array | null>(null);
    const [report, setReport] = useState<PdfMetadataReport | null>(null);
    const [edited, setEdited] = useState<EditablePdfInfo>(EMPTY);
    const [busy, setBusy] = useState(false);

    const onPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.files?.[0];
        event.target.value = "";
        if (!next) return;
        try {
            const data = new Uint8Array(await next.arrayBuffer());
            const { readPdfMetadata } = await import("@/lib/pdf/pdfMetadata");
            const found = await readPdfMetadata(data);
            setFile(next);
            setBytes(data);
            setReport(found);
            setEdited(found.editable);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not read that PDF.";
            toast({
                title: message.includes("encrypted") ? "This PDF is encrypted" : "Could not read metadata",
                description: message.includes("encrypted")
                    ? "Unlock it first if you know the password. The Info dictionary of a locked file is not readable here."
                    : message,
                variant: "destructive",
            });
        }
    };

    const download = async (mode: "edit" | "strip") => {
        if (!file || !bytes) return;
        setBusy(true);
        try {
            const { readPdfMetadata, stripPdfMetadata, writePdfMetadata } = await import("@/lib/pdf/pdfMetadata");
            const next = mode === "strip" ? await stripPdfMetadata(bytes) : await writePdfMetadata(bytes, edited);
            downloadPdf(next, pdfDownloadName(file.name, mode === "strip" ? "metadata-removed" : "metadata"));
            const found = await readPdfMetadata(next);
            setBytes(next);
            setReport(found);
            setEdited(found.editable);
            toast({
                title: mode === "strip" ? "Metadata removed" : "Metadata updated",
                description: mode === "strip"
                    ? "Info fields and the XMP packet were removed from the download."
                    : "The download keeps the Info values below. The previous XMP packet was removed so it cannot contradict them.",
            });
        } catch (error) {
            toast({
                title: "Could not write the PDF",
                description: error instanceof Error ? error.message : "Save failed.",
                variant: "destructive",
            });
        } finally {
            setBusy(false);
        }
    };

    const foundCount = (report?.info.length ?? 0) + (report?.xmp.length ?? 0);

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
                            <h3 className="mb-2 text-lg font-semibold">Choose a PDF</h3>
                            <p className="text-center text-sm text-muted-foreground">Metadata is read in this tab. The file is not uploaded.</p>
                        </button>
                    </CardContent>
                </Card>
            )}

            {file && report && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <FileSearch className="h-5 w-5 text-primary" />
                                <span className="flex-1 truncate text-base font-medium">{file.name}</span>
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Change file</Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {foundCount === 0
                                    ? "Nothing was found in the Info dictionary or in an XMP packet."
                                    : `Found ${foundCount} field${foundCount === 1 ? "" : "s"} across the Info dictionary and XMP.`}
                            </p>
                        </CardContent>
                    </Card>

                    <ReportTable title="Info dictionary" rows={report.info} empty="No Info fields." />
                    <ReportTable title="XMP" rows={report.xmp} empty="No XMP packet, or it had none of the usual fields." />

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="h-5 w-5" />
                                Edit Info fields
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Field id="meta-title" label="Title" value={edited.title} onChange={(title) => setEdited({ ...edited, title })} />
                            <Field id="meta-author" label="Author" value={edited.author} onChange={(author) => setEdited({ ...edited, author })} />
                            <Field id="meta-subject" label="Subject" value={edited.subject} onChange={(subject) => setEdited({ ...edited, subject })} />
                            <Field id="meta-keywords" label="Keywords" value={edited.keywords} onChange={(keywords) => setEdited({ ...edited, keywords })} />
                            <Field id="meta-creator" label="Creator" value={edited.creator} onChange={(creator) => setEdited({ ...edited, creator })} />
                            <Field id="meta-producer" label="Producer" value={edited.producer} onChange={(producer) => setEdited({ ...edited, producer })} />
                            <Field id="meta-created" label="Created" type="datetime-local" value={edited.creationDate} onChange={(creationDate) => setEdited({ ...edited, creationDate })} />
                            <Field id="meta-modified" label="Modified" type="datetime-local" value={edited.modificationDate} onChange={(modificationDate) => setEdited({ ...edited, modificationDate })} />
                            <p className="sm:col-span-2 text-sm text-muted-foreground">
                                Clearing a box removes that Info field. Saving also drops the XMP packet, because a reader will often prefer the old XMP author over the Info value you just changed. Words drawn on the page itself are not metadata and stay where they are.
                            </p>
                            <div className="flex flex-wrap gap-2 sm:col-span-2">
                                <Button type="button" onClick={() => download("edit")} disabled={busy} data-analytics-label="download-edited-metadata">
                                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    Download with these fields
                                </Button>
                                <Button type="button" variant="outline" onClick={() => download("strip")} disabled={busy} data-analytics-label="download-stripped-metadata">
                                    <Eraser className="mr-2 h-4 w-4" />
                                    Strip all metadata
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

function ReportTable({ title, rows, empty }: { title: string; rows: { key: string; value: string }[]; empty: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{empty}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="py-2 pr-4 font-medium">Field</th>
                                    <th className="py-2 font-medium">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={`${row.key}-${row.value}`} className="border-b border-border/60">
                                        <th className="py-2 pr-4 font-normal text-muted-foreground">{row.key}</th>
                                        <td className="py-2 break-all">{row.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function Field({
    id,
    label,
    value,
    onChange,
    type = "text",
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
        </div>
    );
}
