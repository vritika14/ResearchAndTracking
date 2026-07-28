import { PageHeading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DailyNotesPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Workflows"
        title="Daily Notes"
        description="Capture day-to-day research observations and lab notes."
        actions={<Button>New Note</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>No notes yet</CardTitle>
          <CardDescription>Daily notes will appear here once created.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is a placeholder for the daily notes log.
        </CardContent>
      </Card>
    </div>
  );
}
