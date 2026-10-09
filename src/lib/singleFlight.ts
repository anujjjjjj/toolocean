/** Ignores a second activation while the first job is still running, and for a
 *  short cooldown afterwards so a double-click cannot start the job twice. */

export const SINGLE_FLIGHT_COOLDOWN_MS = 500;

export interface ClickGate {
  enter(at?: number): boolean;
  leave(at?: number): void;
}

export function createClickGate(now: () => number = Date.now): ClickGate {
  let pending = false;
  let lockedUntil = 0;

  return {
    enter(at = now()) {
      if (pending || at < lockedUntil) return false;
      pending = true;
      return true;
    },
    leave(at = now()) {
      pending = false;
      lockedUntil = at + SINGLE_FLIGHT_COOLDOWN_MS;
    },
  };
}

export function isPromiseLike(value: unknown): value is Promise<unknown> {
  return typeof value === "object" && value !== null && typeof (value as Promise<unknown>).then === "function";
}
