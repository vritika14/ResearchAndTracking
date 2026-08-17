import { useMemo, useState, type DragEvent } from "react";
import { GripVertical, Pencil, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";

import { ManageStagesDialog } from "@/components/pipeline/manage-stages-dialog";
import { PageHeading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  pipelineRows,
  type PipelineStageInfo,
  type PipelineRow,
} from "@/data/pipeline-rows";
import type { ProjectPriority } from "@/data/pipeline-projects";
import type { ProjectStatus } from "@/data/projects";
import { cn } from "@/lib/utils";
import { reindexModulesAfterStageDeletion } from "@/hooks/use-modules";
import { usePipelineStages } from "@/hooks/use-pipeline-stages";
import { useProjectStageOverrides } from "@/hooks/use-project-stage-overrides";

const VIEW_OPTIONS = ["Flow", "Columns"] as const;
type ViewOption = (typeof VIEW_OPTIONS)[number];

const PRIORITY_FILTERS = ["All", "Critical", "High", "Medium", "Low"] as const;
type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

const STATUS_FILTERS = ["All", "Active", "Review", "Stalled", "Complete"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const ROLE_FILTERS = ["All", "Owner", "Lead", "Collaborator", "Supervisor"] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];
const STAGE_TITLE_CLASS = "text-sm font-bold text-foreground";
const PROJECT_ID_CLASS = "font-mono text-[11px] text-muted-foreground";
const PROJECT_TITLE_CLASS = "text-sm font-medium text-foreground";
const COMPLETION_CLASS = "text-sm font-semibold text-primary";
const OUTSTANDING_CLASS = "text-xs font-medium";

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

/** Selected = solid blue. Inactive = white pill, light-grey border. */
function controlPillClass(selected: boolean) {
  return cn(
    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
    selected
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  );
}

function groupByStage(rows: PipelineRow[], stageCount: number) {
  const groups: PipelineRow[][] = Array.from({ length: stageCount }, () => []);
  for (const row of rows) {
    groups[row.stageIndex]?.push(row);
  }
  return groups;
}

interface PipelineProjectRowProps {
  row: PipelineRow;
  compact?: boolean;
  isDragging: boolean;
  onDragStart: (event: DragEvent<HTMLDivElement>, row: PipelineRow) => void;
  onDragEnd: () => void;
  onStageChange: (projectId: string, stageIndex: number) => void;
  stages: readonly PipelineStageInfo[];
}

function ProjectEditLink({ row }: { row: PipelineRow }) {
  return (
    <Link
      to={`/projects/${row.id}?edit=true&from=pipeline`}
      aria-label={`Edit ${row.title}`}
      title="Edit project"
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Pencil className="h-3.5 w-3.5" />
    </Link>
  );
}

function StageSelect({ row, stages, onStageChange }: {
  row: PipelineRow;
  stages: readonly PipelineStageInfo[];
  onStageChange: (projectId: string, stageIndex: number) => void;
}) {
  return (
    <select
      value={row.stageIndex}
      onChange={(event) => onStageChange(row.id, Number(event.target.value))}
      onMouseDown={(event) => event.stopPropagation()}
      aria-label={`Move ${row.title} to stage`}
      title="Change pipeline stage"
      className="h-7 max-w-44 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {stages.map((stage, index) => (
        <option key={stage.name} value={index}>{stage.name}</option>
      ))}
    </select>
  );
}

