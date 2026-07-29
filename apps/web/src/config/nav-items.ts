import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  NotebookPen,
  ScrollText,
  Settings,
  ShieldCheck,
  Workflow,
} from "lucide-react";

export interface NavLeaf {
  label: string;
  to: string;
  end?: boolean;
}

export interface NavEntry extends NavLeaf {
  icon?: LucideIcon;
  children?: NavLeaf[];
}

export interface NavGroup {
  label: string;
  items: NavEntry[];
}

/**
 * Shared nav hierarchy consumed by both the desktop sidebar and the mobile
 * Sheet drawer (see NavTree). Add a route once here and it appears in both.
 */
export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Research",
    items: [
      { label: "Projects", to: "/projects", icon: FolderKanban },
      { label: "Tasks and to do", to: "/tasks", icon: ClipboardList },
      { label: "Pipeline", to: "/pipeline", icon: Workflow },
      {
        label: "Daily Notes",
        to: "/daily-notes",
        icon: NotebookPen,
        // children: [
        //   { label: "Input", to: "/daily-notes/input" },
        //   { label: "Output", to: "/daily-notes/output" },
        // ],
      },
    ],
  },
  {
    label: "Controlled Data",
    items: [
      { label: "Secure Records", to: "/secure-records", icon: ShieldCheck },
      { label: "Access Log", to: "/access-log", icon: ScrollText },
    ],
  },
  {
    label: "Administration",
    items: [{ label: "Settings", to: "/settings", icon: Settings }],
  },
];
