import { Moon, Sun, Waves, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";

interface HeaderProps {
  minimal?: boolean;
}

// Tool categories configuration - easy to add more
const toolCategories = [
  { name: "Dev Tools", path: "/dev-tools" },
  { name: "PDF Tools", path: "/pdf-tools" },
  { name: "CSV Tools", path: "/csv-tools" },
  { name: "Audio Tools", path: "/audio-tools" },
  { name: "Image Tools", path: "/image-tools" },
  { name: "Video Tools", path: "/video-tools" },
  { name: "Spreadsheet", path: "/spreadsheet-tools" },
  { name: "Compression", path: "/compression-tools" },
  { name: "Archive", path: "/archive-tools" },
  { name: "Converters", path: "/converter-tools" },
];

export function Header({ minimal = false }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { openPalette } = useCommandPalette();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle('dark', savedDarkMode);
  }, []);

  const isActive = (path: string) => {
    if (path === '/dev-tools') {
      return location.pathname === '/dev-tools' || location.pathname.startsWith('/tools');
    }
    if (path === '/pdf-tools') {
      return location.pathname.startsWith('/pdf-tools');
    }
    if (path === '/csv-tools') {
      return location.pathname.startsWith('/csv-tools');
    }
    if (path === '/audio-tools') return location.pathname.startsWith('/audio-tools');
    if (path === '/image-tools') return location.pathname.startsWith('/image-tools');
    if (path === '/video-tools') return location.pathname.startsWith('/video-tools');
    if (path === '/spreadsheet-tools') return location.pathname.startsWith('/spreadsheet-tools');
    if (path === '/compression-tools') return location.pathname.startsWith('/compression-tools');
    if (path === '/archive-tools') return location.pathname.startsWith('/archive-tools');
    if (path === '/converter-tools') return location.pathname.startsWith('/converter-tools');
    return location.pathname === path;
  };

  const isHomePage = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo - Top Left */}
        <Link
          to="/"
          className="flex items-center space-x-2.5 hover:opacity-70 transition-opacity shrink-0"
          aria-label="ToolOcean home"
        >
          <Waves className="h-5 w-5 text-primary" />
          <span className="text-lg font-heading font-semibold text-foreground">ToolOcean</span>
        </Link>

        {/* Center - Subtle tagline (optional) */}
        <div
          className="hidden lg:flex items-center justify-center flex-1 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <p className="text-xs text-muted-foreground/70">
            Your data never leaves your browser
          </p>
        </div>

        {/* Navigation - Top Right */}
        <nav className="flex items-center gap-1 shrink-0">
          {/* Show individual buttons on larger screens */}
          {/*
            xl, not md: the ten category buttons need ~1,100px of width. Showing
            them from 768px pushed the document to 1,123px wide on an iPad in
            portrait, so the whole page scrolled sideways — which also fails
            Google's mobile-friendly check. Below xl the dropdown below is used.
          */}
          <div className="hidden xl:flex items-center gap-1">
            {toolCategories.map((category) => (
              <Button
                key={category.path}
                variant={isActive(category.path) ? "default" : "ghost"}
                size="sm"
                className={isActive(category.path) ? "" : "text-muted-foreground"}
                asChild
              >
                <Link to={category.path}>{category.name}</Link>
              </Button>
            ))}
          </div>

          {/* Dropdown menu for smaller screens or when many categories exist */}
          <div className="xl:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9">
                  Tools
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {toolCategories.map((category) => (
                  <DropdownMenuItem
                    key={category.path}
                    className={isActive(category.path) ? "bg-accent" : ""}
                    asChild
                  >
                    <Link to={category.path}>{category.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={openPalette}
                className="shrink-0"
                aria-label="Search tools"
              >
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search tools <span className="text-xs text-muted-foreground">(⌘K)</span></p>
            </TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="shrink-0"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
