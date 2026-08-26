import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingState({
  title = "Loading",
  description = "Please wait while this information is prepared.",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative isolate flex min-h-48 flex-col items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br from-accent/70 via-card to-primary/5 p-8 text-center shadow-sm",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
        <LoaderCircle className="h-6 w-6 animate-spin" />
      </div>
      <p className="relative z-10 mt-4 text-base font-semibold">{title}</p>
      <p className="relative z-10 mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>

      <div className="relative z-10 mt-7 flex w-full max-w-xs flex-col gap-2" aria-hidden="true">
        <div className="h-2.5 w-full animate-pulse rounded-full bg-primary/10" />
        <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-primary/10 [animation-delay:150ms]" />
        <div className="h-2.5 w-3/5 animate-pulse rounded-full bg-primary/10 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
