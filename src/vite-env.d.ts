/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * GA4 measurement ID, e.g. "G-XXXXXXXXXX". Optional by design, when it is
   * absent (vite dev, or a fork of this repo) every analytics call no-ops and the
   * consent banner never renders. See src/lib/analytics.ts.
   *
   * Not a secret: it ships in the client bundle and identifies the property, not
   * the account. It still lives in an env var so builds of the same source can
   * report to different properties.
   */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /** gtag.js command queue. Created by src/lib/analytics.ts before the tag loads. */
  dataLayer?: unknown[][];
}
