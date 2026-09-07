import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { registerErrorReporter, reportClientError } from "@/lib/client-error-reporter";

describe("reportClientError", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    registerErrorReporter(null);
  });

  it("always logs to the console, even with no reporter registered", () => {
    reportClientError(new Error("boom"));
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("forwards a client_error event to the registered reporter", () => {
    const reporter = vi.fn();
    registerErrorReporter(reporter);

    reportClientError(new Error("boom"));

    expect(reporter).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "client_error",
        properties: expect.objectContaining({ message: "boom" }),
      }),
    );
  });

  it("stops reaching a reporter once it's unregistered", () => {
    const reporter = vi.fn();
    registerErrorReporter(reporter);
    registerErrorReporter(null);

    reportClientError(new Error("boom"));

    expect(reporter).not.toHaveBeenCalled();
  });

  it("handles a non-Error value without throwing", () => {
    expect(() => reportClientError("just a string")).not.toThrow();
  });
});
