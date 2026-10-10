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

/**
 * Replay a shell drop onto the first real file input inside a container.
 * The tool chunk often mounts later, so a pending list is retried when
 * that input appears.
 */
export function useStashedFileRoot(rootRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;

    const findInput = () =>
      [...root.querySelectorAll<HTMLInputElement>('input[type="file"]')].find(
        (el) => !el.closest(".paper-drop"),
      );

    let pending = takeStashedFiles();
    const flush = (files?: File[]) => {
      if (files) pending = files;
      const input = findInput();
      if (!input || !pending.length) return;
      const next = pending;
      pending = [];
      applyFiles(input, next);
    };

    flush();
    const unsub = subscribeStashedFiles((files) => flush(files));
    const observer = new MutationObserver(() => flush());
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      unsub();
      observer.disconnect();
    };
  }, [rootRef, enabled]);
}
