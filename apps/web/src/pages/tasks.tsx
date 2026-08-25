import { useMemo, useState } from "react";
import { ChevronDown, ListTodo, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { apiClient } from "@/api/client";
import {
  useCreateTask,
  useCurrentWorkspace,
  useDeleteMyTask,
  useMembers,
  useModules,
  useMyTasks,
  useProjects,
  useUpdateMyTask,
  type ApiTask,
} from "@/api/hooks";
import { ColumnVisibilityMenu } from "@/components/dashboard/column-visibility-menu";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeading } from "@/components/typography/heading";
import { TaskDialog, type TaskFormInput } from "@/components/tasks/task-dialog";
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
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["All", "To do", "Underway", "Waiting", "Complete"] as const;
const PRIORITY_FILTERS = ["All", "Low", "Medium", "High", "Critical"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

type SortColumn = "code" | "task" | "description" | "project" | "status" | "priority" | "due" | "est";
type SortDirection = "asc" | "desc";

const TASK_COLUMNS = [
  { id: "code", label: "Code", width: "100px" },
  { id: "task", label: "Task", width: "minmax(220px,1.5fr)" },
  { id: "description", label: "Description", width: "minmax(260px,2fr)" },
  { id: "project", label: "Linked to", width: "170px" },
  { id: "status", label: "Status", width: "110px" },
  { id: "priority", label: "Priority", width: "110px" },
  { id: "due", label: "Due", width: "110px" },
  { id: "est", label: "Est.", width: "80px" },
] as const;

const STATUS_ORDER: Record<string, number> = { "To do": 0, Underway: 1, Waiting: 2, Complete: 3 };
const PRIORITY_ORDER: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

function statusPillClass(status: string | null) {
  switch (status) {
    case "To do":
      return "border-border text-muted-foreground";
    case "Underway":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Complete":
      return "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400";
    case "Waiting":
      return "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
    default:
      return "border-border text-muted-foreground";
  }
}

function priorityPillClass(priority: string | null) {
  switch (priority) {
    case "Low":
      return "border-border text-muted-foreground";
    case "Medium":
      return "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
    case "High":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Critical":
      return "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400";
    default:
      return "border-border text-muted-foreground";
  }
}

function formatDueDate(iso: string | null) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
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
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";

  // Tasks are tenant-agnostic — a task shared with the caller from another
  // workspace must still show up here, since task visibility never depended
  // on workspace membership (see MyTasksController on the backend).
  const tasksQuery = useMyTasks();
  const projectsQuery = useProjects(tenantId);
  const modulesQuery = useModules(tenantId);

  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ApiTask | null>(null);
  const membersQuery = useMembers(tenantId, isNewTaskOpen || editingTask !== null);

  const createTask = useCreateTask(tenantId);
  const updateTask = useUpdateMyTask();
  const deleteTask = useDeleteMyTask();

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

  const projectById = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projectsQuery.data ?? []) map.set(project.id, project.title);
    return map;
  }, [projectsQuery.data]);

  const moduleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const module of modulesQuery.data ?? []) map.set(module.id, module.title);
    return map;
  }, [modulesQuery.data]);

  function linkTargetLabel(task: ApiTask) {
    if (task.moduleId) return moduleById.get(task.moduleId) ?? "Unknown module";
    if (task.projectId) return projectById.get(task.projectId) ?? "Unknown project";
    return "General";
  }

  function handleSort(column: SortColumn) {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  function compareTasks(a: ApiTask, b: ApiTask, column: SortColumn) {
    switch (column) {
      case "code":
        return (a.displayId ?? "").localeCompare(b.displayId ?? "");
      case "task":
        return a.title.localeCompare(b.title);
      case "description":
        return (a.description ?? "").localeCompare(b.description ?? "");
      case "project":
        return linkTargetLabel(a).localeCompare(linkTargetLabel(b));
      case "status":
        return (STATUS_ORDER[a.status ?? ""] ?? 99) - (STATUS_ORDER[b.status ?? ""] ?? 99);
      case "priority":
        return (PRIORITY_ORDER[a.priority ?? ""] ?? 99) - (PRIORITY_ORDER[b.priority ?? ""] ?? 99);
      case "due":
        return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
      case "est":
        return Number(a.estimatedHours ?? 0) - Number(b.estimatedHours ?? 0);
    }
  }

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = (tasksQuery.data ?? []).filter((task) => {
      if (status !== "All" && task.status !== status) return false;
      if (priority !== "All" && task.priority !== priority) return false;
      if (
        query &&
        !(task.displayId?.toLowerCase().includes(query) ?? false) &&
        !task.title.toLowerCase().includes(query) &&
        !(task.description?.toLowerCase().includes(query) ?? false) &&
        !linkTargetLabel(task).toLowerCase().includes(query) &&
        !(task.workingWith?.toLowerCase().includes(query) ?? false)
      ) {
        return false;
      }
      return true;
    });
    return [...filtered].sort(
      (a, b) => compareTasks(a, b, sortColumn) * (sortDirection === "asc" ? 1 : -1),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasksQuery.data, search, status, priority, sortColumn, sortDirection, projectById, moduleById]);

  const hasActiveFilters = search !== "" || status !== "All" || priority !== "All";

  function clearFilters() {
    setSearch("");
    setStatus("All");
    setPriority("All");
  }

  async function handleCreateTask(input: TaskFormInput) {
    const task = await createTask.mutateAsync({
      title: input.title,
      description: input.description || undefined,
      projectId: input.linkTarget === "project" ? input.projectId : undefined,
      moduleId: input.linkTarget === "module" ? input.moduleId : undefined,
      status: input.status,
      priority: input.priority,
      visibility: input.visibility,
      workingWith: input.workingWith || undefined,
      estimatedHours: input.estimatedHours || undefined,
      dueDate: input.dueDate || undefined,
    });

    await Promise.all(
      input.collaboratorUserIds.map((userId) =>
        apiClient.POST("/api/v1/tenant/{tenantId}/tasks/{taskId}/members", {
          params: { path: { tenantId, taskId: task.id } },
          body: { userId },
        }),
      ),
    );
  }

  async function handleUpdateTask(input: TaskFormInput) {
    if (!editingTask) return;
    await updateTask.mutateAsync({
      taskId: editingTask.id,
      input: {
        title: input.title,
        description: input.description || undefined,
        status: input.status,
        priority: input.priority,
        visibility: input.visibility,
        workingWith: input.workingWith || undefined,
        estimatedHours: input.estimatedHours || undefined,
        dueDate: input.dueDate || undefined,
        projectId: input.linkTarget === "project" ? input.projectId : undefined,
        // A task's link is cleared server-side only when this key is present
        // and falsy — see TasksService.resolveLinkage's changesLinkage check.
        moduleId: input.linkTarget === "module" ? input.moduleId : "",
      },
    });
    setEditingTask(null);
  }

  async function handleDeleteTask(task: ApiTask) {
    if (!window.confirm(`Delete "${task.title}"? This action cannot be undone.`)) {
      return;
    }
    await deleteTask.mutateAsync(task.id);
    setEditingTask((current) => (current?.id === task.id ? null : current));
  }

  if (workspace.isPending || tasksQuery.isPending) {
    return <LoadingState title="Loading tasks" className="min-h-[50vh]" />;
  }
  if (tasksQuery.isError) {
    return (
      <ErrorState
        title="Tasks could not be loaded"
        description={tasksQuery.error.message}
        onRetry={() => void tasksQuery.refetch()}
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeading
        icon={ListTodo}
        tone="amber"
        eyebrow="Workflows"
        title="Tasks and To Do"
        description="Everything outstanding across your projects — filter by status or priority, then sort any column."
        actions={<Button onClick={() => setIsNewTaskOpen(true)}>New Task</Button>}
      />

      <TaskDialog
        open={isNewTaskOpen}
        onOpenChange={setIsNewTaskOpen}
        tenantId={tenantId}
        projects={projectsQuery.data ?? []}
        modules={modulesQuery.data ?? []}
        members={membersQuery.data ?? []}
        membersLoading={membersQuery.isPending}
        onSave={(input) => void handleCreateTask(input)}
      />

      {editingTask ? (
        <TaskDialog
          key={editingTask.id}
          open
          tenantId={tenantId}
          projects={projectsQuery.data ?? []}
          modules={modulesQuery.data ?? []}
          members={membersQuery.data ?? []}
          membersLoading={membersQuery.isPending}
          task={editingTask}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null);
          }}
          onSave={(input) => void handleUpdateTask(input)}
        />
      ) : null}

      <div className="surface-toolbar flex flex-wrap items-center gap-3 border-amber-200/70 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/10">
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

      <div className="overflow-x-auto rounded-xl border border-border/70 bg-muted/20 p-3 shadow-sm sm:p-4">
        <div className="min-w-[720px]">
          <div
            className="mb-3 grid gap-4 rounded-lg border border-amber-200/70 bg-amber-100/65 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-200"
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
                  key={task.id}
                  className="grid items-center gap-4 rounded-xl border border-amber-200/70 bg-gradient-to-r from-amber-50/55 via-card to-card px-4 py-4 shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-amber-900/50 dark:from-amber-950/15"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  {columns.isColumnVisible("code") ? (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {task.displayId ?? "—"}
                  </span>
                  ) : null}

                  {columns.isColumnVisible("task") ? (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-start gap-2">
                      <Link
                        to={`/tasks/${task.id}`}
                        className="font-semibold leading-tight text-foreground transition-colors hover:text-primary hover:underline"
                      >
                        {task.title}
                      </Link>
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
                        onClick={() => void handleDeleteTask(task)}
                        aria-label={`Delete ${task.title}`}
                        title="Delete task"
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {task.workingWith ? (
                      <span className="text-xs text-muted-foreground">
                        Working with: {task.workingWith}
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
                  <span className="text-sm text-muted-foreground">{linkTargetLabel(task)}</span>
                  ) : null}

                  {columns.isColumnVisible("status") ? (
                  <Badge variant="outline" className={statusPillClass(task.status)}>
                    {task.status ?? "—"}
                  </Badge>
                  ) : null}

                  {columns.isColumnVisible("priority") ? (
                  <Badge variant="outline" className={priorityPillClass(task.priority)}>
                    {task.priority ?? "—"}
                  </Badge>
                  ) : null}

                  {columns.isColumnVisible("due") ? (
                  <span className="text-sm tabular-nums">{formatDueDate(task.dueDate)}</span>
                  ) : null}

                  {columns.isColumnVisible("est") ? (
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {task.estimatedHours ? `${task.estimatedHours}h` : "—"}
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
