import {
  AlertTriangle,
  ArrowDownWideNarrow,
  Braces,
  Bug,
  Check,
  CloudOff,
  Code2,
  Cog,
  Database,
  Download,
  FileJson,
  FileSearch,
  Gauge,
  GraduationCap,
  Infinity as InfinityIcon,
  Keyboard,
  Layers,
  Lock,
  Minimize2,
  Network,
  Palette,
  Server,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Wand2,
  WifiOff,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Curated icon registry for content-driven sections.
 *
 * Deliberately an explicit map instead of `import * as Icons from "lucide-react"`.
 * The namespace import defeats tree-shaking and drags the entire ~1,500 icon set
 * into the bundle, which is a measurable LCP/TBT cost on every page.
 */
const ICONS: Record<string, LucideIcon> = {
  AlertTriangle,
  ArrowDownWideNarrow,
  Braces,
  Bug,
  Check,
  CloudOff,
  Code2,
  Cog,
  Database,
  Download,
  FileJson,
  FileSearch,
  Gauge,
  GraduationCap,
  // Exposed under its schema-friendly name; `Infinity` is a global.
  Infinity: InfinityIcon,
  Keyboard,
  Layers,
  Lock,
  Minimize2,
  Network,
  Palette,
  Server,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Wand2,
  WifiOff,
  Wrench,
  Zap,
};

export function resolveIcon(name: string): LucideIcon {
  return ICONS[name] ?? Wrench;
}
