import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";

import { navItems } from "@/config/nav-items";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function Wordmark() {
  return (
    <NavLink to="/" className="flex items-center gap-2 font-extrabold text-primary">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
        R&amp;T
      </span>
      <span className="hidden sm:inline">Research &amp; Tracking</span>
    </NavLink>
  );
}

function DesktopNav() {
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {navItems.map(({ label, to, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-accent text-primary",
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-3/4 sm:max-w-xs">
        <SheetHeader>
          <SheetTitle>Research &amp; Tracking</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {navItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-primary",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Wordmark />
          <DesktopNav />
        </div>
        <MobileNav />
      </div>
    </header>
  );
}
