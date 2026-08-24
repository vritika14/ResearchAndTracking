import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AuthScreenBackgroundProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared backdrop for authentication and first-run account flows: a plain
 * surface with a faint dot grid for texture, rather than a decorative
 * illustration — keeps the focus on the form.
 */
export function AuthScreenBackground({ children, className }: AuthScreenBackgroundProps) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-muted/40">
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 [background-image:radial-gradient(hsl(var(--foreground)/0.08)_1px,transparent_1px)] [background-size:20px_20px]"
      />
      <div className={cn("relative z-10 min-h-screen", className)}>{children}</div>
    </div>
  );
}
