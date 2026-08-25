import { Outlet, useLocation } from "react-router-dom";

import { CompactSidebar } from "@/components/layout/compact-sidebar";
import { Sidebar } from "@/components/layout/sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { TopNav } from "@/components/layout/top-nav";
import { useDesignTheme } from "@/theme/design-theme";

export function AppLayout() {
  const { layout } = useDesignTheme();
  const location = useLocation();

  if (layout === "topnav") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <TopNav />
        <main className="relative flex-1 bg-gradient-to-br from-muted/[0.65] via-background to-primary/[0.045] px-4 py-6 sm:px-6 sm:py-8 xl:px-10">
          <div key={location.pathname} className="route-stage mx-auto w-full max-w-[1680px]">
            <Outlet />
          </div>
        </main>
        <footer className="border-t bg-card/50 py-5">
          <div className="container flex items-center justify-between text-xs text-muted-foreground">
            <span>Research in Motion</span><span>Research workspace</span>
          </div>
        </footer>
      </div>
    );
  }

  const SidebarComponent = layout === "sidebar-compact" ? CompactSidebar : Sidebar;

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarComponent />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <SiteHeader />
        <main className="relative flex-1 bg-gradient-to-br from-muted/[0.65] via-background to-primary/[0.045] px-4 py-6 sm:px-6 sm:py-8 xl:px-10">
          <div key={location.pathname} className="route-stage mx-auto w-full max-w-[1680px]">
            <Outlet />
          </div>
        </main>
        <footer className="border-t bg-card/50 py-5">
          <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between px-4 text-xs text-muted-foreground sm:px-6 xl:px-10">
            <span>Research in Motion</span><span>Research workspace</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
