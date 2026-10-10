/** Circular theme reveal from the toggle. Instant if reduced-motion; 200ms crossfade without View Transitions. */

export type ThemeName = "light" | "dark";

type StartViewTransition = (update: () => void) => { ready: Promise<void> };

const FADE_MS = 200;

export function readTheme(): ThemeName {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function persist(next: ThemeName) {
  const root = document.documentElement;
  root.classList.toggle("dark", next === "dark");
  root.style.colorScheme = next;
  try {
    localStorage.setItem("theme", next);
    localStorage.setItem("darkMode", next === "dark" ? "true" : "false");
  } catch {
    /* Private mode can reject storage. The class is already set. */
  }
}

export function toggleThemeFrom(origin: HTMLElement | null): ThemeName {
  const next: ThemeName = readTheme() === "dark" ? "light" : "dark";
  const commit = () => persist(next);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Must stay bound to document. A bare call throws Illegal invocation and skips the reveal.
  const raw = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition;
  const start = typeof raw === "function" ? raw.bind(document) : undefined;

  if (reduce || !start) {
    if (!reduce) {
      document.documentElement.classList.add("theme-fade");
      setTimeout(() => document.documentElement.classList.remove("theme-fade"), FADE_MS + 40);
    }
    commit();
    return next;
  }

  const box = origin?.getBoundingClientRect();
  const x = box ? box.left + box.width / 2 : innerWidth / 2;
  const y = box ? box.top + box.height / 2 : 0;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

  let transition: { ready: Promise<void> };
  try {
    transition = start(commit);
  } catch {
    commit();
    return next;
  }

  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 550, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" } as KeyframeAnimationOptions,
      );
    })
    .catch(() => {});

  return next;
}
