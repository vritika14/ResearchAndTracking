import { PageHeading } from "@/components/typography/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DailyNotesOutputPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Daily Notes"
        title="Output"
        description="Review previously logged daily notes."
      />
      <Card>
        <CardHeader>
          <CardTitle>Note history coming soon</CardTitle>
          <CardDescription>
            This placeholder will become the daily note review and export view.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Full functionality is planned for a later phase.
        </CardContent>
      </Card>
    </div>
  );
}
