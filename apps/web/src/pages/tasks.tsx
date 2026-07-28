import { PageHeading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Workflows"
        title="Tasks"
        description="Assign and track task-level work items across research projects."
        actions={<Button>New Task</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>No tasks yet</CardTitle>
          <CardDescription>Task boards will appear here once created.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is a placeholder for the task tracking view.
        </CardContent>
      </Card>
    </div>
  );
}
