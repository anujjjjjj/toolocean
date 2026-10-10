import { Branch as DismissableLayerBranch } from "@radix-ui/react-dismissable-layer";
import { Moon, Search, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import { TOOL_CATALOG } from "@/data/toolCatalog";
import { readTheme, toggleThemeFrom, type ThemeName } from "@/lib/themeTransition";
import { Logo } from "./Logo";
import { tipJarUrl } from "./TipJar";

interface HeaderProps {
  minimal?: boolean;
}

export function Header({ minimal = false }: HeaderProps) {
  const { openPalette } = useCommandPalette();
  const [theme, setTheme] = useState<ThemeName>("light");
  const themeButton = useRef<HTMLButtonElement>(null);
  const tipUrl = tipJarUrl();
  const shortcut = "⌘K";

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const toggleTheme = () => {
    setTheme(toggleThemeFrom(themeButton.current));
  };

  return (
    <header className="pointer-events-auto sticky top-0 z-[60] border-b border-border bg-background">
      <DismissableLayerBranch className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center gap-2.5 px-5 py-2.5 md:h-14 md:flex-nowrap md:gap-6 md:px-8 md:py-0">
        <Link to="/" className="flex items-center gap-2 text-[17px] font-semibold leading-none tracking-[-0.02em] text-foreground" aria-label="ToolOcean home">
          <Logo className="h-7 w-7 shrink-0" />
          <span>ToolOcean</span>
        </Link>

        {!minimal && (
          <button
            type="button"
            onClick={openPalette}
            data-palette-trigger=""
            className="order-3 flex h-9 w-full items-center gap-2 rounded-[10px] border border-border bg-secondary px-3 text-left text-sm text-muted-foreground md:order-none md:ml-4 md:max-w-[460px] md:flex-1"
            aria-label={`Search ${TOOL_CATALOG.length} tools`}
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">Search {TOOL_CATALOG.length} tools</span>
            <kbd className="font-mono hidden rounded border border-border bg-card px-1.5 text-[11px] leading-[18px] sm:inline">{shortcut}</kbd>
          </button>
        )}

        <nav className="ml-auto flex items-center gap-2" aria-label="Site">
          <Link to="/all-tools" className="hidden h-9 items-center rounded-[10px] px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground md:inline-flex">
            All tools
          </Link>
          {tipUrl && (
            <a href={tipUrl} className="hidden h-9 items-center rounded-[10px] px-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground md:inline-flex">
              Tip jar
            </a>
          )}
          <button
            ref={themeButton}
            type="button"
            className="theme-toggle inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={theme === "dark"}
          >
            <span className="dark:hidden"><Moon className="h-4 w-4" aria-hidden="true" /></span>
            <span className="hidden dark:inline-flex"><Sun className="h-4 w-4" aria-hidden="true" /></span>
          </button>
        </nav>
      </DismissableLayerBranch>
    </header>
  );
}
