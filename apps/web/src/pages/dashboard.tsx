import { PageHeading } from "@/components/typography/heading";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const summary = [
  { label: "Active Projects", value: "—" },
  { label: "Open Tasks", value: "—" },
  { label: "Daily Notes This Week", value: "—" },
  { label: "Records Pending Review", value: "—" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Overview"
        title="Dashboard"
        description="A snapshot of research activity across projects, tasks, daily notes, and regulated records."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
