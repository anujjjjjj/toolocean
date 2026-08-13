/**
 * Google Analytics 4, wired for a site whose entire pitch is that nothing leaves
 * the browser.
 *
 * Three deliberate departures from the snippet Google hands you:
 *
 *   1. **The tag is not in index.html.** That template is the base for all 125
 *      prerendered pages, so a hard-coded script there would put a third-party
 *      origin on the critical path of every one of them — undoing the CWV work
 *      documented in docs/SEO.md. It is injected from here, on idle, after the
 *      page is interactive. gtag.js is therefore never competing with the LCP.
 *
 *   2. **Consent Mode v2 defaults to denied.** GA4 still receives cookieless
 *      pings in that state and models the aggregate, so traffic reporting works
 *      before anyone touches the banner, but no identifier is stored until they
 *      opt in. `wait_for_update` holds the first hits briefly so a fast accept
 *      is not raced by the initial page_view.
 *
 *   3. **Advertising storage is never granted.** There are no ads and no
 *      remarketing, so those signals stay denied even after consent. Only
 *      `analytics_storage` flips.
 *
 * Events queue in `dataLayer` whether or not gtag.js has landed — it drains the
 * queue on load — so callers never have to care about load order.
 *
 * Nothing here sends user content. The tools' inputs are the one thing this site
 * promises never to transmit; see useWorkbenchAnalytics for how interactions are
 * reduced to a slug and a static control label.
 */

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

const CONSENT_STORAGE_KEY = "toolOcean.analyticsConsent";

/** How long gtag holds hits waiting for a consent update, in ms. */
const CONSENT_UPDATE_GRACE_MS = 500;

/** Cap on how long we wait for an idle window before loading anyway. */
const IDLE_LOAD_TIMEOUT_MS = 4000;

export type ConsentChoice = "granted" | "denied";

export type AnalyticsParams = Record<string, string | number | boolean>;

let initialized = false;
let scriptRequested = false;

/**
 * Path of the most recent page_view.
 *
 * useSEO's effect can re-run for a reason other than navigation (and does run
 * twice under StrictMode in dev), which would double-count. Comparing against
 * only the *previous* path still records A → B → A as two views of A, which is
 * correct; it suppresses just the consecutive duplicate.
 */
let lastTrackedPath: string | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * False when no measurement ID is configured — the case in `vite dev` and in any
 * fork of this repo. Every export below becomes a no-op, and the consent banner
 * stays hidden, so there is nothing to opt out of.
 */
export function isAnalyticsConfigured(): boolean {
  return Boolean(MEASUREMENT_ID);
}

function gtag(...args: unknown[]): void {
  if (!isBrowser()) return;
  // gtag.js reads pushed values as array-like, so an array behaves exactly as
  // the official snippet's `arguments` object does.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/** localStorage throws outright in Safari private mode, so every access is guarded. */
function readStoredConsent(): ConsentChoice | null {
  if (!isBrowser()) return null;
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored === "granted" || stored === "denied" ? stored : null;
  } catch {
    return null;
  }
}

/** null when the visitor has not answered the banner yet. */
export function getAnalyticsConsent(): ConsentChoice | null {
  return readStoredConsent();
}

/**
 * Record the visitor's choice and tell gtag about it.
 *
 * Only `analytics_storage` moves. Granting the advertising signals would be
 * claiming a purpose this site does not have.
 */
export function setAnalyticsConsent(choice: ConsentChoice): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // A visitor with storage blocked keeps the denied default, which is the
    // outcome they were asking for anyway.
  }

  if (!MEASUREMENT_ID) return;
  gtag("consent", "update", { analytics_storage: choice });
}

function loadTagWhenIdle(): void {
  if (scriptRequested || !MEASUREMENT_ID) return;
  scriptRequested = true;

  const load = () => {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
  };

  // Not in the TS DOM lib on every target, and absent in Safari.
  const requestIdle = (
    window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }
  ).requestIdleCallback;

  if (typeof requestIdle === "function") {
    requestIdle(load, { timeout: IDLE_LOAD_TIMEOUT_MS });
  } else {
    window.setTimeout(load, 2000);
  }
}

/**
 * Set up the dataLayer and consent state, then schedule the tag.
 *
 * Called from main.tsx before hydration so the consent defaults are in the queue
 * ahead of the first page_view, which useSEO fires from an effect.
 */
export function initAnalytics(): void {
  if (!isBrowser() || !MEASUREMENT_ID || initialized) return;
  initialized = true;

  gtag("js", new Date());

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: CONSENT_UPDATE_GRACE_MS,
  });

  // send_page_view: false because this is a single-page app — the tag would only
  // ever see the entry URL. trackPageview() handles every route instead.
  gtag("config", MEASUREMENT_ID, { send_page_view: false });

  if (readStoredConsent() === "granted") {
    gtag("consent", "update", { analytics_storage: "granted" });
  }

  loadTagWhenIdle();
}

/**
 * @param path  Canonical route path, e.g. "/json-formatter". Taken from the SEO
 *              input rather than location.pathname so query strings and stray
 *              trailing slashes cannot fragment the report.
 * @param title Resolved document title, passed in by useSEO because it sets the
 *              title in the same effect — reading document.title here would race
 *              a lazily-loaded route and report the previous page's title.
 */
export function trackPageview(path: string, title: string): void {
  if (!isBrowser() || !MEASUREMENT_ID) return;
  if (path === lastTrackedPath) return;
  lastTrackedPath = path;

  gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: title,
  });
}

export function trackEvent(name: string, params?: AnalyticsParams): void {
  if (!isBrowser() || !MEASUREMENT_ID) return;
  gtag("event", name, params ?? {});
}
