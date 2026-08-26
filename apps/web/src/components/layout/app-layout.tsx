import { BookOpen, FlaskConical, GraduationCap, Sparkles, TrendingUp } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

import { CompactSidebar } from "@/components/layout/compact-sidebar";
import { Sidebar } from "@/components/layout/sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { TopNav } from "@/components/layout/top-nav";
import { useDesignTheme } from "@/theme/design-theme";

/**
 * Large, low-opacity symbols scattered across the main content background so
 * no page ever reads as visually empty — sits behind every page's cards and
 * tables (which paint over it wherever they cover it), never intercepts
 * clicks, and stays within 0–100% bounds so it can't cause overflow scroll.
 */
function PageBackgroundArt() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* big centerpiece — an orbit ring around an oversized graduation cap */}
      <div className="absolute -right-16 -top-16 h-[26rem] w-[26rem] rounded-full border border-primary/[0.05] xl:-right-10 xl:-top-10 xl:h-[34rem] xl:w-[34rem]" />
      <div className="absolute -right-16 -top-16 flex h-[26rem] w-[26rem] items-center justify-center xl:-right-10 xl:-top-10 xl:h-[34rem] xl:w-[34rem]">
        <GraduationCap className="h-52 w-52 rotate-12 text-primary/[0.06] xl:h-64 xl:w-64" />
      </div>

      {/* smaller supporting symbols for texture */}
      <BookOpen className="absolute left-4 top-1/3 h-24 w-24 -rotate-12 text-violet-600/[0.045] xl:left-10" />
      <FlaskConical className="absolute right-10 top-2/3 h-20 w-20 rotate-6 text-primary/[0.045]" />
      <TrendingUp className="absolute bottom-10 left-8 h-28 w-28 -rotate-6 text-emerald-600/[0.045] xl:left-16" />
      <Sparkles className="absolute bottom-1/4 right-1/4 h-12 w-12 text-primary/[0.06]" />
      <Sparkles className="absolute left-1/3 top-10 h-9 w-9 text-violet-600/[0.06]" />
    </div>
  );
}

export function AppLayout() {
  const { layout } = useDesignTheme();
  const location = useLocation();

  if (layout === "topnav") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <TopNav />
        <main className="relative flex-1 bg-gradient-to-br from-muted/[0.65] via-background to-primary/[0.045] px-4 py-6 sm:px-6 sm:py-8 xl:px-10">
          <PageBackgroundArt />
          <div key={location.pathname} className="route-stage relative mx-auto w-full max-w-[1680px]">
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
          <PageBackgroundArt />
          <div key={location.pathname} className="route-stage relative mx-auto w-full max-w-[1680px]">
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
