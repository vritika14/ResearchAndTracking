import { PageHeading } from "@/components/typography/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecordsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Compliance"
        title="Regulated Records"
        description="Records requiring controlled access, review, and audit trails."
      />
      <Card>
        <CardHeader>
          <CardTitle>No records yet</CardTitle>
          <CardDescription>Regulated records will appear here once created.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is a placeholder for the regulated record register.
        </CardContent>
      </Card>
    </div>
  );
}
