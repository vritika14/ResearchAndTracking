import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const APPEARANCE_THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

export type AppearanceTheme = (typeof APPEARANCE_THEMES)[number]["value"];

const STORAGE_KEY = "flow-appearance-theme";
const DEFAULT_THEME: AppearanceTheme = "light";

function isAppearanceTheme(value: string | null): value is AppearanceTheme {
  return APPEARANCE_THEMES.some((theme) => theme.value === value);
}

function readStoredTheme(): AppearanceTheme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isAppearanceTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function applyTheme(theme: AppearanceTheme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

const initialTheme = readStoredTheme();
applyTheme(initialTheme);

interface AppearanceThemeContextValue {
  theme: AppearanceTheme;
  setTheme: (theme: AppearanceTheme) => void;
  toggleTheme: () => void;
}

const AppearanceThemeContext = createContext<AppearanceThemeContextValue | null>(null);

export function AppearanceThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppearanceTheme>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The selected appearance still applies for this session.
    }
  }, [theme]);

  return (
    <AppearanceThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light"),
      }}
    >
      {children}
    </AppearanceThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppearanceTheme() {
  const context = useContext(AppearanceThemeContext);
  if (!context) throw new Error("useAppearanceTheme must be used within AppearanceThemeProvider");
  return context;
}
