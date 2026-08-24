import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ColorTheme } from "./color-theme";

const STORAGE_KEY = "flow-color-theme";

interface UseColorThemeHook {
  (): { theme: ColorTheme; setTheme: (theme: ColorTheme) => void };
}

function ThemeConsumer({ useColorTheme }: { useColorTheme: UseColorThemeHook }) {
  const { theme, setTheme } = useColorTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme("violet")}>switch to violet</button>
    </div>
  );
}

describe("color-theme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-color-theme");
    vi.resetModules();
  });

  it("defaults to ocean and applies the data-color-theme attribute before mount", async () => {
    await import("./color-theme");
    expect(document.documentElement.dataset.colorTheme).toBe("ocean");
  });

  it("reads a previously stored theme on load", async () => {
    window.localStorage.setItem(STORAGE_KEY, "emerald");
    await import("./color-theme");
    expect(document.documentElement.dataset.colorTheme).toBe("emerald");
  });

  it("falls back to ocean when the stored value is invalid", async () => {
    window.localStorage.setItem(STORAGE_KEY, "not-a-real-theme");
    await import("./color-theme");
    expect(document.documentElement.dataset.colorTheme).toBe("ocean");
  });

  it("switching themes updates the attribute and localStorage, independent of the design theme", async () => {
    const { ColorThemeProvider, useColorTheme } = await import("./color-theme");

    render(
      <ColorThemeProvider>
        <ThemeConsumer useColorTheme={useColorTheme} />
      </ColorThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("ocean");

    fireEvent.click(screen.getByRole("button", { name: "switch to violet" }));

    expect(screen.getByTestId("theme")).toHaveTextContent("violet");
    expect(document.documentElement.dataset.colorTheme).toBe("violet");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("violet");
  });
});
