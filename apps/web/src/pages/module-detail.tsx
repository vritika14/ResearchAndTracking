import { useState, type ReactNode } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import {
  useCurrentWorkspace,
  useMembers,
  useMyModule,
  useNotes,
  useProject,
  useProjects,
  useTasks,
  useUpdateMyModule,
  type ApiNote,
  type ApiTask,
} from "@/api/hooks";
import { ModuleCollaboratorsManager } from "@/components/modules/module-collaborators";
import { ModuleDialog, type ModuleFormInput } from "@/components/modules/module-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function DetailItem({ label, children, className = "" }: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 font-medium">{children}</div>
    </div>
  );
}

function ModuleTasksDetails({ tasks }: { tasks: ApiTask[] }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tasks ({tasks.length})
        </span>
        <Button asChild variant="ghost" size="sm">
          <Link to="/tasks">Manage tasks</Link>
        </Button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks are linked to this module.</p>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-md border border-border bg-card p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  {task.displayId ? (
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      {task.displayId}
                    </span>
                  ) : null}
                  <span className="block text-sm font-semibold">{task.title}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <StatusBadge status={task.status ?? "—"} />
                  <StatusBadge status={task.priority ?? "—"} />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Due {formatDate(task.dueDate)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleNotesDetails({ notes }: { notes: ApiNote[] }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Notes ({notes.length})
        </span>
        <Button asChild variant="ghost" size="sm">
          <Link to="/daily-notes">Manage notes</Link>
        </Button>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes are linked to this module.</p>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {notes.map((note) => (
            <div key={note.id} className="rounded-md border border-border bg-card p-3">
              <span className="text-sm font-semibold">{note.title}</span>
              {note.content ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note.content}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ModuleDetailPage() {
  const { moduleId = "" } = useParams();
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";

  // Modules are tenant-agnostic — a module the caller collaborates on
  // (directly, or via its linked project) must still open here (see
  // MyModulesController on the backend).
  const moduleQuery = useMyModule(moduleId);
  const projectsQuery = useProjects(tenantId);
  const tasksQuery = useTasks(tenantId);
  const notesQuery = useNotes(tenantId);
  const membersQuery = useMembers(tenantId);
  const updateModule = useUpdateMyModule();

  const module = moduleQuery.data;
  const sameTenant = Boolean(module && tenantId && module.tenantId === tenantId);
  const linkedProjectQuery = useProject(tenantId, module?.projectId ?? "", Boolean(module?.projectId));
  const [isEditing, setIsEditing] = useState(false);

  if (workspace.isPending || moduleQuery.isPending) {
    return <LoadingState title="Loading module" className="min-h-[50vh]" />;
  }

  if (moduleQuery.isError) {
    return (
      <ErrorState
        title="Module could not be loaded"
        description={moduleQuery.error.message}
        onRetry={() => void moduleQuery.refetch()}
      />
    );
  }

  if (!module) {
    return (
      <EmptyState
        title="Module not found"
        description="This module doesn't exist, or you don't have access to it."
        action={
          <Button asChild variant="outline">
            <Link to="/modules">Back to Modules</Link>
          </Button>
        }
      />
    );
  }

  async function handleSave(input: ModuleFormInput) {
    await updateModule.mutateAsync({
      moduleId,
      input: {
        title: input.title,
        description: input.description || undefined,
        status: input.status,
        tag: input.tag || undefined,
        assignedToUserId: input.assignedToUserId ?? undefined,
      },
    });
    setIsEditing(false);
  }

  const assignee = module.assignedToUserId
    ? (membersQuery.data ?? []).find((member) => member.userId === module.assignedToUserId)
    : undefined;
  const moduleTasks = (tasksQuery.data ?? []).filter((task) => task.moduleId === module.id);
  const moduleNotes = (notesQuery.data ?? []).filter((note) => note.moduleId === module.id);

  return (
    <div className="flex flex-col gap-8">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/modules">
          <ArrowLeft />
          Back to Modules
        </Link>
      </Button>

      <PageHeading
        eyebrow={module.displayId ?? module.id}
        title={module.title}
        description="Review and update the module's status, type and planning details."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={module.status ?? "—"} />
            <Button type="button" onClick={() => setIsEditing(true)}>
              <Pencil />
              Edit Module
            </Button>
          </div>
        }
      />

      <ModuleDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        tenantId={tenantId}
        projects={projectsQuery.data ?? []}
        members={membersQuery.data ?? []}
        module={module}
        onSave={(input) => void handleSave(input)}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Module overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm sm:grid-cols-2">
            <DetailItem label="Linked project">
              {module.projectId
                ? (linkedProjectQuery.data?.title ??
                    (linkedProjectQuery.isError ? "Unknown project" : "Loading…"))
                : "Independent module"}
            </DetailItem>
            <DetailItem label="Type">{module.tag ?? "—"}</DetailItem>
            <DetailItem label="Status">{module.status ?? "—"}</DetailItem>
            <DetailItem label="Assigned to">{assignee?.displayName ?? "Unassigned"}</DetailItem>
            <DetailItem label="Description" className="sm:col-span-2">
              <span className="font-normal text-muted-foreground">
                {module.description || "No description provided."}
              </span>
            </DetailItem>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Linked work</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <ModuleTasksDetails tasks={moduleTasks} />
            <ModuleNotesDetails notes={moduleNotes} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Module collaborators</CardTitle>
          </CardHeader>
          <CardContent>
            {module.projectId ? (
              <p className="text-sm text-muted-foreground">
                This module is visible to anyone who can see its linked project. Manage
                collaborators from the project page instead.
              </p>
            ) : sameTenant ? (
              <ModuleCollaboratorsManager
                tenantId={tenantId}
                moduleId={module.id}
                members={membersQuery.data ?? []}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                This module was shared with you from another workspace. Only members of that
                workspace can manage who has access.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
