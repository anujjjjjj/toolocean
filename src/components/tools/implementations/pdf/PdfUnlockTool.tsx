import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, Loader2, LockOpen, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadPdf, pdfDownloadName } from "@/lib/pdf/downloadPdf";
import { isPdfPasswordRejected } from "@/lib/pdf/pdfErrors";
import type { EncryptionInspection, PreservedPdfInfo } from "@/lib/pdf/unlockPdf";

const COPY: Record<EncryptionInspection, { title: string; body: string }> = {
    none: {
        title: "No password on this file",
        body: "It opens without a password and this page did not find an owner restriction to remove.",
    },
    "owner-only": {
        title: "Opens already, with restrictions",
        body: "Readers can open this without a password, but an owner password is limiting printing or copying. Removing that does not require guessing. The empty open password is enough.",
    },
    "user-password": {
        title: "A password is required to open this",
        body: "Type the password you already know. One attempt is made. This page does not try other passwords.",
    },
};

export function PdfUnlockTool() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [bytes, setBytes] = useState<Uint8Array | null>(null);
    const [kind, setKind] = useState<EncryptionInspection | null>(null);
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    const onPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.files?.[0];
        event.target.value = "";
        if (!next) return;
        setBusy(true);
        try {
            const data = new Uint8Array(await next.arrayBuffer());
            const { inspectPdfEncryption } = await import("@/lib/pdf/unlockPdf");
            const inspection = await inspectPdfEncryption(data);
            setFile(next);
            setBytes(data);
            setKind(inspection);
            setPassword("");
        } catch (error) {
            toast({
                title: "Could not read that PDF",
                description: error instanceof Error ? error.message : "The file could not be inspected.",
                variant: "destructive",
            });
        } finally {
            setBusy(false);
        }
    };

    const save = async () => {
        if (!file || !bytes || !kind || kind === "none") return;
        if (kind === "user-password" && !password) {
            toast({ title: "Enter the password", variant: "destructive" });
            return;
        }
        setBusy(true);
        try {
            const attempt = kind === "user-password" ? password : undefined;
            const preserved = await readPreservedInfo(bytes, attempt ?? "");
            const { unlockPdf } = await import("@/lib/pdf/unlockPdf");
            const unlocked = await unlockPdf(bytes, attempt, preserved);
            downloadPdf(unlocked, pdfDownloadName(file.name, "unlocked"));
            toast({
                title: "Protection removed",
                description: "The download opens without a password. Info fields that could be read were copied back onto it.",
            });
        } catch (error) {
            toast({
                title: isPdfPasswordRejected(error) ? "That password did not open the file" : "Could not unlock this PDF",
                description: isPdfPasswordRejected(error)
                    ? "Nothing else will be tried. If you do not know the password, the file stays locked."
                    : error instanceof Error ? error.message : "Unlock failed.",
                variant: "destructive",
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed">
                Use this on documents you are allowed to open. It removes a password you already know, or an owner restriction on a file that opens with an empty password. It does not guess, search, or crack passwords.
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onPdf} />
            {!file && (
                <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="pt-6">
                        <button type="button" className="flex w-full flex-col items-center py-10" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                {busy ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-primary" />}
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">Choose your PDF</h3>
                            <p className="text-center text-sm text-muted-foreground">Inspection happens locally. The file is not uploaded.</p>
                        </button>
                    </CardContent>
                </Card>
            )}

            {file && kind && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="flex-1 truncate text-base font-medium">{file.name}</span>
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Change file</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-medium">{COPY[kind].title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{COPY[kind].body}</p>
                        </div>
                        {kind === "user-password" && (
                            <div className="max-w-sm space-y-2">
                                <Label htmlFor="unlock-password">Password</Label>
                                <Input
                                    id="unlock-password"
                                    type="password"
                                    autoComplete="off"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                />
                            </div>
                        )}
                        <Button type="button" onClick={save} disabled={busy || kind === "none"} data-analytics-label="download-unlocked-pdf">
                            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockOpen className="mr-2 h-4 w-4" />}
                            Download unlocked PDF
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

async function readPreservedInfo(bytes: Uint8Array, password: string): Promise<PreservedPdfInfo | undefined> {
    try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.mjs",
            import.meta.url,
        ).toString();
        const pdf = await pdfjs.getDocument({ data: bytes.slice(), password }).promise;
        const meta = await pdf.getMetadata();
        await pdf.destroy();
        const info = meta.info as Record<string, string | undefined>;
        return {
            title: info.Title,
            author: info.Author,
            subject: info.Subject,
            keywords: typeof info.Keywords === "string" ? info.Keywords : undefined,
            creator: info.Creator,
            producer: info.Producer,
            creationDate: info.CreationDate,
            modDate: info.ModDate,
        };
    } catch {
        return undefined;
    }
}
