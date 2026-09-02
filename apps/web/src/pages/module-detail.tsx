import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Boxes, ChevronDown, ChevronUp, Pencil, Save, X } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import {
  useCurrentWorkspace,
  useMembers,
  useEnumValues,
  useMyModule,
  useMyModulePipelineStages,
  useNotes,
  useProject,
  useTasks,
  useUpdateMyModule,
  type ApiNote,
  type ApiModule,
  type ApiTask,
} from "@/api/hooks";
import { ModuleCollaboratorsManager } from "@/components/modules/module-collaborators";
import { EntityDetailPipeline } from "@/components/pipeline/entity-detail-pipeline";
import { BackButton } from "@/components/shared/back-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const MODULE_STATUSES = ["Active", "Review", "Stalled", "Complete"];

interface EditableModule {
  title: string;
  description: string;
  status: string;
  pipelineStage: string;
  tag: string;
  dueDate: string;
  assignedToUserId: string;
}

function editableValues(module: ApiModule): EditableModule {
  return {
    title: module.title,
    description: module.description ?? "",
    status: module.status ?? "Active",
    pipelineStage: module.pipelineStage ?? "",
    tag: module.tag ?? "",
    dueDate: module.dueDate ?? "",
    assignedToUserId: module.assignedToUserId ?? "",
  };
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-2.5 py-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}

function FormField({ label, htmlFor, children, className = "" }: { label: string; htmlFor: string; children: ReactNode; className?: string }) {
  return <div className={`grid gap-1.5 ${className}`}><label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>{children}</div>;
}

function ModuleTasksDetails({ tasks }: { tasks: ApiTask[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Tasks ({tasks.length})</CardTitle>
        <Button asChild variant="ghost" size="sm"><Link to="/tasks">View all</Link></Button>
      </CardHeader>
      <CardContent>{tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks are linked to this module.</p>
      ) : (
        <div className="grid gap-2">
          {tasks.map((task) => (
            <Link key={task.id} to={`/tasks/${task.id}`} className="rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
            </Link>
          ))}
        </div>
      )}</CardContent>
    </Card>
  );
}

