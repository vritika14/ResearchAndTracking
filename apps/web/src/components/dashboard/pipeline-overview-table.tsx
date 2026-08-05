import { useMemo, useState } from "react";

import {
  PipelineBar,
  PipelineStageRuler,
} from "@/components/dashboard/pipeline-bar";
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
import {
  PIPELINE_STAGES,
  pipelineProjects,
  type ProjectPriority,
  type ProjectStatus,
} from "@/data/pipeline-projects";
import { cn } from "@/lib/utils";

const PRIORITY_FILTERS = ["All", "Critical", "High", "Medium", "Low"] as const;
const STATUS_FILTERS = [
  "All",
  "Active",
  "Review",
  "Complete",
  "Stalled",
] as const;
const STAGE_FILTERS = ["All", ...PIPELINE_STAGES] as const;

type PriorityFilter = (typeof PRIORITY_FILTERS)[number];
type StatusFilter = (typeof STATUS_FILTERS)[number];
type StageFilter = (typeof STAGE_FILTERS)[number];

function priorityBadgeClass(priority: ProjectPriority) {
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

function statusBadgeClass(status: ProjectStatus) {
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

export function PipelineOverviewTable() {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<PriorityFilter>("All");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [stage, setStage] = useState<StageFilter>("All");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pipelineProjects.filter((row) => {
      if (priority !== "All" && row.priority !== priority) return false;
      if (status !== "All" && row.status !== status) return false;
      if (stage !== "All" && PIPELINE_STAGES[row.stageIndex] !== stage)
        return false;
      if (
        query &&
        !row.id.toLowerCase().includes(query) &&
        !row.name.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [search, priority, status, stage]);

  const hasActiveFilters =
    search !== "" || priority !== "All" || status !== "All" || stage !== "All";

  function clearFilters() {
    setSearch("");
    setPriority("All");
    setStatus("All");
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
            placeholder="Search project or ID…"
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
            value={status}
            onValueChange={(value) => setStatus(value as StatusFilter)}
          >
            <SelectTrigger className="sm:w-36">
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
          <Select
            value={stage}
            onValueChange={(value) => setStage(value as StageFilter)}
          >
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              {STAGE_FILTERS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "All" ? "All stages" : option}
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
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead className="min-w-[1280px]">
                <div className="flex flex-col gap-2 pt-1">
                  <span>Pipeline</span>
                  <PipelineStageRuler />
                </div>
              </TableHead>
              <TableHead>Completion</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No projects match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell
                    className={cn("max-w-[220px] truncate font-medium")}
                    title={row.name}
                  >
                    {row.name}
                  </TableCell>

                  <TableCell className="min-w-[1280px]">
                    <PipelineBar
                      stageIndex={row.stageIndex}
                      completion={row.completion}
                    />
                  </TableCell>

                  <TableCell className="tabular-nums text-muted-foreground">
                    {row.completion}%
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={priorityBadgeClass(row.priority)}
                    >
                      {row.priority}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusBadgeClass(row.status)}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
