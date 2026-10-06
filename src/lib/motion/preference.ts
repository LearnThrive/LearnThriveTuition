/**
 * The visitor's motion preference: System (follow the device, the default) or Reduce.
 *
 * REDUCE ALWAYS WINS. A "Reduce" choice is a second way to switch on exactly what `prefers-reduced-motion`
 * switches on: the capability store reports the "reduced" tier, Motion is told to skip spatial animation,
 * and the blanket CSS rule in globals.css applies under `html[data-motion="reduce"]`. There is no "full
 * motion" choice that overrides a device reduced-motion setting.
 *
 * This is the storage-free subset of the Software project's module. This site has no motion control and
 * nothing here reads or writes the browser's storage, so the preference is always "system" unless
 * something sets `html[data-motion="reduce"]` for the page view. A control that remembered the choice
 * would need the cookie notice and its legal review updated first (docs/PLAN15_PORT_LIST.md, D2); the
 * interface is kept so that one can be added without touching the files that read the preference.
 */
export type MotionPreference = "system" | "reduce";

/** Dispatched on `window` after a change, so every control and the capability store re-read it. */
export const MOTION_EVENT = "lt-motion-change";

export const MOTION_CHOICES: readonly MotionPreference[] = ["system", "reduce"];

export function isMotionPreference(value: unknown): value is MotionPreference {
  return value === "system" || value === "reduce";
}

/** The preference in force on this page right now (the `data-motion` attribute on <html>). */
export function currentMotionPreference(
  root: HTMLElement | undefined = typeof document === "undefined" ? undefined : document.documentElement,
): MotionPreference {
  return root?.getAttribute("data-motion") === "reduce" ? "reduce" : "system";
}

/** True when Reduce is in force for this page view. (The device setting is read separately, by matchMedia.) */
export function userPrefersReducedMotion(): boolean {
  return currentMotionPreference() === "reduce";
}

export function applyMotionPreference(pref: MotionPreference, root: HTMLElement = document.documentElement) {
  if (pref === "reduce") root.setAttribute("data-motion", "reduce");
  else root.removeAttribute("data-motion");
}

/** For useSyncExternalStore: re-read when the preference changes on this page. */
export function subscribeMotionPreference(listener: () => void): () => void {
  window.addEventListener(MOTION_EVENT, listener);
  return () => window.removeEventListener(MOTION_EVENT, listener);
}
