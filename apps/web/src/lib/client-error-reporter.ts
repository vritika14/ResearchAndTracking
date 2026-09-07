type ErrorReporter = (input: {
  name: string;
  path?: string;
  properties?: Record<string, string | number | boolean | null>;
}) => void;

let reporter: ErrorReporter | null = null;

/**
 * Bridges the plain-JS window error listeners (and the class-based
 * ErrorBoundary) to the authenticated `useTrackEvent` hook, which can only
 * be called from within the React tree. AppLayout registers itself here
 * once a workspace — and therefore a tenant to report against — exists.
 */
export function registerErrorReporter(fn: ErrorReporter | null) {
  reporter = fn;
}

const MAX_STACK_LENGTH = 2000;

export function reportClientError(error: unknown, extra?: Record<string, string>) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? (error.stack ?? "").slice(0, MAX_STACK_LENGTH) : undefined;

  console.error("[client error]", error, extra);

  reporter?.({
    name: "client_error",
    path: window.location.pathname,
    properties: { message, stack: stack ?? null, ...extra },
  });
}

let globalHandlersInstalled = false;

/** Installed once at app startup so errors are captured even before any workspace loads. */
export function installGlobalErrorHandlers() {
  if (globalHandlersInstalled) return;
  globalHandlersInstalled = true;

  window.addEventListener("error", (event) => {
    reportClientError(event.error ?? event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportClientError(event.reason);
  });
}
