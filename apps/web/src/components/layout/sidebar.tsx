import { BookOpen, FlaskConical, GraduationCap, Sparkles } from "lucide-react";

import { NavTree } from "@/components/layout/nav-tree";
import { UserMenu } from "@/components/layout/user-menu";
import { Wordmark } from "@/components/layout/wordmark";

/** Fixed left sidebar, visible from md breakpoint up — replaces the old horizontal top nav. */
export function Sidebar() {
  return (
    <aside className="sticky top-0 isolate hidden h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-blue-300/70 bg-gradient-to-b from-blue-100 via-card to-violet-100 text-foreground shadow-md backdrop-blur md:flex xl:w-72 dark:border-blue-900/50 dark:from-blue-950/30 dark:via-card dark:to-violet-950/20">
      <GraduationCap
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -right-10 h-52 w-52 rotate-12 text-primary/[0.07]"
      />
      <BookOpen
        aria-hidden="true"
        className="pointer-events-none absolute -left-8 top-24 h-28 w-28 -rotate-12 text-primary/[0.06]"
      />
      <FlaskConical
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 top-[42%] h-24 w-24 rotate-6 text-violet-600/[0.07]"
      />
      <Sparkles
        aria-hidden="true"
        className="pointer-events-none absolute bottom-24 left-2 h-14 w-14 -rotate-6 text-primary/[0.08]"
      />

      <div className="relative z-10 flex h-[4.5rem] shrink-0 items-center border-b border-blue-300/60 bg-white/45 px-5 dark:border-blue-900/40 dark:bg-white/[0.02]">
        <Wordmark />
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto px-3 py-5">
        <NavTree />
      </div>
      <div className="relative z-10 shrink-0 border-t border-blue-300/60 bg-blue-200/50 px-3 py-3 dark:border-blue-900/40 dark:bg-blue-950/20">
        <UserMenu />
      </div>
    </aside>
  );
}
