import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2, Lock, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { encryptPdf, type PdfPermissionOptions } from "@/lib/pdf/protectPdf";
import { downloadPdf, pdfDownloadName } from "@/lib/pdf/downloadPdf";

const DEFAULT_PERMISSIONS: PdfPermissionOptions = {
    printing: "highResolution",
    modifying: true,
    copying: true,
    annotating: true,
    fillingForms: true,
    contentAccessibility: true,
    documentAssembly: true,
};

export function PdfEncryptTool() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [bytes, setBytes] = useState<Uint8Array | null>(null);
    const [userPassword, setUserPassword] = useState("");
    const [userConfirm, setUserConfirm] = useState("");
    const [ownerPassword, setOwnerPassword] = useState("");
    const [ownerConfirm, setOwnerConfirm] = useState("");
    const [permissions, setPermissions] = useState<PdfPermissionOptions>(DEFAULT_PERMISSIONS);
    const [busy, setBusy] = useState(false);

    const restricted = !permissions.modifying || !permissions.copying || !permissions.annotating
        || !permissions.fillingForms || !permissions.contentAccessibility || !permissions.documentAssembly
        || permissions.printing !== "highResolution";

    const onPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.files?.[0];
        event.target.value = "";
        if (!next) return;
        try {
            const data = new Uint8Array(await next.arrayBuffer());
            const { PDFDocument } = await import("pdf-lib");
            await PDFDocument.load(data, { updateMetadata: false });
            setFile(next);
            setBytes(data);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not read that PDF.";
            toast({
                title: message.includes("encrypted") ? "This PDF is already encrypted" : "Could not open the PDF",
                description: message.includes("encrypted")
                    ? "Unlock it first if you know the password, then protect the copy."
                    : message,
                variant: "destructive",
            });
        }
    };

    const save = async () => {
        if (!file || !bytes) return;
        if (!userPassword) {
            toast({ title: "Enter an open password", variant: "destructive" });
            return;
        }
        if (userPassword !== userConfirm) {
            toast({ title: "The open passwords do not match", variant: "destructive" });
            return;
        }
        if (ownerPassword !== ownerConfirm) {
            toast({ title: "The owner passwords do not match", variant: "destructive" });
            return;
        }
        if (restricted && (!ownerPassword || ownerPassword === userPassword)) {
            toast({
                title: "Permission limits need a separate owner password",
                description: "Someone who opens the file with the owner password bypasses the checkboxes. Set an owner password that differs from the open password, or leave every permission allowed.",
                variant: "destructive",
            });
            return;
        }

        setBusy(true);
        try {
            const encrypted = await encryptPdf(bytes, {
                userPassword,
                ownerPassword: ownerPassword || userPassword,
                permissions,
            });
            downloadPdf(encrypted, pdfDownloadName(file.name, "protected"));
            toast({
                title: "Password applied",
                description: "The download is AES-256 encrypted. Open it in a PDF reader to confirm it asks for the password.",
            });
        } catch (error) {
            toast({
                title: "Could not encrypt this PDF",
                description: error instanceof Error ? error.message : "Encryption failed.",
                variant: "destructive",
            });
        } finally {
            setBusy(false);
        }
    };

    const toggle = (key: keyof PdfPermissionOptions, checked: boolean) => {
        setPermissions((current) => ({ ...current, [key]: checked }));
    };

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
                            <h3 className="mb-2 text-lg font-semibold">Choose a PDF to protect</h3>
                            <p className="text-center text-sm text-muted-foreground">Encryption runs in this tab. The password is not sent anywhere.</p>
                        </button>
                    </CardContent>
                </Card>
            )}

            {file && bytes && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="flex-1 truncate text-base font-medium">{file.name}</span>
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Change file</Button>
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Lock className="h-5 w-5" />
                                Passwords
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="user-password">Open password</Label>
                                <Input id="user-password" type="password" autoComplete="off" value={userPassword} onChange={(event) => setUserPassword(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="user-confirm">Confirm open password</Label>
                                <Input id="user-confirm" type="password" autoComplete="off" value={userConfirm} onChange={(event) => setUserConfirm(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="owner-password">Owner password, optional</Label>
                                <Input id="owner-password" type="password" autoComplete="off" value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="owner-confirm">Confirm owner password</Label>
                                <Input id="owner-confirm" type="password" autoComplete="off" value={ownerConfirm} onChange={(event) => setOwnerConfirm(event.target.value)} />
                            </div>
                            <p className="sm:col-span-2 text-sm text-muted-foreground">
                                The open password is what a reader asks for. Leave the owner password empty and it is set to the same value, which means the permission checkboxes below do not bind the person who can open the file. Set a different owner password when you want those limits to apply.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">What the open password is allowed to do</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="max-w-xs space-y-2">
                                <Label>Printing</Label>
                                <Select
                                    value={permissions.printing === false ? "none" : permissions.printing}
                                    onValueChange={(value) => setPermissions((current) => ({
                                        ...current,
                                        printing: value === "none" ? false : value as "lowResolution" | "highResolution",
                                    }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="highResolution">High resolution</SelectItem>
                                        <SelectItem value="lowResolution">Low resolution only</SelectItem>
                                        <SelectItem value="none">Not allowed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <PermissionRow id="perm-copy" label="Copy text and graphics" checked={permissions.copying} onCheckedChange={(checked) => toggle("copying", checked)} />
                            <PermissionRow id="perm-modify" label="Modify page content" checked={permissions.modifying} onCheckedChange={(checked) => toggle("modifying", checked)} />
                            <PermissionRow id="perm-notes" label="Add or edit annotations" checked={permissions.annotating} onCheckedChange={(checked) => toggle("annotating", checked)} />
                            <PermissionRow id="perm-forms" label="Fill in forms" checked={permissions.fillingForms} onCheckedChange={(checked) => toggle("fillingForms", checked)} />
                            <PermissionRow id="perm-access" label="Accessibility extraction" checked={permissions.contentAccessibility} onCheckedChange={(checked) => toggle("contentAccessibility", checked)} />
                            <PermissionRow id="perm-assemble" label="Assemble pages" checked={permissions.documentAssembly} onCheckedChange={(checked) => toggle("documentAssembly", checked)} />
                            <Button type="button" onClick={save} disabled={busy} data-analytics-label="download-encrypted-pdf">
                                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Download protected PDF
                            </Button>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

function PermissionRow({
    id,
    label,
    checked,
    onCheckedChange,
}: {
    id: string;
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center gap-3">
            <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
            <Label htmlFor={id} className="font-normal">{label}</Label>
        </div>
    );
}
