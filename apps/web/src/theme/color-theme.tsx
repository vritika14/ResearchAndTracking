import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * An accent-color override layered on top of whichever Design Theme is
 * active (see design-theme.tsx) — independent axis: pick any color with any
 * layout. Only overrides color tokens; radius/shadow/spacing/typography
 * stay owned by the Design Theme.
 */
export const COLOR_THEMES = [
  { value: "ocean", label: "Ocean Blue" },
  { value: "violet", label: "Violet" },
  { value: "emerald", label: "Emerald" },
  { value: "rose", label: "Rose" },
] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number]["value"];

const STORAGE_KEY = "flow-color-theme";
const DEFAULT_THEME: ColorTheme = "ocean";

function isColorTheme(value: string | null): value is ColorTheme {
  return COLOR_THEMES.some((theme) => theme.value === value);
}

function readStoredTheme(): ColorTheme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isColorTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function applyTheme(theme: ColorTheme) {
  document.documentElement.dataset.colorTheme = theme;
}

const initialTheme = readStoredTheme();
applyTheme(initialTheme);

interface ColorThemeContextValue {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
}

const ColorThemeContext = createContext<ColorThemeContextValue | null>(null);

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ColorTheme>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The theme still applies for this session when storage is unavailable.
    }
  }, [theme]);

  return (
    <ColorThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

// The hook intentionally shares the provider module so its context stays private.
// eslint-disable-next-line react-refresh/only-export-components
export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error("useColorTheme must be used within ColorThemeProvider");
  }
  return context;
}
