// import { ActivityOverviewChart } from "@/components/dashboard/activity-overview-chart";
import { Building2, Crown, Users } from "lucide-react";
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
  { label: "Active Projects", value: "—" },
  { label: "Open Tasks", value: "—" },
  { label: "In Writing Stage", value: "—" },
  { label: "Submitted - Last 30 days", value: "—" },
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
        <Card className="border-primary/25 bg-primary/[0.03]">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="rounded-xl bg-primary/10 p-3 text-primary">
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
                  <Badge variant="outline" className="gap-1 bg-background">
                    {isOwner ? (
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <Users className="h-3.5 w-3.5" />
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
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
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
