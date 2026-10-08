/** Thrown when a PDF cannot be opened without a password the caller did not supply. */
export class PdfPasswordRequiredError extends Error {
  constructor() {
    super("This PDF needs a password to open.");
    this.name = "PdfPasswordRequiredError";
  }
}

/** Thrown when the single supplied password does not open the file. */
export class PdfPasswordRejectedError extends Error {
  constructor() {
    super("That password did not open the file.");
    this.name = "PdfPasswordRejectedError";
  }
}

export function isPdfPasswordRejected(error: unknown): boolean {
  return error instanceof PdfPasswordRejectedError;
}
