// import { ActivityOverviewChart } from "@/components/dashboard/activity-overview-chart";
import { ConferenceSubmissionsTable } from "@/components/dashboard/conference-submissions-table";
import { PipelineOverviewTable } from "@/components/dashboard/pipeline-overview-table";
import { PriorityTasksTable } from "@/components/dashboard/priority-tasks-table";
// import { WorkOnThisNextBanner } from "@/components/dashboard/work-on-this-next-banner";
import { PageHeading } from "@/components/typography/heading";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const summary = [
  { label: "Active Projects", value: "—" },
  { label: "Open Tasks", value: "—" },
  { label: "Grants in pipeline", value: "—" },
  { label: "In Writing Stage", value: "—" },
  { label: "Submitted - Last 30 days", value: "—" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Overview"
        title="Dashboard"
        description="A snapshot of research activity across projects, tasks, daily notes, and project files."
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
