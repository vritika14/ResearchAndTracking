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
      h1: "text-2xl sm:text-[1.75rem]",
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
}

/** Standard top-of-page header: icon badge, eyebrow, bold title, description, actions. */
const PageHeading = React.forwardRef<HTMLDivElement, PageHeadingProps>(
  ({ className, title, description, eyebrow, icon: Icon, actions, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-4">
        {Icon ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
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
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  ),
);
PageHeading.displayName = "PageHeading";

export { Heading, PageHeading };
