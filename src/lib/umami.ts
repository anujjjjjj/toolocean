/**
 * Umami Cloud, cookieless page views only.
 *
 * The script is not in index.html. That file is the shell for every prerendered
 * page, and a third-party tag there would sit on the critical path. When
 * VITE_UMAMI_WEBSITE_ID is set, the tag is inserted after idle with async and
 * defer, data-website-id, and data-do-not-track="true". When the variable is
 * unset, nothing is inserted and the home-page count is not fetched.
 *
 * The count comes from the public share stats API derived from
 * VITE_UMAMI_SHARE_URL. It is an aggregate. It is not a tracking call, and it
 * does not send a cookie.
 */

const SCRIPT_SRC = "https://cloud.umami.is/script.js";

/** Below this, the home page shows no visitor line. */
export const VISITOR_THRESHOLD = 100;

const IDLE_LOAD_TIMEOUT_MS = 4000;

function readEnv(name: "VITE_UMAMI_WEBSITE_ID" | "VITE_UMAMI_SHARE_URL"): string | undefined {
  const value = import.meta.env?.[name];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

export function umamiWebsiteId(): string | undefined {
  return readEnv("VITE_UMAMI_WEBSITE_ID");
}

export function umamiShareUrl(): string | undefined {
  return readEnv("VITE_UMAMI_SHARE_URL");
}

export function isUmamiConfigured(): boolean {
  return Boolean(umamiWebsiteId());
}

/**
 * Public share page → that share token's stats API.
 *
 * Accepts https://cloud.umami.is/share/<token>/toolocean and a stats URL that
 * already contains /api/share/<token>. The token is the path segment after
 * "share". startAt is the Unix epoch so the figure is the whole history the
 * share exposes, not the last day.
 */
export function umamiStatsUrl(shareUrl: string, now = Date.now()): string | null {
  let url: URL;
  try {
    url = new URL(shareUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const shareAt = parts.indexOf("share");
  const token = shareAt >= 0 ? parts[shareAt + 1] : undefined;
  if (!token || token === "stats") return null;
  const endpoint = new URL(`/api/share/${encodeURIComponent(token)}/stats`, url.origin);
  endpoint.searchParams.set("startAt", "0");
  endpoint.searchParams.set("endAt", String(now));
  return endpoint.toString();
}

/**
 * Umami's stats payload is `{ visitors: { value, prev } }`. Anything else, a
 * failed shape, or a count under the threshold becomes no label, which the
 * home page renders as nothing.
 */
export function visitorLabel(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as { visitors?: { value?: unknown } }).visitors?.value;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const count = Math.floor(value);
  if (count < VISITOR_THRESHOLD) return null;
  return `${count.toLocaleString("en-US")} visitors`;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Never throws. A failed request is the same as no count. */
export async function fetchVisitorLabel(shareUrl: string, fetchImpl: FetchLike = fetch): Promise<string | null> {
  const endpoint = umamiStatsUrl(shareUrl);
  if (!endpoint) return null;
  try {
    const response = await fetchImpl(endpoint, { credentials: "omit", cache: "no-store" });
    if (!response.ok) return null;
    return visitorLabel(await response.json());
  } catch {
    return null;
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

let scriptRequested = false;

function whenIdle(run: () => void): void {
  const requestIdle = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }
  ).requestIdleCallback;
  if (typeof requestIdle === "function") {
    requestIdle(run, { timeout: IDLE_LOAD_TIMEOUT_MS });
  } else {
    window.setTimeout(run, 1500);
  }
}

/**
 * Insert the Cloud script after idle. No-op without a website id, and no-op
 * during prerender.
 */
export function initUmami(): void {
  const websiteId = umamiWebsiteId();
  if (!isBrowser() || !websiteId || scriptRequested) return;
  scriptRequested = true;

  whenIdle(() => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = SCRIPT_SRC;
    script.dataset.websiteId = websiteId;
    script.dataset.doNotTrack = "true";
    document.head.appendChild(script);
  });
}

type UmamiTracker = {
  track: (update: (props: Record<string, string>) => Record<string, string>) => void;
};

/**
 * Record a later route as a page view. The Cloud script's own loader records
 * the first view when it arrives. This only runs once that script has defined
 * `umami`, so an early call from useSEO does not double-count the landing page.
 * The payload is the path and title. Tool input is never passed here.
 */
export function trackUmamiPageview(path: string, title: string): void {
  if (!isBrowser() || !umamiWebsiteId()) return;
  const umami = (window as Window & { umami?: UmamiTracker }).umami;
  if (!umami) return;
  umami.track((props) => ({ ...props, url: path, title }));
}
