interface LogoProps {
  className?: string;
}

/**
 * The wave mark used as the site favicon (public/favicon.svg), reused here so
 * the header, footer, and homepage show that mark instead of a generic Lucide
 * icon standing in for a logo.
 *
 * It replaced an anchor drawn with 2.1px strokes on a 32px canvas, which held
 * together as a header logo and collapsed into noise at 16px in a browser tab.
 * A single heavy stroke is the most detail that survives a favicon.
 *
 * Filled from --primary so the whole site reads as one accent color.
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7.5" fill="hsl(var(--primary))" />
      <path
        d="M4.2 19.2c3.95 0 3.95-6.4 7.9-6.4s3.95 6.4 7.9 6.4 3.95-6.4 7.9-6.4"
        fill="none"
        stroke="white"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
