import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The heading standard: every page and section heading in the app renders
 * through this component so weight/color stay consistent. Ink-colored and
 * moderately weighted rather than oversized brand-color text — `text-primary`
 * is reserved for interactive elements (links, active states), not headings.
 * `as` controls the semantic tag independently of the visual `level`.
 */
const headingVariants = cva("font-heading font-semibold tracking-[var(--heading-tracking)] text-foreground", {
  variants: {
    level: {
      h1: "text-[1.65rem] leading-tight sm:text-[2rem]",
      h2: "text-xl sm:text-2xl",
      h3: "text-lg sm:text-xl",
      h4: "text-base sm:text-lg",
    },
  },
  defaultVariants: {
    level: "h1",
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level, as, ...props }, ref) => {
    const Comp = as ?? level ?? "h1";
    return (
      <Comp
        ref={ref}
        className={cn(headingVariants({ level }), className)}
        {...props}
      />
    );
  },
);
Heading.displayName = "Heading";

export interface PageHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  tone?: "blue" | "violet" | "emerald" | "amber" | "rose" | "cyan";
  children?: React.ReactNode;
}

const pageHeadingTones = {
  blue: {
    surface: "border-blue-200/70 bg-gradient-to-br from-blue-50 via-card to-card dark:border-blue-900/60 dark:from-blue-950/30",
    icon: "bg-blue-600 text-white ring-blue-500/15",
    glow: "from-blue-400/20",
  },
  violet: {
    surface: "border-violet-200/70 bg-gradient-to-br from-violet-50 via-card to-card dark:border-violet-900/60 dark:from-violet-950/30",
    icon: "bg-violet-600 text-white ring-violet-500/15",
    glow: "from-violet-400/20",
  },
  emerald: {
    surface: "border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-card to-card dark:border-emerald-900/60 dark:from-emerald-950/30",
    icon: "bg-emerald-600 text-white ring-emerald-500/15",
    glow: "from-emerald-400/20",
  },
  amber: {
    surface: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-card to-card dark:border-amber-900/60 dark:from-amber-950/30",
    icon: "bg-amber-500 text-white ring-amber-500/15",
    glow: "from-amber-400/20",
  },
  rose: {
    surface: "border-rose-200/70 bg-gradient-to-br from-rose-50 via-card to-card dark:border-rose-900/60 dark:from-rose-950/30",
    icon: "bg-rose-600 text-white ring-rose-500/15",
    glow: "from-rose-400/20",
  },
  cyan: {
    surface: "border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-card to-card dark:border-cyan-900/60 dark:from-cyan-950/30",
    icon: "bg-cyan-600 text-white ring-cyan-500/15",
    glow: "from-cyan-400/20",
  },
};

/** Standard top-of-page header: icon badge, eyebrow, bold title, description, actions. */
const PageHeading = React.forwardRef<HTMLDivElement, PageHeadingProps>(
  ({ className, title, description, eyebrow, icon: Icon, actions, tone = "blue", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl border px-5 py-5 shadow-sm backdrop-blur-sm sm:px-6 sm:py-6",
        pageHeadingTones[tone].surface,
        className,
      )}
      {...props}
    >
      <div aria-hidden="true" className={cn("pointer-events-none absolute inset-y-0 right-0 w-2/5 bg-gradient-to-l to-transparent", pageHeadingTones[tone].glow)} />
      {Icon ? (
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rotate-12 text-foreground/[0.05] sm:h-36 sm:w-36"
        />
      ) : null}
      <div className="relative sm:flex sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          {Icon ? (
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ring-4", pageHeadingTones[tone].icon)}>
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <div className="flex flex-col gap-1.5">
            {eyebrow ? (
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </span>
            ) : null}
            <Heading level="h1">{title}</Heading>
            {description ? (
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="mt-4 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0 sm:justify-end">{actions}</div> : null}
      </div>
      {children ? <div className="relative mt-4 border-t border-border/60 pt-4">{children}</div> : null}
    </div>
  ),
);
PageHeading.displayName = "PageHeading";

export { Heading, PageHeading };
