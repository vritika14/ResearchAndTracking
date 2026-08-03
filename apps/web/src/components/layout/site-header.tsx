import { useState } from "react";
import { Menu } from "lucide-react";

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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:hidden">
      <Wordmark />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Open menu">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-3/4 flex-col overflow-y-auto sm:max-w-xs">
          <SheetHeader>
            <SheetTitle>Research &amp; Tracking</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-6">
            <NavTree onNavigate={() => setOpen(false)} />
            <div className="border-t pt-4">
              <UserMenu />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
