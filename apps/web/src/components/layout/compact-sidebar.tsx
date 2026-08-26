import { BookOpen, GraduationCap, MoreHorizontal } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { navGroups } from "@/config/nav-items";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/layout/user-menu";
import { Wordmark } from "@/components/layout/wordmark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const [primaryGroup, ...moreGroups] = navGroups;

/**
 * The Minimal design theme's navigation — a narrow icon-only rail instead of
 * the full labeled Sidebar, structurally distinct rather than just a
 * restyled version of the same panel. Primary items render as icon buttons
 * (native `title` tooltip); everything else collapses into a "More" dropdown,
 * mirroring the pattern TopNav uses for the same overflow problem.
 */
export function CompactSidebar() {
  return (
    <aside className="sticky top-0 isolate hidden h-screen w-16 shrink-0 flex-col items-center gap-4 overflow-hidden border-r border-blue-300/70 bg-gradient-to-b from-blue-100 via-card to-violet-100 py-3 shadow-sm md:flex dark:border-blue-900/50 dark:from-blue-950/30 dark:via-card dark:to-violet-950/20">
      <GraduationCap
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rotate-12 text-primary/[0.08]"
      />
      <BookOpen
        aria-hidden="true"
        className="pointer-events-none absolute -left-4 top-20 h-20 w-20 -rotate-12 text-violet-600/[0.08]"
      />
      <div className="relative z-10">
        <Wordmark compact />
      </div>

      <nav className="relative z-10 flex flex-1 flex-col items-center gap-1">
        {primaryGroup.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={item.label}
            aria-label={item.label}
            className={({ isActive }) =>
              cn(
                "flex h-10 w-10 items-center justify-center rounded-[var(--radius)] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-primary",
              )
            }
          >
            {item.icon ? <item.icon className="h-5 w-5" /> : null}
          </NavLink>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More navigation options"
              title="More"
              className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-64">
            {moreGroups.map((group, index) => (
              <div key={group.label || index}>
                {index > 0 ? <DropdownMenuSeparator /> : null}
                {group.label ? <DropdownMenuLabel>{group.label}</DropdownMenuLabel> : null}
                {group.items.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link to={item.to}>
                      {item.icon ? <item.icon className="h-4 w-4 shrink-0" /> : null}
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      <div className="relative z-10">
        <UserMenu compact />
      </div>
    </aside>
  );
}
