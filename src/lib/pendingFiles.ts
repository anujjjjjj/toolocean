const EVENT = "toolocean-files";
let stashed: File[] = [];

export function stashFiles(files: File[]) {
  stashed = files;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: files }));
  }
}

export function takeStashedFiles(): File[] {
  const files = stashed;
  stashed = [];
  return files;
}

export function subscribeStashedFiles(listener: (files: File[]) => void) {
  if (typeof window === "undefined") return () => {};
  const onEvent = (event: Event) => listener((event as CustomEvent<File[]>).detail ?? []);
  window.addEventListener(EVENT, onEvent);
  return () => window.removeEventListener(EVENT, onEvent);
}
