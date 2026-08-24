import { useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { navGroups } from "@/config/nav-items";
import { cn } from "@/lib/utils";
import { NavTree } from "@/components/layout/nav-tree";
import { UserMenu } from "@/components/layout/user-menu";
import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const [primaryGroup, ...moreGroups] = navGroups;

/**
 * Executive design theme's horizontal navigation bar — replaces the sidebar
 * entirely. Primary items render inline; the remaining nav groups collapse
 * into a "More" dropdown to keep the bar from overflowing. Below md, falls
 * back to the same hamburger + Sheet + NavTree pattern SiteHeader uses.
 */
export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-16 items-center gap-6">
        <Wordmark />

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {primaryGroup.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-primary/10 font-semibold text-primary hover:bg-primary/10 hover:text-primary",
                )
              }
            >
              {item.icon ? <item.icon className="h-4 w-4 shrink-0" /> : null}
              {item.label}
            </NavLink>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                More
                <ChevronDown className="h-4 w-4 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
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

        <div className="hidden shrink-0 md:block md:w-56">
          <UserMenu />
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu" className="ml-auto md:hidden">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-3/4 flex-col overflow-y-auto sm:max-w-xs">
            <SheetHeader>
              <SheetTitle>Research in Motion</SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-6">
              <NavTree onNavigate={() => setMobileOpen(false)} />
              <div className="border-t pt-4">
                <UserMenu />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
