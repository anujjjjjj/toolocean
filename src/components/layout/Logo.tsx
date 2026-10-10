interface LogoProps {
  className?: string;
}

/**
 * Horizon mark: ink tile, paper waves, sun on the waterline.
 * Fills follow the site theme (the `.dark` class), not only the OS scheme,
 * so the header stays correct after the theme toggle. The favicon SVG uses
 * prefers-color-scheme because a browser tab has no site class to read.
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" className="fill-[#16130F] dark:fill-[#F6F1E7]" />
      <path fill="#F2B705" d="M10.5 15.6a5.5 5.5 0 0 1 11 0z" />
      <g
        fill="none"
        strokeWidth="1.8"
        strokeLinecap="round"
        className="stroke-[#F6F1E7] dark:stroke-[#16130F]"
      >
        <path d="M5.2 20.2c1.9-1.9 3.3-1.9 5.2 0s3.3 1.9 5.2 0 3.3-1.9 5.2 0 3.3 1.9 5.2 0" />
        <path d="M5.2 24.8c1.9-1.9 3.3-1.9 5.2 0s3.3 1.9 5.2 0 3.3-1.9 5.2 0 3.3 1.9 5.2 0" />
      </g>
    </svg>
  );
}
