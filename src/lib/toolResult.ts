const EVENT = "toolocean-result";

/** Tools call this after a successful result. The tip jar listens; nothing else does. */
export function markToolSuccess() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeToolSuccess(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
