import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "flow-text-size";

describe("text-size", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.textSize;
    vi.resetModules();
  });

  it("defaults to the standard text size", async () => {
    await import("./text-size");
    expect(document.documentElement.dataset.textSize).toBe("default");
  });

  it("applies a stored text size before mount", async () => {
    window.localStorage.setItem(STORAGE_KEY, "large");
    await import("./text-size");
    expect(document.documentElement.dataset.textSize).toBe("large");
  });

  it("switches and persists the text size", async () => {
    const { TextSizeProvider, useTextSize } = await import("./text-size");

    function Consumer() {
      const textSize = useTextSize();
      return <button onClick={() => textSize.setSize("large")}>{textSize.size}</button>;
    }

    render(<TextSizeProvider><Consumer /></TextSizeProvider>);
    fireEvent.click(screen.getByRole("button", { name: "default" }));

    expect(screen.getByRole("button", { name: "large" })).toBeInTheDocument();
    expect(document.documentElement.dataset.textSize).toBe("large");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("large");
  });
});
