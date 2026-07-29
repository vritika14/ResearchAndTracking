import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { PageHeading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { PIPELINE_STAGES } from "@/data/pipeline-projects";
import {
  projects,
  type Project,
  type ProjectRole,
  type ProjectStatus,
} from "@/data/projects";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  "All",
  "Active",
  "Review",
  "Stalled",
  "Complete",
] as const;
const ROLE_FILTERS = [
  "All roles",
  "Owner",
  "Lead",
  "Collaborator",
  "Supervisor",
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type RoleFilter = (typeof ROLE_FILTERS)[number];

type SortOption = "Due date" | "Stage" | "Tasks outstanding";
const SORT_OPTIONS: SortOption[] = ["Due date", "Stage", "Tasks outstanding"];

const GRID_TEMPLATE =
  "minmax(280px,2.2fr) 110px 110px 120px 100px 90px 90px 100px 110px";

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

/** Active = solid blue. Inactive = white pill, light-grey border. */
function controlPillClass(selected: boolean) {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    selected
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  );
}

function formatDueDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}-${month}-${year}`;
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
        (a, b) =>
          b.tasksTotal - b.tasksCompleted - (a.tasksTotal - a.tasksCompleted),
      );
      break;
  }
  return sorted;
}

interface SortableHeaderProps {
  label: string;
  option: SortOption;
  active: boolean;
  onClick: () => void;
}

function SortableHeader({
  label,
  option,
  active,
  onClick,
}: SortableHeaderProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Sort by ${option}`}
      className={cn(
        "flex items-center gap-1 text-left transition-colors",
        active ? "text-foreground" : "hover:text-foreground",
      )}
    >
      {label}
      <ChevronDown
        className={cn("h-3 w-3", active ? "text-primary" : "opacity-30")}
      />
    </button>
  );
}

export default function TasksPage() {
  const [status, setStatus] = useState<StatusFilter>("All");
  const [role, setRole] = useState<RoleFilter>("All roles");
  const [sortBy, setSortBy] = useState<SortOption>("Due date");

  const statusCounts = useMemo(() => {
    const roleFiltered = projects.filter(
      (project) => role === "All roles" || project.myRole === role,
    );
    return Object.fromEntries(
      STATUS_FILTERS.map((option) => [
        option,
        roleFiltered.filter(
          (project) => option === "All" || project.status === option,
        ).length,
      ]),
    ) as Record<StatusFilter, number>;
  }, [role]);

  const visibleProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      if (status !== "All" && project.status !== status) return false;
      if (role !== "All roles" && project.myRole !== role) return false;
      return true;
    });
    return sortProjects(filtered, sortBy);
  }, [status, role, sortBy]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        eyebrow="Workflows"
        title="Tasks and To Do"
        description="Keep commitments visible without implying delegation."
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </span>
            {STATUS_FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(option)}
                aria-pressed={option === status}
                className={controlPillClass(option === status)}
              >
                {option}
                <span
                  className={cn(
                    "text-[10px]",
                    option === status
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground/80",
                  )}
                >
                  {statusCounts[option]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              My Role
            </span>
            {ROLE_FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                aria-pressed={option === role}
                className={controlPillClass(option === role)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sort
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
        <div className="min-w-[1120px]">
          <div
            className="grid gap-4 px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
          >
            <span>Project</span>
            <span>My Role</span>
            <span>Status</span>
            <SortableHeader
              label="Stage"
              option="Stage"
              active={sortBy === "Stage"}
              onClick={() => setSortBy("Stage")}
            />
            <SortableHeader
              label="Tasks"
              option="Tasks outstanding"
              active={sortBy === "Tasks outstanding"}
              onClick={() => setSortBy("Tasks outstanding")}
            />
            <span>Budget</span>
            <span>Notes</span>
            <span>Words</span>
            <SortableHeader
              label="Due Date"
              option="Due date"
              active={sortBy === "Due date"}
              onClick={() => setSortBy("Due date")}
            />
          </div>

          <div className="flex flex-col gap-3">
            {visibleProjects.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No projects match the current filters.
              </div>
            ) : (
              visibleProjects.map((project) => {
                const outstanding = project.tasksTotal - project.tasksCompleted;
                const budgetPercent =
                  project.budgetTotal > 0
                    ? Math.round(
                        (project.budgetUsed / project.budgetTotal) * 100,
                      )
                    : 0;

                return (
                  <div
                    key={project.id}
                    className="grid items-center gap-4 rounded-lg border border-border bg-card px-4 py-4 shadow-sm"
                    style={{ gridTemplateColumns: GRID_TEMPLATE }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {project.id}
                      </span>
                      <span className="font-semibold leading-tight">
                        {project.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {project.pi} · {project.funder} ·{" "}
                        {project.collaborators}
                      </span>
                    </div>

                    <Badge
                      variant="outline"
                      className={rolePillClass(project.myRole)}
                    >
                      {project.myRole}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={statusPillClass(project.status)}
                    >
                      {project.status}
                    </Badge>

                    <span className="font-bold">
                      {PIPELINE_STAGES[project.stageIndex]}
                    </span>

                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold">
                        {project.tasksCompleted}/{project.tasksTotal}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          outstanding === 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive",
                        )}
                      >
                        {outstanding} outstanding
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold">{budgetPercent}%</span>
                      <span className="text-xs text-muted-foreground">
                        used
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span
                        className={cn(
                          "font-bold",
                          project.notes === 0 &&
                            "font-normal text-muted-foreground",
                        )}
                      >
                        {project.notes}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {project.notes === 1 ? "entry" : "entries"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold">
                        {project.wordCount.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        words
                      </span>
                    </div>

                    <span className="font-bold">
                      {formatDueDate(project.dueDate)}
                    </span>
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
