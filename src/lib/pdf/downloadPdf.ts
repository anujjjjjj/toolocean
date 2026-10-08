/** Saves bytes as a PDF download. Nothing is sent over the network. */
export function downloadPdf(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function pdfDownloadName(original: string, suffix: string): string {
  const base = original.replace(/\.pdf$/i, "") || "document";
  return `${base}-${suffix}.pdf`;
}
