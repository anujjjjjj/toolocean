import { useEffect, type RefObject } from "react";
import { subscribeStashedFiles, takeStashedFiles } from "@/lib/pendingFiles";

function applyFiles(input: HTMLInputElement, files: File[]) {
  if (!files.length) return;
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * The shell dropzone stays on the page. Files chosen there are replayed onto
 * the tool's own input, including picks that happen after the chunk mounts.
 */
export function useStashedFileInput(inputRef: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const input = inputRef.current;
    if (input) applyFiles(input, takeStashedFiles());
    return subscribeStashedFiles((files) => {
      const node = inputRef.current;
      if (node) applyFiles(node, files);
    });
  }, [inputRef]);
}
