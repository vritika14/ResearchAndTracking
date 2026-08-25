import { useMemo, useState } from "react";

import { useCurrentWorkspace, usePipelineStages, useProjects, useTasks } from "@/api/hooks";
import {
  PipelineBar,
  PipelineStageRuler,
} from "@/components/dashboard/pipeline-bar";
import { ColumnVisibilityMenu } from "@/components/dashboard/column-visibility-menu";
import { priorityBadgeClass } from "@/components/dashboard/priority-badge-styles";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useColumnVisibility } from "@/hooks/use-column-visibility";

const PRIORITY_FILTERS = ["All", "Critical", "High", "Medium", "Low"] as const;
const PIPELINE_COLUMNS = [
  { id: "project", label: "Project" },
  { id: "pipeline", label: "Stage Bar" },
  { id: "completion", label: "Completion" },
  { id: "priority", label: "Priority" },
] as const;

type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

export function PipelineOverviewTable() {
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";
  const projectsQuery = useProjects(tenantId);
  const tasksQuery = useTasks(tenantId);
  const pipelineStagesQuery = usePipelineStages(tenantId);

  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<PriorityFilter>("All");
  const [stage, setStage] = useState("All");
  const columns = useColumnVisibility(
    PIPELINE_COLUMNS.map((column) => column.id),
  );

  const stages = useMemo(
    () => [...(pipelineStagesQuery.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [pipelineStagesQuery.data],
  );
  const stageNames = stages.map((s) => s.value);
  const stageFilterOptions = ["All", "Unassigned", ...stageNames];
  const stageIndexByValue = useMemo(() => {
    const map = new Map<string, number>();
    stages.forEach((s, index) => map.set(s.value, index));
    return map;
  }, [stages]);
  const pipelineWidth = `${Math.max(1280, stageNames.length * 128)}px`;

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

  const projectRows = useMemo(
    () =>
      (projectsQuery.data ?? []).map((project) => {
          const counts = taskCountByProject.get(project.id) ?? { completed: 0, total: 0 };
          const stageIndex = project.pipelineStage
            ? stageIndexByValue.get(project.pipelineStage)
            : undefined;
          return {
            id: project.id,
            name: project.title,
            priority: project.importance,
            stageIndex,
            completion: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0,
          };
        }),
    [projectsQuery.data, taskCountByProject, stageIndexByValue],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projectRows.filter((row) => {
      if (priority !== "All" && row.priority !== priority) return false;
      const rowStage = row.stageIndex === undefined ? "Unassigned" : stageNames[row.stageIndex];
      if (stage !== "All" && rowStage !== stage) return false;
      if (query && !row.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [projectRows, search, priority, stage, stageNames]);

  const hasActiveFilters = search !== "" || priority !== "All" || stage !== "All";

  function clearFilters() {
    setSearch("");
    setPriority("All");
    setStage("All");
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <div>
          <CardTitle>Pipeline Project Overview</CardTitle>
          <CardDescription>
            Where every project stands, from Concept through Published.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search project…"
            className="sm:max-w-xs"
          />
          <Select
            value={priority}
            onValueChange={(value) => setPriority(value as PriorityFilter)}
          >
            <SelectTrigger className="sm:w-36">
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
          <Select
            value={stage}
            onValueChange={setStage}
          >
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              {stageFilterOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "All" ? "All stages" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ColumnVisibilityMenu
            columns={PIPELINE_COLUMNS}
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
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.isColumnVisible("project") ? <TableHead>Project</TableHead> : null}
              {columns.isColumnVisible("pipeline") ? (
                <TableHead style={{ minWidth: pipelineWidth }}>
                  <PipelineStageRuler stages={stageNames} />
                </TableHead>
              ) : null}
              {columns.isColumnVisible("completion") ? (
                <TableHead>Completion</TableHead>
              ) : null}
              {columns.isColumnVisible("priority") ? <TableHead>Priority</TableHead> : null}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.visibleColumns.size}
                  className="h-24 text-center text-muted-foreground"
                >
                  No projects match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  {columns.isColumnVisible("project") ? (
                    <TableCell
                      className={cn("max-w-[220px] truncate font-medium")}
                      title={row.name}
                    >
                      {row.name}
                    </TableCell>
                  ) : null}

                  {columns.isColumnVisible("pipeline") ? (
                    <TableCell style={{ minWidth: pipelineWidth }}>
                      {row.stageIndex === undefined ? (
                        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                          Unassigned — choose a stage in Projects
                        </Badge>
                      ) : (
                        <PipelineBar
                          stageIndex={row.stageIndex}
                          stageCount={stageNames.length}
                        />
                      )}
                    </TableCell>
                  ) : null}

                  {columns.isColumnVisible("completion") ? (
                    <TableCell className="tabular-nums text-muted-foreground">
                      {row.completion}%
                    </TableCell>
                  ) : null}

                  {columns.isColumnVisible("priority") ? (
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={priorityBadgeClass(row.priority)}
                      >
                        {row.priority ?? "—"}
                      </Badge>
                    </TableCell>
                  ) : null}

                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
