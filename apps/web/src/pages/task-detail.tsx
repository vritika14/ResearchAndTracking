import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown, ChevronUp, ListTodo, Pencil, Save, X } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import {
  useCurrentWorkspace,
  useModules,
  useMyTask,
  useProject,
  useProjects,
  useUpdateMyTask,
  type ApiTask,
} from "@/api/hooks";
import type { TaskFormInput } from "@/components/tasks/task-dialog";
import { TaskMembersManager } from "@/components/tasks/task-members";
import { BackButton } from "@/components/shared/back-button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resolveLinkTargetType, type LinkTargetType } from "@/lib/link-target";

const TASK_STATUSES = ["To do", "Underway", "Waiting", "Complete"];
const TASK_PRIORITIES = ["Low", "Medium", "High", "Critical"];
const VISIBILITY_OPTIONS = ["Private", "Shared"];
const LINK_TARGETS: Array<{ value: LinkTargetType; label: string }> = [
  { value: "project", label: "Project" },
  { value: "module", label: "Module" },
  { value: "none", label: "General" },
];

function statusPillClass(status: string | null) {
  switch (status) {
    case "To do":
      return "border-border text-muted-foreground";
    case "Underway":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Complete":
      return "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400";
    case "Waiting":
      return "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
    default:
      return "border-border text-muted-foreground";
  }
}

function priorityPillClass(priority: string | null) {
  switch (priority) {
    case "Low":
      return "border-border text-muted-foreground";
    case "Medium":
      return "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
    case "High":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Critical":
      return "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400";
    default:
      return "border-border text-muted-foreground";
  }
}

