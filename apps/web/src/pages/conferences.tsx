import { useMemo, useState } from "react";
import { Presentation } from "lucide-react";

import {
  useCreateConference,
  useCurrentWorkspace,
  useMe,
  useModules,
  useProjects,
  useTrackEvent,
} from "@/api/hooks";
import { ConferenceSubmissionDialog, type ConferenceSubmissionInput } from "@/components/dashboard/conference-submission-dialog";
import { ConferenceSubmissionsTable } from "@/components/dashboard/conference-submissions-table";
import { PageHeading } from "@/components/typography/heading";
import { Button } from "@/components/ui/button";

export default function ConferencesPage() {
  const workspace = useCurrentWorkspace();
  const tenantId = workspace.data?.id ?? "";
  const projectsQuery = useProjects(tenantId);
  const projects = projectsQuery.data?.data ?? [];
  const modulesQuery = useModules(tenantId);
  const modules = modulesQuery.data?.data ?? [];
  const me = useMe();
  const createConference = useCreateConference(tenantId);
  const trackEvent = useTrackEvent(tenantId);
  const [isNewConferenceOpen, setIsNewConferenceOpen] = useState(false);

  const ownedProjects = useMemo(
    () => projects.filter(
      (project) => project.userId === me.data?.id || project.role?.toLowerCase() === "owner",
    ),
    [projects, me.data?.id],
  );

  const ownedModules = useMemo(() => {
    const ownedProjectIds = new Set(ownedProjects.map((project) => project.id));
    return modules.filter(
      (module) => module.projectId && ownedProjectIds.has(module.projectId),
    );
  }, [modules, ownedProjects]);

  async function handleCreateConference(input: ConferenceSubmissionInput) {
    await createConference.mutateAsync(input);
    trackEvent({ name: "conference_created" });
  }

  return (
    <div className="page-stack">
      <PageHeading
        icon={Presentation}
        tone="rose"
        eyebrow="Dissemination"
        title="Conferences"
        description="Manage conference deadlines, event dates, submission types, and linked research projects."
        actions={<Button onClick={() => setIsNewConferenceOpen(true)}>New Conference</Button>}
      />

      <ConferenceSubmissionDialog
        open={isNewConferenceOpen}
        onOpenChange={setIsNewConferenceOpen}
        projects={ownedProjects}
        modules={ownedModules}
        onSave={handleCreateConference}
      />

      <ConferenceSubmissionsTable showPast hideCreateButton />
    </div>
  );
}
