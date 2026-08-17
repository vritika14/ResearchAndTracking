import { useMemo, useState } from "react";

import { ColumnVisibilityMenu } from "@/components/dashboard/column-visibility-menu";
import { priorityBadgeClass } from "@/components/dashboard/priority-badge-styles";
import {
  priorityTasks,
} from "@/data/priority-tasks";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useColumnVisibility } from "@/hooks/use-column-visibility";

const PRIORITY_FILTERS = ["All", "Critical", "High", "Medium", "Low"] as const;
const TASK_COLUMNS = [
  { id: "project", label: "Project" },
  { id: "task", label: "Task" },
  { id: "due", label: "Due" },
  { id: "priority", label: "Priority" },
] as const;

type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

export function PriorityTasksTable() {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<PriorityFilter>("All");
  const columns = useColumnVisibility(TASK_COLUMNS.map((column) => column.id));

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return priorityTasks.filter((row) => {
      if (priority !== "All" && row.priority !== priority) return false;
      if (
        query &&
        !row.project.toLowerCase().includes(query) &&
        !row.task.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [search, priority]);

  const hasActiveFilters = search !== "" || priority !== "All";

  function clearFilters() {
    setSearch("");
    setPriority("All");
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <div>
          <CardTitle>Tasks to be done</CardTitle>
          <CardDescription>
            Tasks across all projects that need attention first.
          </CardDescription>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search project or task…"
            className="sm:max-w-xs"
          />
          <Select
            value={priority}
            onValueChange={(value) => setPriority(value as PriorityFilter)}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_FILTERS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "All" ? "All priorities" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ColumnVisibilityMenu
            columns={TASK_COLUMNS}
            visibleColumns={columns.visibleColumns}
            onToggle={columns.toggleColumn}
          />
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.isColumnVisible("project") ? <TableHead>Project</TableHead> : null}
              {columns.isColumnVisible("task") ? <TableHead>Task</TableHead> : null}
              {columns.isColumnVisible("due") ? <TableHead>Due</TableHead> : null}
              {columns.isColumnVisible("priority") ? <TableHead>Priority</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.visibleColumns.size}
                  className="h-24 text-center text-muted-foreground"
                >
                  No tasks match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  {columns.isColumnVisible("project") ? (
                    <TableCell className="font-medium">{row.project}</TableCell>
                  ) : null}
                  {columns.isColumnVisible("task") ? (
                    <TableCell className="text-muted-foreground">{row.task}</TableCell>
                  ) : null}
                  {columns.isColumnVisible("due") ? (
                    <TableCell
                      className={cn(row.overdue && "font-medium text-destructive")}
                    >
                      {row.due}
                    </TableCell>
                  ) : null}
                  {columns.isColumnVisible("priority") ? (
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={priorityBadgeClass(row.priority)}
                      >
                        {row.priority}
                      </Badge>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
