// import { ActivityOverviewChart } from "@/components/dashboard/activity-overview-chart";
import {
  FilePenLine,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";

import { useCurrentWorkspace, usePipelineStages, useProjects, useTasks } from "@/api/hooks";
import { ConferenceSubmissionsTable } from "@/components/dashboard/conference-submissions-table";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import {
  CustomizeDashboardDialog,
  type DashboardWidgetOption,
} from "@/components/dashboard/customize-dashboard-dialog";
import type { DashboardInsightId } from "@/components/dashboard/dashboard-insights";
import { PipelineOverviewTable } from "@/components/dashboard/pipeline-overview-table";
import { PriorityTasksTable } from "@/components/dashboard/priority-tasks-table";
// import { WorkOnThisNextBanner } from "@/components/dashboard/work-on-this-next-banner";
import { PageHeading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const REVIEW_STAGE = "Consolidation & Review";

function buildSummary(counts: {
  activeProjects: number;
  totalProjects: number;
  openTasks: number;
  totalTasks: number;
  reviewStage: number;
}) {
  return [
    {
      label: "Active Projects",
      description: "Active of all visible projects",
      value: `${counts.activeProjects} of ${counts.totalProjects}`,
      icon: FolderKanban,
      tone: "blue",
    },
    {
      label: "Open Tasks",
      description: "Open of all visible tasks",
      value: `${counts.openTasks} of ${counts.totalTasks}`,
      icon: ListTodo,
      tone: "amber",
    },
    {
      label: "In Review Stage",
      description: "Projects in consolidation and review",
      value: String(counts.reviewStage),
      icon: FilePenLine,
      tone: "violet",
    },
    {
      label: "Year to Date Accepted",
      description: "Submissions accepted this calendar year",
      value: "—",
      icon: Send,
      tone: "emerald",
    },
  ];
}

type DashboardWidgetId = DashboardInsightId | "tasks" | "pipeline" | "conferences";

interface DashboardWidgetDefinition extends DashboardWidgetOption<DashboardWidgetId> {
  component?: ComponentType;
}

const DASHBOARD_WIDGETS: readonly DashboardWidgetDefinition[] = [
  {
    id: "pipeline-distribution",
    label: "Pipeline distribution",
    description: "Project volume across research stages.",
    group: "Insights",
  },
  {
    id: "task-health",
    label: "Task health",
    description: "Completion, deadlines, and delivery risk.",
    group: "Insights",
  },
  {
    id: "priority-workload",
    label: "Priority workload",
    description: "Open work grouped by urgency.",
    group: "Insights",
  },
  {
    id: "project-progress",
    label: "Project progress",
    description: "Top project completion based on linked tasks.",
    group: "Insights",
  },
  {
    id: "tasks",
    label: "Tasks to be done",
    description: "Priority work across projects.",
    group: "Tables",
    component: PriorityTasksTable,
  },
  {
    id: "pipeline",
    label: "Pipeline project overview",
    description: "Projects arranged by pipeline stage.",
    group: "Tables",
    component: PipelineOverviewTable,
  },
  {
    id: "conferences",
    label: "Upcoming conference submissions",
    description: "Submission deadlines and linked papers.",
    group: "Tables",
    component: ConferenceSubmissionsTable,
  },
] as const;

const DEFAULT_WIDGET_ORDER = DASHBOARD_WIDGETS.map((widget) => widget.id);
const DASHBOARD_LAYOUT_KEY = "research-in-motion.dashboard-layout.v1";

interface StoredDashboardLayout {
  order: DashboardWidgetId[];
  hidden: DashboardWidgetId[];
}

function isDashboardWidgetId(value: unknown): value is DashboardWidgetId {
  return DEFAULT_WIDGET_ORDER.includes(value as DashboardWidgetId);
}

function loadDashboardLayout(): StoredDashboardLayout {
  if (typeof window === "undefined") {
    return { order: [...DEFAULT_WIDGET_ORDER], hidden: [] };
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(DASHBOARD_LAYOUT_KEY) ?? "null") as {
      order?: unknown;
      hidden?: unknown;
    } | null;
    const savedOrder = Array.isArray(stored?.order)
      ? stored.order.filter(isDashboardWidgetId)
      : [];
    const order = [
      ...new Set(savedOrder),
      ...DEFAULT_WIDGET_ORDER.filter((id) => !savedOrder.includes(id)),
    ];
    const hidden = Array.isArray(stored?.hidden)
      ? [...new Set(stored.hidden.filter(isDashboardWidgetId))]
      : [];

    return { order, hidden };
  } catch {
    return { order: [...DEFAULT_WIDGET_ORDER], hidden: [] };
  }
}

export default function DashboardPage() {
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";
  const projectsQuery = useProjects(tenantId);
  const tasksQuery = useTasks(tenantId);
  const stagesQuery = usePipelineStages(tenantId);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [layout, setLayout] = useState(loadDashboardLayout);

  const summary = useMemo(
    () =>
      buildSummary({
        activeProjects: (projectsQuery.data ?? []).filter((project) => project.status === "Active")
          .length,
        totalProjects: (projectsQuery.data ?? []).length,
        openTasks: (tasksQuery.data ?? []).filter((task) => task.status !== "Complete").length,
        totalTasks: (tasksQuery.data ?? []).length,
        reviewStage: (projectsQuery.data ?? []).filter(
          (project) => project.pipelineStage === REVIEW_STAGE,
        ).length,
      }),
    [projectsQuery.data, tasksQuery.data],
  );
  const visibleWidgets = new Set(
    layout.order.filter((id) => !layout.hidden.includes(id)),
  );
  const insightOrder = layout.order.filter((id): id is DashboardInsightId =>
    DASHBOARD_WIDGETS.find((widget) => widget.id === id)?.group === "Insights",
  );
  const visibleInsights = new Set(
    insightOrder.filter((id) => visibleWidgets.has(id)),
  );
  const orderedTables = layout.order
    .map((id) => DASHBOARD_WIDGETS.find((widget) => widget.id === id)!)
    .filter((widget) => widget.group === "Tables");

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(layout));
  }, [layout]);

  function toggleWidget(widgetId: DashboardWidgetId) {
    setLayout((current) => ({
      ...current,
      hidden: current.hidden.includes(widgetId)
        ? current.hidden.filter((id) => id !== widgetId)
        : [...current.hidden, widgetId],
    }));
  }

  function moveWidget(widgetId: DashboardWidgetId, direction: "up" | "down") {
    setLayout((current) => {
      const widgetGroup = DASHBOARD_WIDGETS.find((widget) => widget.id === widgetId)?.group;
      const groupOrder = current.order.filter(
        (id) => DASHBOARD_WIDGETS.find((widget) => widget.id === id)?.group === widgetGroup,
      );
      const groupIndex = groupOrder.indexOf(widgetId);
      const targetId = groupOrder[direction === "up" ? groupIndex - 1 : groupIndex + 1];
      if (!targetId) return current;
      const index = current.order.indexOf(widgetId);
      const nextIndex = current.order.indexOf(targetId);
      const order = [...current.order];
      [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
      return { ...current, order };
    });
  }

  function reorderWidgets(draggedId: DashboardWidgetId, targetId: DashboardWidgetId) {
    setLayout((current) => {
      const draggedGroup = DASHBOARD_WIDGETS.find((widget) => widget.id === draggedId)?.group;
      const targetGroup = DASHBOARD_WIDGETS.find((widget) => widget.id === targetId)?.group;
      if (draggedGroup !== targetGroup) return current;
      const fromIndex = current.order.indexOf(draggedId);
      const toIndex = current.order.indexOf(targetId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return current;
      const order = [...current.order];
      order.splice(fromIndex, 1);
      order.splice(toIndex, 0, draggedId);
      return { ...current, order };
    });
  }

  function resetLayout() {
    setLayout({ order: [...DEFAULT_WIDGET_ORDER], hidden: [] });
  }

  return (
    <div className="page-stack">
      <PageHeading
        icon={LayoutDashboard}
        tone="violet"
        eyebrow="Overview"
        title="Dashboard"
        description="A snapshot of research activity across projects, tasks, daily notes, and project files."
        actions={
          <Button variant="outline" onClick={() => setIsCustomizeOpen(true)}>
            <SlidersHorizontal />
            Customize dashboard
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <Card
            key={item.label}
            className={cn(
              "group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md",
              item.tone === "blue" && "border-blue-200/70 bg-gradient-to-br from-blue-50/80 to-card dark:border-blue-900/50 dark:from-blue-950/20",
              item.tone === "amber" && "border-amber-200/70 bg-gradient-to-br from-amber-50/80 to-card dark:border-amber-900/50 dark:from-amber-950/20",
              item.tone === "violet" && "border-violet-200/70 bg-gradient-to-br from-violet-50/80 to-card dark:border-violet-900/50 dark:from-violet-950/20",
              item.tone === "emerald" && "border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-card dark:border-emerald-900/50 dark:from-emerald-950/20",
            )}
          >
            <div className={cn(
              "absolute inset-x-0 top-0 h-0.5 opacity-80",
              item.tone === "blue" && "bg-blue-500",
              item.tone === "amber" && "bg-amber-500",
              item.tone === "violet" && "bg-violet-500",
              item.tone === "emerald" && "bg-emerald-500",
            )} />
            <CardHeader className="gap-3 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <CardDescription className="font-medium">
                  {item.label}
                </CardDescription>
                <span className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105",
                  item.tone === "blue" && "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900",
                  item.tone === "amber" && "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
                  item.tone === "violet" && "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900",
                  item.tone === "emerald" && "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
                )}>
                  <item.icon className="h-4 w-4" />
                </span>
              </div>
              <CardTitle className="text-4xl text-foreground">
                {item.value}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardHeader>
          </Card>
        ))}
      </div>
      <DashboardInsights
        projects={projectsQuery.data ?? []}
        tasks={tasksQuery.data ?? []}
        stages={stagesQuery.data ?? []}
        order={insightOrder}
        visible={visibleInsights}
      />
      {/* <WorkOnThisNextBanner /> */}
      {orderedTables.map((table) => {
        if (!visibleWidgets.has(table.id)) return null;
        const DashboardTable = table.component;
        return DashboardTable ? <DashboardTable key={table.id} /> : null;
      })}
      {visibleWidgets.size === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">All dashboard tables are hidden.</p>
            <Button variant="outline" onClick={() => setIsCustomizeOpen(true)}>
              Customize dashboard
            </Button>
          </CardContent>
        </Card>
      ) : null}
      {/* <ActivityOverviewChart /> */}
      <CustomizeDashboardDialog
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        widgets={layout.order.map((id) => DASHBOARD_WIDGETS.find((widget) => widget.id === id)!)}
        visibleWidgets={visibleWidgets}
        onToggle={toggleWidget}
        onMove={moveWidget}
        onReorder={reorderWidgets}
        onReset={resetLayout}
      />
    </div>
  );
}
