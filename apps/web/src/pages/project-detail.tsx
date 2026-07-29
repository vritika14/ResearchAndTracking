import { ArrowLeft, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projects } from "@/data/projects";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const project = projects.find((item) => item.id === projectId);

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="The requested project is not part of the current local shell."
        action={
          <Button asChild variant="outline">
            <Link to="/projects">Back to Projects</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/projects">
          <ArrowLeft />
          Back to Projects
        </Link>
      </Button>

      <PageHeading
        eyebrow={project.id}
        title={project.title}
        description="Project detail shell for overview information and future project modules."
        actions={<StatusBadge status={project.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Project overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Principal investigator
              </p>
              <p className="mt-1 font-medium">{project.pi}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Funder
              </p>
              <p className="mt-1 font-medium">{project.funder}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Working with
              </p>
              <p className="mt-1 text-muted-foreground">{project.collaborators}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project collaborators</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Users}
              title="Collaborator details coming later"
              description="Project collaborator records will appear here when the collaboration module is connected."
              className="min-h-40 border-0 bg-muted/30"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
