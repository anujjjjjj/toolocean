interface LogoProps {
  className?: string;
}

/**
 * Ink square and two waves. The lower stroke is the ochre mark from the lock;
 * it is a graphic, not text.
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="7" fill="var(--ink)" />
      <path
        d="M4.5 14.5c2.5-3 4.5-3 7.5 0s5 3 7.5 0"
        fill="none"
        stroke="var(--bg)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4.5 10c2.5-3 4.5-3 7.5 0s5 3 7.5 0"
        fill="none"
        stroke="#C99A4B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
