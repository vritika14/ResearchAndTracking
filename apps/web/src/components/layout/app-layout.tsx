import { Outlet } from "react-router-dom";

import { CompactSidebar } from "@/components/layout/compact-sidebar";
import { Sidebar } from "@/components/layout/sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { TopNav } from "@/components/layout/top-nav";
import { useDesignTheme } from "@/theme/design-theme";

export function AppLayout() {
  const { layout } = useDesignTheme();

  if (layout === "topnav") {
    return (
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <main className="container flex-1 py-8">
          <Outlet />
        </main>
        <footer className="border-t py-6">
          <div className="container text-sm text-muted-foreground">
            Research in Motion
          </div>
        </footer>
      </div>
    );
  }

  const SidebarComponent = layout === "sidebar-compact" ? CompactSidebar : Sidebar;

  return (
    <div className="flex min-h-screen">
      <SidebarComponent />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <SiteHeader />
        <main className="container flex-1 py-8">
          <Outlet />
        </main>
        <footer className="border-t py-6">
          <div className="container text-sm text-muted-foreground">
            Research in Motion
          </div>
        </footer>
      </div>
    </div>
  );
}