function PipelineProjectRow({
  row,
  compact,
  isDragging,
  onDragStart,
  onDragEnd,
  onStageChange,
  stages,
}: PipelineProjectRowProps) {
  const outstandingClass =
    row.outstanding === 0
      ? "text-muted-foreground"
      : "text-orange-600 dark:text-orange-400";

  if (compact) {
    return (
      <div
        draggable
        onDragStart={(event) => onDragStart(event, row)}
        onDragEnd={onDragEnd}
        className={cn(
          "flex cursor-grab flex-col gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm active:cursor-grabbing",
          isDragging && "opacity-45",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-1">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className={PROJECT_ID_CLASS}>{row.id}</span>
          </span>
          <div className="flex items-center gap-1">
            <ProjectEditLink row={row} />
          </div>
        </div>
        <span className={cn(PROJECT_TITLE_CLASS, "leading-snug")}>{row.title}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={priorityPillClass(row.priority)}>
            {row.priority}
          </Badge>
          <Badge variant="outline" className={statusPillClass(row.status)}>
            {row.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className={COMPLETION_CLASS}>{row.completion}%</span>
          <span className={cn(OUTSTANDING_CLASS, outstandingClass)}>
            {row.outstanding} outstanding
          </span>
        </div>
        <StageSelect row={row} stages={stages} onStageChange={onStageChange} />
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, row)}
      onDragEnd={onDragEnd}
      className={cn(
        "flex cursor-grab flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm active:cursor-grabbing",
        isDragging && "opacity-45",
      )}
    >
      <span className="flex items-center gap-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className={PROJECT_ID_CLASS}>{row.id}</span>
      </span>
      <span className={PROJECT_TITLE_CLASS}>{row.title}</span>
      <ProjectEditLink row={row} />
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <Badge variant="outline" className={priorityPillClass(row.priority)}>
          {row.priority}
        </Badge>
        <Badge variant="outline" className={statusPillClass(row.status)}>
          {row.status}
        </Badge>
        <span className={COMPLETION_CLASS}>{row.completion}%</span>
        <span className={cn(OUTSTANDING_CLASS, outstandingClass)}>
          {row.outstanding} outstanding
        </span>
        <StageSelect row={row} stages={stages} onStageChange={onStageChange} />
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { pipelineStages, setPipelineStages } = usePipelineStages();
  const [visibleStageNames, setVisibleStageNames] = useState<Set<string>>(
    () => new Set(pipelineStages.map((stage) => stage.name)),
  );
  const [isManageStagesOpen, setIsManageStagesOpen] = useState(false);
  const [view, setView] = useState<ViewOption>("Flow");
  const [priority, setPriority] = useState<PriorityFilter>("All");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [role, setRole] = useState<RoleFilter>("All");
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverStageIndex, setDragOverStageIndex] = useState<number | null>(null);
  const { stageOverrides, updateProjectStage, updateProjectStages } = useProjectStageOverrides();
  const projectRows = useMemo(
    () =>
      pipelineRows.map((row) => ({
        ...row,
        stageIndex: stageOverrides[row.id] ?? row.stageIndex,
      })),
    [stageOverrides],
  );
  const filteredRows = useMemo(() => {
    return projectRows.filter((row) => {
      if (priority !== "All" && row.priority !== priority) return false;
      if (status !== "All" && row.status !== status) return false;
      if (role !== "All" && row.myRole !== role) return false;
      return true;
    });
  }, [projectRows, priority, status, role]);

  const grouped = useMemo(
    () => groupByStage(filteredRows, pipelineStages.length),
    [filteredRows, pipelineStages.length],
  );
  const visibleStages = pipelineStages.map((stage, index) => ({
    stage,
    index,
  })).filter(({ stage }) => visibleStageNames.has(stage.name));

  function toggleStageVisibility(stageName: string) {
    setVisibleStageNames((current) => {
      const next = new Set(current);
      if (next.has(stageName)) {
        if (next.size === 1) return current;
        next.delete(stageName);
      } else {
        next.add(stageName);
      }
      return next;
    });
  }

  function addStage(name: string, description: string) {
    setPipelineStages([...pipelineStages, { name, description }]);
    setVisibleStageNames((current) => new Set(current).add(name));
  }

  function deleteStage(index: number) {
    const stage = pipelineStages[index];
    if (!stage || pipelineStages.length === 1) return;
    if (!window.confirm(`Delete "${stage.name}"? Projects in this stage will move to the previous stage.`)) {
      return;
    }

    const stageUpdates = Object.fromEntries(
      projectRows.map((project) => [
        project.id,
        project.stageIndex === index
          ? Math.max(0, index - 1)
          : project.stageIndex > index
            ? project.stageIndex - 1
            : project.stageIndex,
      ]),
    );
    updateProjectStages(stageUpdates);
    reindexModulesAfterStageDeletion(index);
    setPipelineStages(pipelineStages.filter((_, stageIndex) => stageIndex !== index));
    setVisibleStageNames((current) => {
      const next = new Set(current);
      next.delete(stage.name);
      return next.size > 0 ? next : new Set([pipelineStages[index === 0 ? 1 : index - 1].name]);
    });
  }

  function moveProject(projectId: string, stageIndex: number) {
    updateProjectStage(projectId, stageIndex);
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, row: PipelineRow) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", row.id);
    setDraggedProjectId(row.id);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, stageIndex: number) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverStageIndex(stageIndex);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, stageIndex: number) {
    event.preventDefault();
    const projectId = draggedProjectId ?? event.dataTransfer.getData("text/plain");
    if (projectId) moveProject(projectId, stageIndex);
    setDraggedProjectId(null);
    setDragOverStageIndex(null);
  }

  function handleDragEnd() {
    setDraggedProjectId(null);
    setDragOverStageIndex(null);
  }

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

        <div className="flex flex-wrap items-center gap-3">
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
                  {option === "All" ? "All roles" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setIsManageStagesOpen(true)}>
            <Settings2 />
            Manage stages
          </Button>
        </div>
      </div>

      {view === "Flow" ? (
        <div className="flex flex-col">
          {visibleStages.map(({ stage, index }, visibleIndex) => {
            const rows = grouped[index] ?? [];
            const hasProjects = rows.length > 0;
            const isLast = visibleIndex === visibleStages.length - 1;

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

                <div
                  role="group"
                  aria-label={`${stage.name} stage drop zone`}
                  onDragOver={(event) => handleDragOver(event, index)}
                  onDrop={(event) => handleDrop(event, index)}
                  className={cn(
                    "min-h-24 flex-1 rounded-lg p-2 transition-colors",
                    !isLast && "mb-6",
                    draggedProjectId && "border border-dashed border-primary/30",
                    dragOverStageIndex === index && "border-primary bg-primary/5 ring-2 ring-primary/30",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={cn(STAGE_TITLE_CLASS, !hasProjects && "text-muted-foreground")}
                    >
                      {stage.name}
                    </h3>
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
                        <PipelineProjectRow
                          key={row.id}
                          row={row}
                          isDragging={draggedProjectId === row.id}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onStageChange={moveProject}
                          stages={pipelineStages}
                        />
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
            style={{ minWidth: `${visibleStages.length * 260}px` }}
          >
            {visibleStages.map(({ stage, index }) => {
              const rows = grouped[index] ?? [];
              const hasProjects = rows.length > 0;

              return (
                <div
                  key={stage.name}
                  role="group"
                  aria-label={`${stage.name} stage drop zone`}
                  onDragOver={(event) => handleDragOver(event, index)}
                  onDrop={(event) => handleDrop(event, index)}
                  className={cn(
                    "flex min-h-48 w-64 shrink-0 flex-col gap-3 rounded-lg border border-border bg-card p-3 transition-colors",
                    draggedProjectId && "border-dashed border-primary/30",
                    dragOverStageIndex === index && "border-primary bg-primary/5 ring-2 ring-primary/30",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        STAGE_TITLE_CLASS,
                        !hasProjects && "text-muted-foreground",
                      )}
                    >
                      {stage.name}
                    </h3>
                    {hasProjects ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {rows.length}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    {hasProjects ? (
                      rows.map((row) => (
                        <PipelineProjectRow
                          key={row.id}
                          row={row}
                          compact
                          isDragging={draggedProjectId === row.id}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onStageChange={moveProject}
                          stages={pipelineStages}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No projects</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <ManageStagesDialog
        open={isManageStagesOpen}
        onOpenChange={setIsManageStagesOpen}
        stages={pipelineStages}
        visibleStages={visibleStageNames}
        onToggleVisibility={toggleStageVisibility}
        onAdd={addStage}
        onDelete={deleteStage}
      />
    </div>
  );
}
