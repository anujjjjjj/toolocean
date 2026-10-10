import { Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import { TOOL_CATALOG } from "@/data/toolCatalog";
import { Logo } from "./Logo";
import { tipJarUrl } from "./TipJar";

interface HeaderProps {
  minimal?: boolean;
}

export function Header({ minimal = false }: HeaderProps) {
  const { openPalette } = useCommandPalette();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const tipUrl = tipJarUrl();
  const shortcut = "⌘K";

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
    localStorage.setItem("theme", next);
    localStorage.setItem("darkMode", next === "dark" ? "true" : "false");
    setTheme(next);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center gap-2.5 px-5 py-2.5 md:h-14 md:flex-nowrap md:gap-6 md:px-8 md:py-0">
        <Link to="/" className="flex items-center gap-2.5 text-base font-semibold tracking-tight" aria-label="ToolOcean home">
          <Logo className="h-6 w-6" />
          <span>ToolOcean</span>
        </Link>

        {!minimal && (
          <button
            type="button"
            onClick={openPalette}
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
            type="button"
            className="theme inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            aria-pressed={theme === "dark"}
          >
            <span className="moon dark:hidden"><Moon className="h-4 w-4" /></span>
            <span className="sun hidden dark:inline-flex"><Sun className="h-4 w-4" /></span>
          </button>
        </nav>
      </div>
    </header>
  );
}
