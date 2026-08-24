// import { ActivityOverviewChart } from "@/components/dashboard/activity-overview-chart";
import {
  Building2,
  Crown,
  FilePenLine,
  FolderKanban,
  ListTodo,
  Send,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";

import { useCurrentWorkspace, useProjects, useTasks } from "@/api/hooks";
import { ConferenceSubmissionsTable } from "@/components/dashboard/conference-submissions-table";
import {
  CustomizeDashboardDialog,
  type DashboardTableOption,
} from "@/components/dashboard/customize-dashboard-dialog";
import { PipelineOverviewTable } from "@/components/dashboard/pipeline-overview-table";
import { PriorityTasksTable } from "@/components/dashboard/priority-tasks-table";
// import { WorkOnThisNextBanner } from "@/components/dashboard/work-on-this-next-banner";
import { PageHeading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const WRITING_STAGE = "Drafting, writing & revisiting";

function buildSummary(counts: { activeProjects: number; openTasks: number; writingStage: number }) {
  return [
    {
      label: "Active Projects",
      description: "Projects currently underway",
      value: String(counts.activeProjects),
      icon: FolderKanban,
    },
    {
      label: "Open Tasks",
      description: "Tasks awaiting completion",
      value: String(counts.openTasks),
      icon: ListTodo,
    },
    {
      label: "In Writing Stage",
      description: "Projects in manuscript preparation",
      value: String(counts.writingStage),
      icon: FilePenLine,
    },
    {
      label: "Year to Date Accepted",
      description: "Submissions accepted this calendar year",
      value: "—",
      icon: Send,
    },
  ];
}

type DashboardTableId = "tasks" | "pipeline" | "conferences";

interface DashboardTableDefinition extends DashboardTableOption<DashboardTableId> {
  component: ComponentType;
}

const DASHBOARD_TABLES: readonly DashboardTableDefinition[] = [
  {
    id: "tasks",
    label: "Tasks to be done",
    description: "Priority work across projects.",
    component: PriorityTasksTable,
  },
  {
    id: "pipeline",
    label: "Pipeline project overview",
    description: "Projects arranged by pipeline stage.",
    component: PipelineOverviewTable,
  },
  {
    id: "conferences",
    label: "Upcoming conference submissions",
    description: "Submission deadlines and linked papers.",
    component: ConferenceSubmissionsTable,
  },
] as const;

const DEFAULT_TABLE_ORDER = DASHBOARD_TABLES.map((table) => table.id);
const DASHBOARD_LAYOUT_KEY = "research-in-motion.dashboard-layout.v1";

interface StoredDashboardLayout {
  order: DashboardTableId[];
  hidden: DashboardTableId[];
}

function isDashboardTableId(value: unknown): value is DashboardTableId {
  return DEFAULT_TABLE_ORDER.includes(value as DashboardTableId);
}

function loadDashboardLayout(): StoredDashboardLayout {
  if (typeof window === "undefined") {
    return { order: [...DEFAULT_TABLE_ORDER], hidden: [] };
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(DASHBOARD_LAYOUT_KEY) ?? "null") as {
      order?: unknown;
      hidden?: unknown;
    } | null;
    const savedOrder = Array.isArray(stored?.order)
      ? stored.order.filter(isDashboardTableId)
      : [];
    const order = [
      ...new Set(savedOrder),
      ...DEFAULT_TABLE_ORDER.filter((id) => !savedOrder.includes(id)),
    ];
    const hidden = Array.isArray(stored?.hidden)
      ? [...new Set(stored.hidden.filter(isDashboardTableId))]
      : [];

    return { order, hidden };
  } catch {
    return { order: [...DEFAULT_TABLE_ORDER], hidden: [] };
  }
}

export default function DashboardPage() {
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";
  const projectsQuery = useProjects(tenantId);
  const tasksQuery = useTasks(tenantId);
  const isOwner = workspace.data?.membershipRole === "owner";
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [layout, setLayout] = useState(loadDashboardLayout);

  const summary = useMemo(
    () =>
      buildSummary({
        activeProjects: (projectsQuery.data ?? []).filter((project) => project.status === "Active")
          .length,
        openTasks: (tasksQuery.data ?? []).filter((task) => task.status !== "Complete").length,
        writingStage: (projectsQuery.data ?? []).filter(
          (project) => project.pipelineStage === WRITING_STAGE,
        ).length,
      }),
    [projectsQuery.data, tasksQuery.data],
  );
  const visibleTables = new Set(
    layout.order.filter((id) => !layout.hidden.includes(id)),
  );
  const orderedTables = layout.order.map(
    (id) => DASHBOARD_TABLES.find((table) => table.id === id)!,
  );

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(layout));
  }, [layout]);

  function toggleTable(tableId: DashboardTableId) {
    setLayout((current) => ({
      ...current,
      hidden: current.hidden.includes(tableId)
        ? current.hidden.filter((id) => id !== tableId)
        : [...current.hidden, tableId],
    }));
  }

  function moveTable(tableId: DashboardTableId, direction: "up" | "down") {
    setLayout((current) => {
      const index = current.order.indexOf(tableId);
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.order.length) return current;
      const order = [...current.order];
      [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
      return { ...current, order };
    });
  }

  function reorderTables(draggedId: DashboardTableId, targetId: DashboardTableId) {
    setLayout((current) => {
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
    setLayout({ order: [...DEFAULT_TABLE_ORDER], hidden: [] });
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
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
      {workspace.data ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="rounded-md bg-muted p-2.5 text-foreground">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current workspace
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold text-foreground">
                    {workspace.data.name}
                  </h2>
                  <Badge variant="outline" className="gap-1">
                    {isOwner ? (
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {isOwner ? "Owner access" : "Limited member access"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Dashboard information is shown for this workspace.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/workspaces">Switch workspace</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardHeader className="gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <CardDescription className="font-medium">
                  {item.label}
                </CardDescription>
                <span className="rounded-md bg-muted p-2 text-muted-foreground">
                  <item.icon className="h-4 w-4" />
                </span>
              </div>
              <CardTitle className="text-3xl text-foreground">
                {item.value}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardHeader>
          </Card>
        ))}
      </div>
      {/* <WorkOnThisNextBanner /> */}
      {orderedTables.map((table) => {
        if (!visibleTables.has(table.id)) return null;
        const DashboardTable = table.component;
        return <DashboardTable key={table.id} />;
      })}
      {visibleTables.size === 0 ? (
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
        tables={orderedTables}
        visibleTables={visibleTables}
        onToggle={toggleTable}
        onMove={moveTable}
        onReorder={reorderTables}
        onReset={resetLayout}
      />
    </div>
  );
}
