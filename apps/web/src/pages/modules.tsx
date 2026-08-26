import { useCallback, useMemo, useState } from "react";
import { Archive, Boxes, Pencil, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

import {
  useArchiveMyModule,
  useCreateModule,
  useCurrentWorkspace,
  useMembers,
  useMyModules,
  useProjects,
  useUpdateMyModule,
  type ApiModule,
} from "@/api/hooks";
import { ColumnVisibilityMenu } from "@/components/dashboard/column-visibility-menu";
import { ModuleDialog, type ModuleFormInput } from "@/components/modules/module-dialog";
import { ModuleCollaboratorsManager } from "@/components/modules/module-collaborators";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useColumnVisibility } from "@/hooks/use-column-visibility";

const STATUS_FILTERS = ["All", "Active", "Review", "Stalled", "Complete"] as const;
const MODULE_COLUMNS = [
  { id: "module", label: "Module", width: "minmax(280px,2fr)" },
  { id: "project", label: "Project", width: "180px" },
  { id: "status", label: "Status", width: "110px" },
  { id: "stage", label: "Stage", width: "170px" },
  { id: "type", label: "Type", width: "140px" },
  { id: "assignee", label: "Assigned To", width: "150px" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

function statusPillClass(status: string | null) {
  switch (status) {
    case "Active":
    case "Complete":
      return "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400";
    case "Review":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Stalled":
      return "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400";
    default:
      return "border-border text-muted-foreground";
  }
}

export default function ModulesPage() {
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";

  // Modules are tenant-agnostic — a module the caller collaborates on
  // (directly, or via its linked project) must still show up here, even
  // from another workspace (see MyModulesController on the backend).
  const modulesQuery = useMyModules();
  const projectsQuery = useProjects(tenantId);
  const [isNewModuleOpen, setIsNewModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ApiModule | null>(null);
  const [sharingModule, setSharingModule] = useState<ApiModule | null>(null);
  const workspaceMembers = useMembers(
    tenantId,
    isNewModuleOpen || editingModule !== null || sharingModule !== null,
  );

  const createModule = useCreateModule(tenantId);
  const updateModule = useUpdateMyModule();
  const archiveModule = useArchiveMyModule();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const columns = useColumnVisibility(MODULE_COLUMNS.map((column) => column.id));
  const gridTemplate = MODULE_COLUMNS.filter((column) =>
    columns.visibleColumns.has(column.id),
  )
    .map((column) => column.width)
    .join(" ");

  const projectById = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projectsQuery.data ?? []) map.set(project.id, project.title);
    return map;
  }, [projectsQuery.data]);

  const memberById = useMemo(() => {
    const map = new Map<string, string>();
    for (const member of workspaceMembers.data ?? []) map.set(member.userId, member.displayName);
    return map;
  }, [workspaceMembers.data]);

  const projectName = useCallback((projectId: string | null) => {
    if (!projectId) return "Independent module";
    return projectById.get(projectId) ?? "Unknown project";
  }, [projectById]);

  const visibleModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (modulesQuery.data ?? []).filter((module) => {
      if (status !== "All" && module.status !== status) return false;
      const linkedProject = projectName(module.projectId);
      return (
        !query ||
        module.title.toLowerCase().includes(query) ||
        (module.description?.toLowerCase().includes(query) ?? false) ||
        linkedProject.toLowerCase().includes(query)
      );
    });
  }, [modulesQuery.data, search, status, projectName]);

  const hasActiveFilters = search !== "" || status !== "All";

  async function handleCreateModule(input: ModuleFormInput) {
    await createModule.mutateAsync({
      title: input.title,
      description: input.description || undefined,
      projectId: input.projectId ?? undefined,
      status: input.status,
      pipelineStage: input.pipelineStage,
      pipelineStages: input.pipelineStages,
      tag: input.tag || undefined,
      assignedToUserId: input.assignedToUserId ?? undefined,
    });

  }

  async function handleUpdateModule(input: ModuleFormInput) {
    if (!editingModule) return;
    await updateModule.mutateAsync({
      moduleId: editingModule.id,
      input: {
        title: input.title,
        description: input.description || undefined,
        status: input.status,
        pipelineStage: input.pipelineStage,
        tag: input.tag || undefined,
        assignedToUserId: input.assignedToUserId ?? undefined,
      },
    });
    setEditingModule(null);
  }

  async function archive(module: ApiModule) {
    if (!window.confirm(`Archive "${module.title}"? It will be permanently deleted after 14 days.`)) {
      return;
    }
    await archiveModule.mutateAsync(module.id);
    setEditingModule((current) => (current?.id === module.id ? null : current));
    setSharingModule((current) => (current?.id === module.id ? null : current));
  }

  if (workspace.isPending || modulesQuery.isPending) {
    return <LoadingState title="Loading modules" className="min-h-[50vh]" />;
  }
  if (modulesQuery.isError) {
    return (
      <ErrorState
        title="Modules could not be loaded"
        description={modulesQuery.error.message}
        onRetry={() => void modulesQuery.refetch()}
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeading
        tone="violet"
        icon={Boxes}
        eyebrow="Workflows"
        title="Modules"
        description="Organize project-related or independent areas of work by status, type and assignee."
        actions={<Button onClick={() => setIsNewModuleOpen(true)}>New Module</Button>}
      />

      <ModuleDialog
        open={isNewModuleOpen}
        onOpenChange={setIsNewModuleOpen}
        tenantId={tenantId}
        projects={projectsQuery.data ?? []}
        members={workspaceMembers.data ?? []}
        onSave={(input) => void handleCreateModule(input)}
      />
      <ModuleDialog
        open={editingModule !== null}
        onOpenChange={(open) => {
          if (!open) setEditingModule(null);
        }}
        tenantId={tenantId}
        projects={projectsQuery.data ?? []}
        members={workspaceMembers.data ?? []}
        module={editingModule}
        onSave={(input) => void handleUpdateModule(input)}
      />
      <Dialog
        open={sharingModule !== null}
        onOpenChange={(open) => {
          if (!open) setSharingModule(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Module collaborators</DialogTitle>
            <DialogDescription>
              Invite collaborators to {sharingModule?.title ?? "this module"} by email and manage pending access.
            </DialogDescription>
          </DialogHeader>
          {sharingModule ? (
            sharingModule.tenantId === tenantId ? (
              <ModuleCollaboratorsManager
                tenantId={tenantId}
                moduleId={sharingModule.id}
                moduleTitle={sharingModule.title}
                members={workspaceMembers.data ?? []}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                This module belongs to another workspace. Only its owner can manage collaborators.
              </p>
            )
          ) : null}
        </DialogContent>
      </Dialog>

      <div className="surface-toolbar flex flex-wrap items-center gap-3 border-violet-200/70 bg-violet-50/40 dark:border-violet-900/50 dark:bg-violet-950/10">
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
            }}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/70 bg-muted/20 p-3 shadow-sm sm:p-4">
        <div className="min-w-[860px]">
          <div
            className="mb-3 grid gap-4 rounded-lg border border-violet-200/70 bg-violet-100/65 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-violet-950 dark:border-violet-900/50 dark:bg-violet-950/35 dark:text-violet-200"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {MODULE_COLUMNS.filter((column) =>
              columns.visibleColumns.has(column.id),
            ).map((column) => (
              <span key={column.id}>{column.label}</span>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {visibleModules.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No modules match the current filters.
              </div>
            ) : (
              visibleModules.map((module) => (
                <div
                  key={module.id}
                  className="grid items-center gap-4 rounded-xl border border-violet-200/70 bg-gradient-to-r from-violet-50/55 via-card to-card px-4 py-4 shadow-sm transition-all hover:border-violet-300 hover:shadow-md dark:border-violet-900/50 dark:from-violet-950/15"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  {columns.isColumnVisible("module") ? (
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-0.5">
                        {module.displayId ? (
                          <span className="font-mono text-[11px] text-muted-foreground">{module.displayId}</span>
                        ) : null}
                        <div className="flex items-start gap-2">
                          <Link
                            to={`/modules/${module.id}`}
                            className="font-semibold leading-tight text-foreground transition-colors hover:text-primary hover:underline"
                          >
                            {module.title}
                          </Link>
                          {module.tenantId === tenantId ? (
                            <button
                              type="button"
                              aria-label={`Manage collaborators for ${module.title}`}
                              title="Manage collaborators"
                              onClick={() => setSharingModule(module)}
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            aria-label={`Edit ${module.title}`}
                            title="Edit module"
                            onClick={() => setEditingModule(module)}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Archive ${module.title}`}
                            title="Archive module"
                            onClick={() => void archive(module)}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="max-w-md text-xs text-muted-foreground">
                          {module.description || "No description"}
                        </span>
                      </div>
                    </div>
                  ) : null}
                  {columns.isColumnVisible("project") ? (
                    <span className="max-w-56 text-sm text-muted-foreground">
                      {projectName(module.projectId)}
                    </span>
                  ) : null}
                  {columns.isColumnVisible("status") ? (
                    <Badge variant="outline" className={statusPillClass(module.status)}>
                      {module.status ?? "—"}
                    </Badge>
                  ) : null}
                  {columns.isColumnVisible("stage") ? (
                    <span className="text-sm text-muted-foreground">
                      {module.pipelineStage ?? "Unassigned"}
                    </span>
                  ) : null}
                  {columns.isColumnVisible("type") ? (
                    <span className="text-sm text-muted-foreground">
                      {module.tag ?? "—"}
                    </span>
                  ) : null}
                  {columns.isColumnVisible("assignee") ? (
                    <span className="text-sm text-muted-foreground">
                      {module.assignedToUserId
                        ? (memberById.get(module.assignedToUserId) ?? "Unknown member")
                        : "Unassigned"}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
