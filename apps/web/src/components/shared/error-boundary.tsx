import { Component, type ErrorInfo, type ReactNode } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { reportClientError } from "@/lib/client-error-reporter";

interface AppErrorBoundaryProps {
  children: ReactNode;
  /** Shown as the fallback title — lets callers say what broke ("This page", "The app"). */
  label: string;
  className?: string;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/**
 * React error boundaries only catch errors thrown during rendering, so this
 * only covers that case — event-handler and async errors are reported
 * separately via the window listeners installed in client-error-reporter.ts.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError(error, { componentStack: (info.componentStack ?? "").slice(0, 2000) });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title={`${this.props.label} hit an unexpected error`}
          description="Reloading the page usually fixes this. If it keeps happening, let us know what you were doing."
          onRetry={() => window.location.reload()}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}
