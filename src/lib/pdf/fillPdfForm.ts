import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  type PDFField,
} from "pdf-lib";

export type FormFieldKind = "text" | "checkbox" | "radio" | "dropdown" | "option-list" | "unsupported";

export interface FormFieldInfo {
  name: string;
  kind: FormFieldKind;
  readOnly: boolean;
  multiline: boolean;
  maxLength?: number;
  options: string[];
  /** Text, radio and dropdown store a string. Checkboxes store "true" / "false". Option lists store a comma-joined selection. */
  value: string;
  note?: string;
}

export type FormValues = Record<string, string>;

export async function inspectPdfForm(bytes: Uint8Array): Promise<FormFieldInfo[]> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const form = doc.getForm();
  return form.getFields().map(describeField);
}

export async function fillPdfForm(bytes: Uint8Array, values: FormValues, flatten: boolean): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const form = doc.getForm();

  for (const field of form.getFields()) {
    if (field.isReadOnly()) continue;
    const next = values[field.getName()];
    if (next === undefined) continue;
    applyValue(field, next);
  }

  if (flatten) form.flatten();
  else form.updateFieldAppearances();

  return doc.save();
}

function describeField(field: PDFField): FormFieldInfo {
  const base = {
    name: field.getName(),
    readOnly: field.isReadOnly(),
    multiline: false,
    options: [] as string[],
    value: "",
  };

  if (field instanceof PDFTextField) {
    return {
      ...base,
      kind: "text",
      multiline: field.isMultiline(),
      maxLength: field.getMaxLength(),
      value: field.getText() ?? "",
    };
  }
  if (field instanceof PDFCheckBox) {
    return { ...base, kind: "checkbox", value: field.isChecked() ? "true" : "false" };
  }
  if (field instanceof PDFRadioGroup) {
    return {
      ...base,
      kind: "radio",
      options: field.getOptions(),
      value: field.getSelected() ?? "",
    };
  }
  if (field instanceof PDFDropdown) {
    return {
      ...base,
      kind: "dropdown",
      options: field.getOptions(),
      value: field.getSelected()[0] ?? "",
    };
  }
  if (field instanceof PDFOptionList) {
    return {
      ...base,
      kind: "option-list",
      options: field.getOptions(),
      value: field.getSelected().join(", "),
    };
  }

  return {
    ...base,
    kind: "unsupported",
    note: "This field is not a text box, checkbox, radio group, dropdown or option list, so it is left as it was.",
  };
}

function applyValue(field: PDFField, value: string) {
  if (field instanceof PDFTextField) {
    field.setText(value);
    return;
  }
  if (field instanceof PDFCheckBox) {
    if (value === "true") field.check();
    else field.uncheck();
    return;
  }
  if (field instanceof PDFRadioGroup) {
    if (value) field.select(value);
    else field.clear();
    return;
  }
  if (field instanceof PDFDropdown) {
    if (value) field.select(value);
    else field.clear();
    return;
  }
  if (field instanceof PDFOptionList) {
    const selected = value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (selected.length) field.select(selected);
    else field.clear();
  }
}
