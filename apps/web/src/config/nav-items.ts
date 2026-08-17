import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Building2,
  BookOpen,
  Boxes,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  FileText,
  Files,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  List,
  Megaphone,
  NotebookPen,
  Presentation,
  Settings,
  ShieldCheck,
  Users,
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
 * Single source of truth for both desktop and mobile navigation.
 */
export const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { label: "Dashboard", to: "/", icon: LayoutDashboard, end: true },
      { label: "Projects", to: "/projects", icon: FolderKanban },
      { label: "Modules", to: "/modules", icon: Boxes },
      { label: "Tasks and to do", to: "/tasks", icon: ClipboardList },
      { label: "Notes", to: "/daily-notes", icon: NotebookPen },
      { label: "Pipeline", to: "/pipeline", icon: Workflow },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Workspaces", to: "/workspaces", icon: Building2 },
      { label: "Settings", to: "/settings", icon: Settings },
      {
        label: "Account Audit",
        to: "/settings/account-audit",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "Potential Future Features",
    items: [
      { label: "Calendar", to: "/future/calendar", icon: Calendar },
      { label: "Collaborators", to: "/future/collaborators", icon: Users },
      { label: "Conferences", to: "/future/conferences", icon: Presentation },
      { label: "CV Builder", to: "/future/cv-builder", icon: FileText },
      { label: "Dissemination", to: "/future/dissemination", icon: Megaphone },
      { label: "Documents", to: "/future/documents", icon: Files },
      { label: "Funding", to: "/future/funding", icon: DollarSign },
      {
        label: "HDR students",
        to: "/future/hdr-students",
        icon: GraduationCap,
      },
      {
        label: "Journal rankings & research lists",
        to: "/future/journal-rankings-research-lists",
        icon: List,
      },
      {
        label: "Log real time activity",
        to: "/future/log-real-time-activity",
        icon: Activity,
      },
      {
        label: "Reviews, HDR examinations",
        to: "/future/reviews-hdr-examinations",
        icon: ClipboardCheck,
      },
      { label: "Teaching", to: "/future/teaching", icon: BookOpen },
    ],
  },
];
