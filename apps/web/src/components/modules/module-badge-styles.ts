import type { ModuleImportance, ModuleStatus } from "@/data/modules";

export function moduleStatusBadgeClass(status: ModuleStatus) {
  switch (status) {
    case "Active":
    case "Complete":
      return "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400";
    case "Review":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Stalled":
      return "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400";
    case "Archived":
      return "border-border text-muted-foreground";
  }
}

export function moduleImportanceBadgeClass(importance: ModuleImportance) {
  switch (importance) {
    case "Critical":
      return "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400";
    case "High":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Medium":
      return "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
    case "Low":
      return "border-border text-muted-foreground";
  }
}
