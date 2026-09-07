import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppErrorBoundary } from "@/components/shared/error-boundary";
import { registerErrorReporter } from "@/lib/client-error-reporter";

function Boom(): never {
  throw new Error("kaboom");
}

describe("AppErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React logs the caught error to console itself; keep test output clean.
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    registerErrorReporter(null);
  });

  it("shows a fallback instead of crashing when a child throws", () => {
    render(
      <AppErrorBoundary label="This page">
        <Boom />
      </AppErrorBoundary>,
    );

    expect(
      screen.getByText("This page hit an unexpected error"),
    ).toBeInTheDocument();
  });

  it("reports the error to the registered reporter", () => {
    const reporter = vi.fn();
    registerErrorReporter(reporter);

    render(
      <AppErrorBoundary label="This page">
        <Boom />
      </AppErrorBoundary>,
    );

    expect(reporter).toHaveBeenCalledWith(
      expect.objectContaining({ name: "client_error" }),
    );
  });

  it("renders children normally when nothing throws", () => {
    render(
      <AppErrorBoundary label="This page">
        <p>All good</p>
      </AppErrorBoundary>,
    );

    expect(screen.getByText("All good")).toBeInTheDocument();
  });
});
