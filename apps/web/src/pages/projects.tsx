import { useMemo, useState } from "react";

import { PageHeading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
const SORT_OPTIONS = ["Due date", "Stage", "Tasks outstanding"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type RoleFilter = (typeof ROLE_FILTERS)[number];
type SortOption = (typeof SORT_OPTIONS)[number];

const GRID_TEMPLATE =
  "minmax(280px,2.2fr) 110px 110px 120px 90px 130px 70px 100px 110px";

const OUTSTANDING_TASK_THRESHOLD = 0.35;

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

function controlPillClass(selected: boolean) {
  return cn(
    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    selected
      ? "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400"
      : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  );
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return value >= 1000
    ? `$${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`
    : `$${value}`;
}

interface FilterRowProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterRowProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={option === value}
          className={controlPillClass(option === value)}
        >
          {option}
        </button>
      ))}
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
        (a, b) =>
          b.tasksTotal - b.tasksCompleted - (a.tasksTotal - a.tasksCompleted),
      );
      break;
  }
  return sorted;
}

export default function ProjectsPage() {
  const [status, setStatus] = useState<StatusFilter>("All");
  const [role, setRole] = useState<RoleFilter>("All roles");
  const [sortBy, setSortBy] = useState<SortOption>("Due date");

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
        title="Projects"
        description="Track research work by stage, dates, collaborators and outstanding tasks."
        actions={<Button>New Project</Button>}
      />

      <div className="flex flex-col gap-4 rounded-lg border p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-3">
          <FilterRow
            label="Status"
            options={STATUS_FILTERS}
            value={status}
            onChange={setStatus}
          />
          <FilterRow
            label="Role"
            options={ROLE_FILTERS}
            value={role}
            onChange={setRole}
          />
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
        <div className="min-w-[1060px]">
          <div
            className="grid gap-4 px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
          >
            <span>Project</span>
            <span>My Role</span>
            <span>Status</span>
            <span>Stage</span>
            <span>Tasks</span>
            <span>Budget Used</span>
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
                const isOutstandingWarning =
                  project.tasksTotal > 0 &&
                  project.tasksCompleted / project.tasksTotal <
                    OUTSTANDING_TASK_THRESHOLD;

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

                    <span className="text-sm text-muted-foreground">
                      {PIPELINE_STAGES[project.stageIndex]}
                    </span>

                    <span
                      className={cn(
                        "text-sm",
                        isOutstandingWarning
                          ? "font-semibold text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {project.tasksCompleted}/{project.tasksTotal}
                    </span>

                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(project.budgetUsed)} /{" "}
                      {formatCurrency(project.budgetTotal)}
                    </span>

                    <span className="text-sm text-muted-foreground">
                      {project.notes}
                    </span>

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
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
