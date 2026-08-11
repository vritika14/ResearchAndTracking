// import { ActivityOverviewChart } from "@/components/dashboard/activity-overview-chart";
import {
  Building2,
  Crown,
  FilePenLine,
  FolderKanban,
  ListTodo,
  Send,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useCurrentWorkspace } from "@/api/hooks";
import { ConferenceSubmissionsTable } from "@/components/dashboard/conference-submissions-table";
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

const summary = [
  {
    label: "Active Projects",
    value: "—",
    icon: FolderKanban,
    accent: "bg-blue-500",
    iconStyle: "bg-blue-100 text-blue-700",
    valueStyle: "text-blue-700",
  },
  {
    label: "Open Tasks",
    value: "—",
    icon: ListTodo,
    accent: "bg-cyan-500",
    iconStyle: "bg-cyan-100 text-cyan-700",
    valueStyle: "text-cyan-700",
  },
  {
    label: "In Writing Stage",
    value: "—",
    icon: FilePenLine,
    accent: "bg-violet-500",
    iconStyle: "bg-violet-100 text-violet-700",
    valueStyle: "text-violet-700",
  },
  {
    label: "Submitted - Last 30 days",
    value: "—",
    icon: Send,
    accent: "bg-emerald-500",
    iconStyle: "bg-emerald-100 text-emerald-700",
    valueStyle: "text-emerald-700",
  },
];

export default function DashboardPage() {
  const workspace = useCurrentWorkspace();
  const isOwner = workspace.data?.membershipRole === "owner";

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Overview"
        title="Dashboard"
        description="A snapshot of research activity across projects, tasks, daily notes, and project files."
      />
      {workspace.data ? (
        <Card className="border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-white to-cyan-50/80 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current workspace
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-bold text-foreground">
                    {workspace.data.name}
                  </h2>
                  <Badge variant="outline" className="gap-1 bg-white/80">
                    {isOwner ? (
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                    )}
                    {isOwner ? "Owner access" : "Limited member access"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Dashboard information is shown for this workspace.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="shrink-0 bg-white/80">
              <Link to="/workspaces">Switch workspace</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {summary.map((item) => (
          <Card
            key={item.label}
            className="overflow-hidden border-0 bg-white/90 shadow-sm ring-1 ring-slate-200/80 transition-transform hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`h-1 ${item.accent}`} />
            <CardHeader className="p-5">
              <div className="flex items-start justify-between gap-3">
                <CardDescription className="font-medium text-slate-600">
                  {item.label}
                </CardDescription>
                <span className={`rounded-lg p-2 ${item.iconStyle}`}>
                  <item.icon className="h-4 w-4" />
                </span>
              </div>
              <CardTitle className={`text-3xl ${item.valueStyle}`}>
                {item.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      {/* <WorkOnThisNextBanner /> */}
      <PriorityTasksTable />
      <PipelineOverviewTable />
      <ConferenceSubmissionsTable />
      {/* <ActivityOverviewChart /> */}
    </div>
  );
}
