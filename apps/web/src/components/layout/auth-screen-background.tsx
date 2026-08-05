import type { ReactNode } from "react";

import backgroundImage from "@/assets/images/background.svg";
import { cn } from "@/lib/utils";

interface AuthScreenBackgroundProps {
  children: ReactNode;
  className?: string;
}

/** Shared illustrated backdrop for authentication and first-run account flows. */
export function AuthScreenBackground({ children, className }: AuthScreenBackgroundProps) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <img
        aria-hidden="true"
        src={backgroundImage}
        alt=""
        className="fixed inset-0 z-0 h-full w-full object-cover object-center"
      />
      <div aria-hidden="true" className="fixed inset-0 z-0 bg-background/45" />
      <div className={cn("relative z-10 min-h-screen", className)}>{children}</div>
    </div>
  );
}
