import { useMemo, useState, type DragEvent } from "react";
import { GripVertical, Pencil, Settings2, Workflow } from "lucide-react";
import { Link } from "react-router-dom";

import {
  useCreateModuleOwnPipelineStage,
  useCreateModulePipelineStage,
  useCreatePipelineStage,
  useCreateProjectPipelineStage,
  useCurrentWorkspace,
  useDeleteModuleOwnPipelineStage,
  useDeleteModulePipelineStage,
  useDeletePipelineStage,
  useDeleteProjectPipelineStage,
  useMe,
  useMembers,
  useModulePipelineStagePool,
  useModulePipelineStages,
  useModules,
  usePipelineStages,
  useProjectPipelineStages,
  useProjects,
  useTasks,
  useUpdateModule,
  useUpdateProject,
  type ApiPipelineStage,
} from "@/api/hooks";
import { ManageStagesDialog } from "@/components/pipeline/manage-stages-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
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
import { cn } from "@/lib/utils";

const VIEW_OPTIONS = ["Flow", "Columns"] as const;
type ViewOption = (typeof VIEW_OPTIONS)[number];

const ENTITY_TYPES = ["Project", "Module"] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

const PRIORITY_FILTERS = ["All", "Critical", "High", "Medium", "Low"] as const;
type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

