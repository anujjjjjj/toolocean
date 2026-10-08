export interface PdfPermissionOptions {
  /** `false` refuses printing. Resolution values match the PDF permission bit. */
  printing: false | "lowResolution" | "highResolution";
  modifying: boolean;
  copying: boolean;
  annotating: boolean;
  fillingForms: boolean;
  contentAccessibility: boolean;
  documentAssembly: boolean;
}

export interface EncryptPdfOptions {
  userPassword: string;
  ownerPassword: string;
  permissions: PdfPermissionOptions;
}

/**
 * Encrypts a PDF with AES-256 (revision 6), the handler ISO 32000-2 recommends.
 *
 * `@cantoo/pdf-lib` is loaded only when this runs, so the encrypt page is the
 * only place that downloads it. The bytes never leave the tab.
 */
export async function encryptPdf(bytes: Uint8Array, options: EncryptPdfOptions): Promise<Uint8Array> {
  if (!options.userPassword) {
    throw new Error("An open password is required.");
  }

  const { PDFDocument } = await import("@cantoo/pdf-lib");
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  doc.encrypt({
    userPassword: options.userPassword,
    ownerPassword: options.ownerPassword || options.userPassword,
    algorithm: "AES-256",
    permissions: {
      printing: options.permissions.printing,
      modifying: options.permissions.modifying,
      copying: options.permissions.copying,
      annotating: options.permissions.annotating,
      fillingForms: options.permissions.fillingForms,
      contentAccessibility: options.permissions.contentAccessibility,
      documentAssembly: options.permissions.documentAssembly,
    },
  });
  return doc.save();
}
