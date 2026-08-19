import { useMemo, useState } from "react";
import { Archive, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

import { apiClient } from "@/api/client";
import {
  useArchiveModule,
  useCreateModule,
  useCurrentWorkspace,
  useMembers,
  useModules,
  useProjects,
  useUpdateModule,
  type ApiModule,
} from "@/api/hooks";
import { ColumnVisibilityMenu } from "@/components/dashboard/column-visibility-menu";
import { ModuleDialog, type ModuleFormInput } from "@/components/modules/module-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeading } from "@/components/typography/heading";
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
import { useColumnVisibility } from "@/hooks/use-column-visibility";

const STATUS_FILTERS = ["All", "Active", "Review", "Stalled", "Complete"] as const;
const MODULE_COLUMNS = [
  { id: "module", label: "Module" },
  { id: "project", label: "Project" },
  { id: "status", label: "Status" },
  { id: "type", label: "Type" },
  { id: "assignee", label: "Assigned To" },
  { id: "actions", label: "Actions" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function ModulesPage() {
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";

  const modulesQuery = useModules(tenantId);
  const projectsQuery = useProjects(tenantId);
  const [isNewModuleOpen, setIsNewModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ApiModule | null>(null);
  const workspaceMembers = useMembers(
    tenantId,
    isNewModuleOpen || editingModule !== null,
  );

  const createModule = useCreateModule(tenantId);
  const updateModule = useUpdateModule(tenantId);
  const archiveModule = useArchiveModule(tenantId);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const columns = useColumnVisibility(MODULE_COLUMNS.map((column) => column.id));

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

  function projectName(projectId: string | null) {
    if (!projectId) return "Independent module";
    return projectById.get(projectId) ?? "Unknown project";
  }

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
  }, [modulesQuery.data, search, status, projectById]);

  const hasActiveFilters = search !== "" || status !== "All";

  async function handleCreateModule(input: ModuleFormInput) {
    const module = await createModule.mutateAsync({
      title: input.title,
      description: input.description || undefined,
      projectId: input.projectId ?? undefined,
      status: input.status,
      tag: input.tag || undefined,
      assignedToUserId: input.assignedToUserId ?? undefined,
    });

    await Promise.all(
      input.collaboratorUserIds.map((userId) =>
        apiClient.POST("/api/v1/tenant/{tenantId}/modules/{moduleId}/collaborators", {
          params: { path: { tenantId, moduleId: module.id } },
          body: { userId, role: "Collaborator" },
        }),
      ),
    );
  }

  async function handleUpdateModule(input: ModuleFormInput) {
    if (!editingModule) return;
    await updateModule.mutateAsync({
      moduleId: editingModule.id,
      input: {
        title: input.title,
        description: input.description || undefined,
        status: input.status,
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
    <div className="flex flex-col gap-6">
      <PageHeading
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
        membersLoading={workspaceMembers.isPending}
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
        membersLoading={workspaceMembers.isPending}
        module={editingModule}
        onSave={(input) => void handleUpdateModule(input)}
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

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              {columns.isColumnVisible("module") ? <TableHead>Module</TableHead> : null}
              {columns.isColumnVisible("project") ? <TableHead>Project</TableHead> : null}
              {columns.isColumnVisible("status") ? <TableHead>Status</TableHead> : null}
              {columns.isColumnVisible("type") ? <TableHead>Type</TableHead> : null}
              {columns.isColumnVisible("assignee") ? <TableHead>Assigned To</TableHead> : null}
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
                        {module.displayId ? (
                          <span className="font-mono text-[11px] text-muted-foreground">{module.displayId}</span>
                        ) : null}
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
                      <StatusBadge status={module.status ?? "—"} />
                    </TableCell>
                  ) : null}
                  {columns.isColumnVisible("type") ? (
                    <TableCell className="text-sm text-muted-foreground">
                      {module.tag ?? "—"}
                    </TableCell>
                  ) : null}
                  {columns.isColumnVisible("assignee") ? (
                    <TableCell className="text-sm text-muted-foreground">
                      {module.assignedToUserId
                        ? (memberById.get(module.assignedToUserId) ?? "Unknown member")
                        : "Unassigned"}
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
                          aria-label={`Archive ${module.title}`}
                          onClick={() => void archive(module)}
                        >
                          <Archive />
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
