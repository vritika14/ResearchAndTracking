export function priorityBadgeClass(priority: string | null) {
  switch (priority) {
    case "Critical":
      return "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400";
    case "High":
      return "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400";
    case "Medium":
      return "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400";
    case "Low":
      return "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300";
    default:
      return "border-border bg-transparent text-muted-foreground";
  }
}
