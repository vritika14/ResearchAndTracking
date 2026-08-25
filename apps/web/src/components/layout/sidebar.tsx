import { NavTree } from "@/components/layout/nav-tree";
import { UserMenu } from "@/components/layout/user-menu";
import { Wordmark } from "@/components/layout/wordmark";

/** Fixed left sidebar, visible from md breakpoint up — replaces the old horizontal top nav. */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-blue-200/70 bg-gradient-to-b from-blue-50 via-card to-violet-50/70 text-foreground shadow-md backdrop-blur md:flex xl:w-72 dark:border-blue-900/50 dark:from-blue-950/30 dark:via-card dark:to-violet-950/20">
      <div className="flex h-[4.5rem] shrink-0 items-center border-b border-blue-200/60 bg-white/35 px-5 dark:border-blue-900/40 dark:bg-white/[0.02]">
        <Wordmark />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <NavTree />
      </div>
      <div className="shrink-0 border-t border-blue-200/60 bg-blue-100/35 px-3 py-3 dark:border-blue-900/40 dark:bg-blue-950/20">
        <UserMenu />
      </div>
    </aside>
  );
}
