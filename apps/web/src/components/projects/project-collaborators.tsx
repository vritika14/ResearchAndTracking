import { useMemo } from "react";
import { X } from "lucide-react";

import {
  useProjectCollaborators,
  useRemoveProjectCollaborator,
  type Membership,
} from "@/api/hooks";
import { LoadingState } from "@/components/shared/loading-state";
import { InvitationPanel } from "@/components/sharing/invitation-panel";
import { Badge } from "@/components/ui/badge";

interface ProjectCollaboratorsProps {
  tenantId: string;
  projectId: string;
  ownerUserId: string | undefined;
  members: Membership[];
  entityTitle: string;
  canManage: boolean;
}

export function ProjectCollaborators({
  tenantId,
  projectId,
  ownerUserId,
  members,
  entityTitle,
  canManage,
}: ProjectCollaboratorsProps) {
  const collaboratorsQuery = useProjectCollaborators(tenantId, projectId);
  const removeCollaborator = useRemoveProjectCollaborator(tenantId, projectId);

  const memberByUserId = useMemo(() => {
    const map = new Map<string, Membership>();
    for (const member of members) map.set(member.userId, member);
    return map;
  }, [members]);

  if (collaboratorsQuery.isPending) {
    return <LoadingState title="Loading collaborators" className="min-h-32" />;
  }

  const collaborators = collaboratorsQuery.data ?? [];
  const ownerIsReturned = collaborators.some(
    (collaborator) => collaborator.userId === ownerUserId,
  );
  const hasAdditionalCollaborators = collaborators.some(
    (collaborator) => collaborator.userId !== ownerUserId,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {!ownerIsReturned && ownerUserId && memberByUserId.has(ownerUserId) ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {memberByUserId.get(ownerUserId)!.displayName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {memberByUserId.get(ownerUserId)!.email}
              </span>
            </span>
            <Badge variant="outline">Owner</Badge>
          </div>
        ) : null}
        {collaborators.map((collaborator) => {
          const member = memberByUserId.get(collaborator.userId);
          const displayName =
            collaborator.displayName ?? member?.displayName ?? "Unknown collaborator";
          const collaboratorEmail = collaborator.email ?? member?.email;
          return (
            <div
              key={collaborator.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{displayName}</span>
                {collaboratorEmail ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {collaboratorEmail}
                  </span>
                ) : null}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{collaborator.role ?? "Collaborator"}</Badge>
                {canManage && collaborator.userId !== ownerUserId ? (
                  <button
                    type="button"
                    aria-label={`Remove ${displayName}`}
                    onClick={() => removeCollaborator.mutate(collaborator.userId)}
                    className="rounded-full p-1 text-muted-foreground hover:text-destructive focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        {!hasAdditionalCollaborators ? (
          <p className="text-sm text-muted-foreground">No additional collaborators yet.</p>
        ) : null}
      </div>

      {canManage ? (
        <InvitationPanel
          target="project"
          tenantId={tenantId}
          entityId={projectId}
          entityTitle={entityTitle}
          excludedUserIds={[
            ...(ownerUserId ? [ownerUserId] : []),
            ...collaborators.map((collaborator) => collaborator.userId),
          ]}
        />
      ) : (
        <p className="border-t pt-4 text-sm text-muted-foreground">
          Only the project owner can invite or remove collaborators.
        </p>
      )}
    </div>
  );
}
