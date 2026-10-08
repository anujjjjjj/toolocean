import { PDFDocument as StockPDFDocument } from "pdf-lib";
import { PdfPasswordRejectedError } from "./pdfErrors";

export type EncryptionInspection = "none" | "owner-only" | "user-password";

/** Info-dictionary values read by a viewer that can decrypt, then written back. */
export interface PreservedPdfInfo {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  /** PDF date (`D:YYYYMMDDHHmmSSZ`) or any string `Date` can parse. */
  creationDate?: string;
  modDate?: string;
}

/**
 * Classifies encryption without trying any password except the empty one.
 *
 * An empty user password is how PDFs express "opens, but printing is blocked".
 * Trying it once is the normal way to read that file, not a search.
 */
export async function inspectPdfEncryption(bytes: Uint8Array): Promise<EncryptionInspection> {
  try {
    // Stock pdf-lib refuses a real encryption dictionary and accepts a file whose
    // decrypt-and-save left an inert leftover object. That matches other readers.
    await StockPDFDocument.load(bytes, { updateMetadata: false });
    return "none";
  } catch (error) {
    if (!isEncryptedLoadError(error)) throw error;
  }

  const { PDFDocument } = await import("@cantoo/pdf-lib");
  try {
    await PDFDocument.load(bytes, { password: "", updateMetadata: false });
    return "owner-only";
  } catch (error) {
    if (isEncryptedLoadError(error) || isPasswordFailure(error)) return "user-password";
    throw error;
  }
}

/**
 * Writes a copy with the encryption dictionary removed.
 *
 * When `password` is omitted, the empty user password is tried exactly once,
 * which succeeds for restriction-only files and fails for everything else.
 * There is no second guess.
 */
export async function unlockPdf(
  bytes: Uint8Array,
  password: string | undefined,
  preserved?: PreservedPdfInfo,
): Promise<Uint8Array> {
  const { PDFDocument } = await import("@cantoo/pdf-lib");

  let doc;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (error) {
    if (!isEncryptedLoadError(error)) throw error;
    const attempt = password ?? "";
    try {
      doc = await PDFDocument.load(bytes, { password: attempt, updateMetadata: false });
    } catch (inner) {
      if (isEncryptedLoadError(inner) || isPasswordFailure(inner)) {
        throw new PdfPasswordRejectedError();
      }
      throw inner;
    }
  }

  if (preserved) applyPreservedInfo(doc, preserved);
  return doc.save();
}

function applyPreservedInfo(
  doc: {
    setTitle: (value: string) => void;
    setAuthor: (value: string) => void;
    setSubject: (value: string) => void;
    setKeywords: (value: string[]) => void;
    setCreator: (value: string) => void;
    setProducer: (value: string) => void;
    setCreationDate: (value: Date) => void;
    setModificationDate: (value: Date) => void;
  },
  info: PreservedPdfInfo,
) {
  if (info.title) doc.setTitle(info.title);
  if (info.author) doc.setAuthor(info.author);
  if (info.subject) doc.setSubject(info.subject);
  if (info.keywords) {
    const parts = info.keywords
      .split(/[,;]/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length) doc.setKeywords(parts);
  }
  if (info.creator) doc.setCreator(info.creator);
  if (info.producer) doc.setProducer(info.producer);
  const created = parsePdfDate(info.creationDate);
  if (created) doc.setCreationDate(created);
  const modified = parsePdfDate(info.modDate);
  if (modified) doc.setModificationDate(modified);
}

export function parsePdfDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const match = /^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/.exec(value);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2] ?? "1");
    const day = Number(match[3] ?? "1");
    const hour = Number(match[4] ?? "0");
    const minute = Number(match[5] ?? "0");
    const second = Number(match[6] ?? "0");
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function isPasswordFailure(error: unknown): boolean {
  return error instanceof Error && /password/i.test(error.message);
}

function isEncryptedLoadError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("is encrypted");
}
