import { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  Boxes,
  CheckSquare2,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Presentation,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  useCurrentWorkspace,
  useConferences,
  useModules,
  useProjects,
  useTasks,
  type ApiProject,
  type ApiTask,
} from "@/api/hooks";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalendarEvent = {
  id: string;
  kind: "project" | "module" | "task" | "conference";
  title: string;
  dueDate: string;
  href: string;
  meta: string | null;
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayKey() {
  const today = new Date();
  return dateKey(today.getFullYear(), today.getMonth(), today.getDate());
}

function startOfCalendarGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  return new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset);
}

function buildCalendarDays(month: Date) {
  const start = startOfCalendarGrid(month);
  return Array.from({ length: 42 }, (_, index) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  );
}

function taskProjectName(task: ApiTask, projectById: Map<string, ApiProject>) {
  if (!task.projectId) return null;
  return projectById.get(task.projectId)?.title ?? null;
}

export default function CalendarPage() {
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";
  const projectsQuery = useProjects(tenantId);
  const modulesQuery = useModules(tenantId);
  const tasksQuery = useTasks(tenantId);
  const conferencesQuery = useConferences(tenantId);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [showProjects, setShowProjects] = useState(true);
  const [showModules, setShowModules] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [showConferences, setShowConferences] = useState(true);

  const projectById = useMemo(
    () => new Map((projectsQuery.data ?? []).map((project) => [project.id, project])),
    [projectsQuery.data],
  );

  const events = useMemo(() => {
    const rows: CalendarEvent[] = [];
    if (showProjects) {
      for (const project of projectsQuery.data ?? []) {
        if (!project.dueDate) continue;
        rows.push({
          id: project.id,
          kind: "project",
          title: project.title,
          dueDate: project.dueDate,
          href: `/projects/${project.id}`,
          meta: project.status,
        });
      }
    }
    if (showModules) {
      for (const module of modulesQuery.data ?? []) {
        if (!module.dueDate) continue;
        rows.push({
          id: module.id,
          kind: "module",
          title: module.title,
          dueDate: module.dueDate,
          href: `/modules/${module.id}`,
          meta: module.projectId ? (projectById.get(module.projectId)?.title ?? null) : "Independent module",
        });
      }
    }
    if (showTasks) {
      for (const task of tasksQuery.data ?? []) {
        if (!task.dueDate) continue;
        rows.push({
          id: task.id,
          kind: "task",
          title: task.title,
          dueDate: task.dueDate,
          href: `/tasks/${task.id}`,
          meta: taskProjectName(task, projectById),
        });
      }
    }
    if (showConferences) {
      for (const conference of conferencesQuery.data ?? []) {
        rows.push({
          id: `${conference.id}-submission`,
          kind: "conference",
          title: `${conference.name} — submission deadline`,
          dueDate: conference.submissionDue,
          href: `/conferences/${conference.id}`,
          meta: "Submission deadline",
        });
        for (
          let date = new Date(`${conference.startDate}T00:00:00`);
          date <= new Date(`${conference.endDate}T00:00:00`);
          date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        ) {
          rows.push({
            id: `${conference.id}-event-${dateKey(date.getFullYear(), date.getMonth(), date.getDate())}`,
            kind: "conference",
            title: conference.name,
            dueDate: dateKey(date.getFullYear(), date.getMonth(), date.getDate()),
            href: `/conferences/${conference.id}`,
            meta: conference.location,
          });
        }
      }
    }
    return rows.sort((a, b) => a.title.localeCompare(b.title));
  }, [conferencesQuery.data, modulesQuery.data, projectById, projectsQuery.data, showConferences, showModules, showProjects, showTasks, tasksQuery.data]);

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      grouped.set(event.dueDate, [...(grouped.get(event.dueDate) ?? []), event]);
    }
    return grouped;
  }, [events]);

  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const currentTodayKey = todayKey();

  function changeMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function goToToday() {
    const today = new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  if (workspace.isPending || projectsQuery.isPending || modulesQuery.isPending || tasksQuery.isPending || conferencesQuery.isPending) {
    return <LoadingState title="Loading calendar" className="min-h-[50vh]" />;
  }

  if (projectsQuery.isError || modulesQuery.isError || tasksQuery.isError || conferencesQuery.isError) {
    const error = projectsQuery.error ?? modulesQuery.error ?? tasksQuery.error ?? conferencesQuery.error;
    return (
      <ErrorState
        title="Calendar could not be loaded"
        description={error?.message ?? "Please try again."}
        onRetry={() => void Promise.all([projectsQuery.refetch(), modulesQuery.refetch(), tasksQuery.refetch(), conferencesQuery.refetch()])}
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeading
        icon={CalendarIcon}
        tone="cyan"
        eyebrow="Planning"
        title="Calendar"
        description="See project, module, task, and conference dates together, month by month."
      />

      <section className="overflow-hidden rounded-2xl border border-cyan-200/70 bg-card shadow-sm dark:border-cyan-900/50">
        <div className="flex flex-col gap-4 border-b border-border bg-cyan-50/40 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-cyan-950/10">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => changeMonth(1)} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="ml-1 text-lg font-semibold sm:text-xl" aria-live="polite">
              {monthFormatter.format(visibleMonth)}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2" aria-label="Calendar filters">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Show</span>
            <button
              type="button"
              aria-pressed={showProjects}
              onClick={() => setShowProjects((current) => !current)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                showProjects
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-border bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              <FolderKanban className="h-3.5 w-3.5" /> Projects
            </button>
            <button
              type="button"
              aria-pressed={showModules}
              onClick={() => setShowModules((current) => !current)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                showModules
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-border bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              <Boxes className="h-3.5 w-3.5" /> Modules
            </button>
            <button
              type="button"
              aria-pressed={showTasks}
              onClick={() => setShowTasks((current) => !current)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                showTasks
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-border bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              <CheckSquare2 className="h-3.5 w-3.5" /> Tasks
            </button>
            <button
              type="button"
              aria-pressed={showConferences}
              onClick={() => setShowConferences((current) => !current)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                showConferences
                  ? "border-rose-600 bg-rose-600 text-white"
                  : "border-border bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              <Presentation className="h-3.5 w-3.5" /> Conferences
            </button>
          </div>
        </div>

        <div className="hidden grid-cols-7 border-b border-border bg-muted/30 md:grid">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        <div className="hidden grid-cols-7 md:grid">
          {days.map((day) => {
            const key = dateKey(day.getFullYear(), day.getMonth(), day.getDate());
            const dayEvents = eventsByDate.get(key) ?? [];
            const inMonth = day.getMonth() === visibleMonth.getMonth();
            const isToday = key === currentTodayKey;
            return (
              <div
                key={key}
                className={cn(
                  "min-h-32 border-b border-r border-border p-2 last:border-r-0 lg:min-h-36",
                  !inMonth && "bg-muted/20",
                )}
              >
                <div className="mb-1 flex justify-end">
                  <span className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    isToday && "bg-primary font-semibold text-primary-foreground",
                    !inMonth && !isToday && "text-muted-foreground/60",
                  )}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <Link
                      key={`${event.kind}-${event.id}`}
                      to={event.href}
                      title={`${event.kind === "project" ? "Project" : event.kind === "module" ? "Module" : event.kind === "conference" ? "Conference" : "Task"}: ${event.title}`}
                      className={cn(
                        "block truncate rounded-md border-l-4 px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        event.kind === "project"
                          ? "border-l-blue-600 bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200"
                          : event.kind === "module"
                            ? "border-l-violet-600 bg-violet-100 text-violet-950 dark:bg-violet-950/60 dark:text-violet-200"
                            : event.kind === "conference"
                              ? "border-l-rose-600 bg-rose-100 text-rose-950 dark:bg-rose-950/60 dark:text-rose-200"
                            : "border-l-amber-500 bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-200",
                      )}
                    >
                      {event.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="divide-y divide-border md:hidden">
          {days
            .filter((day) => day.getMonth() === visibleMonth.getMonth())
            .map((day) => {
              const key = dateKey(day.getFullYear(), day.getMonth(), day.getDate());
              const dayEvents = eventsByDate.get(key) ?? [];
              if (dayEvents.length === 0) return null;
              return (
                <div key={key} className="grid grid-cols-[5rem_1fr] gap-3 p-4">
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground">
                      {WEEKDAYS[(day.getDay() + 6) % 7].slice(0, 3)}
                    </div>
                    <div className="text-sm font-semibold">{shortDateFormatter.format(day)}</div>
                  </div>
                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <Link
                        key={`${event.kind}-${event.id}`}
                        to={event.href}
                        className={cn(
                          "block rounded-lg border p-2.5 text-sm transition-colors hover:bg-accent",
                          event.kind === "project"
                            ? "border-blue-200 dark:border-blue-900"
                            : event.kind === "module"
                              ? "border-violet-200 dark:border-violet-900"
                              : event.kind === "conference"
                                ? "border-rose-200 dark:border-rose-900"
                              : "border-amber-200 dark:border-amber-900",
                        )}
                      >
                        <span className="font-medium">{event.title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {event.kind === "project" ? "Project" : event.kind === "module" ? "Module" : event.kind === "conference" ? "Conference" : "Task"}{event.meta ? ` · ${event.meta}` : ""}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          {events.filter((event) => event.dueDate.startsWith(dateKey(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).slice(0, 7))).length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No due dates to show this month.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
