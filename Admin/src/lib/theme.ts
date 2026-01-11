export type ThemeMode = "light" | "dark";

const THEME_COOKIE = "admin_theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const readCookie = (name: string) => {
  const parts = document.cookie.split("; ").filter(Boolean);
  const match = parts.find((item) => item.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
};

export const getStoredTheme = (): ThemeMode | null => {
  const stored = readCookie(THEME_COOKIE);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return null;
};

export const getSystemTheme = (): ThemeMode => {
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

export const getInitialTheme = (): ThemeMode => {
  return getStoredTheme() ?? getSystemTheme();
};

export const applyTheme = (theme: ThemeMode) => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
};

export const setTheme = (theme: ThemeMode) => {
  applyTheme(theme);
  document.cookie = `${THEME_COOKIE}=${encodeURIComponent(
    theme
  )}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
};