function formatDueDate(iso: string | null) {
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

function formValues(task: ApiTask): TaskFormInput {
  return {
    title: task.title,
    description: task.description ?? "",
    linkTarget: resolveLinkTargetType(task),
    projectId: task.projectId ?? "",
    moduleId: task.moduleId ?? "",
    status: task.status ?? "To do",
    priority: task.priority ?? "Medium",
    dueDate: task.dueDate ?? "",
    estimatedHours: task.estimatedHours ?? "",
    visibility: task.visibility ?? "Private",
    workingWith: task.workingWith ?? "",
    collaboratorUserIds: [],
  };
}

function FormField({ label, htmlFor, children, className = "" }: { label: string; htmlFor: string; children: ReactNode; className?: string }) {
  return <div className={`grid gap-1.5 ${className}`}><label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>{children}</div>;
}

export default function TaskDetailPage() {
  const { taskId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";

  const taskQuery = useMyTask(taskId);
  const projectsQuery = useProjects(tenantId);
  const modulesQuery = useModules(tenantId);
  const updateTask = useUpdateMyTask();

  const task = taskQuery.data;
  const linkedProjectQuery = useProject(tenantId, task?.projectId ?? "", Boolean(task?.projectId));
  const sameTenant = Boolean(task && tenantId && task.tenantId === tenantId);
  const [form, setForm] = useState<TaskFormInput | null>(null);
  const [openedRequestedEdit, setOpenedRequestedEdit] = useState(false);
  const [isOverviewVisible, setIsOverviewVisible] = useState(true);

  useEffect(() => {
    if (!openedRequestedEdit && searchParams.get("edit") === "true" && task) {
      setForm(formValues(task));
      setOpenedRequestedEdit(true);
    }
  }, [openedRequestedEdit, searchParams, task]);

  if (workspace.isPending || taskQuery.isPending) {
    return <LoadingState title="Loading task" className="min-h-[50vh]" />;
  }

  if (taskQuery.isError) {
    return (
      <ErrorState
        title="Task could not be loaded"
        description={taskQuery.error.message}
        onRetry={() => void taskQuery.refetch()}
      />
    );
  }

  if (!task) {
    return (
      <EmptyState
        title="Task not found"
        description="This task doesn't exist, or you don't have access to it."
        action={
          <Button asChild variant="outline">
            <Link to="/tasks">Back to Tasks</Link>
          </Button>
        }
      />
    );
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    await updateTask.mutateAsync({
      taskId,
      input: {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority,
        visibility: form.visibility,
        workingWith: form.workingWith.trim() || undefined,
        estimatedHours: form.estimatedHours || undefined,
        dueDate: form.dueDate || undefined,
        projectId: form.linkTarget === "project" ? form.projectId : undefined,
        moduleId: form.linkTarget === "module" ? form.moduleId : "",
      },
    });
    setForm(null);
  }

  const linkedModule = task.moduleId
    ? (modulesQuery.data ?? []).find((module) => module.id === task.moduleId)
    : undefined;

  return (
    <div className="page-stack">
      <BackButton fallback="/tasks" label="Back" />

      <PageHeading
        tone="amber"
        icon={ListTodo}
        eyebrow={task.displayId ?? task.id}
        title={task.title}
        description="Review and update the task's status, priority and progress."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className={statusPillClass(task.status)}>
              {task.status ?? "—"}
            </Badge>
            <Badge variant="outline" className={priorityPillClass(task.priority)}>
              {task.priority ?? "—"}
            </Badge>
            {form ? <Button type="button" variant="outline" onClick={() => setForm(null)}><X /> Cancel Editing</Button>
              : <Button type="button" onClick={() => setForm(formValues(task))}><Pencil /> Edit Task</Button>}
          </div>
        }
      />

      {form ? (
        <Card>
          <CardHeader><CardTitle>Edit task details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(event) => void handleSave(event)} className="grid gap-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Task title" htmlFor="edit-task-title" className="sm:col-span-2">
                  <Input id="edit-task-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required autoFocus />
                </FormField>
                <FormField label="Description" htmlFor="edit-task-description" className="sm:col-span-2">
                  <Textarea id="edit-task-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} />
                </FormField>
                <FormField label="Link to" htmlFor="edit-task-link" className="sm:col-span-2">
                  <div id="edit-task-link" className="flex flex-wrap gap-2">{LINK_TARGETS.map((option) => <button key={option.value} type="button" aria-pressed={form.linkTarget === option.value}
                    onClick={() => setForm({ ...form, linkTarget: option.value, projectId: option.value === "project" ? form.projectId : "", moduleId: option.value === "module" ? form.moduleId : "" })}
                    className={form.linkTarget === option.value ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground" : "rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"}>{option.label}</button>)}</div>
                </FormField>
                {form.linkTarget === "project" ? <FormField label="Project" htmlFor="edit-task-project"><Select value={form.projectId} onValueChange={(value) => setForm({ ...form, projectId: value })}><SelectTrigger id="edit-task-project"><SelectValue placeholder="Select a project" /></SelectTrigger><SelectContent>{(projectsQuery.data ?? []).map((project) => <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>)}</SelectContent></Select></FormField> : null}
                {form.linkTarget === "module" ? <FormField label="Module" htmlFor="edit-task-module"><Select value={form.moduleId} onValueChange={(value) => setForm({ ...form, moduleId: value })}><SelectTrigger id="edit-task-module"><SelectValue placeholder="Select a module" /></SelectTrigger><SelectContent>{(modulesQuery.data ?? []).map((module) => <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>)}</SelectContent></Select></FormField> : null}
                <FormField label="Status" htmlFor="edit-task-status"><Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}><SelectTrigger id="edit-task-status"><SelectValue /></SelectTrigger><SelectContent>{TASK_STATUSES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></FormField>
                <FormField label="Priority" htmlFor="edit-task-priority"><Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}><SelectTrigger id="edit-task-priority"><SelectValue /></SelectTrigger><SelectContent>{TASK_PRIORITIES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></FormField>
                <FormField label="Due date" htmlFor="edit-task-due"><DatePickerInput id="edit-task-due" label="Due date" value={form.dueDate} onChange={(value) => setForm({ ...form, dueDate: value })} /></FormField>
                <FormField label="Estimated hours" htmlFor="edit-task-hours"><Input id="edit-task-hours" type="number" min="0" step="0.5" value={form.estimatedHours} onChange={(event) => setForm({ ...form, estimatedHours: event.target.value })} /></FormField>
                <FormField label="Visibility" htmlFor="edit-task-visibility"><Select value={form.visibility} onValueChange={(value) => setForm({ ...form, visibility: value })}><SelectTrigger id="edit-task-visibility"><SelectValue /></SelectTrigger><SelectContent>{VISIBILITY_OPTIONS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></FormField>
                {form.visibility === "Shared" ? <FormField label="Working with" htmlFor="edit-task-working"><Input id="edit-task-working" value={form.workingWith} onChange={(event) => setForm({ ...form, workingWith: event.target.value })} /></FormField> : null}
              </div>
              <div className="flex justify-end gap-3 border-t pt-5"><Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button type="submit" disabled={updateTask.isPending}><Save /> Save Changes</Button></div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-6">
        <section aria-labelledby="task-overview-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="task-overview-heading" className="text-lg font-semibold">Overview</h2>
            <Button variant="outline" size="sm" aria-expanded={isOverviewVisible} aria-controls="task-overview-content" onClick={() => setIsOverviewVisible((visible) => !visible)}>
              {isOverviewVisible ? <ChevronUp /> : <ChevronDown />}
              {isOverviewVisible ? "Hide overview" : "Show overview"}
            </Button>
          </div>
          {isOverviewVisible ? <div id="task-overview-content" className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Task overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm sm:grid-cols-2">
            <DetailItem label="Estimated hours">
              {task.estimatedHours ? `${task.estimatedHours}h` : "—"}
            </DetailItem>
            <DetailItem label="Due date">{formatDueDate(task.dueDate)}</DetailItem>
            <DetailItem label="Visibility">{task.visibility ?? "Private"}</DetailItem>
            {task.workingWith ? (
              <DetailItem label="Working with">{task.workingWith}</DetailItem>
            ) : null}
            <DetailItem label="Description" className="sm:col-span-2">
              <span className="font-normal text-muted-foreground">
                {task.description || "No description provided."}
              </span>
            </DetailItem>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task members</CardTitle>
          </CardHeader>
          <CardContent>
            {task.visibility === "Shared" && sameTenant ? (
              <TaskMembersManager
                tenantId={tenantId}
                taskId={task.id}
              />
            ) : task.visibility === "Shared" ? (
              <p className="text-sm text-muted-foreground">
                This task was shared with you from another workspace. Only members of that
                workspace can manage who has access.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                This task is private — only you can see it. Switch its visibility to Shared to
                add members.
              </p>
            )}
          </CardContent>
        </Card>
          </div> : null}
        </section>

        <Card>
          <CardHeader><CardTitle>Linked work</CardTitle></CardHeader>
          <CardContent>
            {task.projectId ? (
              <Link to={`/projects/${task.projectId}`} className="block rounded-md border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project</span>
                <span className="mt-1 block font-semibold text-primary">
                  {linkedProjectQuery.data?.title ?? (linkedProjectQuery.isError ? "Unknown project" : "Loading…")}
                </span>
              </Link>
            ) : task.moduleId ? (
              <Link to={`/modules/${task.moduleId}`} className="block rounded-md border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Module</span>
                <span className="mt-1 block font-semibold text-primary">{linkedModule?.title ?? "Loading…"}</span>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">This is a general task with no linked project or module.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
