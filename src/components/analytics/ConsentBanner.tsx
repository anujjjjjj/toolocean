import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getAnalyticsConsent,
  isAnalyticsConfigured,
  setAnalyticsConsent,
  type ConsentChoice,
} from "@/lib/analytics";

/**
 * Consent prompt for GA4's analytics cookie.
 *
 * Deliberately absent from the prerendered HTML. It renders nothing until after
 * mount, for the same reason ToolWorkbench does: the decision depends on
 * localStorage, which does not exist during the build, so rendering it in the
 * static pass would either guess wrong or produce a hydration mismatch. The
 * useState/useEffect pair makes the server output and the first client render
 * identical, and the banner appears immediately after.
 *
 * The side benefit is that no cookie-notice text lands in the HTML a crawler
 * reads, so it cannot dilute the page's actual content.
 *
 * Declining is a real choice, not a dark pattern: both buttons are the same size
 * and dismiss the banner permanently. Consent Mode already defaults to denied
 * (see src/lib/analytics.ts), so ignoring the banner entirely stores nothing.
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAnalyticsConfigured()) return;
    if (getAnalyticsConsent() !== null) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const choose = (choice: ConsentChoice) => {
    setAnalyticsConsent(choice);
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Analytics cookie notice"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
    >
      <div className="container mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use a single analytics cookie to count visits and see which tools get used.{" "}
          <span className="text-foreground">
            Your files and text never leave your device either way.
          </span>
        </p>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => choose("denied")}>
            Decline
          </Button>
          <Button size="sm" onClick={() => choose("granted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
