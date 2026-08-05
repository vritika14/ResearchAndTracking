import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Pencil, Save, Users, X } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PIPELINE_STAGES } from "@/data/pipeline-projects";
import {
  projects,
  type Project,
  type ProjectPriority,
  type ProjectRole,
  type ProjectStatus,
} from "@/data/projects";

const PROJECT_ROLES: ProjectRole[] = ["Owner", "Lead", "Collaborator", "Supervisor"];
const PROJECT_PRIORITIES: ProjectPriority[] = ["Low", "Medium", "High", "Critical"];
const PROJECT_STATUSES: ProjectStatus[] = ["Active", "Review", "Stalled", "Complete"];

type EditableProject = Omit<Project, "id" | "overdue">;

function editableValues(project: Project): EditableProject {
  const { id: _id, overdue: _overdue, ...values } = project;
  void _id;
  void _overdue;
  return values;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
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

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProject = projects.find((item) => item.id === projectId);
  const [project, setProject] = useState<Project | undefined>(() =>
    initialProject ? { ...initialProject } : undefined,
  );
  const [form, setForm] = useState<EditableProject | null>(() =>
    initialProject && searchParams.get("edit") === "true" ? editableValues(initialProject) : null,
  );

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="The requested project is not part of the current local shell."
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
    if (!project) return;
    setForm(editableValues(project));
  }

  function cancelEditing() {
    setForm(null);
    if (searchParams.get("edit") === "true") {
      navigate(editOrigin === "pipeline" ? "/pipeline" : projectPath, { replace: true });
    }
  }

  function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    const dueDate = form.dueDate;
    const today = new Date().toISOString().slice(0, 10);
    setProject((current) =>
      current
        ? {
            ...current,
            ...form,
            title: form.title.trim(),
            pi: form.pi.trim(),
            funder: form.funder.trim() || "Not specified",
            collaborators: form.collaborators.trim() || "None listed",
            targetJournal: form.targetJournal.trim() || "Not specified",
            overdue: form.status !== "Complete" && dueDate < today,
          }
        : current,
    );
    setForm(null);
    if (searchParams.get("edit") === "true") {
      navigate(projectPath, { replace: true });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/projects">
          <ArrowLeft />
          Back to Projects
        </Link>
      </Button>

      <PageHeading
        eyebrow={project.id}
        title={project.title}
        description="Review and update the project’s core details, planning information and progress."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={project.status} />
            {form ? (
              <Button type="button" variant="outline" onClick={cancelEditing}>
                <X />
                Cancel Editing
              </Button>
            ) : (
              <Button type="button" onClick={beginEditing}>
                <Pencil />
                Edit Project
              </Button>
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
            <form onSubmit={saveProject} className="grid gap-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <FormField label="Project title" htmlFor="edit-project-title" required className="sm:col-span-2">
                  <Input
                    id="edit-project-title"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    required
                    autoFocus
                  />
                </FormField>

                <FormField label="Principal investigator" htmlFor="edit-project-pi" required>
                  <Input
                    id="edit-project-pi"
                    value={form.pi}
                    onChange={(event) => setForm({ ...form, pi: event.target.value })}
                    required
                  />
                </FormField>

                <FormField label="Funder" htmlFor="edit-project-funder">
                  <Input
                    id="edit-project-funder"
                    value={form.funder}
                    onChange={(event) => setForm({ ...form, funder: event.target.value })}
                  />
                </FormField>

                <FormField label="Collaborators" htmlFor="edit-project-collaborators" className="sm:col-span-2">
                  <Input
                    id="edit-project-collaborators"
                    value={form.collaborators}
                    onChange={(event) => setForm({ ...form, collaborators: event.target.value })}
                  />
                </FormField>

                <FormField label="My role" htmlFor="edit-project-role">
                  <Select
                    value={form.myRole}
                    onValueChange={(value) => setForm({ ...form, myRole: value as ProjectRole })}
                  >
                    <SelectTrigger id="edit-project-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Importance" htmlFor="edit-project-priority">
                  <Select
                    value={form.priority}
                    onValueChange={(value) => setForm({ ...form, priority: value as ProjectPriority })}
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
                    onValueChange={(value) => setForm({ ...form, status: value as ProjectStatus })}
                  >
                    <SelectTrigger id="edit-project-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Pipeline stage" htmlFor="edit-project-stage">
                  <Select
                    value={String(form.stageIndex)}
                    onValueChange={(value) => setForm({ ...form, stageIndex: Number(value) })}
                  >
                    <SelectTrigger id="edit-project-stage"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.map((stage, index) => (
                        <SelectItem key={stage} value={String(index)}>{stage}</SelectItem>
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

                <FormField label="Target journal or output" htmlFor="edit-project-journal" className="sm:col-span-2">
                  <Input
                    id="edit-project-journal"
                    value={form.targetJournal}
                    onChange={(event) => setForm({ ...form, targetJournal: event.target.value })}
                  />
                </FormField>

                <FormField label="Tasks completed" htmlFor="edit-project-tasks-completed">
                  <Input
                    id="edit-project-tasks-completed"
                    type="number"
                    min="0"
                    max={form.tasksTotal}
                    value={form.tasksCompleted}
                    onChange={(event) => setForm({ ...form, tasksCompleted: Number(event.target.value) })}
                  />
                </FormField>

                <FormField label="Total tasks" htmlFor="edit-project-tasks-total">
                  <Input
                    id="edit-project-tasks-total"
                    type="number"
                    min="0"
                    value={form.tasksTotal}
                    onChange={(event) => setForm({ ...form, tasksTotal: Number(event.target.value) })}
                  />
                </FormField>

                <FormField label="Notes" htmlFor="edit-project-notes">
                  <Input
                    id="edit-project-notes"
                    type="number"
                    min="0"
                    value={form.notes}
                    onChange={(event) => setForm({ ...form, notes: Number(event.target.value) })}
                  />
                </FormField>

                <FormField label="Word count" htmlFor="edit-project-word-count">
                  <Input
                    id="edit-project-word-count"
                    type="number"
                    min="0"
                    value={form.wordCount}
                    onChange={(event) => setForm({ ...form, wordCount: Number(event.target.value) })}
                  />
                </FormField>

                <FormField label="Budget used" htmlFor="edit-project-budget-used">
                  <Input
                    id="edit-project-budget-used"
                    type="number"
                    min="0"
                    step="100"
                    value={form.budgetUsed}
                    onChange={(event) => setForm({ ...form, budgetUsed: Number(event.target.value) })}
                  />
                </FormField>

                <FormField label="Total budget" htmlFor="edit-project-budget-total">
                  <Input
                    id="edit-project-budget-total"
                    type="number"
                    min="0"
                    step="100"
                    value={form.budgetTotal}
                    onChange={(event) => setForm({ ...form, budgetTotal: Number(event.target.value) })}
                  />
                </FormField>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={cancelEditing}>Cancel</Button>
                <Button type="submit">
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
              <DetailItem label="Principal investigator">{project.pi}</DetailItem>
              <DetailItem label="Funder">{project.funder}</DetailItem>
              <DetailItem label="My role">{project.myRole}</DetailItem>
              <DetailItem label="Importance">{project.priority}</DetailItem>
              <DetailItem label="Pipeline stage">{PIPELINE_STAGES[project.stageIndex]}</DetailItem>
              <DetailItem label="Scheduled for">{formatDate(project.scheduledFor)}</DetailItem>
              <DetailItem label="Due date">{formatDate(project.dueDate)}</DetailItem>
              <DetailItem label="Target journal or output" className="sm:col-span-2">
                {project.targetJournal}
              </DetailItem>
              <DetailItem label="Working with" className="sm:col-span-2">
                <span className="text-muted-foreground">{project.collaborators}</span>
              </DetailItem>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress and resources</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <DetailItem label="Tasks">{project.tasksCompleted}/{project.tasksTotal} complete</DetailItem>
              <DetailItem label="Notes">{project.notes}</DetailItem>
              <DetailItem label="Word count">{project.wordCount.toLocaleString()}</DetailItem>
              <DetailItem label="Budget">{formatCurrency(project.budgetUsed)} / {formatCurrency(project.budgetTotal)}</DetailItem>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Project collaborators</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Users}
                title="Collaborator records coming later"
                description={`Current collaborator summary: ${project.collaborators}. Detailed membership records will appear here when the collaboration module is connected.`}
                className="min-h-40 border-0 bg-muted/30"
              />
            </CardContent>
          </Card>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Project edits are stored locally in this interface until the projects API is connected.
      </p>
    </div>
  );
}
