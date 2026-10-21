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
 * The home-page count is a different request from the tracker script. The
 * script posts page views to cloud.umami.is. The count is read, after idle,
 * from the public share API on gateway-us.umami.is: one GET for a short-lived
 * share token, then one GET for all-time stats with that token in a header.
 * The old /api/share/<token>/stats path now 404s. The count is an aggregate.
 * It is not a tracking call, and it does not send a cookie. A failed request
 * or a total of zero leaves the line unmounted.
 */

export const UMAMI_SCRIPT_SRC = "https://cloud.umami.is/script.js";

/** Umami Cloud website id for toolocean.co. */
export const UMAMI_WEBSITE_ID = "485af8d4-6328-4f5c-adb8-7c5eeabd81cb";

/** Hostnames that send page views. Preview and localhost are excluded. */
export const UMAMI_DOMAINS = "toolocean.co";

/**
 * Public share page for the home-page visitor total.
 * VITE_UMAMI_SHARE_URL overrides this when a build needs a different share.
 */
export const UMAMI_SHARE_URL = "https://cloud.umami.is/share/zgbDWbwKtfAOBwIa";

/**
 * Share stats API. The tracker script does not call this host.
 * Umami's own dashboard client uses this base. The cloud.umami.is/analytics/us
 * app rewrites to the same API, but the gateway is the one that client calls.
 */
export const UMAMI_SHARE_API = "https://gateway-us.umami.is/api";

/** A total of zero is the same as no line. One or more is shown. */
export const VISITOR_THRESHOLD = 1;

function readEnv(name: "VITE_UMAMI_SHARE_URL"): string | undefined {
  const value = import.meta.env?.[name];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

export function umamiWebsiteId(): string {
  return UMAMI_WEBSITE_ID;
}

export function umamiShareUrl(): string {
  return readEnv("VITE_UMAMI_SHARE_URL") ?? UMAMI_SHARE_URL;
}

export function isUmamiConfigured(): boolean {
  return Boolean(umamiWebsiteId());
}

/**
 * Share page → the slug Umami's share API expects.
 *
 * Accepts https://cloud.umami.is/share/<slug> and the same URL with an extra
 * path segment after the slug. The slug is the path segment after "share".
 */
export function umamiShareSlug(shareUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(shareUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const shareAt = parts.indexOf("share");
  const slug = shareAt >= 0 ? parts[shareAt + 1] : undefined;
  if (!slug || slug === "stats") return null;
  return slug;
}

function visitorCount(body: unknown): number | null {
  if (!body || typeof body !== "object") return null;
  const visitors = (body as { visitors?: unknown }).visitors;
  const value =
    typeof visitors === "number"
      ? visitors
      : visitors && typeof visitors === "object"
        ? (visitors as { value?: unknown }).value
        : undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.floor(value);
}

/**
 * Current share stats are `{ visitors: number, comparison: { visitors } }`.
 * The older `{ visitors: { value } }` shape is still accepted. Anything else,
 * or a count under the threshold, becomes no label, which the home page
 * renders as nothing.
 */
export function visitorLabel(body: unknown): string | null {
  const count = visitorCount(body);
  if (count === null || count < VISITOR_THRESHOLD) return null;
  const noun = count === 1 ? "visitor" : "visitors";
  return `${count.toLocaleString("en-US")} ${noun}`;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type SharePayload = { token?: unknown; websiteId?: unknown };

/**
 * All-time visitor total for a public share.
 *
 * Two GETs, both with credentials omitted:
 *   1. `{UMAMI_SHARE_API}/share/<slug>` returns `{ token, websiteId }`.
 *   2. `{UMAMI_SHARE_API}/websites/<websiteId>/stats?startAt=0&endAt=<now>`
 *      with `x-umami-share-token` set to that token and
 *      `x-umami-share-context: 1`.
 * startAt is the Unix epoch so the figure is the whole history the share
 * exposes, not the last day. Never throws. A failed request is no count.
 */
export async function fetchVisitorLabel(
  shareUrl: string,
  fetchImpl: FetchLike = fetch,
  now = Date.now(),
): Promise<string | null> {
  const slug = umamiShareSlug(shareUrl);
  if (!slug) return null;
  try {
    const shareResponse = await fetchImpl(`${UMAMI_SHARE_API}/share/${encodeURIComponent(slug)}`, {
      credentials: "omit",
      cache: "no-store",
    });
    if (!shareResponse.ok) return null;
    const share = (await shareResponse.json()) as SharePayload;
    if (typeof share.token !== "string" || share.token === "") return null;
    if (typeof share.websiteId !== "string" || share.websiteId === "") return null;

    const stats = new URL(`${UMAMI_SHARE_API}/websites/${encodeURIComponent(share.websiteId)}/stats`);
    stats.searchParams.set("startAt", "0");
    stats.searchParams.set("endAt", String(now));
    const statsResponse = await fetchImpl(stats.toString(), {
      credentials: "omit",
      cache: "no-store",
      headers: {
        "x-umami-share-token": share.token,
        "x-umami-share-context": "1",
      },
    });
    if (!statsResponse.ok) return null;
    return visitorLabel(await statsResponse.json());
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
