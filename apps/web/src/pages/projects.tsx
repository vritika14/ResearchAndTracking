import { useMemo, useState } from "react";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { apiClient } from "@/api/client";
import {
  apiKeys,
  useArchiveMyProject,
  useCurrentWorkspace,
  useMe,
  useModules,
  useMyProjects,
  useNotes,
  usePipelineStages,
  useCreateProject,
  useTasks,
  type ApiProject,
} from "@/api/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnVisibilityMenu } from "@/components/dashboard/column-visibility-menu";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeading } from "@/components/typography/heading";
import {
  NewProjectDialog,
  type NewProjectInput,
} from "@/components/projects/new-project-dialog";
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
import { cn } from "@/lib/utils";
import { useColumnVisibility } from "@/hooks/use-column-visibility";

const STATUS_FILTERS = ["All", "Active", "Review", "Stalled", "Complete"] as const;
const ROLE_FILTERS = ["All roles", "owner", "collaborator", "supervisor", "lead"] as const;
const SORT_OPTIONS = ["Due date", "Stage", "Tasks outstanding"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type RoleFilter = (typeof ROLE_FILTERS)[number];
type SortOption = (typeof SORT_OPTIONS)[number];

const PROJECT_COLUMNS = [
  { id: "project", label: "Project", width: "minmax(280px,2.2fr)" },
  { id: "role", label: "My Role", width: "110px" },
  { id: "importance", label: "Importance", width: "110px" },
  { id: "status", label: "Status", width: "110px" },
  { id: "stage", label: "Stage", width: "120px" },
  { id: "progress", label: "Progress", width: "130px" },
  { id: "notes", label: "Notes", width: "70px" },
  { id: "scheduled", label: "Scheduled For", width: "110px" },
  { id: "due", label: "Due Date", width: "110px" },
] as const;

function priorityPillClass(priority: string | null) {
  switch (priority) {
    case "Critical":
      return "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400";
    case "High":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Medium":
      return "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
    default:
      return "border-border text-muted-foreground";
  }
}

function statusPillClass(status: string | null) {
  switch (status) {
    case "Active":
    case "Complete":
      return "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400";
    case "Review":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Stalled":
      return "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400";
    default:
      return "border-border text-muted-foreground";
  }
}

function rolePillClass(role: string | null) {
  switch (role) {
    case "owner":
      return "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
    case "lead":
      return "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400";
    case "collaborator":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    default:
      return "border-border text-muted-foreground";
  }
}

/** Selected = solid blue. Inactive = white pill, light-grey border. */
function controlPillClass(selected: boolean) {
  return cn(
    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    selected
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function ProgressCell({ completed, total }: { completed: number; total: number }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{percent}%</span>
    </div>
  );
}

function ProjectOverviewDetails({
  project,
  moduleCount,
  taskCount,
  noteCount,
}: {
  project: ApiProject;
  moduleCount: number;
  taskCount: number;
  noteCount: number;
}) {
  const fields = [
    { label: "Research area", value: project.researchArea ?? "—" },
    { label: "Modules", value: String(moduleCount) },
    { label: "Tasks", value: String(taskCount) },
    { label: "Notes", value: String(noteCount) },
    { label: "Total budget", value: project.totalBudget ? `$${project.totalBudget}` : "—" },
    { label: "Target journal(s)", value: project.targetJournals ?? "—" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Overview
      </span>
      {project.description ? (
        <p className="max-w-2xl text-sm text-muted-foreground">{project.description}</p>
      ) : null}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {fields.map((field) => (
          <div key={field.label} className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{field.label}</span>
            <span className="text-sm font-semibold">{field.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function isOverdue(project: ApiProject) {
  if (!project.dueDate || project.status === "Complete") return false;
  return project.dueDate < new Date().toISOString().slice(0, 10);
}

function sortProjects(rows: ApiProject[], sortBy: SortOption, stageOrder: Map<string, number>) {
  const sorted = [...rows];
  switch (sortBy) {
    case "Due date":
      sorted.sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
      break;
    case "Stage":
      sorted.sort(
        (a, b) =>
          (stageOrder.get(a.pipelineStage ?? "") ?? Number.MAX_SAFE_INTEGER) -
          (stageOrder.get(b.pipelineStage ?? "") ?? Number.MAX_SAFE_INTEGER),
      );
      break;
    case "Tasks outstanding":
      // Handled by the caller, which has live task counts per project.
      break;
  }
  return sorted;
}

export default function ProjectsPage() {
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";
  const queryClient = useQueryClient();

  // Projects are tenant-agnostic — a project shared with the caller from
  // another workspace must still show up here (see MyProjectsController on
  // the backend). Linked module/task/note counts below remain scoped to the
  // caller's current workspace, so they may read incomplete for a project
  // that lives in a different tenant.
  const projectsQuery = useMyProjects();
  const modulesQuery = useModules(tenantId);
  const tasksQuery = useTasks(tenantId);
  const notesQuery = useNotes(tenantId);
  const pipelineStagesQuery = usePipelineStages(tenantId);
  const stageOrder = useMemo(() => {
    const map = new Map<string, number>();
    for (const stage of pipelineStagesQuery.data ?? []) {
      map.set(stage.value, stage.sortOrder);
    }
    return map;
  }, [pipelineStagesQuery.data]);

  const createProject = useCreateProject(tenantId);
  const archiveProject = useArchiveMyProject();

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [role, setRole] = useState<RoleFilter>("All roles");
  const [sortBy, setSortBy] = useState<SortOption>("Due date");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const columns = useColumnVisibility(
    PROJECT_COLUMNS.map((column) => column.id),
  );
  const gridTemplate = PROJECT_COLUMNS.filter((column) =>
    columns.visibleColumns.has(column.id),
  )
    .map((column) => column.width)
    .join(" ");
  const me = useMe();

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const taskCountByProject = useMemo(() => {
    const counts = new Map<string, { completed: number; total: number }>();
    for (const task of tasksQuery.data ?? []) {
      if (!task.projectId) continue;
      const entry = counts.get(task.projectId) ?? { completed: 0, total: 0 };
      entry.total += 1;
      if (task.status === "Complete") entry.completed += 1;
      counts.set(task.projectId, entry);
    }
    return counts;
  }, [tasksQuery.data]);

  const noteCountByProject = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notesQuery.data ?? []) {
      if (!note.projectId) continue;
      counts.set(note.projectId, (counts.get(note.projectId) ?? 0) + 1);
    }
    return counts;
  }, [notesQuery.data]);

  const moduleCountByProject = useMemo(() => {
    const counts = new Map<string, number>();
    for (const module of modulesQuery.data ?? []) {
      if (!module.projectId) continue;
      counts.set(module.projectId, (counts.get(module.projectId) ?? 0) + 1);
    }
    return counts;
  }, [modulesQuery.data]);

  const visibleProjects = useMemo(() => {
    const rows = projectsQuery.data ?? [];
    const query = search.trim().toLowerCase();
    const filtered = rows.filter((project) => {
      if (status !== "All" && project.status !== status) return false;
      if (role !== "All roles" && project.role !== role) return false;
      if (
        query &&
        !project.title.toLowerCase().includes(query) &&
        !(project.researchArea?.toLowerCase().includes(query) ?? false)
      ) {
        return false;
      }
      return true;
    });
    if (sortBy === "Tasks outstanding") {
      return [...filtered].sort((a, b) => {
        const aCounts = taskCountByProject.get(a.id) ?? { completed: 0, total: 0 };
        const bCounts = taskCountByProject.get(b.id) ?? { completed: 0, total: 0 };
        return (bCounts.total - bCounts.completed) - (aCounts.total - aCounts.completed);
      });
    }
    return sortProjects(filtered, sortBy, stageOrder);
  }, [projectsQuery.data, search, status, role, sortBy, stageOrder, taskCountByProject]);

  const hasActiveFilters = search !== "" || status !== "All" || role !== "All roles";

  function clearFilters() {
    setSearch("");
    setStatus("All");
    setRole("All roles");
  }

  async function handleCreateProject(input: NewProjectInput) {
    const project = await createProject.mutateAsync({
      title: input.title,
      description: input.description || undefined,
      researchArea: input.researchArea || undefined,
      status: input.status,
      importance: input.priority,
      pipelineStage: input.pipelineStage || undefined,
      scheduledFor: input.scheduledFor || undefined,
      dueDate: input.dueDate || undefined,
      totalBudget: input.totalBudget || undefined,
      targetJournals: input.targetJournals || undefined,
    });

    await Promise.all(
      input.collaboratorUserIds.map((userId) =>
        apiClient.POST(
          "/api/v1/tenant/{tenantId}/projects/{projectId}/collaborators",
          {
            params: { path: { tenantId, projectId: project.id } },
            body: { userId, role: "Collaborator" },
          },
        ),
      ),
    );
    if (input.collaboratorUserIds.length > 0) {
      await queryClient.invalidateQueries({
        queryKey: apiKeys.projectCollaborators(tenantId, project.id),
      });
    }
  }

  async function handleDeleteProject(project: ApiProject) {
    if (
      !window.confirm(
        `Delete "${project.title}"? It will be archived and permanently removed after 14 days.`,
      )
    ) {
      return;
    }
    await archiveProject.mutateAsync(project.id);
    setExpandedId((current) => (current === project.id ? null : current));
  }

  if (workspace.isPending || projectsQuery.isPending) {
    return <LoadingState title="Loading projects" className="min-h-[50vh]" />;
  }
  if (projectsQuery.isError) {
    return (
      <ErrorState
        title="Projects could not be loaded"
        description={projectsQuery.error.message}
        onRetry={() => void projectsQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        eyebrow="Workflows"
        title="Projects"
        description="Track research work by stage, dates, collaborators and outstanding tasks."
        actions={<Button onClick={() => setIsNewProjectOpen(true)}>New Project</Button>}
      />

      <NewProjectDialog
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
        onCreate={(input) => void handleCreateProject(input)}
        currentUserId={me.data?.id ?? ""}
        pipelineStages={pipelineStagesQuery.data ?? []}
      />

      <div className="flex flex-col gap-4 rounded-lg border p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects…"
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
          <Select value={role} onValueChange={(value) => setRole(value as RoleFilter)}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_FILTERS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "All roles" ? option : option.replace(/^\w/, (c) => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ColumnVisibilityMenu
            columns={PROJECT_COLUMNS}
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
        <div className="flex flex-col gap-2 lg:items-end">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sort by
          </span>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSortBy(option)}
                aria-pressed={option === sortBy}
                className={controlPillClass(option === sortBy)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div
            className="grid gap-4 px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-primary"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {PROJECT_COLUMNS.filter((column) =>
              columns.visibleColumns.has(column.id),
            ).map((column) => (
              <span key={column.id}>{column.label}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {visibleProjects.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No projects match the current filters.
              </div>
            ) : (
              visibleProjects.map((project) => {
                const isExpanded = expandedId === project.id;
                const taskCounts = taskCountByProject.get(project.id) ?? {
                  completed: 0,
                  total: 0,
                };

                return (
                  <div key={project.id} className="flex flex-col">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() => toggleExpanded(project.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleExpanded(project.id);
                        }
                      }}
                      className={cn(
                        "grid cursor-pointer items-center gap-4 border border-border bg-card px-4 py-4 shadow-sm transition-colors hover:bg-accent/40",
                        isExpanded ? "rounded-t-lg border-b-0" : "rounded-lg",
                      )}
                      style={{ gridTemplateColumns: gridTemplate }}
                    >
                      {columns.isColumnVisible("project") ? (
                      <div className="flex items-start gap-2">
                        <ChevronRight
                          className={cn(
                            "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                            isExpanded && "rotate-90",
                          )}
                        />
                        <div className="flex flex-col gap-0.5">
                          {project.displayId ? (
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {project.displayId}
                            </span>
                          ) : null}
                          <div className="flex items-start gap-2">
                            <Link
                              to={`/projects/${project.id}`}
                              onClick={(event) => event.stopPropagation()}
                              className="font-semibold leading-tight transition-colors hover:text-primary hover:underline"
                            >
                              {project.title}
                            </Link>
                            <Link
                              to={`/projects/${project.id}?edit=true`}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`Edit ${project.title}`}
                              title="Edit project"
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDeleteProject(project);
                              }}
                              aria-label={`Delete ${project.title}`}
                              title="Delete project"
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {project.researchArea ? (
                            <span className="text-xs text-muted-foreground">
                              {project.researchArea}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      ) : null}

                      {columns.isColumnVisible("role") ? (
                      <Badge variant="outline" className={rolePillClass(project.role)}>
                        {project.role ?? "—"}
                      </Badge>
                      ) : null}

                      {columns.isColumnVisible("importance") ? (
                      <Badge variant="outline" className={priorityPillClass(project.importance)}>
                        {project.importance ?? "—"}
                      </Badge>
                      ) : null}

                      {columns.isColumnVisible("status") ? (
                      <Badge variant="outline" className={statusPillClass(project.status)}>
                        {project.status ?? "—"}
                      </Badge>
                      ) : null}

                      {columns.isColumnVisible("stage") ? (
                      <span className="text-sm text-muted-foreground">
                        {project.pipelineStage ?? "Unknown stage"}
                      </span>
                      ) : null}

                      {columns.isColumnVisible("progress") ? (
                      <ProgressCell
                        completed={taskCounts.completed}
                        total={taskCounts.total}
                      />
                      ) : null}

                      {columns.isColumnVisible("notes") ? (
                      <span className="text-sm text-muted-foreground">
                        {noteCountByProject.get(project.id) ?? 0}
                      </span>
                      ) : null}

                      {columns.isColumnVisible("scheduled") ? (
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {formatDate(project.scheduledFor)}
                      </span>
                      ) : null}

                      {columns.isColumnVisible("due") ? (
                      <span
                        className={cn(
                          "text-sm",
                          isOverdue(project)
                            ? "font-semibold text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {formatDate(project.dueDate)}
                      </span>
                      ) : null}
                    </div>

                    {isExpanded ? (
                      <div className="flex flex-col gap-5 rounded-b-lg border border-t-0 border-border bg-muted/30 px-4 py-5">
                        <ProjectOverviewDetails
                          project={project}
                          moduleCount={moduleCountByProject.get(project.id) ?? 0}
                          taskCount={taskCounts.total}
                          noteCount={noteCountByProject.get(project.id) ?? 0}
                        />
                        <Button asChild variant="outline" size="sm" className="w-fit">
                          <Link to={`/projects/${project.id}`}>View full project details</Link>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
