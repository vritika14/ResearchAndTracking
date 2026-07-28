import { PageHeading } from "@/components/typography/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DailyNotesInputPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Daily Notes"
        title="Input"
        description="Log a new daily research note."
      />
      <Card>
        <CardHeader>
          <CardTitle>Note entry form coming soon</CardTitle>
          <CardDescription>
            This placeholder will become the daily note entry form.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Full functionality is planned for a later phase.
        </CardContent>
      </Card>
    </div>
  );
}
