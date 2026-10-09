import { useCallback, useSyncExternalStore } from "react";

export type ThemePref = "system" | "light" | "dark";

// Not prefixed with "sood-ngern-" on purpose: signing out must not reset the look of the app.
const STORAGE_KEY = "snx-theme";
const listeners = new Set<() => void>();

function read(): ThemePref {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
}

/** Call once before first render so there is no flash of the wrong theme. */
export function initTheme() {
  apply(read());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTheme() {
  const pref = useSyncExternalStore(subscribe, read, () => "system" as ThemePref);

  const setPref = useCallback((next: ThemePref) => {
    try {
      if (next === "system") window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable — still apply for this session
    }
    apply(next);
    listeners.forEach((l) => l());
  }, []);

  return { pref, setPref };
}
