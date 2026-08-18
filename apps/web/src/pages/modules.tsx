import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { ColumnVisibilityMenu } from "@/components/dashboard/column-visibility-menu";
import {
  moduleImportanceBadgeClass,
  moduleStatusBadgeClass,
} from "@/components/modules/module-badge-styles";
import { ModuleDialog, type ModuleInput } from "@/components/modules/module-dialog";
import { PageHeading } from "@/components/typography/heading";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ResearchModule } from "@/data/modules";
import { projects } from "@/data/projects";
import { useColumnVisibility } from "@/hooks/use-column-visibility";
import { useModules } from "@/hooks/use-modules";
import { usePipelineStages } from "@/hooks/use-pipeline-stages";

const STATUS_FILTERS = ["All", "Active", "Review", "Stalled", "Complete", "Archived"] as const;
const IMPORTANCE_FILTERS = ["All", "Critical", "High", "Medium", "Low"] as const;
const MODULE_COLUMNS = [
  { id: "module", label: "Module" },
  { id: "project", label: "Project" },
  { id: "status", label: "Status" },
  { id: "stage", label: "Pipeline Stage" },
  { id: "due", label: "Due Date" },
  { id: "importance", label: "Importance" },
  { id: "actions", label: "Actions" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];
type ImportanceFilter = (typeof IMPORTANCE_FILTERS)[number];

function formatDate(iso: string) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function projectName(projectId: string | null) {
  if (!projectId) return "Independent module";
  return projects.find((project) => project.id === projectId)?.title ?? "Unknown project";
}

export default function ModulesPage() {
  const { moduleRows, setModuleRows } = useModules();
  const { pipelineStages } = usePipelineStages();
  const [isNewModuleOpen, setIsNewModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ResearchModule | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [importance, setImportance] = useState<ImportanceFilter>("All");
  const columns = useColumnVisibility(MODULE_COLUMNS.map((column) => column.id));

  const visibleModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return moduleRows.filter((module) => {
      if (status !== "All" && module.status !== status) return false;
      if (importance !== "All" && module.importance !== importance) return false;
      const linkedProject = projectName(module.projectId);
      return (
        !query ||
        module.id.toLowerCase().includes(query) ||
        module.title.toLowerCase().includes(query) ||
        module.description.toLowerCase().includes(query) ||
        linkedProject.toLowerCase().includes(query)
      );
    });
  }, [moduleRows, search, status, importance]);

  function createModule(input: ModuleInput) {
    const highestId = moduleRows.reduce((highest, module) => {
      const numericId = Number(module.id.replace(/\D/g, ""));
      return Number.isNaN(numericId) ? highest : Math.max(highest, numericId);
    }, 0);
    setModuleRows((current) => [
      { ...input, id: `MOD-${String(highestId + 1).padStart(3, "0")}` },
      ...current,
    ]);
  }

  function updateModule(input: ModuleInput) {
    if (!editingModule) return;
    setModuleRows((current) =>
      current.map((module) =>
        module.id === editingModule.id ? { ...input, id: editingModule.id } : module,
      ),
    );
    setEditingModule(null);
  }

  function deleteModule(module: ResearchModule) {
    if (!window.confirm(`Delete "${module.title}"? This action cannot be undone.`)) return;
    setModuleRows((current) => current.filter((row) => row.id !== module.id));
    setEditingModule((current) => (current?.id === module.id ? null : current));
  }

  const hasActiveFilters = search !== "" || status !== "All" || importance !== "All";

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        eyebrow="Workflows"
        title="Modules"
        description="Organize project-related or independent areas of work by status, pipeline stage, due date, and importance."
        actions={<Button onClick={() => setIsNewModuleOpen(true)}>New Module</Button>}
      />

      <ModuleDialog
        open={isNewModuleOpen}
        onOpenChange={setIsNewModuleOpen}
        projects={projects}
        onSave={createModule}
      />
      <ModuleDialog
        open={editingModule !== null}
        onOpenChange={(open) => {
          if (!open) setEditingModule(null);
        }}
        projects={projects}
        module={editingModule}
        onSave={updateModule}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search modules…"
          className="sm:max-w-xs"
        />
        <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
          <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "All" ? "All statuses" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={importance}
          onValueChange={(value) => setImportance(value as ImportanceFilter)}
        >
          <SelectTrigger className="sm:w-40"><SelectValue placeholder="Importance" /></SelectTrigger>
          <SelectContent>
            {IMPORTANCE_FILTERS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "All" ? "All importance" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ColumnVisibilityMenu
          columns={MODULE_COLUMNS}
          visibleColumns={columns.visibleColumns}
          onToggle={columns.toggleColumn}
        />
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("All");
              setImportance("All");
            }}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              {columns.isColumnVisible("module") ? <TableHead>Module</TableHead> : null}
              {columns.isColumnVisible("project") ? <TableHead>Project</TableHead> : null}
              {columns.isColumnVisible("status") ? <TableHead>Status</TableHead> : null}
              {columns.isColumnVisible("stage") ? <TableHead>Pipeline Stage</TableHead> : null}
              {columns.isColumnVisible("due") ? <TableHead>Due Date</TableHead> : null}
              {columns.isColumnVisible("importance") ? <TableHead>Importance</TableHead> : null}
              {columns.isColumnVisible("actions") ? <TableHead className="text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleModules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.visibleColumns.size} className="h-24 text-center text-muted-foreground">
                  No modules match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              visibleModules.map((module) => (
                <TableRow key={module.id}>
                  {columns.isColumnVisible("module") ? (
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[11px] text-muted-foreground">{module.id}</span>
                        <Link
                          to={`/modules/${module.id}`}
                          className="font-semibold leading-tight text-foreground transition-colors hover:text-primary hover:underline"
                        >
                          {module.title}
                        </Link>
                        <span className="max-w-md text-xs text-muted-foreground">
                          {module.description || "No description"}
                        </span>
                      </div>
                    </TableCell>
                  ) : null}
                  {columns.isColumnVisible("project") ? (
                    <TableCell className="max-w-56 text-sm text-muted-foreground">
                      {projectName(module.projectId)}
                    </TableCell>
                  ) : null}
                  {columns.isColumnVisible("status") ? (
                    <TableCell>
                      <Badge variant="outline" className={moduleStatusBadgeClass(module.status)}>
                        {module.status}
                      </Badge>
                    </TableCell>
                  ) : null}
                  {columns.isColumnVisible("stage") ? (
                    <TableCell className="text-sm text-muted-foreground">
                      {pipelineStages[module.stageIndex]?.name ?? "Unknown stage"}
                    </TableCell>
                  ) : null}
                  {columns.isColumnVisible("due") ? (
                    <TableCell className="tabular-nums">{formatDate(module.dueDate)}</TableCell>
                  ) : null}
                  {columns.isColumnVisible("importance") ? (
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={moduleImportanceBadgeClass(module.importance)}
                      >
                        {module.importance}
                      </Badge>
                    </TableCell>
                  ) : null}
                  {columns.isColumnVisible("actions") ? (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${module.title}`}
                          onClick={() => setEditingModule(module)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Delete ${module.title}`}
                          onClick={() => deleteModule(module)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
