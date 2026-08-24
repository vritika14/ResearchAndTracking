import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import {
  useAddModuleCollaborator,
  useModuleCollaborators,
  useRemoveModuleCollaborator,
  useUserSearch,
  type Membership,
} from "@/api/hooks";
import { LoadingState } from "@/components/shared/loading-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ModuleCollaboratorsManagerProps {
  tenantId: string;
  moduleId: string;
  members: Membership[];
}

export function ModuleCollaboratorsManager({
  tenantId,
  moduleId,
  members,
}: ModuleCollaboratorsManagerProps) {
  const collaboratorsQuery = useModuleCollaborators(tenantId, moduleId);
  const addCollaborator = useAddModuleCollaborator(tenantId, moduleId);
  const removeCollaborator = useRemoveModuleCollaborator(tenantId, moduleId);
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const memberByUserId = useMemo(() => {
    const map = new Map<string, Membership>();
    for (const member of members) map.set(member.userId, member);
    return map;
  }, [members]);

  const collaboratorUserIds = useMemo(
    () => new Set((collaboratorsQuery.data ?? []).map((collaborator) => collaborator.userId)),
    [collaboratorsQuery.data],
  );

  const userSearchQuery = useUserSearch(search, pickerOpen);
  const matchingMembers = useMemo(() => {
    return (userSearchQuery.data ?? []).filter((user) => !collaboratorUserIds.has(user.id));
  }, [collaboratorUserIds, userSearchQuery.data]);

  if (collaboratorsQuery.isPending) {
    return <LoadingState title="Loading collaborators" className="min-h-32" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {(collaboratorsQuery.data ?? []).map((collaborator) => {
          const member = memberByUserId.get(collaborator.userId);
          return (
            <div
              key={collaborator.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {member?.displayName ?? collaborator.userId}
                </span>
                {member ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {member.email}
                  </span>
                ) : null}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{collaborator.role ?? "Collaborator"}</Badge>
                <button
                  type="button"
                  aria-label={`Remove ${member?.displayName ?? "collaborator"}`}
                  onClick={() => removeCollaborator.mutate(collaborator.userId)}
                  className="rounded-full p-1 text-muted-foreground hover:text-destructive focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {(collaboratorsQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No collaborators added yet.</p>
        ) : null}
      </div>

      <div
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPickerOpen(false);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          role="combobox"
          aria-expanded={pickerOpen}
          aria-controls="module-collaborator-options"
          aria-autocomplete="list"
          value={search}
          onFocus={() => setPickerOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            setPickerOpen(true);
          }}
          placeholder="Type a name or email to search all users"
          className="pl-9"
          autoComplete="off"
        />
        {pickerOpen && search.trim() ? (
          <div
            id="module-collaborator-options"
            role="listbox"
            className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            {userSearchQuery.isPending ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
            ) : matchingMembers.length ? (
              matchingMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  className="flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                  onClick={() => {
                    addCollaborator.mutate({ userId: member.id, role: "Collaborator" });
                    setSearch("");
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{member.displayName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">No matching users.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
