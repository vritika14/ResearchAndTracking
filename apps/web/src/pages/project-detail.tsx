import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, FolderKanban, Pencil, Save, Trash2, Users, X } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  useArchiveMyProject,
  useCurrentWorkspace,
  useMe,
  useMembers,
  useModules,
  useMyProject,
  useNotes,
  usePipelineStages,
  useProjectPipelineStages,
  useProjectCollaborators,
  useRemoveProjectCollaborator,
  useTasks,
  useUpdateMyProject,
  type ApiModule,
  type ApiNote,
  type ApiProject,
  type ApiTask,
  type Membership,
} from "@/api/hooks";
import { EmptyState } from "@/components/shared/empty-state";
import { InvitationPanel } from "@/components/sharing/invitation-panel";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROJECT_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
const PROJECT_STATUSES = ["Active", "Review", "Stalled", "Complete"] as const;

interface EditableProject {
  title: string;
  description: string;
  researchArea: string;
  status: string;
  importance: string;
  pipelineStage: string;
  scheduledFor: string;
  dueDate: string;
  totalBudget: string;
  targetJournals: string;
}

function editableValues(project: ApiProject): EditableProject {
  return {
    title: project.title,
    description: project.description ?? "",
    researchArea: project.researchArea ?? "",
    status: project.status ?? "Active",
    importance: project.importance ?? "Medium",
    pipelineStage: project.pipelineStage ?? "",
    scheduledFor: project.scheduledFor ?? "",
    dueDate: project.dueDate ?? "",
    totalBudget: project.totalBudget ?? "",
    targetJournals: project.targetJournals ?? "",
  };
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: string | null) {
  if (!value) return "—";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
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

function FormField({ label, htmlFor, required, children, className = "" }: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function ProjectModulesDetails({ modules }: { modules: ApiModule[] }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Modules ({modules.length})
        </span>
        <Button asChild variant="ghost" size="sm">
          <Link to="/modules">Manage modules</Link>
        </Button>
      </div>
      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No modules are linked to this project.</p>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {modules.map((module) => (
            <div key={module.id} className="rounded-md border border-border bg-card p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  {module.displayId ? (
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      {module.displayId}
                    </span>
                  ) : null}
                  <span className="block text-sm font-semibold">{module.title}</span>
                </div>
                <StatusBadge status={module.status ?? "—"} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectTasksDetails({ tasks }: { tasks: ApiTask[] }) {
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
        <p className="text-sm text-muted-foreground">No tasks are linked to this project.</p>
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

function ProjectNotesDetails({ notes }: { notes: ApiNote[] }) {
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
        <p className="text-sm text-muted-foreground">No notes are linked to this project.</p>
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

function ProjectCollaborators({
  tenantId,
  projectId,
  ownerUserId,
  members,
  entityTitle,
  canManage,
}: {
  tenantId: string;
  projectId: string;
  ownerUserId: string | undefined;
  members: Membership[];
  entityTitle: string;
  canManage: boolean;
}) {
  const collaboratorsQuery = useProjectCollaborators(tenantId, projectId);
  const removeCollaborator = useRemoveProjectCollaborator(tenantId, projectId);

  const memberByUserId = useMemo(() => {
    const map = new Map<string, Membership>();
    for (const member of members) map.set(member.userId, member);
    return map;
  }, [members]);

  if (collaboratorsQuery.isPending) {
    return <LoadingState title="Loading collaborators" className="min-h-32" />;
  }

  const collaborators = collaboratorsQuery.data ?? [];
  const ownerIsReturned = collaborators.some(
    (collaborator) => collaborator.userId === ownerUserId,
  );
  const hasAdditionalCollaborators = collaborators.some(
    (collaborator) => collaborator.userId !== ownerUserId,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {!ownerIsReturned && ownerUserId && memberByUserId.has(ownerUserId) ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {memberByUserId.get(ownerUserId)!.displayName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {memberByUserId.get(ownerUserId)!.email}
              </span>
            </span>
            <Badge variant="outline">Owner</Badge>
          </div>
        ) : null}
        {collaborators.map((collaborator) => {
          const member = memberByUserId.get(collaborator.userId);
          const displayName =
            collaborator.displayName ?? member?.displayName ?? "Unknown collaborator";
          const collaboratorEmail = collaborator.email ?? member?.email;
          return (
            <div
              key={collaborator.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {displayName}
                </span>
                {collaboratorEmail ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {collaboratorEmail}
                  </span>
                ) : null}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{collaborator.role ?? "Collaborator"}</Badge>
                {canManage && collaborator.userId !== ownerUserId ? (
                  <button
                    type="button"
                    aria-label={`Remove ${displayName}`}
                    onClick={() => removeCollaborator.mutate(collaborator.userId)}
                    className="rounded-full p-1 text-muted-foreground hover:text-destructive focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        {!hasAdditionalCollaborators ? (
          <p className="text-sm text-muted-foreground">No additional collaborators yet.</p>
        ) : null}
      </div>

      {canManage ? (
        <InvitationPanel
          target="project"
          tenantId={tenantId}
          entityId={projectId}
          entityTitle={entityTitle}
          excludedUserIds={[
            ...(ownerUserId ? [ownerUserId] : []),
            ...collaborators.map((collaborator) => collaborator.userId),
          ]}
        />
      ) : (
        <p className="border-t pt-4 text-sm text-muted-foreground">
          Only the project owner can invite or remove collaborators.
        </p>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";

  // Projects are tenant-agnostic — a project shared with the caller from
  // another workspace must still open here (see MyProjectsController on the
  // backend).
  const projectQuery = useMyProject(projectId);
  const modulesQuery = useModules(tenantId, projectId);
  const tasksQuery = useTasks(tenantId, projectId);
  const notesQuery = useNotes(tenantId, projectId);
  const membersQuery = useMembers(tenantId);
  const me = useMe();
  const updateProject = useUpdateMyProject();
  const archiveProject = useArchiveMyProject();

  const project = projectQuery.data;
  const sameTenant = Boolean(project && tenantId && project.tenantId === tenantId);
  const scopedPipelineStagesQuery = useProjectPipelineStages(
    project?.tenantId ?? tenantId,
    projectId,
    sameTenant,
  );
  const globalPipelineStagesQuery = usePipelineStages(tenantId, !sameTenant);
  const pipelineStagesQuery = sameTenant
    ? scopedPipelineStagesQuery
    : globalPipelineStagesQuery;
  const [isEditing, setIsEditing] = useState(() => searchParams.get("edit") === "true");
  const [form, setForm] = useState<EditableProject | null>(null);

  useEffect(() => {
    if (project && isEditing && form === null) {
      setForm(editableValues(project));
    }
  }, [project, isEditing, form]);

  if (workspace.isPending || projectQuery.isPending) {
    return <LoadingState title="Loading project" className="min-h-[50vh]" />;
  }

  if (projectQuery.isError) {
    return (
      <ErrorState
        title="Project could not be loaded"
        description={projectQuery.error.message}
        onRetry={() => void projectQuery.refetch()}
      />
    );
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="This project doesn't exist, or you don't have access to it."
        action={
          <Button asChild variant="outline">
            <Link to="/projects">Back to Projects</Link>
          </Button>
        }
      />
    );
  }

  const projectPath = `/projects/${project.id}`;
  const editOrigin = searchParams.get("from");

  function beginEditing() {
    setForm(editableValues(project!));
    setIsEditing(true);
  }

  function cancelEditing() {
    setForm(null);
    setIsEditing(false);
    if (searchParams.get("edit") === "true") {
      navigate(editOrigin === "pipeline" ? "/pipeline" : projectPath, { replace: true });
    }
  }

  async function handleDeleteProject() {
    if (
      !window.confirm(
        `Delete "${project!.title}"? It will be archived and permanently removed after 14 days.`,
      )
    ) {
      return;
    }
    await archiveProject.mutateAsync(project!.id);
    navigate("/projects");
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    await updateProject.mutateAsync({
      projectId,
      input: {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        researchArea: form.researchArea.trim() || undefined,
        status: form.status,
        importance: form.importance,
        pipelineStage: form.pipelineStage || undefined,
        scheduledFor: form.scheduledFor || undefined,
        dueDate: form.dueDate || undefined,
        totalBudget: form.totalBudget || undefined,
        targetJournals: form.targetJournals.trim() || undefined,
      },
    });
    setForm(null);
    setIsEditing(false);
    if (searchParams.get("edit") === "true") {
      navigate(projectPath, { replace: true });
    }
  }

  const myRole = project.userId === me.data?.id ? "Owner" : project.role ?? "—";
  const taskCounts = {
    completed: (tasksQuery.data ?? []).filter((task) => task.status === "Complete").length,
    total: (tasksQuery.data ?? []).length,
  };

  return (
    <div className="page-stack">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/projects">
          <ArrowLeft />
          Back to Projects
        </Link>
      </Button>

      <PageHeading
        tone="blue"
        icon={FolderKanban}
        eyebrow={project.displayId ?? project.id}
        title={project.title}
        description="Review and update the project’s core details, planning information and progress."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={project.status ?? "—"} />
            {form ? (
              <Button type="button" variant="outline" onClick={cancelEditing}>
                <X />
                Cancel Editing
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleDeleteProject()}
                  disabled={archiveProject.isPending}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 />
                  Delete Project
                </Button>
                <Button type="button" onClick={beginEditing}>
                  <Pencil />
                  Edit Project
                </Button>
              </>
            )}
          </div>
        }
      />

      {form ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit project details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void saveProject(event)} className="grid gap-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <FormField label="Project title" htmlFor="edit-project-title" required className="sm:col-span-2 lg:col-span-3">
                  <Input
                    id="edit-project-title"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    required
                    autoFocus
                  />
                </FormField>

                <FormField label="Description" htmlFor="edit-project-description" className="sm:col-span-2 lg:col-span-3">
                  <Textarea
                    id="edit-project-description"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    rows={3}
                  />
                </FormField>

                <FormField label="Research area" htmlFor="edit-project-research-area">
                  <Input
                    id="edit-project-research-area"
                    value={form.researchArea}
                    onChange={(event) => setForm({ ...form, researchArea: event.target.value })}
                  />
                </FormField>

                <FormField label="Importance" htmlFor="edit-project-priority">
                  <Select
                    value={form.importance}
                    onValueChange={(value) => setForm({ ...form, importance: value })}
                  >
                    <SelectTrigger id="edit-project-priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_PRIORITIES.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Status" htmlFor="edit-project-status">
                  <Select
                    value={form.status}
                    onValueChange={(value) => setForm({ ...form, status: value })}
                  >
                    <SelectTrigger id="edit-project-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Pipeline stage" htmlFor="edit-project-stage">
                  <Select
                    value={form.pipelineStage}
                    onValueChange={(value) => setForm({ ...form, pipelineStage: value })}
                  >
                    <SelectTrigger id="edit-project-stage"><SelectValue placeholder="Select a stage" /></SelectTrigger>
                    <SelectContent>
                      {(pipelineStagesQuery.data ?? []).map((stage) => (
                        <SelectItem key={stage.id} value={stage.value}>{stage.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Scheduled for" htmlFor="edit-project-scheduled-for">
                  <DatePickerInput
                    id="edit-project-scheduled-for"
                    label="Scheduled for date"
                    value={form.scheduledFor}
                    onChange={(value) => setForm({ ...form, scheduledFor: value })}
                  />
                </FormField>

                <FormField label="Due date" htmlFor="edit-project-due-date">
                  <DatePickerInput
                    id="edit-project-due-date"
                    label="Due date"
                    value={form.dueDate}
                    onChange={(value) => setForm({ ...form, dueDate: value })}
                  />
                </FormField>

                <FormField label="Total budget" htmlFor="edit-project-budget-total">
                  <Input
                    id="edit-project-budget-total"
                    type="number"
                    min="0"
                    step="100"
                    value={form.totalBudget}
                    onChange={(event) => setForm({ ...form, totalBudget: event.target.value })}
                  />
                </FormField>

                <FormField label="Target journal(s) or output" htmlFor="edit-project-journal" className="sm:col-span-2 lg:col-span-3">
                  <Input
                    id="edit-project-journal"
                    value={form.targetJournals}
                    onChange={(event) => setForm({ ...form, targetJournals: event.target.value })}
                  />
                </FormField>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={cancelEditing}>Cancel</Button>
                <Button type="submit" disabled={updateProject.isPending}>
                  <Save />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Project overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 text-sm sm:grid-cols-2">
              <DetailItem label="Research area">{project.researchArea ?? "—"}</DetailItem>
              <DetailItem label="My role">{myRole}</DetailItem>
              <DetailItem label="Importance">{project.importance ?? "—"}</DetailItem>
              <DetailItem label="Pipeline stage">{project.pipelineStage ?? "Unknown stage"}</DetailItem>
              <DetailItem label="Scheduled for">{formatDate(project.scheduledFor)}</DetailItem>
              <DetailItem label="Due date">{formatDate(project.dueDate)}</DetailItem>
              <DetailItem label="Target journal or output" className="sm:col-span-2">
                {project.targetJournals ?? "—"}
              </DetailItem>
              {project.description ? (
                <DetailItem label="Description" className="sm:col-span-2">
                  <span className="font-normal text-muted-foreground">{project.description}</span>
                </DetailItem>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress and resources</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <DetailItem label="Tasks">{taskCounts.completed}/{taskCounts.total} complete</DetailItem>
              <DetailItem label="Notes">{(notesQuery.data ?? []).length}</DetailItem>
              <DetailItem label="Modules">{(modulesQuery.data ?? []).length}</DetailItem>
              <DetailItem label="Total budget">{formatCurrency(project.totalBudget)}</DetailItem>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Linked work</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <ProjectModulesDetails modules={modulesQuery.data ?? []} />
              <ProjectTasksDetails tasks={tasksQuery.data ?? []} />
              <ProjectNotesDetails notes={notesQuery.data ?? []} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Project collaborators</CardTitle>
            </CardHeader>
            <CardContent>
              {!tenantId ? (
                <EmptyState
                  icon={Users}
                  title="No workspace selected"
                  description="Select a workspace to manage collaborators."
                  className="min-h-40 border-0 bg-muted/30"
                />
              ) : sameTenant ? (
                <ProjectCollaborators
                  tenantId={tenantId}
                  projectId={project.id}
                  ownerUserId={project.userId}
                  members={membersQuery.data ?? []}
                  entityTitle={project.title}
                  canManage={me.data?.id === project.userId}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  This project was shared with you from another workspace. Only members of
                  that workspace can manage collaborators.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
