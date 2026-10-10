import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CATEGORY_LABEL, toolsInCategory, type CategoryKey } from "@/data/toolCatalog";

/**
 * Category hub title, the existing paragraph, then a one-row ledger.
 * The count is the catalog length for that category. Figures sit in Geist Mono.
 */
export function HubHeader({
  category,
  title,
  description,
  icon: Icon,
}: {
  category: CategoryKey;
  title: string;
  description: ReactNode;
  icon: LucideIcon;
}) {
  const count = toolsInCategory(category).length;
  const name = CATEGORY_LABEL[category].replace(/ Tools$/, "");

  return (
    <section className="text-center">
      <h1 className="mb-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground md:text-[34px]">
        {title}
      </h1>
      <p className="mx-auto mb-4 max-w-2xl text-base leading-snug text-muted-foreground md:text-lg">
        {description}
      </p>
      <div className="hub-ledger" aria-label={`${name}, ${count} tools`}>
        <div>
          <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--ink)]" aria-hidden="true" />
          <span className="font-medium text-[var(--ink)]">{name}</span>
          <span className="font-mono">{count} tools</span>
        </div>
        <div>Runs in your tab</div>
        <div>
          Uploaded <span className="font-mono">0 bytes</span>
        </div>
      </div>
    </section>
  );
}
