import { useMemo, useState } from "react";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";

import { ColumnVisibilityMenu } from "@/components/dashboard/column-visibility-menu";
import { PageHeading } from "@/components/typography/heading";
import { EditTaskDialog, type EditTaskInput } from "@/components/tasks/edit-task-dialog";
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
import { useColumnVisibility } from "@/hooks/use-column-visibility";

const STATUS_FILTERS = ["All", "To do", "Underway", "Waiting", "Complete"] as const;
const PRIORITY_FILTERS = ["All", "Low", "Medium", "High", "Critical"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

type SortColumn =
  | "code"
  | "task"
  | "description"
  | "project"
  | "status"
  | "priority"
  | "scheduled"
  | "due"
  | "est";
type SortDirection = "asc" | "desc";

const TASK_COLUMNS = [
  { id: "code", label: "Code", width: "100px" },
  { id: "task", label: "Task", width: "minmax(220px,1.5fr)" },
  { id: "description", label: "Description", width: "minmax(260px,2fr)" },
  { id: "project", label: "Project", width: "170px" },
  { id: "status", label: "Status", width: "110px" },
  { id: "priority", label: "Priority", width: "110px" },
  { id: "scheduled", label: "Scheduled For", width: "120px" },
  { id: "due", label: "Due", width: "110px" },
  { id: "est", label: "Est.", width: "80px" },
] as const;

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
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function compareTasks(a: TaskItem, b: TaskItem, column: SortColumn) {
  switch (column) {
    case "code":
      return a.code.localeCompare(b.code);
    case "task":
      return a.title.localeCompare(b.title);
    case "description":
      return a.description.localeCompare(b.description);
    case "project":
      return a.projectName.localeCompare(b.projectName);
    case "status":
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    case "priority":
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    case "scheduled":
      return a.scheduledFor.localeCompare(b.scheduledFor);
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
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [priority, setPriority] = useState<PriorityFilter>("All");
  const [sortColumn, setSortColumn] = useState<SortColumn>("due");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const columns = useColumnVisibility(TASK_COLUMNS.map((column) => column.id));
  const gridTemplate = TASK_COLUMNS.filter((column) =>
    columns.visibleColumns.has(column.id),
  )
    .map((column) => column.width)
    .join(" ");

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
        !task.description.toLowerCase().includes(query) &&
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
    const projectName = input.isIndependent
      ? "Independent task"
      : projects.find((project) => project.id === input.projectId)?.title;
    if (!projectName) return;

    setTaskRows((current) => [
      {
        code: `TSK-${String(highestCode + 1).padStart(4, "0")}`,
        title: input.title,
        description: input.description,
        projectName,
        status: input.status,
        priority: input.priority,
        scheduledFor: input.scheduledFor,
        dueDate: input.dueDate,
        estimatedHours: input.estimatedHours,
        waitingOn: input.waitingOn,
      },
      ...current,
    ]);
  }

  function updateTask(code: string, input: EditTaskInput) {
    const projectName = input.isIndependent
      ? "Independent task"
      : projects.find((project) => project.id === input.projectId)?.title;
    if (!projectName) return;
    const {
      projectId: _projectId,
      isIndependent: _isIndependent,
      ...values
    } = input;
    void _projectId;
    void _isIndependent;

    setTaskRows((current) =>
      current.map((task) =>
        task.code === code
          ? {
              ...task,
              ...values,
              projectName,
            }
          : task,
      ),
    );
  }

  function deleteTask(task: TaskItem) {
    if (!window.confirm(`Delete "${task.title}"? This action cannot be undone.`)) {
      return;
    }
    setTaskRows((current) => current.filter((row) => row.code !== task.code));
    setEditingTask((current) => (current?.code === task.code ? null : current));
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

      {editingTask ? (
        <EditTaskDialog
          key={editingTask.code}
          open
          task={editingTask}
          projects={projects}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null);
          }}
          onSave={(input) => updateTask(editingTask.code, input)}
        />
      ) : null}

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

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div
            className="grid gap-4 px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-primary"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {TASK_COLUMNS.filter((column) =>
              columns.visibleColumns.has(column.id),
            ).map((column) => (
              <SortableHeader
                key={column.id}
                label={column.label}
                column={column.id}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            ))}
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
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  {columns.isColumnVisible("code") ? (
                  <span className="font-mono text-[11px] text-muted-foreground">{task.code}</span>
                  ) : null}

                  {columns.isColumnVisible("task") ? (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold leading-tight">{task.title}</span>
                      <button
                        type="button"
                        onClick={() => setEditingTask(task)}
                        aria-label={`Edit ${task.title}`}
                        title="Edit task"
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask(task)}
                        aria-label={`Delete ${task.title}`}
                        title="Delete task"
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {task.waitingOn ? (
                      <span className="text-xs text-muted-foreground">
                        Waiting: {task.waitingOn}
                      </span>
                    ) : null}
                  </div>
                  ) : null}

                  {columns.isColumnVisible("description") ? (
                  <span className="text-sm leading-5 text-muted-foreground">
                    {task.description || "—"}
                  </span>
                  ) : null}

                  {columns.isColumnVisible("project") ? (
                  <span className="text-sm text-muted-foreground">{task.projectName}</span>
                  ) : null}

                  {columns.isColumnVisible("status") ? (
                  <Badge variant="outline" className={statusPillClass(task.status)}>
                    {task.status}
                  </Badge>
                  ) : null}

                  {columns.isColumnVisible("priority") ? (
                  <Badge variant="outline" className={priorityPillClass(task.priority)}>
                    {task.priority}
                  </Badge>
                  ) : null}

                  {columns.isColumnVisible("scheduled") ? (
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {formatDueDate(task.scheduledFor)}
                  </span>
                  ) : null}

                  {columns.isColumnVisible("due") ? (
                  <span className="text-sm tabular-nums">{formatDueDate(task.dueDate)}</span>
                  ) : null}

                  {columns.isColumnVisible("est") ? (
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {task.estimatedHours}h
                  </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
