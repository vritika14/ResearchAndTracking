import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "flow-appearance-theme";

describe("appearance-theme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.style.removeProperty("color-scheme");
    vi.resetModules();
  });

  it("defaults to light appearance", async () => {
    await import("./appearance-theme");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("applies a stored dark appearance before mount", async () => {
    window.localStorage.setItem(STORAGE_KEY, "dark");
    await import("./appearance-theme");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("switches appearance and persists the preference", async () => {
    const { AppearanceThemeProvider, useAppearanceTheme } = await import("./appearance-theme");

    function Consumer() {
      const appearance = useAppearanceTheme();
      return <button onClick={appearance.toggleTheme}>{appearance.theme}</button>;
    }

    render(<AppearanceThemeProvider><Consumer /></AppearanceThemeProvider>);
    fireEvent.click(screen.getByRole("button", { name: "light" }));

    expect(screen.getByRole("button", { name: "dark" })).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });
});
