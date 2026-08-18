import { useState, type ReactNode } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { EditTaskDialog, type EditTaskInput } from "@/components/tasks/edit-task-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projects } from "@/data/projects";
import { tasks, type TaskItem, type TaskPriority, type TaskStatus } from "@/data/tasks";

function statusPillClass(status: TaskStatus) {
  switch (status) {
    case "To do":
      return "border-border text-muted-foreground";
    case "Underway":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Complete":
      return "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400";
    case "Waiting":
      return "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
  }
}

function priorityPillClass(priority: TaskPriority) {
  switch (priority) {
    case "Low":
      return "border-border text-muted-foreground";
    case "Medium":
      return "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400";
    case "High":
      return "border-orange-300 text-orange-700 dark:border-orange-800 dark:text-orange-400";
    case "Critical":
      return "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400";
  }
}

function formatDueDate(iso: string) {
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
  const { taskCode } = useParams();
  const sourceTask = tasks.find((item) => item.code === taskCode);
  const [task, setTask] = useState<TaskItem | undefined>(sourceTask);
  const [isEditing, setIsEditing] = useState(false);

  if (!task) {
    return (
      <EmptyState
        title="Task not found"
        description="The requested task is not part of the current local shell."
        action={
          <Button asChild variant="outline">
            <Link to="/tasks">Back to Tasks</Link>
          </Button>
        }
      />
    );
  }

  function updateTask(input: EditTaskInput) {
    const projectName = input.isIndependent
      ? "Independent task"
      : projects.find((project) => project.id === input.projectId)?.title;
    if (!projectName) return;
    const { projectId: _projectId, isIndependent: _isIndependent, ...values } = input;
    void _projectId;
    void _isIndependent;

    setTask((current) => (current ? { ...current, ...values, projectName } : current));
    setIsEditing(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/tasks">
          <ArrowLeft />
          Back to Tasks
        </Link>
      </Button>

      <PageHeading
        eyebrow={task.code}
        title={task.title}
        description="Review and update the task's status, schedule and progress."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className={statusPillClass(task.status)}>
              {task.status}
            </Badge>
            <Badge variant="outline" className={priorityPillClass(task.priority)}>
              {task.priority}
            </Badge>
            <Button type="button" onClick={() => setIsEditing(true)}>
              <Pencil />
              Edit Task
            </Button>
          </div>
        }
      />

      {isEditing ? (
        <EditTaskDialog
          key={task.code}
          open
          task={task}
          projects={projects}
          onOpenChange={setIsEditing}
          onSave={updateTask}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Task overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm sm:grid-cols-2">
            <DetailItem label="Project">{task.projectName}</DetailItem>
            <DetailItem label="Estimated hours">{task.estimatedHours}h</DetailItem>
            <DetailItem label="Scheduled for">{formatDueDate(task.scheduledFor)}</DetailItem>
            <DetailItem label="Due date">{formatDueDate(task.dueDate)}</DetailItem>
            {task.waitingOn ? (
              <DetailItem label="Waiting on">{task.waitingOn}</DetailItem>
            ) : null}
            <DetailItem label="Description" className="sm:col-span-2">
              <span className="font-normal text-muted-foreground">
                {task.description || "No description provided."}
              </span>
            </DetailItem>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Task edits are stored locally in this interface until the tasks API is connected.
      </p>
    </div>
  );
}
