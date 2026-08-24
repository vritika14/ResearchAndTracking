import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { CircleAlert, ChevronRight } from "lucide-react";

import { useMe } from "@/api/hooks";
import { navGroups, type NavEntry } from "@/config/nav-items";
import { cn } from "@/lib/utils";

function isChildActive(pathname: string, entry: NavEntry) {
  return entry.children?.some((child) => pathname.startsWith(child.to)) ?? false;
}

function computeAutoExpanded(pathname: string) {
  const expanded = new Set<string>();
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.children && isChildActive(pathname, item)) {
        expanded.add(item.to);
      }
    }
  }
  return expanded;
}

interface NavTreeProps {
  /** Called after a link is clicked — used to close the mobile Sheet. */
  onNavigate?: () => void;
}

/**
 * Grouped, expandable nav shared by the desktop sidebar and the mobile
 * Sheet drawer. Nested entries (e.g. Daily Notes > Input/Output) collapse
 * by default and auto-expand when a descendant route is active.
 */
export function NavTree({ onNavigate }: NavTreeProps) {
  const location = useLocation();
  const me = useMe();
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    computeAutoExpanded(location.pathname),
  );

  useEffect(() => {
    setExpanded((prev) => new Set([...prev, ...computeAutoExpanded(location.pathname)]));
  }, [location.pathname]);

  function toggle(to: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(to)) {
        next.delete(to);
      } else {
        next.add(to);
      }
      return next;
    });
  }

  return (
    <nav className="flex flex-col gap-6">
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {group.label ? (
            <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
          ) : null}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const hasChildren = Boolean(item.children?.length);
              const isOpen = expanded.has(item.to);

              return (
                <div key={item.to}>
                  <div className="flex items-center">
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex flex-1 items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                          isActive && "border-primary bg-primary/10 font-semibold text-primary hover:bg-primary/10 hover:text-primary",
                        )
                      }
                    >
                      {item.icon ? <item.icon className="h-4 w-4 shrink-0" /> : null}
                      <span className="flex-1">{item.label}</span>
                      {item.to === "/settings" && me.data?.profileComplete === false ? (
                        <CircleAlert
                          className="h-4 w-4 shrink-0 text-amber-500"
                          aria-label="Profile incomplete"
                        />
                      ) : null}
                    </NavLink>
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggle(item.to)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <ChevronRight
                          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")}
                        />
                      </button>
                    ) : null}
                  </div>
                  {hasChildren && isOpen ? (
                    <div className="ml-4 flex flex-col gap-0.5 border-l pl-3 pt-0.5">
                      {item.children!.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            cn(
                              "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                              isActive && "bg-primary/10 font-semibold text-primary hover:bg-primary/10 hover:text-primary",
                            )
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
