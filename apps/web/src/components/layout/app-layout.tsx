import { Outlet } from "react-router-dom";

import { Sidebar } from "@/components/layout/sidebar";
import { SiteHeader } from "@/components/layout/site-header";

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <SiteHeader />
        <main className="container flex-1 py-8">
          <Outlet />
        </main>
        <footer className="border-t py-6">
          <div className="container text-sm text-muted-foreground">
            Research &amp; Tracking
          </div>
        </footer>
      </div>
    </div>
  );
}
