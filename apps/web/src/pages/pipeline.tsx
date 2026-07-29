import { useMemo, useState } from "react";

import { Heading, PageHeading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import {
  RESEARCH_PIPELINE_STAGES,
  pipelineRows,
  type PipelineRow,
} from "@/data/pipeline-rows";
import type { ProjectPriority } from "@/data/pipeline-projects";
import type { ProjectStatus } from "@/data/projects";
import { cn } from "@/lib/utils";

const VIEW_OPTIONS = ["Flow", "Columns"] as const;
type ViewOption = (typeof VIEW_OPTIONS)[number];

const PRIORITY_FILTERS = ["All", "Critical", "High", "Medium"] as const;
type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

const STATUS_FILTERS = ["All", "Active", "Review", "Stalled", "Complete"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const ROLE_FILTERS = ["All", "Owner", "Lead", "Collaborator", "Supervisor"] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];

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

/** Selected = solid blue. Inactive = white pill, light-grey border. */
function controlPillClass(selected: boolean) {
  return cn(
    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    selected
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  );
}

interface FilterPillRowProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

function FilterPillRow<T extends string>({ label, options, value, onChange }: FilterPillRowProps<T>) {
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

function groupByStage(rows: PipelineRow[]) {
  const groups: PipelineRow[][] = RESEARCH_PIPELINE_STAGES.map(() => []);
  for (const row of rows) {
    groups[row.stageIndex]?.push(row);
  }
  return groups;
}

interface PipelineProjectRowProps {
  row: PipelineRow;
  compact?: boolean;
}

function PipelineProjectRow({ row, compact }: PipelineProjectRowProps) {
  const outstandingClass =
    row.outstanding === 0
      ? "text-muted-foreground"
      : "text-orange-600 dark:text-orange-400";

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm">
        <span className="font-mono text-[10px] text-muted-foreground">{row.id}</span>
        <span className="text-xs font-medium leading-snug">{row.title}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={cn("text-[10px]", priorityPillClass(row.priority))}>
            {row.priority}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px]", statusPillClass(row.status))}>
            {row.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-[11px] font-medium">
          <span className="text-primary">{row.completion}%</span>
          <span className={outstandingClass}>{row.outstanding} outstanding</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm">
      <span className="font-mono text-[11px] text-muted-foreground">{row.id}</span>
      <span className="text-sm font-medium">{row.title}</span>
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <Badge variant="outline" className={priorityPillClass(row.priority)}>
          {row.priority}
        </Badge>
        <Badge variant="outline" className={statusPillClass(row.status)}>
          {row.status}
        </Badge>
        <span className="text-sm font-semibold text-primary">{row.completion}%</span>
        <span className={cn("text-xs font-medium", outstandingClass)}>
          {row.outstanding} outstanding
        </span>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [view, setView] = useState<ViewOption>("Flow");
  const [priority, setPriority] = useState<PriorityFilter>("All");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [role, setRole] = useState<RoleFilter>("All");

  const filteredRows = useMemo(() => {
    return pipelineRows.filter((row) => {
      if (priority !== "All" && row.priority !== priority) return false;
      if (status !== "All" && row.status !== status) return false;
      if (role !== "All" && row.myRole !== role) return false;
      return true;
    });
  }, [priority, status, role]);

  const grouped = useMemo(() => groupByStage(filteredRows), [filteredRows]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        eyebrow="Workflows"
        title="Pipeline"
        description="Active projects grouped by their current stage in the research workflow, from early concept through publication."
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            View
          </span>
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              aria-pressed={option === view}
              className={controlPillClass(option === view)}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <FilterPillRow label="Priority" options={PRIORITY_FILTERS} value={priority} onChange={setPriority} />
          <FilterPillRow label="Status" options={STATUS_FILTERS} value={status} onChange={setStatus} />
          <FilterPillRow label="Role" options={ROLE_FILTERS} value={role} onChange={setRole} />
        </div>
      </div>

      {view === "Flow" ? (
        <div className="flex flex-col">
          {RESEARCH_PIPELINE_STAGES.map((stage, index) => {
            const rows = grouped[index] ?? [];
            const hasProjects = rows.length > 0;
            const isLast = index === RESEARCH_PIPELINE_STAGES.length - 1;

            return (
              <div key={stage.name} className="flex gap-4">
                <div className="flex w-4 shrink-0 flex-col items-center">
                  <span
                    className={cn(
                      "mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2",
                      hasProjects ? "border-primary bg-primary" : "border-border bg-background",
                    )}
                  />
                  {!isLast ? <span className="w-px flex-1 bg-border" /> : null}
                </div>

                <div className={cn("flex-1 min-w-0", !isLast && "pb-8")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Heading
                      level="h4"
                      className={cn(!hasProjects && "text-muted-foreground")}
                    >
                      {stage.name}
                    </Heading>
                    {hasProjects ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {rows.length}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    {stage.description}
                  </p>

                  {hasProjects ? (
                    <div className="mt-3 flex flex-col gap-2">
                      {rows.map((row) => (
                        <PipelineProjectRow key={row.id} row={row} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div
            className="flex gap-4"
            style={{ minWidth: `${RESEARCH_PIPELINE_STAGES.length * 260}px` }}
          >
            {RESEARCH_PIPELINE_STAGES.map((stage, index) => {
              const rows = grouped[index] ?? [];
              const hasProjects = rows.length > 0;

              return (
                <div
                  key={stage.name}
                  className="flex w-64 shrink-0 flex-col gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        !hasProjects && "text-muted-foreground",
                      )}
                    >
                      {stage.name}
                    </span>
                    {hasProjects ? (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {rows.length}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    {hasProjects ? (
                      rows.map((row) => <PipelineProjectRow key={row.id} row={row} compact />)
                    ) : (
                      <p className="text-xs text-muted-foreground">No projects</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
