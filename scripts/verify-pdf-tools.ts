/**
 * End-to-end checks for the five new PDF tools' library code.
 *
 * Run with: node scripts/run-verify-pdf-tools.mjs
 *
 * Assertions here are what the PR treats as evidence. The Python half opens the
 * encrypted file with pypdf, which is a normal PDF reader, not our own code.
 */
import { writeFileSync } from "node:fs";
import { PDFDocument as CantooDocument } from "@cantoo/pdf-lib";
import { PDFDocument, PDFName, StandardFonts } from "pdf-lib";
import { applySignatureImage } from "../src/lib/pdf/signPdf";
import { encryptPdf } from "../src/lib/pdf/protectPdf";
import { inspectPdfEncryption, unlockPdf, type PreservedPdfInfo } from "../src/lib/pdf/unlockPdf";
import { readPdfMetadata, stripPdfMetadata, writePdfMetadata } from "../src/lib/pdf/pdfMetadata";
import { fillPdfForm, inspectPdfForm } from "../src/lib/pdf/fillPdfForm";
import { PdfPasswordRejectedError } from "../src/lib/pdf/pdfErrors";

const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function fixture(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([420, 420]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText("Hello fixture", { x: 48, y: 360, size: 18, font });
  doc.setTitle("Probe Title");
  doc.setAuthor("Ada Lovelace");
  doc.setSubject("Payroll");
  doc.setKeywords(["q3", "confidential"]);
  doc.setCreator("Probe Creator");
  doc.setProducer("Probe Producer");
  doc.setCreationDate(new Date(Date.UTC(2020, 0, 2, 3, 4, 5)));
  doc.setModificationDate(new Date(Date.UTC(2020, 5, 7, 8, 9, 10)));

  const form = doc.getForm();
  form.createTextField("full_name").addToPage(page, { x: 48, y: 300, width: 220, height: 22 });
  form.createCheckBox("agree").addToPage(page, { x: 48, y: 260, width: 16, height: 16 });
  const color = form.createRadioGroup("color");
  color.addOptionToPage("red", page, { x: 48, y: 220, width: 14, height: 14 });
  color.addOptionToPage("blue", page, { x: 130, y: 220, width: 14, height: 14 });
  const city = form.createDropdown("city");
  city.addOptions(["London", "Paris", "Oslo"]);
  city.addToPage(page, { x: 48, y: 170, width: 180, height: 22 });

  const xml = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/" xmlns:xmp="http://ns.adobe.com/xap/1.0/"><dc:title><rdf:Alt><rdf:li xml:lang="x-default">XMP Title Marker</rdf:li></rdf:Alt></dc:title><dc:creator><rdf:Seq><rdf:li>XMP Creator Marker</rdf:li></rdf:Seq></dc:creator><pdf:Producer>XMP Producer Marker</pdf:Producer><pdf:Keywords>xmp-keyword</pdf:Keywords><xmp:CreatorTool>XMP Tool Marker</xmp:CreatorTool></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;
  const stream = doc.context.stream(xml, { Type: "Metadata", Subtype: "XML" });
  doc.catalog.set(PDFName.of("Metadata"), doc.context.register(stream));

  return doc.save({ updateFieldAppearances: false });
}

async function main() {
  const plain = await fixture();
  writeFileSync("/tmp/toolocean-plain.pdf", plain);

  const signed = await applySignatureImage(plain, png, {
    pageIndex: 0,
    xRatio: 0.55,
    yRatio: 0.72,
    widthRatio: 0.2,
  });
  writeFileSync("/tmp/toolocean-signed.pdf", signed);
  assert(Buffer.from(signed).includes(Buffer.from("/Image")), "signed PDF should contain an image XObject");

  const report = await readPdfMetadata(plain);
  assert(report.editable.author === "Ada Lovelace", `author was ${report.editable.author}`);
  assert(report.editable.title === "Probe Title", `title was ${report.editable.title}`);
  assert(report.xmp.some((entry) => entry.value.includes("XMP Creator Marker")), "XMP creator missing");
  assert(report.xmp.some((entry) => entry.key === "pdf:Keywords"), "XMP keywords missing");

  const edited = await writePdfMetadata(plain, {
    ...report.editable,
    author: "Grace Hopper",
    title: "Edited Title",
  });
  const editedReport = await readPdfMetadata(edited);
  assert(editedReport.editable.author === "Grace Hopper", "edit did not stick");
  assert(editedReport.xmp.length === 0, "editing info should drop the XMP packet");
  writeFileSync("/tmp/toolocean-meta-edited.pdf", edited);

  const stripped = await stripPdfMetadata(plain);
  const strippedReport = await readPdfMetadata(stripped);
  assert(strippedReport.info.length === 0, `strip left info ${JSON.stringify(strippedReport.info)}`);
  assert(strippedReport.xmp.length === 0, "strip left XMP");
  assert(!Buffer.from(stripped).includes(Buffer.from("XMP Creator Marker")), "XMP marker still in bytes");
  assert(!Buffer.from(stripped).includes(Buffer.from("Ada Lovelace")), "author still in bytes");
  writeFileSync("/tmp/toolocean-stripped.pdf", stripped);

  const fields = await inspectPdfForm(plain);
  const kinds = Object.fromEntries(fields.map((field) => [field.name, field.kind]));
  assert(kinds.full_name === "text", "text field missing");
  assert(kinds.agree === "checkbox", "checkbox missing");
  assert(kinds.color === "radio", "radio missing");
  assert(kinds.city === "dropdown", "dropdown missing");

  const filled = await fillPdfForm(
    plain,
    { full_name: "Grace Hopper", agree: "true", color: "blue", city: "Paris" },
    true,
  );
  const filledDoc = await PDFDocument.load(filled, { updateMetadata: false });
  assert(filledDoc.getForm().getFields().length === 0, "flatten left live fields");
  writeFileSync("/tmp/toolocean-filled.pdf", filled);

  const locked = await encryptPdf(plain, {
    userPassword: "open-me",
    ownerPassword: "owner-me",
    permissions: {
      printing: "lowResolution",
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });
  writeFileSync("/tmp/toolocean-locked.pdf", locked);
  assert((await inspectPdfEncryption(locked)) === "user-password", "locked file should need a password");

  let rejected = false;
  try {
    await unlockPdf(locked, "not-the-password");
  } catch (error) {
    rejected = error instanceof PdfPasswordRejectedError;
  }
  assert(rejected, "wrong password should be rejected once");

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const opened = await pdfjs.getDocument({ data: locked.slice(), password: "open-me" }).promise;
  const meta = await opened.getMetadata();
  const info = meta.info as Record<string, string | undefined>;
  const preserved: PreservedPdfInfo = {
    title: info.Title,
    author: info.Author,
    subject: info.Subject,
    keywords: info.Keywords,
    creator: info.Creator,
    producer: info.Producer,
    creationDate: info.CreationDate,
    modDate: info.ModDate,
  };
  await opened.destroy();

  const unlocked = await unlockPdf(locked, "open-me", preserved);
  writeFileSync("/tmp/toolocean-unlocked.pdf", unlocked);
  assert((await inspectPdfEncryption(unlocked)) === "none", "unlocked file still looks encrypted");
  const unlockedMeta = await readPdfMetadata(unlocked);
  assert(unlockedMeta.editable.author === "Ada Lovelace", `unlock dropped author: ${unlockedMeta.editable.author}`);
  assert(unlockedMeta.editable.title === "Probe Title", "unlock dropped title");

  const restrictedDoc = await CantooDocument.load(plain);
  restrictedDoc.encrypt({
    userPassword: "",
    ownerPassword: "owner-only",
    permissions: { printing: false, modifying: false, copying: false },
  });
  const restricted = await restrictedDoc.save();
  writeFileSync("/tmp/toolocean-restricted.pdf", restricted);
  assert((await inspectPdfEncryption(restricted)) === "owner-only", "empty user password should be owner-only");
  const unrestricted = await unlockPdf(restricted, undefined, preserved);
  writeFileSync("/tmp/toolocean-unrestricted.pdf", unrestricted);
  assert((await inspectPdfEncryption(unrestricted)) === "none", "restrictions were not removed");

  console.log("pdf tool library checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
