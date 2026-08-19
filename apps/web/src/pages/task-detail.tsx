import { useState, type ReactNode } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import {
  useCurrentWorkspace,
  useMembers,
  useModules,
  useProject,
  useProjects,
  useTask,
  useUpdateTask,
} from "@/api/hooks";
import { TaskDialog, type TaskFormInput } from "@/components/tasks/task-dialog";
import { TaskMembersManager } from "@/components/tasks/task-members";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function TaskDetailPage() {
  const { taskId = "" } = useParams();
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";

  const taskQuery = useTask(tenantId, taskId);
  const projectsQuery = useProjects(tenantId);
  const modulesQuery = useModules(tenantId);
  const membersQuery = useMembers(tenantId);
  const updateTask = useUpdateTask(tenantId);

  const task = taskQuery.data;
  const linkedProjectQuery = useProject(tenantId, task?.projectId ?? "", Boolean(task?.projectId));
  const [isEditing, setIsEditing] = useState(false);

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

  async function handleSave(input: TaskFormInput) {
    await updateTask.mutateAsync({
      taskId,
      input: {
        title: input.title,
        description: input.description || undefined,
        status: input.status,
        priority: input.priority,
        visibility: input.visibility,
        workingWith: input.workingWith || undefined,
        estimatedHours: input.estimatedHours || undefined,
        dueDate: input.dueDate || undefined,
        projectId: input.linkTarget === "project" ? input.projectId : undefined,
        moduleId: input.linkTarget === "module" ? input.moduleId : "",
      },
    });
    setIsEditing(false);
  }

  const linkedModule = task.moduleId
    ? (modulesQuery.data ?? []).find((module) => module.id === task.moduleId)
    : undefined;

  return (
    <div className="flex flex-col gap-8">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/tasks">
          <ArrowLeft />
          Back to Tasks
        </Link>
      </Button>

      <PageHeading
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
            <Button type="button" onClick={() => setIsEditing(true)}>
              <Pencil />
              Edit Task
            </Button>
          </div>
        }
      />

      <TaskDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        tenantId={tenantId}
        projects={projectsQuery.data ?? []}
        modules={modulesQuery.data ?? []}
        members={membersQuery.data ?? []}
        membersLoading={membersQuery.isPending}
        task={task}
        onSave={(input) => void handleSave(input)}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Task overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm sm:grid-cols-2">
            <DetailItem label="Linked to">
              {task.projectId ? (
                <Link to={`/projects/${task.projectId}`} className="text-primary hover:underline">
                  {linkedProjectQuery.data?.title ?? "Loading…"}
                </Link>
              ) : task.moduleId ? (
                <Link to={`/modules/${task.moduleId}`} className="text-primary hover:underline">
                  {linkedModule?.title ?? "Loading…"}
                </Link>
              ) : (
                <span>General</span>
              )}
            </DetailItem>
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Task members</CardTitle>
          </CardHeader>
          <CardContent>
            {task.visibility === "Shared" && tenantId ? (
              <TaskMembersManager
                tenantId={tenantId}
                taskId={task.id}
                members={membersQuery.data ?? []}
                membersLoading={membersQuery.isPending}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                This task is private — only you can see it. Switch its visibility to Shared to
                add members.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