const STATUS_FILTERS = ["All", "Active", "Review", "Stalled", "Complete"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const ALL_ENTITIES = "All";

const STAGE_TITLE_CLASS = "text-sm font-bold text-foreground";
const ITEM_ID_CLASS = "font-mono text-[11px] text-muted-foreground";
const ITEM_TITLE_CLASS = "text-sm font-medium text-foreground";
const COMPLETION_CLASS = "text-sm font-semibold text-primary";
const OUTSTANDING_CLASS = "text-xs font-medium";

interface PipelineRow {
  id: string;
  kind: EntityType;
  displayId: string | null;
  title: string;
  priority: string | null;
  status: string | null;
  role: string | null;
  assignee: string | null;
  projectId: string | null;
  completion: number;
  outstanding: number;
  stageIndex: number | undefined;
}

function priorityPillClass(priority: string | null) {
  switch (priority) {
    case "Critical":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400";
    case "High":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-400";
    case "Medium":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400";
    default:
      return "border-border bg-muted/50 text-muted-foreground";
  }
}

function statusPillClass(status: string | null) {
  switch (status) {
    case "Active":
    case "Complete":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400";
    case "Review":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-400";
    case "Stalled":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400";
    default:
      return "border-border bg-muted/50 text-muted-foreground";
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
    if (row.stageIndex === undefined) continue;
    groups[row.stageIndex]?.push(row);
  }
  return groups;
}

interface PipelineItemRowProps {
  row: PipelineRow;
  compact?: boolean;
  isDragging: boolean;
  onDragStart: (event: DragEvent<HTMLDivElement>, row: PipelineRow) => void;
  onDragEnd: () => void;
  onStageChange: (id: string, stageIndex: number) => void;
  stages: readonly ApiPipelineStage[];
}

function ItemEditLink({ row }: { row: PipelineRow }) {
  const to =
    row.kind === "Project"
      ? `/projects/${row.id}?edit=true&from=pipeline`
      : `/modules/${row.id}?edit=true&from=pipeline`;
  return (
    <Link
      to={to}
      aria-label={`Edit ${row.title}`}
      title={`Edit ${row.kind.toLowerCase()}`}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Pencil className="h-3.5 w-3.5" />
    </Link>
  );
}

function StageSelect({ row, stages, onStageChange }: {
  row: PipelineRow;
  stages: readonly ApiPipelineStage[];
  onStageChange: (id: string, stageIndex: number) => void;
}) {
  return (
    <select
      value={row.stageIndex ?? ""}
      onChange={(event) => onStageChange(row.id, Number(event.target.value))}
      onMouseDown={(event) => event.stopPropagation()}
      aria-label={`Move ${row.title} to stage`}
      title="Change pipeline stage"
      className="h-7 max-w-44 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    >
      <option value="" disabled>Select a stage</option>
      {stages.map((stage, index) => (
        <option key={stage.id} value={index}>{stage.value}</option>
      ))}
    </select>
  );
}

function PipelineItemRow({
  row,
  compact,
  isDragging,
  onDragStart,
  onDragEnd,
  onStageChange,
  stages,
}: PipelineItemRowProps) {
  const outstandingClass =
    row.outstanding === 0
      ? "text-muted-foreground"
      : "text-orange-600 dark:text-orange-400";
  const isModule = row.kind === "Module";
  const cardTone = isModule
    ? "border-violet-200/70 bg-gradient-to-br from-violet-50/70 to-card dark:border-violet-900/50 dark:from-violet-950/20"
    : "border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-card dark:border-emerald-900/50 dark:from-emerald-950/20";
  const cardToneRow = isModule
    ? "border-violet-200/70 bg-gradient-to-r from-violet-50/70 to-card dark:border-violet-900/50 dark:from-violet-950/20"
    : "border-emerald-200/70 bg-gradient-to-r from-emerald-50/70 to-card dark:border-emerald-900/50 dark:from-emerald-950/20";

  const secondaryBadge = isModule ? row.assignee : row.priority;

  if (compact) {
    return (
      <div
        draggable
        onDragStart={(event) => onDragStart(event, row)}
        onDragEnd={onDragEnd}
        className={cn(
          "flex cursor-grab flex-col gap-1.5 rounded-xl border px-3 py-2.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
          cardTone,
          isDragging && "opacity-45",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-1">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className={ITEM_ID_CLASS}>{row.displayId ?? row.id}</span>
          </span>
          <div className="flex items-center gap-1">
            <ItemEditLink row={row} />
          </div>
        </div>
        <span className={cn(ITEM_TITLE_CLASS, "leading-snug")}>{row.title}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {secondaryBadge ? (
            <Badge variant="outline" className={isModule ? undefined : priorityPillClass(row.priority)}>
              {secondaryBadge}
            </Badge>
          ) : null}
          <Badge variant="outline" className={statusPillClass(row.status)}>
            {row.status ?? "—"}
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
        "flex cursor-grab flex-wrap items-center gap-3 rounded-xl border px-4 py-2.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        cardToneRow,
        isDragging && "opacity-45",
      )}
    >
      <span className="flex items-center gap-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className={ITEM_ID_CLASS}>{row.displayId ?? row.id}</span>
      </span>
      <span className={ITEM_TITLE_CLASS}>{row.title}</span>
      <ItemEditLink row={row} />
      <div className="ml-auto flex flex-wrap items-center gap-3">
        {secondaryBadge ? (
          <Badge variant="outline" className={isModule ? undefined : priorityPillClass(row.priority)}>
            {secondaryBadge}
          </Badge>
        ) : null}
        <Badge variant="outline" className={statusPillClass(row.status)}>
          {row.status ?? "—"}
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
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";

  const projectsQuery = useProjects(tenantId);
  const modulesQuery = useModules(tenantId);
  const tasksQuery = useTasks(tenantId);
  const membersQuery = useMembers(tenantId);
  const me = useMe();

  const [entityType, setEntityType] = useState<EntityType>("Project");
  const [entityFilter, setEntityFilter] = useState<string>(ALL_ENTITIES);
  const isAllEntities = entityFilter === ALL_ENTITIES;

  // Stage sources — exactly one of these four is active at a time, based on
  // entityType × whether a single entity is filtered in.
  const tenantProjectPoolQuery = usePipelineStages(
    tenantId,
    entityType === "Project" && isAllEntities,
  );
  const tenantModulePoolQuery = useModulePipelineStagePool(
    tenantId,
    entityType === "Module" && isAllEntities,
  );
  const oneProjectStagesQuery = useProjectPipelineStages(
    tenantId,
    entityFilter,
    entityType === "Project" && !isAllEntities,
  );
  const oneModuleStagesQuery = useModulePipelineStages(
    tenantId,
    entityFilter,
    entityType === "Module" && !isAllEntities,
  );

  const activeStagesQuery =
    entityType === "Project"
      ? isAllEntities
        ? tenantProjectPoolQuery
        : oneProjectStagesQuery
      : isAllEntities
        ? tenantModulePoolQuery
        : oneModuleStagesQuery;

  const updateProject = useUpdateProject(tenantId);
  const updateModule = useUpdateModule(tenantId);
  const createProjectPoolStage = useCreatePipelineStage(tenantId);
  const deleteProjectPoolStage = useDeletePipelineStage(tenantId);
  const createModulePoolStage = useCreateModulePipelineStage(tenantId);
  const deleteModulePoolStage = useDeleteModulePipelineStage(tenantId);
  const createOwnProjectStage = useCreateProjectPipelineStage(
    tenantId,
    isAllEntities ? "" : entityFilter,
  );
  const deleteOwnProjectStage = useDeleteProjectPipelineStage(
    tenantId,
    isAllEntities ? "" : entityFilter,
  );
  const createOwnModuleStage = useCreateModuleOwnPipelineStage(
    tenantId,
    isAllEntities ? "" : entityFilter,
  );
  const deleteOwnModuleStage = useDeleteModuleOwnPipelineStage(
    tenantId,
    isAllEntities ? "" : entityFilter,
  );

  const [hiddenStageValues, setHiddenStageValues] = useState<Set<string>>(new Set());
  const [isManageStagesOpen, setIsManageStagesOpen] = useState(false);
  const [view, setView] = useState<ViewOption>("Flow");
  const [priority, setPriority] = useState<PriorityFilter>("All");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [role, setRole] = useState<string>("All");
  const [moduleStatus, setModuleStatus] = useState<StatusFilter>("All");
  const [assignee, setAssignee] = useState<string>("All");
  const [moduleProjectFilter, setModuleProjectFilter] = useState<string>(ALL_ENTITIES);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStageIndex, setDragOverStageIndex] = useState<number | null>(null);

  function selectEntityType(next: EntityType) {
    setEntityType(next);
    setEntityFilter(ALL_ENTITIES);
    setModuleProjectFilter(ALL_ENTITIES);
    setHiddenStageValues(new Set());
  }

  function selectEntityFilter(next: string) {
    setEntityFilter(next);
    setHiddenStageValues(new Set());
  }

  const stages = useMemo(
    () => [...(activeStagesQuery.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [activeStagesQuery.data],
  );
  const stageIndexByValue = useMemo(() => {
    const map = new Map<string, number>();
    stages.forEach((stage, index) => map.set(stage.value, index));
    return map;
  }, [stages]);

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

  const taskCountByModule = useMemo(() => {
    const counts = new Map<string, { completed: number; total: number }>();
    for (const task of tasksQuery.data ?? []) {
      if (!task.moduleId) continue;
      const entry = counts.get(task.moduleId) ?? { completed: 0, total: 0 };
      entry.total += 1;
      if (task.status === "Complete") entry.completed += 1;
      counts.set(task.moduleId, entry);
    }
    return counts;
  }, [tasksQuery.data]);

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of membersQuery.data ?? []) {
      if (member.displayName) map.set(member.userId, member.displayName);
    }
    return map;
  }, [membersQuery.data]);

  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    for (const project of projectsQuery.data ?? []) {
      if (project.role) roles.add(project.role);
      else if (project.userId === me.data?.id) roles.add("Owner");
    }
    return ["All", ...Array.from(roles).sort()];
  }, [projectsQuery.data, me.data?.id]);

  const assigneeOptions = useMemo(() => {
    const ids = new Set<string>();
    for (const module of modulesQuery.data ?? []) {
      if (module.assignedToUserId) ids.add(module.assignedToUserId);
    }
    const labeled = Array.from(ids).map((id) => ({
      id,
      label: id === me.data?.id ? "Me" : (memberNameById.get(id) ?? "Other member"),
    }));
    labeled.sort((a, b) => a.label.localeCompare(b.label));
    return [{ id: "All", label: "All assignees" }, { id: "Unassigned", label: "Unassigned" }, ...labeled];
  }, [modulesQuery.data, memberNameById, me.data?.id]);

  const moduleProjectFilterOptions = useMemo(() => {
    const projects = (projectsQuery.data ?? []).map((project) => ({
      id: project.id,
      label: project.title,
    }));
    projects.sort((a, b) => a.label.localeCompare(b.label));
    return [
      { id: ALL_ENTITIES, label: "All projects" },
      { id: "None", label: "No project" },
      ...projects,
    ];
  }, [projectsQuery.data]);

  const projectRows: PipelineRow[] = useMemo(
    () =>
      (projectsQuery.data ?? []).map((project) => {
        const counts = taskCountByProject.get(project.id) ?? { completed: 0, total: 0 };
        return {
          id: project.id,
          kind: "Project" as const,
          displayId: project.displayId,
          title: project.title,
          priority: project.importance,
          status: project.status,
          role: project.role ?? (project.userId === me.data?.id ? "Owner" : null),
          assignee: null,
          projectId: project.id,
          completion: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
          outstanding: counts.total - counts.completed,
          stageIndex: project.pipelineStage ? stageIndexByValue.get(project.pipelineStage) : undefined,
        };
      }),
    [projectsQuery.data, taskCountByProject, stageIndexByValue, me.data?.id],
  );

  const moduleRows: PipelineRow[] = useMemo(
    () =>
      (modulesQuery.data ?? []).map((module) => {
        const counts = taskCountByModule.get(module.id) ?? { completed: 0, total: 0 };
        const assigneeLabel = module.assignedToUserId
          ? module.assignedToUserId === me.data?.id
            ? "Me"
            : (memberNameById.get(module.assignedToUserId) ?? "Other member")
          : null;
        return {
          id: module.id,
          kind: "Module" as const,
          displayId: module.displayId,
          title: module.title,
          priority: null,
          status: module.status,
          role: null,
          assignee: assigneeLabel,
          projectId: module.projectId,
          completion: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
          outstanding: counts.total - counts.completed,
          stageIndex: module.pipelineStage ? stageIndexByValue.get(module.pipelineStage) : undefined,
        };
      }),
    [modulesQuery.data, taskCountByModule, stageIndexByValue, memberNameById, me.data?.id],
  );

  const entityRows = entityType === "Project" ? projectRows : moduleRows;
  const entityOptions = useMemo(
    () =>
      entityType === "Project"
        ? (projectsQuery.data ?? []).map((project) => ({ id: project.id, label: project.title }))
        : (modulesQuery.data ?? []).map((module) => ({ id: module.id, label: module.title })),
    [entityType, projectsQuery.data, modulesQuery.data],
  );

  const unassignedCount = entityRows.filter((row) => row.stageIndex === undefined).length;

  const filteredRows = useMemo(() => {
    return entityRows.filter((row) => {
      if (!isAllEntities && row.id !== entityFilter) return false;
      if (entityType === "Project") {
        if (priority !== "All" && row.priority !== priority) return false;
        if (status !== "All" && row.status !== status) return false;
        if (role !== "All" && row.role !== role) return false;
      } else {
        if (moduleStatus !== "All" && row.status !== moduleStatus) return false;
        if (assignee === "Unassigned" && row.assignee !== null) return false;
        if (assignee !== "All" && assignee !== "Unassigned" && row.assignee !== assignee) return false;
        if (moduleProjectFilter === "None" && row.projectId !== null) return false;
        if (
          moduleProjectFilter !== ALL_ENTITIES &&
          moduleProjectFilter !== "None" &&
          row.projectId !== moduleProjectFilter
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    entityRows,
    isAllEntities,
    entityFilter,
    entityType,
    priority,
    status,
    role,
    moduleStatus,
    assignee,
    moduleProjectFilter,
  ]);

  const grouped = useMemo(
    () => groupByStage(filteredRows, stages.length),
    [filteredRows, stages.length],
  );
  const unassignedRows = filteredRows.filter((row) => row.stageIndex === undefined);
  const visibleStages = stages
    .map((stage, index) => ({ stage, index }))
    .filter(({ stage }) => !hiddenStageValues.has(stage.value));

  function toggleStageVisibility(stageValue: string) {
    setHiddenStageValues((current) => {
      const next = new Set(current);
      if (next.has(stageValue)) {
        next.delete(stageValue);
      } else {
        if (stages.length - current.size <= 1) return current;
        next.add(stageValue);
      }
      return next;
    });
  }

  async function addStage(value: string) {
    const maxSortOrder = stages.reduce((max, stage) => Math.max(max, stage.sortOrder), 0);
    const sortOrder = maxSortOrder + 1;
    if (!isAllEntities) {
      if (entityType === "Project") await createOwnProjectStage.mutateAsync({ value, sortOrder });
      else await createOwnModuleStage.mutateAsync({ value, sortOrder });
      return;
    }
    if (entityType === "Project") await createProjectPoolStage.mutateAsync({ value, sortOrder });
    else await createModulePoolStage.mutateAsync({ value, sortOrder });
  }

  async function deleteStage(stage: ApiPipelineStage) {
    if (stages.length === 1) return;
    if (
      !window.confirm(
        `Delete "${stage.value}"? Items in this stage will no longer show a pipeline stage.`,
      )
    ) {
      return;
    }
    if (!isAllEntities) {
      if (entityType === "Project") await deleteOwnProjectStage.mutateAsync(stage.id);
      else await deleteOwnModuleStage.mutateAsync(stage.id);
    } else if (entityType === "Project") {
      await deleteProjectPoolStage.mutateAsync(stage.id);
    } else {
      await deleteModulePoolStage.mutateAsync(stage.id);
    }
    setHiddenStageValues((current) => {
      if (!current.has(stage.value)) return current;
      const next = new Set(current);
      next.delete(stage.value);
      return next;
    });
  }

  function moveItem(id: string, stageIndex: number) {
    const stageValue = stages[stageIndex]?.value;
    if (!stageValue) return;
    if (entityType === "Project") {
      void updateProject.mutateAsync({ projectId: id, input: { pipelineStage: stageValue } });
    } else {
      void updateModule.mutateAsync({ moduleId: id, input: { pipelineStage: stageValue } });
    }
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, row: PipelineRow) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", row.id);
    setDraggedId(row.id);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, stageIndex: number) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverStageIndex(stageIndex);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, stageIndex: number) {
    event.preventDefault();
    const id = draggedId ?? event.dataTransfer.getData("text/plain");
    if (id) moveItem(id, stageIndex);
    setDraggedId(null);
    setDragOverStageIndex(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverStageIndex(null);
  }

  if (
    workspace.isPending ||
    projectsQuery.isPending ||
    modulesQuery.isPending ||
    activeStagesQuery.isPending
  ) {
    return <LoadingState title="Loading pipeline" className="min-h-[50vh]" />;
  }
  if (projectsQuery.isError) {
    return (
      <ErrorState
        title="Pipeline could not be loaded"
        description={projectsQuery.error.message}
        onRetry={() => void projectsQuery.refetch()}
      />
    );
  }
  if (modulesQuery.isError) {
    return (
      <ErrorState
        title="Pipeline could not be loaded"
        description={modulesQuery.error.message}
        onRetry={() => void modulesQuery.refetch()}
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeading
        icon={Workflow}
        tone="emerald"
        eyebrow="Workflows"
        title="Pipeline"
        description="Projects or modules grouped by their current stage in the research workflow — view every workspace item, or drill into one to see its own custom pipeline."
      />

      <div className="surface-toolbar flex flex-col gap-4 border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pipeline
          </span>
          {ENTITY_TYPES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => selectEntityType(option)}
              aria-pressed={option === entityType}
              className={controlPillClass(option === entityType)}
            >
              {option === "Project" ? "Project pipeline" : "Module pipeline"}
            </button>
          ))}
          <span className="mx-2 h-4 w-px bg-border" aria-hidden="true" />
          <Select value={entityFilter} onValueChange={selectEntityFilter}>
            <SelectTrigger className="sm:w-56" aria-label={`Filter by ${entityType.toLowerCase()}`}>
              <SelectValue placeholder={`All ${entityType.toLowerCase()}s`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ENTITIES}>
                All {entityType === "Project" ? "projects" : "modules"}
              </SelectItem>
              {entityOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
          {entityType === "Project" ? (
            <>
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
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "All" ? "All roles" : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : (
            <>
              <Select value={moduleProjectFilter} onValueChange={setModuleProjectFilter}>
                <SelectTrigger className="sm:w-48" aria-label="Filter by project">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  {moduleProjectFilterOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={moduleStatus} onValueChange={(value) => setModuleStatus(value as StatusFilter)}>
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
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  {assigneeOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          <Button variant="outline" onClick={() => setIsManageStagesOpen(true)}>
            <Settings2 />
            Manage stages
          </Button>
        </div>
        {!isAllEntities ? (
          <p className="text-xs text-muted-foreground">
            Showing only this {entityType.toLowerCase()}'s own pipeline — the stages picked or
            created for it when it was made. Switch back to "All {entityType === "Project" ? "projects" : "modules"}"
            to see the shared workspace pipeline.
          </p>
        ) : unassignedCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {unassignedCount} {entityType.toLowerCase()}{unassignedCount === 1 ? "" : "s"} without a
            pipeline stage {unassignedCount === 1 ? "is" : "are"} shown in Unassigned.
          </p>
        ) : null}
      </div>

      {view === "Flow" ? (
        <div className="flex flex-col">
          {unassignedRows.length > 0 ? (
            <div className="mb-6 flex gap-4">
              <div className="flex w-4 shrink-0 flex-col items-center">
                <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-amber-400 bg-amber-100 dark:bg-amber-950" />
                <span className="w-px flex-1 bg-border" />
              </div>
              <div className="min-h-24 flex-1 rounded-xl border border-amber-200 bg-amber-50/45 p-3 dark:border-amber-900/50 dark:bg-amber-950/15">
                <div className="flex items-center gap-2">
                  <h3 className={STAGE_TITLE_CLASS}>Unassigned</h3>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {unassignedRows.length}
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {unassignedRows.map((row) => (
                    <PipelineItemRow
                      key={row.id}
                      row={row}
                      isDragging={draggedId === row.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onStageChange={moveItem}
                      stages={stages}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {visibleStages.map(({ stage, index }, visibleIndex) => {
            const rows = grouped[index] ?? [];
            const hasItems = rows.length > 0;
            const isLast = visibleIndex === visibleStages.length - 1;

            return (
              <div key={stage.id} className="flex gap-4">
                <div className="flex w-4 shrink-0 flex-col items-center">
                  <span
                    className={cn(
                      "mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2",
                      hasItems ? "border-primary bg-primary" : "border-border bg-background",
                    )}
                  />
                  {!isLast ? <span className="w-px flex-1 bg-border" /> : null}
                </div>

                <div
                  role="group"
                  aria-label={`${stage.value} stage drop zone`}
                  onDragOver={(event) => handleDragOver(event, index)}
                  onDrop={(event) => handleDrop(event, index)}
                  className={cn(
                    "min-h-24 flex-1 rounded-xl border border-transparent bg-card/35 p-3 transition-all",
                    !isLast && "mb-6",
                    draggedId && "border border-dashed border-primary/30",
                    dragOverStageIndex === index && "border-primary bg-primary/5 ring-2 ring-primary/30",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={cn(STAGE_TITLE_CLASS, !hasItems && "text-muted-foreground")}
                    >
                      {stage.value}
                    </h3>
                    {hasItems ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {rows.length}
                      </span>
                    ) : null}
                  </div>

                  {hasItems ? (
                    <div className="mt-3 flex flex-col gap-2">
                      {rows.map((row) => (
                        <PipelineItemRow
                          key={row.id}
                          row={row}
                          isDragging={draggedId === row.id}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onStageChange={moveItem}
                          stages={stages}
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
            style={{ minWidth: `${(visibleStages.length + (unassignedRows.length ? 1 : 0)) * 260}px` }}
          >
            {unassignedRows.length > 0 ? (
              <div className="flex min-h-48 w-64 shrink-0 flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/45 p-3 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/15">
                <div className="flex items-center gap-2">
                  <h3 className={STAGE_TITLE_CLASS}>Unassigned</h3>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {unassignedRows.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {unassignedRows.map((row) => (
                    <PipelineItemRow
                      key={row.id}
                      row={row}
                      compact
                      isDragging={draggedId === row.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onStageChange={moveItem}
                      stages={stages}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {visibleStages.map(({ stage, index }) => {
              const rows = grouped[index] ?? [];
              const hasItems = rows.length > 0;

              return (
                <div
                  key={stage.id}
                  role="group"
                  aria-label={`${stage.value} stage drop zone`}
                  onDragOver={(event) => handleDragOver(event, index)}
                  onDrop={(event) => handleDrop(event, index)}
                  className={cn(
                    "flex min-h-48 w-64 shrink-0 flex-col gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/30 p-3 shadow-sm transition-colors dark:border-emerald-900/40 dark:bg-emerald-950/10",
                    draggedId && "border-dashed border-primary/30",
                    dragOverStageIndex === index && "border-primary bg-primary/5 ring-2 ring-primary/30",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        STAGE_TITLE_CLASS,
                        !hasItems && "text-muted-foreground",
                      )}
                    >
                      {stage.value}
                    </h3>
                    {hasItems ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {rows.length}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    {hasItems ? (
                      rows.map((row) => (
                        <PipelineItemRow
                          key={row.id}
                          row={row}
                          compact
                          isDragging={draggedId === row.id}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onStageChange={moveItem}
                          stages={stages}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No {entityType.toLowerCase()}s</p>
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
        stages={stages}
        visibleStages={new Set(stages.filter((stage) => !hiddenStageValues.has(stage.value)).map((stage) => stage.value))}
        onToggleVisibility={toggleStageVisibility}
        onAdd={(value) => void addStage(value)}
        onDelete={(stage) => void deleteStage(stage)}
      />
    </div>
  );
}
