import { PageHeading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Workflows"
        title="Projects"
        description="Track research projects from proposal through closeout."
        actions={<Button>New Project</Button>}
      />
      <Card>
        <CardHeader>
          <CardTitle>No projects yet</CardTitle>
          <CardDescription>Project workflows will appear here once created.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This is a placeholder for the project pipeline view.
        </CardContent>
      </Card>
    </div>
  );
}
