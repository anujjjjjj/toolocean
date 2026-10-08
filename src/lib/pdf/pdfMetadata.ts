import {
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRawStream,
  PDFRef,
  PDFString,
  type PDFObject,
} from "pdf-lib";

export interface MetadataEntry {
  key: string;
  value: string;
}

export interface PdfMetadataReport {
  info: MetadataEntry[];
  xmp: MetadataEntry[];
  /** Standard Info fields, decoded, for the edit form. Missing keys are "". */
  editable: EditablePdfInfo;
}

export interface EditablePdfInfo {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
}

export async function readPdfMetadata(bytes: Uint8Array): Promise<PdfMetadataReport> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const info = readInfoEntries(doc);
  const xmp = readXmpEntries(doc);
  return {
    info,
    xmp,
    editable: {
      title: doc.getTitle() ?? "",
      author: doc.getAuthor() ?? "",
      subject: doc.getSubject() ?? "",
      keywords: doc.getKeywords() ?? "",
      creator: doc.getCreator() ?? "",
      producer: doc.getProducer() ?? "",
      creationDate: toIso(doc.getCreationDate()),
      modificationDate: toIso(doc.getModificationDate()),
    },
  };
}

export async function writePdfMetadata(bytes: Uint8Array, edited: EditablePdfInfo): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  setOrDelete(doc, "Title", edited.title, (value) => doc.setTitle(value));
  setOrDelete(doc, "Author", edited.author, (value) => doc.setAuthor(value));
  setOrDelete(doc, "Subject", edited.subject, (value) => doc.setSubject(value));
  setOrDelete(doc, "Creator", edited.creator, (value) => doc.setCreator(value));
  setOrDelete(doc, "Producer", edited.producer, (value) => doc.setProducer(value));

  const keywords = edited.keywords
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (keywords.length) doc.setKeywords(keywords);
  else deleteInfoKey(doc, "Keywords");

  const created = edited.creationDate ? new Date(edited.creationDate) : undefined;
  if (created && !Number.isNaN(created.getTime())) doc.setCreationDate(created);
  else deleteInfoKey(doc, "CreationDate");

  const modified = edited.modificationDate ? new Date(edited.modificationDate) : undefined;
  if (modified && !Number.isNaN(modified.getTime())) doc.setModificationDate(modified);
  else deleteInfoKey(doc, "ModDate");

  // A leftover XMP packet is what Acrobat shows when it disagrees with Info.
  // Editing the Info dictionary therefore drops the packet rather than leaving
  // the previous author sitting beside the new one.
  removeXmp(doc);
  return doc.save();
}

export async function stripPdfMetadata(bytes: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const info = infoDict(doc);
  for (const [key] of info.entries()) info.delete(key);
  removeXmp(doc);
  return doc.save();
}

function setOrDelete(doc: PDFDocument, key: string, value: string, write: (value: string) => void) {
  const trimmed = value.trim();
  if (trimmed) write(trimmed);
  else deleteInfoKey(doc, key);
}

function deleteInfoKey(doc: PDFDocument, key: string) {
  infoDict(doc).delete(PDFName.of(key));
}

function infoDict(doc: PDFDocument): PDFDict {
  return (doc as unknown as { getInfoDict(): PDFDict }).getInfoDict();
}

function readInfoEntries(doc: PDFDocument): MetadataEntry[] {
  const entries: MetadataEntry[] = [];
  for (const [key, value] of infoDict(doc).entries()) {
    const name = nameOf(key);
    if (!name) continue;
    const text = textOf(value).trim();
    if (!text) continue;
    entries.push({ key: name, value: text });
  }
  return entries;
}

function readXmpEntries(doc: PDFDocument): MetadataEntry[] {
  const xml = xmpXml(doc);
  if (!xml) return [];

  const found = new Map<string, string>();
  const simple = /<((?:dc|pdf|xmp|photoshop|xmpMM|pdfaid):[A-Za-z0-9]+)>([^<]+)<\/\1>/g;
  for (const match of xml.matchAll(simple)) {
    const value = decodeXml(match[2]).trim();
    if (value) found.set(match[1], value);
  }

  const wrapped = /<((?:dc|pdf|xmp):[A-Za-z0-9]+)>[\s\S]*?<rdf:li[^>]*>([^<]*)<\/rdf:li>/g;
  for (const match of xml.matchAll(wrapped)) {
    const value = decodeXml(match[2]).trim();
    if (value && !found.has(match[1])) found.set(match[1], value);
  }

  return [...found.entries()].map(([key, value]) => ({ key, value }));
}

function xmpXml(doc: PDFDocument): string | null {
  const ref = doc.catalog.get(PDFName.of("Metadata"));
  if (!ref) return null;
  const stream = doc.context.lookup(ref);
  if (!(stream instanceof PDFRawStream)) return null;
  const xml = new TextDecoder("utf-8", { fatal: false }).decode(stream.getContents());
  return xml.includes("<") ? xml : null;
}

function removeXmp(doc: PDFDocument) {
  const ref = doc.catalog.get(PDFName.of("Metadata"));
  doc.catalog.delete(PDFName.of("Metadata"));
  if (ref instanceof PDFRef) doc.context.delete(ref);
}

function nameOf(key: PDFName): string {
  const raw = key.toString();
  return raw.startsWith("/") ? raw.slice(1) : raw;
}

function textOf(value: PDFObject): string {
  if (value instanceof PDFString || value instanceof PDFHexString) return value.decodeText();
  if (value instanceof PDFName) return nameOf(value);
  return String(value);
}

function toIso(date: Date | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
