/**
 * Register the asset-only service worker after load, on idle.
 * Dev skips it so Vite's module server is left alone. HTML is not cached.
 */
export function registerAssetCache(): void {
  if (!import.meta.env.PROD) return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const register = () => {
    void navigator.serviceWorker.register("/sw.js");
  };

  window.addEventListener(
    "load",
    () => {
      const ric = window.requestIdleCallback;
      if (typeof ric === "function") ric(register, { timeout: 5000 });
      else window.setTimeout(register, 3000);
    },
    { once: true },
  );
}