function ModuleNotesDetails({ notes }: { notes: ApiNote[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Notes ({notes.length})</CardTitle>
        <Button asChild variant="ghost" size="sm"><Link to="/daily-notes">View all</Link></Button>
      </CardHeader>
      <CardContent>{notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes are linked to this module.</p>
      ) : (
        <div className="grid gap-2">
          {notes.map((note) => (
            <Link key={note.id} to={`/daily-notes/${note.id}`} className="rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="text-sm font-semibold">{note.title}</span>
              {note.content ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note.content}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}</CardContent>
    </Card>
  );
}

export default function ModuleDetailPage() {
  const { moduleId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";

  // Modules are tenant-agnostic — a module the caller collaborates on
  // (directly, or via its linked project) must still open here (see
  // MyModulesController on the backend).
  const moduleQuery = useMyModule(moduleId);
  const tasksQuery = useTasks(tenantId);
  const notesQuery = useNotes(tenantId);
  const membersQuery = useMembers(tenantId);
  const updateModule = useUpdateMyModule();
  const tagValuesQuery = useEnumValues("module_type");

  const module = moduleQuery.data;
  const sameTenant = Boolean(module && tenantId && module.tenantId === tenantId);
  const linkedProjectQuery = useProject(tenantId, module?.projectId ?? "", Boolean(module?.projectId));
  const stagesQuery = useMyModulePipelineStages(moduleId);
  const [form, setForm] = useState<EditableModule | null>(null);
  const [openedRequestedEdit, setOpenedRequestedEdit] = useState(false);
  const [isCollaboratorsVisible, setIsCollaboratorsVisible] = useState(false);

  useEffect(() => {
    if (!openedRequestedEdit && searchParams.get("edit") === "true" && module) {
      setForm(editableValues(module));
      setOpenedRequestedEdit(true);
    }
  }, [module, openedRequestedEdit, searchParams]);

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

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    await updateModule.mutateAsync({
      moduleId,
      input: {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        pipelineStage: form.pipelineStage,
        tag: form.tag || undefined,
        dueDate: form.dueDate || undefined,
        assignedToUserId: form.assignedToUserId || undefined,
      },
    });
    setForm(null);
  }

  function changePipelineStage(stage: string) {
    void updateModule.mutateAsync({
      moduleId,
      input: { pipelineStage: stage },
    });
  }

  const assignee = module.assignedToUserId
    ? (membersQuery.data ?? []).find((member) => member.userId === module.assignedToUserId)
    : undefined;
  const moduleTasks = (tasksQuery.data ?? []).filter((task) => task.moduleId === module.id);
  const moduleNotes = (notesQuery.data ?? []).filter((note) => note.moduleId === module.id);

  return (
    <div className="page-stack">
      <BackButton fallback="/modules" label="Back" />

      <PageHeading
        tone="violet"
        icon={Boxes}
        eyebrow={module.displayId ?? module.id}
        title={module.title}
        description={module.description || "Review and update the module's status, type and planning details."}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={module.status ?? "—"} />
            {form ? <Button type="button" variant="outline" onClick={() => setForm(null)}><X /> Cancel Editing</Button>
              : <Button type="button" onClick={() => setForm(editableValues(module))}><Pencil /> Edit Module</Button>}
          </div>
        }
      >
        {!form ? (
          <div className="flex flex-wrap gap-2">
            <HeaderStat label="Type" value={module.tag ?? "—"} />
            <HeaderStat label="Status" value={module.status ?? "—"} />
            <HeaderStat label="Pipeline stage" value={module.pipelineStage ?? "Unassigned"} />
            <HeaderStat label="Due" value={formatDate(module.dueDate)} />
            <HeaderStat label="Assigned to" value={assignee?.displayName ?? "Unassigned"} />
          </div>
        ) : null}
      </PageHeading>

      {form ? <Card>
        <CardHeader><CardTitle>Edit module details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(event) => void handleSave(event)} className="grid gap-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Module title" htmlFor="edit-module-title" className="sm:col-span-2"><Input id="edit-module-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required autoFocus /></FormField>
              <FormField label="Description" htmlFor="edit-module-description" className="sm:col-span-2"><Textarea id="edit-module-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} /></FormField>
              <FormField label="Linked project" htmlFor="edit-module-project"><Input id="edit-module-project" value={module.projectId ? (linkedProjectQuery.data?.title ?? "Loading…") : "Independent module"} readOnly className="bg-muted/30" /></FormField>
              <FormField label="Status" htmlFor="edit-module-status"><Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}><SelectTrigger id="edit-module-status"><SelectValue /></SelectTrigger><SelectContent>{MODULE_STATUSES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></FormField>
              <FormField label="Type" htmlFor="edit-module-type"><Select value={form.tag} onValueChange={(value) => setForm({ ...form, tag: value })}><SelectTrigger id="edit-module-type"><SelectValue placeholder="Select a type" /></SelectTrigger><SelectContent>{(tagValuesQuery.data ?? []).map((value) => <SelectItem key={value.id} value={value.value}>{value.value}</SelectItem>)}</SelectContent></Select></FormField>
              <FormField label="Pipeline stage" htmlFor="edit-module-stage"><Select value={form.pipelineStage} onValueChange={(value) => setForm({ ...form, pipelineStage: value })}><SelectTrigger id="edit-module-stage"><SelectValue placeholder="Select a stage" /></SelectTrigger><SelectContent>{(stagesQuery.data ?? []).map((value) => <SelectItem key={value.id} value={value.value}>{value.value}</SelectItem>)}</SelectContent></Select></FormField>
              <FormField label="Due date" htmlFor="edit-module-due"><DatePickerInput id="edit-module-due" label="Due date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} /></FormField>
              <FormField label="Assigned to" htmlFor="edit-module-assignee"><Select value={form.assignedToUserId || "__unassigned__"} onValueChange={(value) => setForm({ ...form, assignedToUserId: value === "__unassigned__" ? "" : value })}><SelectTrigger id="edit-module-assignee"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__unassigned__">Unassigned</SelectItem>{(membersQuery.data ?? []).map((member) => <SelectItem key={member.userId} value={member.userId}>{member.displayName}</SelectItem>)}</SelectContent></Select></FormField>
            </div>
            <div className="flex justify-end gap-3 border-t pt-5"><Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" disabled={updateModule.isPending}><Save /> Save Changes</Button></div>
          </form>
        </CardContent>
      </Card> : null}

      <div className="flex flex-col gap-6">
        <section aria-labelledby="module-collaborators-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="module-collaborators-heading" className="text-lg font-semibold">Collaborators</h2>
            <Button variant="outline" size="sm" aria-expanded={isCollaboratorsVisible} aria-controls="module-collaborators-content" onClick={() => setIsCollaboratorsVisible((visible) => !visible)}>
              {isCollaboratorsVisible ? <ChevronUp /> : <ChevronDown />}
              {isCollaboratorsVisible ? "Hide collaborators" : "Show collaborators"}
            </Button>
          </div>
          {isCollaboratorsVisible ? (
            <Card id="module-collaborators-content">
              <CardHeader>
                <CardTitle>Module collaborators</CardTitle>
              </CardHeader>
              <CardContent>
                {sameTenant ? (
                  <div className="grid gap-4">
                    {module.projectId ? (
                      <p className="text-sm text-muted-foreground">
                        Project collaborators already inherit access. You can also invite someone directly to this module by email.
                      </p>
                    ) : null}
                    <ModuleCollaboratorsManager
                      tenantId={tenantId}
                      moduleId={module.id}
                      moduleTitle={module.title}
                      members={membersQuery.data ?? []}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This module was shared with you from another workspace. Only members of that
                    workspace can manage who has access.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-3" aria-label="Linked work">
          <Card>
            <CardHeader><CardTitle>Linked project</CardTitle></CardHeader>
            <CardContent>
              {module.projectId ? (
                <Link to={`/projects/${module.projectId}`} className="block rounded-md border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project</span>
                  <span className="mt-1 block font-semibold text-primary">
                    {linkedProjectQuery.data?.title ?? (linkedProjectQuery.isError ? "Unknown project" : "Loading…")}
                  </span>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">This is an independent module.</p>
              )}
            </CardContent>
          </Card>
          <ModuleTasksDetails tasks={moduleTasks} />
          <ModuleNotesDetails notes={moduleNotes} />
        </section>

        <EntityDetailPipeline
          entityLabel="module"
          entity={{ ...module, secondaryStatus: module.tag }}
          stages={stagesQuery.data ?? []}
          isPending={stagesQuery.isPending}
          isError={stagesQuery.isError}
          isUpdating={updateModule.isPending}
          onStageChange={changePipelineStage}
        />
      </div>
    </div>
  );
}
