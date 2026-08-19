import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Shared chrome and typography for the About/Privacy/Terms pages.
 *
 * @tailwindcss/typography is a devDependency but is not registered in
 * tailwind.config.ts, so `prose` classes are inert in this project. Rather than
 * wire up the plugin for three pages, the handful of type styles they need are
 * defined here as small components — which also keeps the heading levels correct
 * by construction, since Section always emits an h2.
 */

interface InfoPageLayoutProps {
  title: string;
  /** Shown under the h1 — a one-line summary of what the page covers. */
  intro: string;
  /** Human-readable date, e.g. "18 August 2026". Omitted where meaningless. */
  lastUpdated?: string;
  children: ReactNode;
}

export function InfoPageLayout({ title, intro, lastUpdated, children }: InfoPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{intro}</p>
        {lastUpdated && (
          <p className="mt-6 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        )}

        <div className="mt-10 space-y-10">{children}</div>
      </main>

      <Footer />
    </div>
  );
}

/** A titled section. Wires its heading to the region for assistive tech. */
export function Section({ id, heading, children }: { id: string; heading: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`}>
      <h2
        id={`${id}-heading`}
        className="font-heading text-2xl font-semibold tracking-tight text-foreground"
      >
        {heading}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed text-muted-foreground">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-2 pl-6 leading-relaxed text-muted-foreground">{children}</ul>
  );
}

/** Emphasised inline term — used for the storage keys and similar literals. */
export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
      {children}
    </code>
  );
}
