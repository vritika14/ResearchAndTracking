import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  NotebookPen,
  ShieldCheck,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "Tasks", to: "/tasks", icon: ClipboardList },
  { label: "Daily Notes", to: "/daily-notes", icon: NotebookPen },
  { label: "Records", to: "/records", icon: ShieldCheck },
];
