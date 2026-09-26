interface LogoProps {
  className?: string;
}

/**
 * The anchor mark used as the site favicon (public/favicon.svg), reused here so
 * the header, footer, and homepage show that mark instead of a generic Lucide
 * icon standing in for a logo.
 *
 * Filled from --primary so the whole site reads as one accent color.
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
      <g stroke="white" strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="10" r="2.4" fill="white" stroke="none" />
        <path d="M16 13v13" />
        <path d="M11 16h10" />
        <path d="M9 20c0 4 3 6 7 6s7-2 7-6" />
      </g>
    </svg>
  );
}
