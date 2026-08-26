import { useState } from "react";
import { GraduationCap, Menu } from "lucide-react";

import { NavTree } from "@/components/layout/nav-tree";
import { UserMenu } from "@/components/layout/user-menu";
import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Mobile-only top bar (hidden from md up, where the Sidebar takes over). */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 isolate z-40 flex h-16 shrink-0 items-center justify-between overflow-hidden border-b border-blue-300/70 bg-gradient-to-r from-blue-100/95 via-card/95 to-violet-100/95 px-4 shadow-sm backdrop-blur-xl md:hidden dark:border-blue-900/50 dark:from-blue-950/80 dark:via-card/90 dark:to-violet-950/70">
      <GraduationCap
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -top-10 h-24 w-24 -translate-x-1/2 rotate-6 text-primary/[0.08]"
      />
      <div className="relative z-10">
        <Wordmark />
      </div>
      <div className="relative z-10">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-3/4 flex-col overflow-y-auto sm:max-w-xs">
            <SheetHeader>
              <SheetTitle>Research in Motion</SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-6">
              <NavTree onNavigate={() => setOpen(false)} />
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
