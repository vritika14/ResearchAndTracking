import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DesignTheme, DesignThemeLayout } from "./design-theme";

const STORAGE_KEY = "flow-design-theme";

interface UseDesignThemeHook {
  (): { theme: DesignTheme; layout: DesignThemeLayout; setTheme: (theme: DesignTheme) => void };
}

function ThemeConsumer({ useDesignTheme }: { useDesignTheme: UseDesignThemeHook }) {
  const { theme, layout, setTheme } = useDesignTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="layout">{layout}</span>
      <button onClick={() => setTheme("minimal")}>switch to minimal</button>
    </div>
  );
}

describe("design-theme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-design-theme");
    vi.resetModules();
  });

  it("exposes exactly the modern/minimal/executive themes with their layouts", async () => {
    const { DESIGN_THEMES } = await import("./design-theme");
    expect(DESIGN_THEMES.map((option) => [option.value, option.layout])).toEqual([
      ["modern", "sidebar"],
      ["minimal", "sidebar-compact"],
      ["executive", "topnav"],
    ]);
  });

  it("defaults to modern and applies the data-design-theme attribute before mount", async () => {
    await import("./design-theme");
    expect(document.documentElement.dataset.designTheme).toBe("modern");
  });

  it("reads a previously stored theme on load", async () => {
    window.localStorage.setItem(STORAGE_KEY, "executive");
    await import("./design-theme");
    expect(document.documentElement.dataset.designTheme).toBe("executive");
  });

  it("falls back to modern when the stored value is invalid", async () => {
    window.localStorage.setItem(STORAGE_KEY, "not-a-real-theme");
    await import("./design-theme");
    expect(document.documentElement.dataset.designTheme).toBe("modern");
  });

  it("switching themes updates the attribute, localStorage, and the exposed layout", async () => {
    const { DesignThemeProvider, useDesignTheme } = await import("./design-theme");

    render(
      <DesignThemeProvider>
        <ThemeConsumer useDesignTheme={useDesignTheme} />
      </DesignThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("modern");
    expect(screen.getByTestId("layout")).toHaveTextContent("sidebar");

    fireEvent.click(screen.getByRole("button", { name: "switch to minimal" }));

    expect(screen.getByTestId("theme")).toHaveTextContent("minimal");
    expect(screen.getByTestId("layout")).toHaveTextContent("sidebar-compact");
    expect(document.documentElement.dataset.designTheme).toBe("minimal");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("minimal");
  });
});
