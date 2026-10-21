/**
 * Umami Cloud, cookieless page views only.
 *
 * The tracker is a deferred script in index.html. That file is the shell for
 * every prerendered page, so one tag covers the site. It is placed after the
 * app module: deferred scripts run in document order, and the tool bundle is
 * first, so a slow response from cloud.umami.is does not hold hydration.
 * data-domains limits collection to toolocean.co. Localhost and preview hosts
 * still download the script and send nothing.
 *
 * The website id lives in UMAMI_WEBSITE_ID. index.html must use the same value.
 * scripts/umami.test.mjs and scripts/check-umami.mjs fail if the tag drifts.
 *
 * The home-page count is separate. It comes from the public share stats API
 * derived from VITE_UMAMI_SHARE_URL. That variable is unset, so the visitor
 * line stays unmounted. The count is an aggregate. It is not a tracking call,
 * and it does not send a cookie.
 */

export const UMAMI_SCRIPT_SRC = "https://cloud.umami.is/script.js";

/** Umami Cloud website id for toolocean.co. */
export const UMAMI_WEBSITE_ID = "485af8d4-6328-4f5c-adb8-7c5eeabd81cb";

/** Hostnames that send page views. Preview and localhost are excluded. */
export const UMAMI_DOMAINS = "toolocean.co";

/** Below this, the home page shows no visitor line. */
export const VISITOR_THRESHOLD = 100;

function readEnv(name: "VITE_UMAMI_SHARE_URL"): string | undefined {
  const value = import.meta.env?.[name];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

export function umamiWebsiteId(): string {
  return UMAMI_WEBSITE_ID;
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

type UmamiTracker = {
  track: (update: (props: Record<string, string>) => Record<string, string>) => void;
};

/**
 * The deferred tag records the document that loaded it. useSEO also calls this
 * for that same landing view. Skipping the first call keeps the script's own
 * page view as the only one, including when the tag has already executed
 * (it is the next deferred script after the app module). Later client-side
 * routes are recorded here. The payload is the path and title. Tool input is
 * never passed here. If the tag has not defined `umami` yet, the call is a no-op.
 */
let landingViewLeftToScript = false;

export function trackUmamiPageview(path: string, title: string): void {
  if (!isBrowser()) return;
  if (!landingViewLeftToScript) {
    landingViewLeftToScript = true;
    return;
  }
  const umami = (window as Window & { umami?: UmamiTracker }).umami;
  if (!umami) return;
  umami.track((props) => ({ ...props, url: path, title }));
}
