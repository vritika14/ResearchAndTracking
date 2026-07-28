import { PageHeading } from "@/components/typography/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccessLogPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Controlled Data"
        title="Access Log"
        description="Audit trail of who accessed or modified secure records."
      />
      <Card>
        <CardHeader>
          <CardTitle>No access events yet</CardTitle>
          <CardDescription>Access log entries will appear here once created.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is a placeholder for the access audit trail.
        </CardContent>
      </Card>
    </div>
  );
}
