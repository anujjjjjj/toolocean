import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { subscribeToolSuccess } from "@/lib/toolResult";

/**
 * Shown only after a successful result, and only when VITE_TIP_URL is set.
 * An empty flag renders nothing, including in the header.
 */
export function tipJarUrl(): string {
  const url = import.meta.env.VITE_TIP_URL;
  return typeof url === "string" ? url.trim() : "";
}

export function TipJar() {
  const url = tipJarUrl();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!url) return;
    return subscribeToolSuccess(() => setReady(true));
  }, [url]);

  if (!url || !ready) return null;

  return (
    <p className="paper-tip">
      <Heart className="inline h-3.5 w-3.5" aria-hidden="true" />
      If this saved you a trip to a desktop app,{" "}
      <a href={url} target="_blank" rel="noreferrer">
        leave a tip
      </a>
      . It is optional, and your file still never leaves this tab.
    </p>
  );
}
