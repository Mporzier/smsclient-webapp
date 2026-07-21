export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "smsclient.theme";
export const THEME_EVENT = "smsclient:theme";

export function parseTheme(raw: string | null | undefined): ThemeMode {
  return raw === "dark" ? "dark" : "light";
}

export function getStoredTheme(): ThemeMode {
  try {
    return parseTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "light";
  }
}

export function readDomTheme(): ThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}
