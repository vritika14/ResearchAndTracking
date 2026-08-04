import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

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
import { PIPELINE_STAGES } from "@/data/pipeline-projects";
import {
  projects,
  type Project,
  type ProjectPriority,
  type ProjectRole,
  type ProjectStatus,
} from "@/data/projects";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["All", "Active", "Review", "Stalled", "Complete"] as const;
const ROLE_FILTERS = ["All roles", "Owner", "Lead", "Collaborator", "Supervisor"] as const;
const SORT_OPTIONS = ["Due date", "Stage", "Tasks outstanding"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type RoleFilter = (typeof ROLE_FILTERS)[number];
type SortOption = (typeof SORT_OPTIONS)[number];

const GRID_TEMPLATE = "minmax(280px,2.2fr) 110px 110px 110px 120px 130px 70px 100px 110px";

function priorityPillClass(priority: ProjectPriority) {
  switch (priority) {
    case "Critical":
      return "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400";
    case "High":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Medium":
      return "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
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
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [role, setRole] = useState<RoleFilter>("All roles");
  const [sortBy, setSortBy] = useState<SortOption>("Due date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = projectRows.filter((project) => {
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
  }, [projectRows, search, status, role, sortBy]);

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
        overdue: input.status !== "Complete" && input.dueDate < today,
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
        <div className="min-w-[1080px]">
          <div
            className="grid gap-4 px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
          >
            <span>Project</span>
            <span>My Role</span>
            <span>Importance</span>
            <span>Status</span>
            <span>Stage</span>
            <span>Progress</span>
            <span>Notes</span>
            <span>Words</span>
            <span>Due Date</span>
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
                      style={{ gridTemplateColumns: GRID_TEMPLATE }}
                    >
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
                          <Link
                            to={`/projects/${project.id}`}
                            className="font-semibold leading-tight transition-colors hover:text-primary hover:underline"
                          >
                            {project.title}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {project.pi} · {project.funder} · {project.collaborators}
                          </span>
                        </div>
                      </div>

                      <Badge variant="outline" className={rolePillClass(project.myRole)}>
                        {project.myRole}
                      </Badge>

                      <Badge variant="outline" className={priorityPillClass(project.priority)}>
                        {project.priority}
                      </Badge>

                      <Badge variant="outline" className={statusPillClass(project.status)}>
                        {project.status}
                      </Badge>

                      <span className="text-sm text-muted-foreground">
                        {PIPELINE_STAGES[project.stageIndex]}
                      </span>

                      <ProgressCell
                        completed={project.tasksCompleted}
                        total={project.tasksTotal}
                      />

                      <span className="text-sm text-muted-foreground">{project.notes}</span>

                      <span className="text-sm text-muted-foreground">
                        {project.wordCount.toLocaleString()}
                      </span>

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
                    </div>

                    {isExpanded ? (
                      <div className="rounded-b-lg border border-t-0 border-border bg-muted/30 px-4 py-5">
                        <ProjectOverviewDetails project={project} />
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
