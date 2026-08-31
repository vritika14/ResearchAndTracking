import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const TEXT_SIZES = [
  { value: "small", label: "Small" },
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
] as const;

export type TextSize = (typeof TEXT_SIZES)[number]["value"];

const STORAGE_KEY = "flow-text-size";
const DEFAULT_SIZE: TextSize = "default";

function isTextSize(value: string | null): value is TextSize {
  return TEXT_SIZES.some((size) => size.value === value);
}

function readStoredSize(): TextSize {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isTextSize(stored) ? stored : DEFAULT_SIZE;
  } catch {
    return DEFAULT_SIZE;
  }
}

function applySize(size: TextSize) {
  document.documentElement.dataset.textSize = size;
}

const initialSize = readStoredSize();
applySize(initialSize);

interface TextSizeContextValue {
  size: TextSize;
  setSize: (size: TextSize) => void;
}

const TextSizeContext = createContext<TextSizeContextValue | null>(null);

export function TextSizeProvider({ children }: { children: ReactNode }) {
  const [size, setSize] = useState<TextSize>(initialSize);

  useEffect(() => {
    applySize(size);
    try {
      window.localStorage.setItem(STORAGE_KEY, size);
    } catch {
      // The selected size still applies for this session.
    }
  }, [size]);

  return <TextSizeContext.Provider value={{ size, setSize }}>{children}</TextSizeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTextSize() {
  const context = useContext(TextSizeContext);
  if (!context) throw new Error("useTextSize must be used within TextSizeProvider");
  return context;
}
