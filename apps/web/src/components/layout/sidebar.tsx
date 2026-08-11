import { NavTree } from "@/components/layout/nav-tree";
import { UserMenu } from "@/components/layout/user-menu";
import { Wordmark } from "@/components/layout/wordmark";

/** Fixed left sidebar, visible from md breakpoint up — replaces the old horizontal top nav. */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-background text-foreground shadow-sm md:flex">
      <div className="flex h-16 shrink-0 items-center border-b bg-background px-4">
        <Wordmark />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavTree />
      </div>
      <div className="shrink-0 border-t bg-background px-4 py-3">
        <UserMenu />
      </div>
    </aside>
  );
}
