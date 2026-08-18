import { useState, type ReactNode } from "react";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import {
  moduleImportanceBadgeClass,
  moduleStatusBadgeClass,
} from "@/components/modules/module-badge-styles";
import { ModuleDialog, type ModuleInput } from "@/components/modules/module-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeading } from "@/components/typography/heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projects } from "@/data/projects";
import { useModules } from "@/hooks/use-modules";
import { usePipelineStages } from "@/hooks/use-pipeline-stages";

function formatDate(iso: string) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function projectName(projectId: string | null) {
  if (!projectId) return "Independent module";
  return projects.find((project) => project.id === projectId)?.title ?? "Unknown project";
}

function DetailItem({ label, children, className = "" }: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 font-medium">{children}</div>
    </div>
  );
}

export default function ModuleDetailPage() {
  const { moduleId } = useParams();
  const { moduleRows, setModuleRows } = useModules();
  const { pipelineStages } = usePipelineStages();
  const [isEditing, setIsEditing] = useState(false);
  const module = moduleRows.find((row) => row.id === moduleId);

  if (!module) {
    return (
      <EmptyState
        title="Module not found"
        description="The requested module is not part of the current local shell."
        action={
          <Button asChild variant="outline">
            <Link to="/modules">Back to Modules</Link>
          </Button>
        }
      />
    );
  }

  function updateModule(input: ModuleInput) {
    setModuleRows((current) =>
      current.map((row) => (row.id === module!.id ? { ...input, id: module!.id } : row)),
    );
    setIsEditing(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/modules">
          <ArrowLeft />
          Back to Modules
        </Link>
      </Button>

      <PageHeading
        eyebrow={module.id}
        title={module.title}
        description="Review and update the module's status, pipeline stage and planning details."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className={moduleStatusBadgeClass(module.status)}>
              {module.status}
            </Badge>
            <Badge variant="outline" className={moduleImportanceBadgeClass(module.importance)}>
              {module.importance}
            </Badge>
            {isEditing ? (
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                <X />
                Cancel Editing
              </Button>
            ) : (
              <Button type="button" onClick={() => setIsEditing(true)}>
                <Pencil />
                Edit Module
              </Button>
            )}
          </div>
        }
      />

      <ModuleDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        projects={projects}
        module={module}
        onSave={updateModule}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Module overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm sm:grid-cols-2">
            <DetailItem label="Linked project">{projectName(module.projectId)}</DetailItem>
            <DetailItem label="Pipeline stage">
              {pipelineStages[module.stageIndex]?.name ?? "Unknown stage"}
            </DetailItem>
            <DetailItem label="Status">{module.status}</DetailItem>
            <DetailItem label="Importance">{module.importance}</DetailItem>
            <DetailItem label="Due date">{formatDate(module.dueDate)}</DetailItem>
            <DetailItem label="Description" className="sm:col-span-2">
              <span className="font-normal text-muted-foreground">
                {module.description || "No description provided."}
              </span>
            </DetailItem>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Module edits are stored locally in this interface until the modules API is connected.
      </p>
    </div>
  );
}
