import { useMemo, useState } from "react";
import { ChevronRight, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

import { useCurrentWorkspace, useMe, useMembers } from "@/api/hooks";
import { ColumnVisibilityMenu } from "@/components/dashboard/column-visibility-menu";
import {
  moduleImportanceBadgeClass,
  moduleStatusBadgeClass,
} from "@/components/modules/module-badge-styles";
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
import type { ResearchModule } from "@/data/modules";
import {
  projects,
  type Project,
  type ProjectPriority,
  type ProjectRole,
  type ProjectStatus,
} from "@/data/projects";
import { cn } from "@/lib/utils";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useModules } from "@/hooks/use-modules";
import { usePipelineStages } from "@/hooks/use-pipeline-stages";
import { useProjectStageOverrides } from "@/hooks/use-project-stage-overrides";

const STATUS_FILTERS = ["All", "Active", "Review", "Stalled", "Complete"] as const;
const ROLE_FILTERS = ["All roles", "Owner", "Lead", "Collaborator", "Supervisor"] as const;
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

function priorityPillClass(priority: ProjectPriority) {
  switch (priority) {
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

function statusPillClass(status: ProjectStatus) {
  switch (status) {
    case "Active":
    case "Complete":
      return "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400";
    case "Review":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Stalled":
      return "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400";
  }
}

function rolePillClass(role: ProjectRole) {
  switch (role) {
    case "Owner":
      return "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
    case "Lead":
      return "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400";
    case "Collaborator":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Supervisor":
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

function formatDate(iso: string) {
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

function ProjectOverviewDetails({ project }: { project: Project }) {
  const budgetPercent =
    project.budgetTotal > 0 ? Math.round((project.budgetUsed / project.budgetTotal) * 100) : 0;

  const fields = [
    { label: "Funder", value: project.funder },
    {
      label: "Task Completion",
      value: `${project.tasksCompleted}/${project.tasksTotal} complete`,
    },
    { label: "Budget Usage", value: `${budgetPercent}% used` },
    { label: "Target Journal", value: project.targetJournal },
  ];

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Overview
      </span>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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

function ProjectModulesDetails({
  modules,
  stageNames,
}: {
  modules: ResearchModule[];
  stageNames: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Modules ({modules.length})
        </span>
        <Button asChild variant="ghost" size="sm">
          <Link to="/modules">Manage modules</Link>
        </Button>
      </div>
      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No modules are linked to this project.</p>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {modules.map((module) => (
            <div key={module.id} className="rounded-md border border-border bg-card p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="block font-mono text-[10px] text-muted-foreground">
                    {module.id}
                  </span>
                  <span className="block text-sm font-semibold">{module.title}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className={moduleStatusBadgeClass(module.status)}>
                    {module.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={moduleImportanceBadgeClass(module.importance)}
                  >
                    {module.importance}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{stageNames[module.stageIndex] ?? "Unknown stage"}</span>
                <span>Due {formatDate(module.dueDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function sortProjects(rows: Project[], sortBy: SortOption) {
  const sorted = [...rows];
  switch (sortBy) {
    case "Due date":
      sorted.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      break;
    case "Stage":
      sorted.sort((a, b) => a.stageIndex - b.stageIndex);
      break;
    case "Tasks outstanding":
      sorted.sort(
        (a, b) => b.tasksTotal - b.tasksCompleted - (a.tasksTotal - a.tasksCompleted),
      );
      break;
  }
  return sorted;
}

export default function ProjectsPage() {
  const [projectRows, setProjectRows] = useState<Project[]>(projects);
  const { moduleRows } = useModules();
  const { pipelineStages } = usePipelineStages();
  const stageNames = pipelineStages.map((stage) => stage.name);
  const { stageOverrides } = useProjectStageOverrides();
  const stagedProjectRows = useMemo(
    () =>
      projectRows.map((project) => ({
        ...project,
        stageIndex: stageOverrides[project.id] ?? project.stageIndex,
      })),
    [projectRows, stageOverrides],
  );
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
  const workspace = useCurrentWorkspace();
  const workspaceMembers = useMembers(
    workspace.data?.id ?? "",
    isNewProjectOpen,
  );

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = stagedProjectRows.filter((project) => {
      if (status !== "All" && project.status !== status) return false;
      if (role !== "All roles" && project.myRole !== role) return false;
      if (
        query &&
        !project.title.toLowerCase().includes(query) &&
        !project.id.toLowerCase().includes(query) &&
        !project.pi.toLowerCase().includes(query) &&
        !project.funder.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
    return sortProjects(filtered, sortBy);
  }, [stagedProjectRows, search, status, role, sortBy]);

  const hasActiveFilters = search !== "" || status !== "All" || role !== "All roles";

  function clearFilters() {
    setSearch("");
    setStatus("All");
    setRole("All roles");
  }

  function createProject(input: NewProjectInput) {
    const highestId = projectRows.reduce((highest, project) => {
      const numericId = Number(project.id.replace(/\D/g, ""));
      return Number.isNaN(numericId) ? highest : Math.max(highest, numericId);
    }, 100);
    const today = new Date().toISOString().slice(0, 10);

    setProjectRows((current) => [
      {
        id: `PRJ-${highestId + 1}`,
        ...input,
        tasksCompleted: 0,
        tasksTotal: 0,
        budgetUsed: 0,
        notes: 0,
        wordCount: 0,
        overdue: Boolean(input.dueDate) && input.status !== "Complete" && input.dueDate < today,
      },
      ...current,
    ]);
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
        onCreate={createProject}
        principalInvestigator={me.data?.displayName ?? me.data?.email ?? ""}
        currentUserId={me.data?.id ?? ""}
        members={workspaceMembers.data ?? []}
        membersLoading={workspaceMembers.isPending}
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
                  {option}
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
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {project.id}
                          </span>
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
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {project.pi} · {project.funder} · {project.collaborators}
                          </span>
                        </div>
                      </div>
                      ) : null}

                      {columns.isColumnVisible("role") ? (
                      <Badge variant="outline" className={rolePillClass(project.myRole)}>
                        {project.myRole}
                      </Badge>
                      ) : null}

                      {columns.isColumnVisible("importance") ? (
                      <Badge variant="outline" className={priorityPillClass(project.priority)}>
                        {project.priority}
                      </Badge>
                      ) : null}

                      {columns.isColumnVisible("status") ? (
                      <Badge variant="outline" className={statusPillClass(project.status)}>
                        {project.status}
                      </Badge>
                      ) : null}

                      {columns.isColumnVisible("stage") ? (
                      <span className="text-sm text-muted-foreground">
                        {stageNames[project.stageIndex] ?? "Unknown stage"}
                      </span>
                      ) : null}

                      {columns.isColumnVisible("progress") ? (
                      <ProgressCell
                        completed={project.tasksCompleted}
                        total={project.tasksTotal}
                      />
                      ) : null}

                      {columns.isColumnVisible("notes") ? (
                      <span className="text-sm text-muted-foreground">{project.notes}</span>
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
                          project.overdue
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
                        <ProjectOverviewDetails project={project} />
                        <ProjectModulesDetails
                          modules={moduleRows.filter((module) => module.projectId === project.id)}
                          stageNames={stageNames}
                        />
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
