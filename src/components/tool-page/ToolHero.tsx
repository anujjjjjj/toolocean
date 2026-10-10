import { ArrowDown, CloudOff, Gitlab, Infinity as InfinityIcon, MonitorSmartphone, ShieldCheck, Upload, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emitToolAction } from "@/lib/toolActions";
import type { ToolBadgeKey, ToolCta, ToolHeroContent } from "@/types/toolContent";

/**
 * Badge copy lives here rather than in per-tool content so the privacy promise
 * is worded identically on all 100+ pages. Inconsistent trust claims read as
 * boilerplate to users and as thin duplication to search engines.
 */
export const BADGES: Record<ToolBadgeKey, { icon: LucideIcon; label: string; title: string }> = {
  "browser-first": {
    icon: MonitorSmartphone,
    label: "Runs in your browser",
    title: "All processing happens locally in this tab using JavaScript.",
  },
  "no-uploads": {
    icon: CloudOff,
    label: "No uploads",
    title: "Your data is never sent to a server. There is no server to send it to.",
  },
  offline: {
    icon: WifiOff,
    label: "Works offline",
    title: "Once the page has loaded you can disconnect and keep working.",
  },
  free: {
    icon: InfinityIcon,
    label: "Unlimited & free",
    title: "No usage caps, no paywall, no file size tiers.",
  },
  "no-signup": {
    icon: ShieldCheck,
    label: "No sign-up",
    title: "No account, no email, no cookies required to use the tool.",
  },
  "open-source": {
    icon: Gitlab,
    label: "Open source",
    title: "The formatting logic is public and auditable.",
  },
};

function CtaButton({ cta, variant }: { cta: ToolCta; variant: "default" | "outline" }) {
  const Icon = cta.action === "upload" ? Upload : ArrowDown;

  return (
    <Button
      size="lg"
      variant={variant}
      onClick={() => emitToolAction({ type: cta.action === "upload" ? "upload" : "focus" })}
      className="h-11 gap-2 px-6 text-[0.9375rem]"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {cta.label}
    </Button>
  );
}

export function ToolHero({ hero }: { hero: ToolHeroContent }) {
  return (
    <section className="border-b border-border">
      <div className="container relative mx-auto max-w-3xl px-4 py-14 text-center sm:py-16">
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {hero.h1}
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {hero.subtitle}
        </p>

        <ul className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {hero.badges.map((key) => {
            const badge = BADGES[key];
            if (!badge) return null;
            const Icon = badge.icon;
            return (
              <li key={key}>
                <span
                  title={badge.title}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {badge.label}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <CtaButton cta={hero.primaryCta} variant="default" />
          {hero.secondaryCta && <CtaButton cta={hero.secondaryCta} variant="outline" />}
        </div>
      </div>
    </section>
  );
}
