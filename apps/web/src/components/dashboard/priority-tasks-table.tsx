import { useMemo, useState } from "react";

import {
  priorityTasks,
  type TaskPriority,
  type TaskStatus,
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

const PRIORITY_FILTERS = ["All", "Critical", "High", "Medium", "Low"] as const;
const STATUS_FILTERS = [
  "All",
  "Open",
  "In Progress",
  "Blocked",
  "Done",
] as const;

type PriorityFilter = (typeof PRIORITY_FILTERS)[number];
type StatusFilter = (typeof STATUS_FILTERS)[number];

function priorityBadgeClass(priority: TaskPriority) {
  return priority === "Critical"
    ? "border-transparent bg-destructive text-destructive-foreground"
    : "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-400";
}

function statusBadgeClass(status: TaskStatus) {
  switch (status) {
    case "Open":
      return "border-transparent bg-secondary text-secondary-foreground";
    case "In Progress":
      return "border-transparent bg-primary text-primary-foreground";
    case "Blocked":
      return "border-transparent bg-destructive text-destructive-foreground";
    case "Done":
      return "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-400";
  }
}

export function PriorityTasksTable() {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<PriorityFilter>("All");
  const [status, setStatus] = useState<StatusFilter>("All");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return priorityTasks.filter((row) => {
      if (priority !== "All" && row.priority !== priority) return false;
      if (status !== "All" && row.status !== status) return false;
      if (
        query &&
        !row.project.toLowerCase().includes(query) &&
        !row.task.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [search, priority, status]);

  const hasActiveFilters =
    search !== "" || priority !== "All" || status !== "All";

  function clearFilters() {
    setSearch("");
    setPriority("All");
    setStatus("All");
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
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as StatusFilter)}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "All" ? "All statuses" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <TableHead>Project</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No tasks match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.project}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.task}
                  </TableCell>
                  <TableCell
                    className={cn(
                      row.overdue && "font-medium text-destructive",
                    )}
                  >
                    {row.due}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={priorityBadgeClass(row.priority)}
                    >
                      {row.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusBadgeClass(row.status)}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
