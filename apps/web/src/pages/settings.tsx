import { PageHeading } from "@/components/typography/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Administration"
        title="Settings"
        description="Application and account configuration."
      />
      <Card>
        <CardHeader>
          <CardTitle>No settings yet</CardTitle>
          <CardDescription>Configuration options will appear here once created.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is a placeholder for application settings.
        </CardContent>
      </Card>
    </div>
  );
}
