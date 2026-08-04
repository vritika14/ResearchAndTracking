import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { PageHeading } from "@/components/typography/heading";
import { NewTaskDialog, type NewTaskInput } from "@/components/tasks/new-task-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tasks, type TaskItem, type TaskPriority, type TaskStatus } from "@/data/tasks";
import { projects } from "@/data/projects";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["All", "To do", "Underway", "Waiting", "Complete"] as const;
const PRIORITY_FILTERS = ["All", "Low", "Medium", "High", "Critical"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

type SortColumn = "code" | "task" | "project" | "status" | "priority" | "due" | "est";
type SortDirection = "asc" | "desc";

const GRID_TEMPLATE = "100px minmax(240px,2fr) 170px 110px 110px 110px 80px";

const STATUS_ORDER: Record<TaskStatus, number> = {
  "To do": 0,
  Underway: 1,
  Waiting: 2,
  Complete: 3,
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Critical: 3,
};

function statusPillClass(status: TaskStatus) {
  switch (status) {
    case "To do":
      return "border-border text-muted-foreground";
    case "Underway":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Complete":
      return "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400";
    case "Waiting":
      return "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
  }
}

function priorityPillClass(priority: TaskPriority) {
  switch (priority) {
    case "Low":
      return "border-border text-muted-foreground";
    case "Medium":
      return "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
    case "High":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Critical":
      return "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400";
  }
}

function formatDueDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}-${month}-${year}`;
}

function compareTasks(a: TaskItem, b: TaskItem, column: SortColumn) {
  switch (column) {
    case "code":
      return a.code.localeCompare(b.code);
    case "task":
      return a.title.localeCompare(b.title);
    case "project":
      return a.projectName.localeCompare(b.projectName);
    case "status":
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    case "priority":
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    case "due":
      return a.dueDate.localeCompare(b.dueDate);
    case "est":
      return a.estimatedHours - b.estimatedHours;
  }
}

interface SortableHeaderProps {
  label: string;
  column: SortColumn;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

function SortableHeader({ label, column, sortColumn, sortDirection, onSort }: SortableHeaderProps) {
  const active = column === sortColumn;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      aria-label={`Sort by ${label}`}
      className={cn(
        "flex items-center gap-1 text-left transition-colors",
        active ? "text-foreground" : "hover:text-foreground",
      )}
    >
      {label}
      <ChevronDown
        className={cn(
          "h-3 w-3 transition-transform",
          active ? "text-primary" : "opacity-30",
          active && sortDirection === "desc" && "rotate-180",
        )}
      />
    </button>
  );
}

export default function TasksPage() {
  const [taskRows, setTaskRows] = useState<TaskItem[]>(tasks);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [priority, setPriority] = useState<PriorityFilter>("All");
  const [sortColumn, setSortColumn] = useState<SortColumn>("due");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  function handleSort(column: SortColumn) {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = taskRows.filter((task) => {
      if (status !== "All" && task.status !== status) return false;
      if (priority !== "All" && task.priority !== priority) return false;
      if (
        query &&
        !task.code.toLowerCase().includes(query) &&
        !task.title.toLowerCase().includes(query) &&
        !task.projectName.toLowerCase().includes(query) &&
        !(task.waitingOn?.toLowerCase().includes(query) ?? false)
      ) {
        return false;
      }
      return true;
    });
    const sorted = [...filtered].sort(
      (a, b) => compareTasks(a, b, sortColumn) * (sortDirection === "asc" ? 1 : -1),
    );
    return sorted;
  }, [taskRows, search, status, priority, sortColumn, sortDirection]);

  const hasActiveFilters = search !== "" || status !== "All" || priority !== "All";

  function clearFilters() {
    setSearch("");
    setStatus("All");
    setPriority("All");
  }

  function createTask(input: NewTaskInput) {
    const highestCode = taskRows.reduce((highest, task) => {
      const numericCode = Number(task.code.replace(/\D/g, ""));
      return Number.isNaN(numericCode) ? highest : Math.max(highest, numericCode);
    }, 440);
    const projectName = projects.find((project) => project.id === input.projectId)?.title;
    if (!projectName) return;

    setTaskRows((current) => [
      {
        code: `TSK-${String(highestCode + 1).padStart(4, "0")}`,
        title: input.title,
        projectName,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate,
        estimatedHours: input.estimatedHours,
        waitingOn: input.waitingOn,
      },
      ...current,
    ]);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        eyebrow="Workflows"
        title="Tasks and To Do"
        description="Everything outstanding across your projects — filter by status or priority, then sort any column."
        actions={<Button onClick={() => setIsNewTaskOpen(true)}>New Task</Button>}
      />

      <NewTaskDialog
        open={isNewTaskOpen}
        onOpenChange={setIsNewTaskOpen}
        projects={projects}
        onCreate={createTask}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tasks…"
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
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
        <Select value={priority} onValueChange={(value) => setPriority(value as PriorityFilter)}>
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

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div
            className="grid gap-4 px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
          >
            <SortableHeader
              label="Code"
              column="code"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              label="Task"
              column="task"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              label="Project"
              column="project"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              label="Status"
              column="status"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              label="Priority"
              column="priority"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              label="Due"
              column="due"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortableHeader
              label="Est."
              column="est"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </div>

          <div className="flex flex-col gap-3">
            {visibleTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No tasks match the current filters.
              </div>
            ) : (
              visibleTasks.map((task) => (
                <div
                  key={task.code}
                  className="grid items-center gap-4 rounded-lg border border-border bg-card px-4 py-4 shadow-sm"
                  style={{ gridTemplateColumns: GRID_TEMPLATE }}
                >
                  <span className="font-mono text-[11px] text-muted-foreground">{task.code}</span>

                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold leading-tight">{task.title}</span>
                    {task.waitingOn ? (
                      <span className="text-xs text-muted-foreground">
                        Waiting: {task.waitingOn}
                      </span>
                    ) : null}
                  </div>

                  <span className="text-sm text-muted-foreground">{task.projectName}</span>

                  <Badge variant="outline" className={statusPillClass(task.status)}>
                    {task.status}
                  </Badge>

                  <Badge variant="outline" className={priorityPillClass(task.priority)}>
                    {task.priority}
                  </Badge>

                  <span className="text-sm tabular-nums">{formatDueDate(task.dueDate)}</span>

                  <span className="text-sm tabular-nums text-muted-foreground">
                    {task.estimatedHours}h
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
